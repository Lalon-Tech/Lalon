/**
 * Core Profit Distribution Engine & Mathematical Services
 * 
 * Implements proportional profit distribution based on member deposits/balances:
 * 1. Profit Ratio = Profit Amount / Total Deposit
 * 2. Member Profit = Profit Ratio * Member Deposit
 * 3. Exact 2-decimal rounding with final-adjustment mechanism ensuring:
 *    Sum of All Allocated Profits === Original Profit Amount exactly.
 * 4. Transaction-level deposit snapshots for historical accuracy.
 * 5. Reusable calculation helpers for reports, history, and real-time previews.
 */

export interface MemberDepositSnapshotItem {
  memberId: string;
  memberNo: string;
  memberName: string;
  depositAmount: number;
}

export interface DistributedMemberShare {
  memberId: string;
  memberNo: string;
  memberName: string;
  depositSnapshot: number;
  weightPercentage: number; // e.g. 53.3333%
  profitRatio: number;      // e.g. 0.0666666666666667
  rawAllocated: number;     // e.g. 533.333333333333
  allocatedProfit: number;  // e.g. 533.33 (rounded to 2 decimal places with last member adjustment)
}

export interface ProfitDistributionResult {
  profitAmount: number;
  totalDeposit: number;
  profitRatio: number;
  memberShares: DistributedMemberShare[];
  totalDistributed: number;
  roundingDifference: number;
}

/**
 * Calculates proportional profit distribution for a given profit amount
 * across an array of member deposits.
 * 
 * Example:
 * Members:
 * - Lalon: 8,000
 * - Milon: 5,000
 * - Kamrul: 2,000
 * Total Deposit: 15,000
 * Kamrul generates: 1,000 profit
 * 
 * Profit Ratio = 1,000 / 15,000 = 0.0666666666666667
 * Lalon Profit = 533.33
 * Milon Profit = 333.33
 * Kamrul Profit = 133.34
 * Total Distributed = 1,000.00
 */
export function calculateProportionalProfit(
  profitAmount: number,
  members: MemberDepositSnapshotItem[]
): ProfitDistributionResult {
  const cleanProfit = Number(profitAmount) || 0;
  const eligible = members.filter(m => (Number(m.depositAmount) || 0) > 0);
  const totalDeposit = eligible.reduce((sum, m) => sum + Number(m.depositAmount), 0);

  if (cleanProfit <= 0 || totalDeposit <= 0 || eligible.length === 0) {
    return {
      profitAmount: cleanProfit,
      totalDeposit,
      profitRatio: 0,
      memberShares: members.map(m => ({
        memberId: m.memberId,
        memberNo: m.memberNo,
        memberName: m.memberName,
        depositSnapshot: Number(m.depositAmount) || 0,
        weightPercentage: 0,
        profitRatio: 0,
        rawAllocated: 0,
        allocatedProfit: 0,
      })),
      totalDistributed: 0,
      roundingDifference: 0,
    };
  }

  const profitRatio = cleanProfit / totalDeposit;
  let runningSum = 0;

  const memberShares: DistributedMemberShare[] = [];

  eligible.forEach((m, idx) => {
    const dep = Number(m.depositAmount);
    const rawAllocated = profitRatio * dep;
    const isLast = idx === eligible.length - 1;

    let allocatedProfit = Math.round(rawAllocated * 100) / 100;

    if (isLast) {
      // Final adjustment mechanism: exactly absorb any remaining cent/paisa
      allocatedProfit = Number((cleanProfit - runningSum).toFixed(2));
      if (allocatedProfit < 0) allocatedProfit = 0;
    } else {
      runningSum = Number((runningSum + allocatedProfit).toFixed(2));
    }

    const weightPercentage = Number(((dep / totalDeposit) * 100).toFixed(4));

    memberShares.push({
      memberId: m.memberId,
      memberNo: m.memberNo,
      memberName: m.memberName,
      depositSnapshot: dep,
      weightPercentage,
      profitRatio,
      rawAllocated,
      allocatedProfit,
    });
  });

  // Non-eligible members (with 0 deposit) receive 0
  const nonEligible = members
    .filter(m => (Number(m.depositAmount) || 0) <= 0)
    .map(m => ({
      memberId: m.memberId,
      memberNo: m.memberNo,
      memberName: m.memberName,
      depositSnapshot: 0,
      weightPercentage: 0,
      profitRatio,
      rawAllocated: 0,
      allocatedProfit: 0,
    }));

  const allShares = [...memberShares, ...nonEligible];
  const totalDistributed = Number(
    memberShares.reduce((sum, s) => sum + s.allocatedProfit, 0).toFixed(2)
  );

  return {
    profitAmount: cleanProfit,
    totalDeposit,
    profitRatio,
    memberShares: allShares,
    totalDistributed,
    roundingDifference: Number((cleanProfit - totalDistributed).toFixed(2)),
  };
}

