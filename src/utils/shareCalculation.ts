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
