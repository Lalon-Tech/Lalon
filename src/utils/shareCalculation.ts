import { Member, Transaction, ShareClosure } from '../types';
import { calculateMemberSavingsBreakdown } from './accountingRules';

/**
 * Calculates the current remaining active shares for a member based on verified share records
 * (share purchases, share surrenders, share closures, and active share transactions).
 */
export function calculateMemberRemainingShares(
  member: Member,
  transactions: Transaction[] = [],
  shareClosures: ShareClosure[] = []
): number {
  if (!member) return 0;

  const memberId = member.id;
  const memberClosures = (shareClosures || []).filter(c => c.memberId === memberId);
  const completedTxs = (transactions || []).filter(t => t.memberId === memberId && t.status === 'completed');

  // 1. Check if there are explicit share closure records
  if (memberClosures.length > 0) {
    const sortedClosures = [...memberClosures].sort(
      (a, b) => new Date(b.createdAt || b.closureDate).getTime() - new Date(a.createdAt || a.closureDate).getTime()
    );
    const latestClosure = sortedClosures[0];

    if (latestClosure && latestClosure.remainingActiveShares !== undefined) {
      if (latestClosure.remainingActiveShares === 0) {
        // Verify if new shares were purchased strictly AFTER this closure date
        const postClosurePurchases = completedTxs.filter(t =>
          t.type === 'share_purchase' &&
          new Date(t.date).getTime() > new Date(latestClosure.closureDate).getTime()
        );
        const postShares = postClosurePurchases.reduce(
          (sum, t) => sum + (Number(t.shareCount) || (t.selectedShares ? t.selectedShares.length : 0)),
          0
        );
        return Math.max(0, postShares);
      }
      return Math.max(0, latestClosure.remainingActiveShares);
    }
  }

  // 2. Derive from transactions
  const purchaseTxs = completedTxs.filter(t => t.type === 'share_purchase');
  const surrenderTxs = completedTxs.filter(t => t.type === 'share_surrender');

  const totalPurchasedFromTxs = purchaseTxs.reduce(
    (sum, t) => sum + (Number(t.shareCount) || (t.selectedShares ? t.selectedShares.length : 0)),
    0
  );
  const totalSurrenderedFromTxs = surrenderTxs.reduce(
    (sum, t) => sum + (Number(t.shareCount) || (t.selectedShares ? t.selectedShares.length : 0)),
    0
  );
  const totalClosedFromClosures = memberClosures.reduce(
    (sum, c) => sum + (Number(c.closedSharesCount) || 0),
    0
  );
  const totalClosed = Math.max(totalSurrenderedFromTxs, totalClosedFromClosures);

  // If member has surrendered/closed shares
  if (totalClosed > 0) {
    const baseShares = totalPurchasedFromTxs > 0 ? totalPurchasedFromTxs : (Number(member.shareCount) || 0);
    if (totalClosed >= baseShares) {
      return 0;
    }
    return Math.max(0, baseShares - totalClosed);
  }

  // If member has purchase transactions, but no closures
  if (purchaseTxs.length > 0) {
    return Math.max(0, totalPurchasedFromTxs);
  }

  // If there are transactions in the system or for this member, but no purchase transactions exist:
  if (completedTxs.length > 0 && purchaseTxs.length === 0) {
    // Member has transaction history, but has 0 share purchase transactions
    return 0;
  }

  // Fallback to member's recorded shareCount
  return Math.max(0, Number(member.shareCount) || 0);
}

/**
 * Calculates the pure Base Deposit for a member based strictly on remaining active shares.
 * When a member has 0 shares, Base Deposit is strictly 0.
 * If only some shares are surrendered, calculates the remaining value based only on remaining shares.
 */