/**
 * Derives comprehensive Member-wise Profit & Balance Report from profit transactions.
 * Calculates:
 * - Total Profit Earned by Member (from all distributions)
 * - Total Profit Contributed / Provided by Member
 * - Base Deposit Balance
 * - Overall Balance + Earned Profit
 */
export interface MemberProfitSummary {
  memberId: string;
  memberNo: string;
  memberName: string;
  currentDeposit: number;
  totalEarnedProfit: number;
  totalProvidedProfit: number;
  overallBalanceWithProfit: number;
  distributionCount: number;
}

export function deriveMemberProfitSummaries(
  records: any[] = [],
  members: any[] = [],
  profitDistributions: any[] = [],
  transactions: any[] = [],
  monthFilter: string = 'all'
): MemberProfitSummary[] {
  const memberMap = new Map<string, MemberProfitSummary>();

  // Initialize with all members, deriving strictly the pure Base Deposit (excluding profit)
  members.forEach(m => {
    const memberTxs = (transactions || []).filter((t: any) => t.memberId === m.id && t.status === 'completed');
    const depTxs = memberTxs.filter((t: any) => t.type === 'deposit').reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
    const withdrTxs = memberTxs.filter((t: any) => t.type === 'withdraw').reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
    const profTxs = memberTxs.filter((t: any) => t.type === 'profit_share').reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
    const dpsFdr = (Number(m.dpsSavingsBalance) || 0) + (Number(m.fdrSavingsBalance) || 0);

    let pureDeposit = 0;
    if (depTxs > 0 || withdrTxs > 0) {
      pureDeposit = Math.max(0, Number((depTxs - withdrTxs + dpsFdr).toFixed(2)));
    } else {
      const rawSavings = Number(m.totalSavings ?? m.generalSavingsBalance ?? 0);
      pureDeposit = Math.max(0, Number((rawSavings - profTxs).toFixed(2)));
    }

    memberMap.set(m.id, {
      memberId: m.id,
      memberNo: m.memberNo || '',
      memberName: m.name || '',
      currentDeposit: pureDeposit,
      totalEarnedProfit: 0,
      totalProvidedProfit: 0,
      overallBalanceWithProfit: pureDeposit,
      distributionCount: 0,
    });
  });

  // Track counted distribution keys per member to prevent duplicate counts between records and profitDistributions
  const memberCountedDistKeys = new Map<string, Set<string>>();
  members.forEach(m => memberCountedDistKeys.set(m.id, new Set()));

  // Active record IDs to filter out deleted records
  const activeRecordIds = new Set((records || []).map(r => r.id));

  // 1. Credit profit provided/contributed by members, plus any embedded memberDistributions snapshot
  (records || []).forEach(record => {
    if (monthFilter !== 'all' && record.month !== monthFilter) return;
    const profitAmount = Number(record.somitiProfitAmount || record.profitAmount || record.totalBusinessProfit || 0);
    const providerId = record.memberId;

    // Credit to provider
    if (providerId && memberMap.has(providerId)) {
      const p = memberMap.get(providerId)!;
      p.totalProvidedProfit = Number((p.totalProvidedProfit + profitAmount).toFixed(2));
    }

    // Credit to recipients from record snapshot
    const distributions = record.memberDistributions || record.distributions || [];
    distributions.forEach((d: any) => {
      const recipientId = d.memberId;
      const allocated = Number(d.allocatedProfit || 0);
      if (recipientId && memberMap.has(recipientId) && allocated > 0) {
        const distKey = `rec-${record.id}`;
        const userKeys = memberCountedDistKeys.get(recipientId)!;
        if (!userKeys.has(distKey)) {
          userKeys.add(distKey);
          userKeys.add(`pd-${record.id}`);
          userKeys.add(`dist-${record.id}`);
          const item = memberMap.get(recipientId)!;
          item.totalEarnedProfit = Number((item.totalEarnedProfit + allocated).toFixed(2));
          item.distributionCount += 1;
        }
      }
    });
  });

  // 2. Credit profit from profitDistributions (Monthly profit distribution cycles)
  (profitDistributions || []).forEach(dist => {
    // If monthFilter is active, filter distributions by month
    if (monthFilter !== 'all') {
      const distMonth = dist.month ? `${dist.year}-${String(dist.month).padStart(2, '0')}` : '';
      if (distMonth && distMonth !== monthFilter && dist.monthName !== monthFilter) return;
    }

    // Skip distributions belonging to deleted business profit records
    const recordTag = dist.id.startsWith('pd-')
      ? dist.id.slice(3)
      : (dist.id.startsWith('dist-bpr-')
          ? dist.id.slice(9)
          : dist.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]);
    if (recordTag && !activeRecordIds.has(recordTag)) {
      return;
    }

    const distKey = dist.id || dist.distributionNo;
    const mDist = dist.memberDistributions || [];
    mDist.forEach((d: any) => {
      const recipientId = d.memberId;
      const allocated = Number(d.allocatedProfit || 0);
      if (recipientId && memberMap.has(recipientId) && allocated > 0) {
        const userKeys = memberCountedDistKeys.get(recipientId)!;
        if (!userKeys.has(distKey) && (!recordTag || !userKeys.has(`rec-${recordTag}`))) {
          userKeys.add(distKey);
          if (recordTag) userKeys.add(`rec-${recordTag}`);
          const item = memberMap.get(recipientId)!;
          item.totalEarnedProfit = Number((item.totalEarnedProfit + allocated).toFixed(2));
          item.distributionCount += 1;
        }
      }
    });
  });

  // 3. Fallback: If a member still has 0 earned profit from distributions, check transactions of type 'profit_share'
  if (transactions && transactions.length > 0) {
    memberMap.forEach((item, memberId) => {
      if (item.totalEarnedProfit === 0) {
        const memberProfitTxs = transactions.filter((t: any) => {
          if (t.memberId !== memberId || t.type !== 'profit_share' || t.category === 'business_profit_member_share') {
            return false;
          }
          const bprTag = t.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]
            || (t.id.startsWith('tx-bpr-') ? t.id.replace('tx-', '').split('-')[0] : null);
          if (bprTag && !activeRecordIds.has(bprTag)) {
            return false;
          }
          if (monthFilter !== 'all') {
            const txMonth = t.date ? t.date.slice(0, 7) : '';
            if (txMonth !== monthFilter) return false;
          }
          return true;
        });

        if (memberProfitTxs.length > 0) {
          const txSum = memberProfitTxs.reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0);
          if (txSum > 0) {
            item.totalEarnedProfit = Number(txSum.toFixed(2));
            item.distributionCount = memberProfitTxs.length;
          }
        }
      }
    });
  }

  // 4. Update overallBalanceWithProfit
  memberMap.forEach(item => {
    item.overallBalanceWithProfit = Number(
      (item.currentDeposit + item.totalEarnedProfit).toFixed(2)
    );
  });

  return Array.from(memberMap.values()).sort((a, b) => b.totalEarnedProfit - a.totalEarnedProfit);
}

