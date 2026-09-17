import { Member, Transaction, ShareClosure } from '../types';

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
  const totalWith = completedTxs.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netDeposit = Math.max(0, totalDep - totalWith);

  const initialShares = Math.max(remainingShares, Number(member.shareCount) || remainingShares);
  const ratio = initialShares > 0 ? remainingShares / initialShares : 1;

  if (netDeposit > 0) {
    return Math.max(0, Number((netDeposit * ratio).toFixed(2)));
  }

  // Proportional general savings
  const generalSavings = Number(member.generalSavingsBalance) || 0;
  return Math.max(0, Number((generalSavings * ratio).toFixed(2)));
}

/**
 * Recalculates all member financial fields based on current/remaining share records.
 * Ensures that when shareCount is 0, all share-related values, Base Deposit, and Share Capital become 0.
 * If only some shares are surrendered, calculates remaining values based only on the remaining shares.
 */
export function recalculateMemberShareFinancials(
  member: Member,
  transactions: Transaction[] = [],
  shareClosures: ShareClosure[] = []
): Member {
  if (!member) return member;

  const remainingShares = calculateMemberRemainingShares(member, transactions, shareClosures);
  const dps = Number(member.dpsSavingsBalance) || 0;
  const fdr = Number(member.fdrSavingsBalance) || 0;

  // Requirement: When a member surrenders/deletes all of their shares, all share-related values for that member must become 0
  if (remainingShares <= 0) {
    return {
      ...member,
      shareCount: 0,
      shareValue: 0,
      generalSavingsBalance: 0,
      totalSavings: dps + fdr,
    };
  }

  // If only some shares are surrendered, calculate remaining values based only on the remaining shares
  const baseDeposit = calculateMemberBaseDeposit(member, transactions, shareClosures);
  const initialShares = Math.max(remainingShares, Number(member.shareCount) || remainingShares);
  const ratio = initialShares > 0 ? remainingShares / initialShares : 1;
  const remainingShareVal = Math.max(0, Math.round((Number(member.shareValue) || 0) * ratio));
  const totalSavings = baseDeposit + dps + fdr + remainingShareVal;

  return {
    ...member,
    shareCount: remainingShares,
    shareValue: remainingShareVal,
    generalSavingsBalance: baseDeposit,
    totalSavings,
  };
}