export function calculateMemberBaseDeposit(
  member: Member,
  transactions: Transaction[] = [],
  shareClosures: ShareClosure[] = []
): number {
  if (!member) return 0;

  const remainingShares = calculateMemberRemainingShares(member, transactions, shareClosures);

  // Requirement: When a member surrenders/deletes all of their shares, all share-related values and Base Deposit must become 0
  if (remainingShares <= 0) {
    return 0;
  }

  const memberId = member.id;
  const completedTxs = (transactions || []).filter(t => t.memberId === memberId && t.status === 'completed');
  const sharePurchaseTxs = completedTxs.filter(t => t.type === 'share_purchase');
  const depositTxs = completedTxs.filter(t => t.type === 'deposit');

  // Share-wise breakdown calculation for active shares 1 .. remainingShares
  let accumulatedForActiveShares = 0;
  let hasShareWiseData = false;

  for (let shareNo = 1; shareNo <= remainingShares; shareNo++) {
    let initialDeposit = 0;
    for (const tx of sharePurchaseTxs) {
      if (tx.shareAmounts && tx.shareAmounts[shareNo] !== undefined) {
        initialDeposit = Number(tx.shareAmounts[shareNo]) || 0;
        hasShareWiseData = true;
        break;
      } else if (tx.selectedShares && tx.selectedShares.includes(shareNo)) {
        initialDeposit = Number(tx.unitPrice) || (Number(tx.amount) / (tx.selectedShares.length || 1));
        hasShareWiseData = true;
        break;
      }
    }

    let monthlyDepositsTotal = 0;
    depositTxs.forEach(tx => {
      if (tx.shareAmounts && tx.shareAmounts[shareNo] !== undefined) {
        monthlyDepositsTotal += Number(tx.shareAmounts[shareNo]) || 0;
        hasShareWiseData = true;
      } else if (tx.selectedShares && tx.selectedShares.includes(shareNo)) {
        const rate = tx.shareRate || (tx.amount / (tx.selectedShares.length || 1));
        monthlyDepositsTotal += rate;
        hasShareWiseData = true;
      }
    });

    accumulatedForActiveShares += (initialDeposit + monthlyDepositsTotal);
  }

  if (hasShareWiseData && accumulatedForActiveShares > 0) {
    return Math.max(0, Number(accumulatedForActiveShares.toFixed(2)));
  }

  // Transaction ledger net calculation
  const totalDep = depositTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalProf = completedTxs.filter(t => t.type === 'profit_share').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalWith = completedTxs.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netDeposit = Math.max(0, totalDep + totalProf - totalWith);

  const initialShares = Math.max(remainingShares, Number(member.shareCount) || remainingShares);
  const ratio = initialShares > 0 ? remainingShares / initialShares : 1;

  if (depositTxs.length > 0 || completedTxs.some(t => t.type === 'profit_share' || t.type === 'withdraw')) {
    return Math.max(0, Number((netDeposit * ratio).toFixed(2)));
  }

  // If member has other transactions, but 0 deposit transactions:
  if (completedTxs.length > 0) {
    return 0;
  }

  // Proportional general savings fallback only if no transactions exist in the ledger
  const generalSavings = Number(member.generalSavingsBalance) || 0;
  return Math.max(0, Number((generalSavings * ratio).toFixed(2)));
}

/**
 * Recalculates all member financial fields based on current/remaining share records.
 * Ensures that when shareCount is 0, all share-related values, Base Deposit, and Share Capital become 0.
 * If only some shares are surrendered, calculates remaining values based only on the remaining shares.
 * Sums valid active financial records rather than relying on stale cached values.
 */