/**
 * Derives Date-wise Profit Summary
 */
export interface DateProfitSummary {
  date: string;
  totalProfit: number;
  transactionCount: number;
  providers: { memberName: string; amount: number; id: string }[];
}

export function deriveProfitByDate(records: any[]): DateProfitSummary[] {
  const dateMap = new Map<string, DateProfitSummary>();

  records.forEach(r => {
    const date = r.date || (r.createdAt ? r.createdAt.split('T')[0] : 'Unknown');
    const amount = Number(r.somitiProfitAmount || r.profitAmount || r.totalBusinessProfit || 0);

    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        totalProfit: 0,
        transactionCount: 0,
        providers: [],
      });
    }

    const entry = dateMap.get(date)!;
    entry.totalProfit = Number((entry.totalProfit + amount).toFixed(2));
    entry.transactionCount += 1;
    entry.providers.push({
      memberName: r.memberName || 'Unknown',
      amount,
      id: r.id,
    });
  });

  return Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Derives Month-wise Profit Summary
 */
export interface MonthProfitSummary {
  month: string;
  totalProfit: number;
  transactionCount: number;
  providersCount: number;
  providers: { memberName: string; totalAmount: number; count: number }[];
}

export function deriveProfitByMonth(records: any[]): MonthProfitSummary[] {
  const monthMap = new Map<string, {
    month: string;
    totalProfit: number;
    transactionCount: number;
    providerTotals: Map<string, { memberName: string; totalAmount: number; count: number }>;
  }>();

  records.forEach(r => {
    const month = r.month || (r.date ? r.date.slice(0, 7) : 'Unknown');
    const amount = Number(r.somitiProfitAmount || r.profitAmount || r.totalBusinessProfit || 0);
    const providerName = r.memberName || 'Unknown';

    if (!monthMap.has(month)) {
      monthMap.set(month, {
        month,
        totalProfit: 0,
        transactionCount: 0,
        providerTotals: new Map(),
      });
    }

    const mEntry = monthMap.get(month)!;
    mEntry.totalProfit = Number((mEntry.totalProfit + amount).toFixed(2));
    mEntry.transactionCount += 1;

    if (!mEntry.providerTotals.has(providerName)) {
      mEntry.providerTotals.set(providerName, { memberName: providerName, totalAmount: 0, count: 0 });
    }
    const p = mEntry.providerTotals.get(providerName)!;
    p.totalAmount = Number((p.totalAmount + amount).toFixed(2));
    p.count += 1;
  });

  return Array.from(monthMap.values())
    .map(m => ({
      month: m.month,
      totalProfit: m.totalProfit,
      transactionCount: m.transactionCount,
      providersCount: m.providerTotals.size,
      providers: Array.from(m.providerTotals.values()).sort((a, b) => b.totalAmount - a.totalAmount),
    }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Derives Provider-wise Profit Summary
 */
export interface ProviderProfitSummary {
  memberId: string;
  memberName: string;
  memberNo?: string;
  totalContributedProfit: number;
  transactionCount: number;
  transactions: any[];
}

export function deriveProfitByProvider(records: any[]): ProviderProfitSummary[] {
  const providerMap = new Map<string, ProviderProfitSummary>();

  records.forEach(r => {
    const id = r.memberId || r.memberName || 'Unknown';
    const amount = Number(r.somitiProfitAmount || r.profitAmount || r.totalBusinessProfit || 0);

    if (!providerMap.has(id)) {
      providerMap.set(id, {
        memberId: r.memberId || '',
        memberName: r.memberName || 'Unknown',
        memberNo: r.memberNo,
        totalContributedProfit: 0,
        transactionCount: 0,
        transactions: [],
      });
    }

    const p = providerMap.get(id)!;
    p.totalContributedProfit = Number((p.totalContributedProfit + amount).toFixed(2));
    p.transactionCount += 1;
    p.transactions.push(r);
  });

  return Array.from(providerMap.values()).sort(
    (a, b) => b.totalContributedProfit - a.totalContributedProfit
  );
}

/**
 * Extracts the member's current total savings/deposit balance with robust fallbacks
 */
export function getMemberSavingsBalance(m: { totalSavings?: number; generalSavingsBalance?: number; savingsBalance?: number } | null | undefined): number {
  if (!m) return 0;
  if (typeof m.totalSavings === 'number' && !isNaN(m.totalSavings) && m.totalSavings > 0) return m.totalSavings;
  if (typeof m.generalSavingsBalance === 'number' && !isNaN(m.generalSavingsBalance) && m.generalSavingsBalance > 0) return m.generalSavingsBalance;
  if (typeof m.savingsBalance === 'number' && !isNaN(m.savingsBalance) && m.savingsBalance > 0) return m.savingsBalance;
  return 0;
}
