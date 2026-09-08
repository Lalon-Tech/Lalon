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
  records: any[],
  members: any[]
): MemberProfitSummary[] {
  const memberMap = new Map<string, MemberProfitSummary>();

  // Initialize with all members
  members.forEach(m => {
    const currentDeposit = Number(m.totalSavings || m.generalSavingsBalance || 0);
    memberMap.set(m.id, {
      memberId: m.id,
      memberNo: m.memberNo || '',
      memberName: m.name || '',
      currentDeposit,
      totalEarnedProfit: 0,
      totalProvidedProfit: 0,
      overallBalanceWithProfit: currentDeposit,
      distributionCount: 0,
    });
  });

  // Aggregate across all profit records
  records.forEach(record => {
    const profitAmount = Number(record.somitiProfitAmount || record.profitAmount || record.totalBusinessProfit || 0);
    const providerId = record.memberId;

    // 1. Credit to provider
    if (providerId && memberMap.has(providerId)) {
      const p = memberMap.get(providerId)!;
      p.totalProvidedProfit = Number((p.totalProvidedProfit + profitAmount).toFixed(2));
    }

    // 2. Credit to recipients from memberDistributions snapshot
    const distributions = record.memberDistributions || record.distributions || [];
    distributions.forEach((d: any) => {
      const recipientId = d.memberId;
      const allocated = Number(d.allocatedProfit || 0);
      if (recipientId && memberMap.has(recipientId)) {
        const item = memberMap.get(recipientId)!;
        item.totalEarnedProfit = Number((item.totalEarnedProfit + allocated).toFixed(2));
        item.distributionCount += 1;
        item.overallBalanceWithProfit = Number(
          (item.currentDeposit + item.totalEarnedProfit).toFixed(2)
        );
      }
    });
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