export function recalculateMemberShareFinancials(
  member: Member,
  transactions: Transaction[] = [],
  shareClosures: ShareClosure[] = [],
  sharePricePerUnit: number = 1000
): Member {
  if (!member) return member;

  const memberId = member.id;
  const completedTxs = (transactions || []).filter(t => t.memberId === memberId && t.status === 'completed');

  const remainingShares = calculateMemberRemainingShares(member, transactions, shareClosures);

  // Derive DPS and FDR strictly from valid active transactions
  const dpsTxs = completedTxs.filter(t => t.type === 'dps_deposit');
  const fdrTxs = completedTxs.filter(t => t.type === 'fdr_deposit');
  const dpsFromTxs = dpsTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const fdrFromTxs = fdrTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // If member has transactions in history, use exact ledger sum. Do not retain stale cached values.
  const dps = dpsTxs.length > 0 ? dpsFromTxs : (completedTxs.length > 0 ? 0 : (Number(member.dpsSavingsBalance) || 0));
  const fdr = fdrTxs.length > 0 ? fdrFromTxs : (completedTxs.length > 0 ? 0 : (Number(member.fdrSavingsBalance) || 0));

  // Requirement: When a member surrenders/deletes all of their shares, all share-related values for that member must become 0
  // Base Deposit must become 0 when the member has no remaining shares.
  // Share Capital related to those shares must also be 0.
  // When remainingShares <= 0, any share-related value is 0. If no DPS/FDR records exist, totalSavings is 0.
  if (remainingShares <= 0) {
    const finalDps = dpsTxs.length > 0 ? dpsFromTxs : 0;
    const finalFdr = fdrTxs.length > 0 ? fdrFromTxs : 0;
    return {
      ...member,
      shareCount: 0,
      shareValue: 0,
      generalSavingsBalance: 0,
      dpsSavingsBalance: finalDps,
      fdrSavingsBalance: finalFdr,
      totalSavings: finalDps + finalFdr,
    };
  }

  // Calculate pure savings strictly based on actual recorded deposits and profit
  const breakdown = calculateMemberSavingsBreakdown(member, transactions, shareClosures);

  return {
    ...member,
    shareCount: remainingShares,
    shareValue: 0, // No separate inflated shareValue in savings
    generalSavingsBalance: breakdown.generalSavingsBalance,
    dpsSavingsBalance: breakdown.dpsSavingsBalance,
    fdrSavingsBalance: breakdown.fdrSavingsBalance,
    totalSavings: breakdown.totalSavings,
  };
}

/**
 * Interface representing tracking data for a single Share
 */
export interface ShareWiseProfitItem {
  shareNo: number;
  initialDeposit: number;       // Share purchase / initial equity deposit (৳)
  monthlyDeposits: number;      // Monthly savings deposits accumulated on this share (৳)
  totalDeposit: number;         // Total Deposit for this share (৳)
  depositPercentage: number;    // Share's proportion of member's total deposit (%)
  totalProfit: number;          // Total Profit allocated to this share (৳)
  profitPercentage: number;     // Share's proportion of member's total profit (%)
  totalSavings: number;         // Total Savings = Total Deposit + Total Profit (৳)
  purchaseDate?: string;
  voucherNo?: string;
  status: 'active' | 'closed';
}

/**
 * Interface representing a member's complete share-wise profit and deposit summary
 */
export interface MemberShareWiseSummary {
  memberId: string;
  memberNo: string;
  memberName: string;
  totalShares: number;
  shares: ShareWiseProfitItem[];
  totalDeposit: number;         // Sum of all shares' deposits
  totalProfit: number;          // Sum of all shares' profits
  totalSavings: number;         // Sum of all shares' total savings (deposit + profit)
}

/**
 * Calculates share-wise Deposit, Profit, and Total Savings (Deposit + Profit) separately
 * for each individual share of a member.
 * 
 * Rules:
 * 1. Uses verified share-wise deposit records (tx.shareAmounts / tx.selectedShares / tx.shareRate).
 * 2. Allocates profit proportionally based on each share's deposit weight (or explicit share profit).
 * 3. Exact 2-decimal rounding with final-share adjustment ensures:
 *    Sum of All Shares' Deposits === Member Total Deposit
 *    Sum of All Shares' Profits === Member Total Profit
 *    Sum of All Shares' Savings === Member Total Savings (Deposit + Profit)
 * 
 * Example:
 * Share #1 → Deposit ৳6,000 | Profit ৳1,500 | Total ৳7,500
 * Share #2 → Deposit ৳4,000 | Profit ৳1,000 | Total ৳5,000
 */
export function calculateMemberShareWiseProfits(
  member: Member,
  transactions: Transaction[] = [],
  shareClosures: ShareClosure[] = [],
  totalProfitOverride?: number
): MemberShareWiseSummary {
  if (!member) {
    return {
      memberId: '',
      memberNo: '',
      memberName: '',
      totalShares: 0,
      shares: [],
      totalDeposit: 0,
      totalProfit: 0,
      totalSavings: 0,
    };
  }

  const remainingShares = calculateMemberRemainingShares(member, transactions, shareClosures);

  // If member has 0 active shares, return empty
  if (remainingShares <= 0) {
    return {
      memberId: member.id,
      memberNo: member.memberNo || '',
      memberName: member.name || '',
      totalShares: 0,
      shares: [],
      totalDeposit: 0,
      totalProfit: 0,
      totalSavings: 0,
    };
  }

  const completedTxs = (transactions || []).filter(t => t.memberId === member.id && t.status === 'completed');
  const sharePurchaseTxs = completedTxs.filter(t => t.type === 'share_purchase');
  const depositTxs = completedTxs.filter(t => t.type === 'deposit');
  const profitTxs = completedTxs.filter(t => t.type === 'profit_share');

  // 1. Calculate each share's Deposit (Initial + Monthly)
  interface RawShareData {
    shareNo: number;
    initialDeposit: number;
    monthlyDeposits: number;
    totalDeposit: number;
    explicitProfit: number;
    purchaseDate?: string;
    voucherNo?: string;
  }

  const rawShares: RawShareData[] = [];

  for (let shareNo = 1; shareNo <= remainingShares; shareNo++) {
    // Initial deposit from share purchase
    let initialDeposit = 0;
    let purchaseDate: string | undefined;
    let voucherNo: string | undefined;

    for (const tx of sharePurchaseTxs) {
      if (tx.shareAmounts && tx.shareAmounts[shareNo] !== undefined) {
        initialDeposit = Number(tx.shareAmounts[shareNo]) || 0;
        purchaseDate = tx.date;
        voucherNo = tx.voucherNo;
        break;
      } else if (tx.selectedShares && tx.selectedShares.includes(shareNo)) {
        initialDeposit = Number(tx.unitPrice) || (Number(tx.amount) / (tx.selectedShares.length || 1));
        purchaseDate = tx.date;
        voucherNo = tx.voucherNo;
        break;
      }
    }

    // Monthly deposits assigned to this share
    let monthlyDeposits = 0;
    depositTxs.forEach(tx => {
      if (tx.shareAmounts && tx.shareAmounts[shareNo] !== undefined) {
        monthlyDeposits += Number(tx.shareAmounts[shareNo]) || 0;
      } else if (tx.selectedShares && tx.selectedShares.includes(shareNo)) {
        const rate = tx.shareRate || (tx.amount / (tx.selectedShares.length || 1));
        monthlyDeposits += rate;
      }
    });

    // Check for any explicit profit recorded specifically for this share
    let explicitProfit = 0;
    profitTxs.forEach(tx => {
      if (tx.shareAmounts && tx.shareAmounts[shareNo] !== undefined) {
        explicitProfit += Number(tx.shareAmounts[shareNo]) || 0;
      } else if (tx.selectedShares && tx.selectedShares.includes(shareNo) && tx.selectedShares.length === 1) {
        explicitProfit += Number(tx.amount) || 0;
      }
    });

    const totalDeposit = Number((initialDeposit + monthlyDeposits).toFixed(2));

    rawShares.push({
      shareNo,
      initialDeposit: Number(initialDeposit.toFixed(2)),
      monthlyDeposits: Number(monthlyDeposits.toFixed(2)),
      totalDeposit,
      explicitProfit: Number(explicitProfit.toFixed(2)),
      purchaseDate,
      voucherNo,
    });
  }

  // Sum of deposits across all shares
  let totalDepositSum = Number(
    rawShares.reduce((sum, s) => sum + s.totalDeposit, 0).toFixed(2)
  );

  // If no share-wise transactions exist yet, fallback to member's base deposit divided equally
  if (totalDepositSum <= 0) {
    const fallbackBaseDeposit = calculateMemberBaseDeposit(member, transactions, shareClosures);
    if (fallbackBaseDeposit > 0) {
      const perShareDeposit = Number((fallbackBaseDeposit / remainingShares).toFixed(2));
      let runningDeposit = 0;
      rawShares.forEach((s, idx) => {
        if (idx === rawShares.length - 1) {
          s.totalDeposit = Number((fallbackBaseDeposit - runningDeposit).toFixed(2));
        } else {
          s.totalDeposit = perShareDeposit;
          runningDeposit = Number((runningDeposit + perShareDeposit).toFixed(2));
        }
        s.monthlyDeposits = s.totalDeposit;
      });
      totalDepositSum = fallbackBaseDeposit;
    }
  }

  // 2. Determine member's total profit earned
  let totalMemberProfit = 0;
  if (totalProfitOverride !== undefined && totalProfitOverride !== null && !isNaN(totalProfitOverride)) {
    totalMemberProfit = Math.max(0, Number(Number(totalProfitOverride).toFixed(2)));
  } else {
    // Sum from completed profit_share transactions
    const txProfitSum = profitTxs
      .filter(t => t.category !== 'business_profit_member_share')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    totalMemberProfit = Number(Math.max(0, txProfitSum).toFixed(2));
  }

  // 3. Allocate profit across shares
  const totalExplicitProfit = Number(
    rawShares.reduce((sum, s) => sum + s.explicitProfit, 0).toFixed(2)
  );

  const unallocatedProfit = Math.max(0, Number((totalMemberProfit - totalExplicitProfit).toFixed(2)));

  let runningProfitSum = 0;
  const finalShares: ShareWiseProfitItem[] = rawShares.map((s, idx) => {
    const isLast = idx === rawShares.length - 1;
    let shareProfit = s.explicitProfit;

    if (unallocatedProfit > 0) {
      if (totalDepositSum > 0) {
        // Proportional distribution based on share's deposit weight
        const weight = s.totalDeposit / totalDepositSum;
        const rawAllocated = weight * unallocatedProfit;
        let allocatedProfit = Math.round(rawAllocated * 100) / 100;

        if (isLast) {
          // Exact final-cent adjustment mechanism
          allocatedProfit = Number((unallocatedProfit - runningProfitSum).toFixed(2));
          if (allocatedProfit < 0) allocatedProfit = 0;
        } else {
          runningProfitSum = Number((runningProfitSum + allocatedProfit).toFixed(2));
        }
        shareProfit = Number((shareProfit + allocatedProfit).toFixed(2));
      } else {
        // Equal split if all deposits are 0
        const perShare = Math.round((unallocatedProfit / remainingShares) * 100) / 100;
        let allocatedProfit = perShare;
        if (isLast) {
          allocatedProfit = Number((unallocatedProfit - runningProfitSum).toFixed(2));
          if (allocatedProfit < 0) allocatedProfit = 0;
        } else {
          runningProfitSum = Number((runningProfitSum + allocatedProfit).toFixed(2));
        }
        shareProfit = Number((shareProfit + allocatedProfit).toFixed(2));
      }
    }

    const depositPercentage = totalDepositSum > 0
      ? Number(((s.totalDeposit / totalDepositSum) * 100).toFixed(2))
      : Number((100 / remainingShares).toFixed(2));

    const profitPercentage = totalMemberProfit > 0
      ? Number(((shareProfit / totalMemberProfit) * 100).toFixed(2))
      : depositPercentage;

    const totalSavings = Number((s.totalDeposit + shareProfit).toFixed(2));

    return {
      shareNo: s.shareNo,
      initialDeposit: s.initialDeposit,
      monthlyDeposits: s.monthlyDeposits,
      totalDeposit: s.totalDeposit,
      depositPercentage,
      totalProfit: shareProfit,
      profitPercentage,
      totalSavings,
      purchaseDate: s.purchaseDate,
      voucherNo: s.voucherNo,
      status: 'active' as const,
    };
  });

  const verifiedTotalProfit = Number(
    finalShares.reduce((sum, s) => sum + s.totalProfit, 0).toFixed(2)
  );

  const verifiedTotalSavings = Number(
    finalShares.reduce((sum, s) => sum + s.totalSavings, 0).toFixed(2)
  );

  return {
    memberId: member.id,
    memberNo: member.memberNo || '',
    memberName: member.name || '',
    totalShares: remainingShares,
    shares: finalShares,
    totalDeposit: totalDepositSum,
    totalProfit: verifiedTotalProfit,
    totalSavings: verifiedTotalSavings,
  };
}
