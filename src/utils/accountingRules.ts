import { Member, Transaction, Loan, BusinessFunding, IncomeExpenseItem, ShareClosure } from '../types';

/**
 * PERMANENT AND FIXED ACCOUNTING ENGINE FOR BONDHU SOMITI
 * 
 * Rules Implemented:
 * 1. SHARE SYSTEM: Fixed unit value ৳1,000. Stored as shareCount. Never auto-inflates balances.
 * 2. TOTAL MEMBER SAVINGS: Total Member Deposits + Total Member Profit
 * 3. ACTIVE LOANS OUT: Total Loan Principal - Total Principal Repaid
 * 4. AVAILABLE BALANCE (CASH + BANK): Total Money Received - Total Money Paid/Invested
 * 5. TOTAL BUSINESS CAPITAL: Total Business Funding - Total Business Capital Returned
 * 6. NO AUTOMATIC FINANCIAL ENTRIES: Zero automatic transactions on registration or updates.
 * 7. SINGLE SOURCE OF TRUTH: Ledger-derived dynamic calculation across all views.
 * 8. SEPARATION OF SHARES & MONEY: Shares count is distinct from deposited funds.
 */

export interface MemberFinancialsBreakdown {
  memberId: string;
  shareCount: number;
  totalDeposits: number;
  totalProfit: number;
  totalWithdrawals: number;
  totalSavings: number; // Total Member Deposits + Total Member Profit (net of withdrawals/refunds)
  generalSavingsBalance: number;
  dpsSavingsBalance: number;
  fdrSavingsBalance: number;
  activeLoanPrincipalOut: number;
}

export interface AccountingSummary {
  // Available Balance Breakdown
  totalMoneyReceived: number;
  totalMoneyPaidOrInvested: number;
  availableBalance: number;

  // Components of Money Received
  startingMoney: number;
  memberDepositsReceived: number;
  sharePurchaseReceived: number;
  loanRepaymentsReceived: number;
  businessFundingRepaymentsReceived: number;
  profitReceived: number;
  otherIncomeReceived: number;

  // Components of Money Paid/Invested
  loansGiven: number;
  businessFundingGiven: number;
  withdrawalsAndRefunds: number;
  otherExpenses: number;

  // Other Core Balances
  totalMemberSavings: number;
  totalActiveLoansOut: number;
  totalBusinessCapital: number;
  totalBankBalance: number;
  totalVaultCash: number;
}

/**
 * 1 & 2. Calculate Total Member Savings for a single member
 * Exact Formula: Total Member Savings = Total Member Deposits + Total Member Profit
 * (Net of actual recorded withdrawals and share surrender refunds)
 * IMPORTANT: Does NOT use fixed ৳1,000 Share Value to automatically inflate savings.
 */
export function calculateMemberSavingsBreakdown(
  member: Member,
  transactions: Transaction[] = [],
  shareClosures: ShareClosure[] = []
): MemberFinancialsBreakdown {
  if (!member) {
    return {
      memberId: '',
      shareCount: 0,
      totalDeposits: 0,
      totalProfit: 0,
      totalWithdrawals: 0,
      totalSavings: 0,
      generalSavingsBalance: 0,
      dpsSavingsBalance: 0,
      fdrSavingsBalance: 0,
      activeLoanPrincipalOut: 0,
    };
  }

  const memberId = member.id;
  const completedTxs = (transactions || []).filter(
    t => t.memberId === memberId && t.status === 'completed'
  );

  // Shares Count
  let shareCount = Number(member.shareCount) || 0;
  const memberClosures = (shareClosures || []).filter(c => c.memberId === memberId);
  const purchaseTxs = completedTxs.filter(t => t.type === 'share_purchase');
  const surrenderTxs = completedTxs.filter(t => t.type === 'share_surrender');

  const totalPurchased = purchaseTxs.reduce(
    (sum, t) => sum + (Number(t.shareCount) || (t.selectedShares ? t.selectedShares.length : 0)),
    0
  );
  const totalSurrendered = surrenderTxs.reduce(
    (sum, t) => sum + (Number(t.shareCount) || (t.selectedShares ? t.selectedShares.length : 0)),
    0
  );
  const totalClosedFromClosures = memberClosures.reduce(
    (sum, c) => sum + (Number(c.closedSharesCount) || 0),
    0
  );
  const totalClosed = Math.max(totalSurrendered, totalClosedFromClosures);

  if (purchaseTxs.length > 0) {
    shareCount = Math.max(0, totalPurchased - totalClosed);
  } else if (totalClosed > 0) {
    shareCount = Math.max(0, (Number(member.shareCount) || 0) - totalClosed);
  }

  // Deposits breakdown
  const genDepositTxs = completedTxs.filter(t => t.type === 'deposit');
  const sharePurchaseTxs = completedTxs.filter(t => t.type === 'share_purchase');
  const dpsTxs = completedTxs.filter(t => t.type === 'dps_deposit');
  const fdrTxs = completedTxs.filter(t => t.type === 'fdr_deposit');

  const sumGenDeposits = genDepositTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const sumSharePurchase = sharePurchaseTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const sumDps = dpsTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const sumFdr = fdrTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Profit breakdown
  const profitTxs = completedTxs.filter(t => t.type === 'profit_share');
  const sumProfit = profitTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Withdrawals & Refunds
  const withdrawTxs = completedTxs.filter(t => t.type === 'withdraw');
  const surrenderRefundTxs = completedTxs.filter(t => t.type === 'share_surrender');
  const sumWithdrawals = withdrawTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const sumSurrenderRefunds = surrenderRefundTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalWithdrawals = sumWithdrawals + sumSurrenderRefunds;

  const totalDeposits = sumGenDeposits + sumSharePurchase + sumDps + sumFdr;
  const totalProfit = sumProfit;

  // When ledger transactions exist for this member, derive balances directly from ledger
  let totalSavings = 0;
  let netGeneral = 0;
  let netDps = 0;
  let netFdr = 0;

  if (completedTxs.length > 0) {
    // Exact Formula: Total Member Savings = Total Member Deposits + Total Member Profit (net of actual withdrawals)
    totalSavings = Math.max(0, totalDeposits + totalProfit - totalWithdrawals);
    netGeneral = Math.max(0, (sumGenDeposits + sumSharePurchase + sumProfit) - totalWithdrawals);
    netDps = Math.max(0, sumDps);
    netFdr = Math.max(0, sumFdr);
  } else {
    // If no transactions exist yet for this member, fallback to explicit member record without shareValue inflation
    netGeneral = Number(member.generalSavingsBalance) || 0;
    netDps = Number(member.dpsSavingsBalance) || 0;
    netFdr = Number(member.fdrSavingsBalance) || 0;
    totalSavings = netGeneral + netDps + netFdr;
  }

  return {
    memberId,
    shareCount,
    totalDeposits,
    totalProfit,
    totalWithdrawals,
    totalSavings,
    generalSavingsBalance: netGeneral,
    dpsSavingsBalance: netDps,
    fdrSavingsBalance: netFdr,
    activeLoanPrincipalOut: Number(member.activeLoanBalance) || 0,
  };
}

/**
 * 3. ACTIVE LOANS OUT
 * Exact formula: Active Loans Out = Total Loan Principal − Total Principal Repaid
 * Only outstanding principal should be counted as Active Loans Out.
 * Loan interest/profit must NOT be incorrectly added to the outstanding principal.
 */
export function calculateActiveLoansOut(
  loans: Loan[] = [],
  transactions: Transaction[] = [],
  members: Member[] = []
): number {
  const deletedMemberIds = new Set((members || []).filter(m => m.isDeleted).map(m => m.id));
  const activeLoans = (loans || []).filter(l => l.status === 'active' && !deletedMemberIds.has(l.memberId));
  const completedInstallments = (transactions || []).filter(
    t => t.status === 'completed' && t.type === 'loan_installment'
  );

  let totalPrincipalOut = 0;

  for (const loan of activeLoans) {
    const principal = Number(loan.principalAmount) || 0;
    const totalAmount = Number(loan.totalAmount) || principal;
    const principalRatio = totalAmount > 0 ? principal / totalAmount : 1;

    // Calculate total principal repaid for this loan
    let principalRepaid = 0;

    // Check schedule if available with explicit principal breakdown
    if (loan.schedule && loan.schedule.length > 0) {
      principalRepaid = loan.schedule
        .filter(inst => inst.status === 'paid')
        .reduce((sum, inst) => sum + (Number(inst.principal) || ((Number(inst.paidAmount) || inst.amount) * principalRatio)), 0);
    } else {
      // Find matching completed transactions for this loan
      const loanTxs = completedInstallments.filter(t => t.loanId === loan.id);
      if (loanTxs.length > 0) {
        const totalPaidTxs = loanTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        principalRepaid = totalPaidTxs * principalRatio;
      } else if (loan.paidAmount) {
        principalRepaid = (Number(loan.paidAmount) || 0) * principalRatio;
      }
    }

    const loanPrincipalOutstanding = Math.max(0, principal - principalRepaid);
    totalPrincipalOut += loanPrincipalOutstanding;
  }

  return Math.round(totalPrincipalOut);
}

/**
 * 5. TOTAL BUSINESS CAPITAL
 * Exact formula: Total Business Capital = Total Business Funding − Total Business Capital Returned
 */
export function calculateTotalBusinessCapital(
  businessFundings: BusinessFunding[] = [],
  transactions: Transaction[] = []
): number {
  const activeOrDisbursedFundings = (businessFundings || []).filter(
    f => f.status === 'active' || f.status === 'completed' || !!f.disbursementDate
  );

  if (activeOrDisbursedFundings.length === 0) {
    return 0;
  }

  const validFundingIds = new Set(activeOrDisbursedFundings.map(f => f.id));
  const validAppNos = new Set(activeOrDisbursedFundings.map(f => f.applicationNo).filter(Boolean));

  const totalBusinessFunding = activeOrDisbursedFundings.reduce(
    (sum, f) => sum + (Number(f.approvedAmount || f.amountRequested) || 0),
    0
  );

  // Capital returned from fundings or transactions
  const returnedFromFundings = activeOrDisbursedFundings.reduce(
    (sum, f) => sum + (Number(f.repaidPrincipal) || 0),
    0
  );

  const returnedFromTxs = (transactions || [])
    .filter(t => {
      if (t.status !== 'completed' || t.type !== 'business_funding_return') return false;
      return (t.businessFundingId && validFundingIds.has(t.businessFundingId)) ||
        Array.from(validFundingIds).some(id => t.id.includes(id) || t.notes?.includes(id)) ||
        Array.from(validAppNos).some(appNo => t.notes?.includes(appNo));
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalBusinessCapitalReturned = Math.max(returnedFromFundings, returnedFromTxs);

  return Math.max(0, totalBusinessFunding - totalBusinessCapitalReturned);
}

/**
 * 4. AVAILABLE BALANCE (CASH + BANK)
 * Exact formula: Available Balance (Cash + Bank) = Total Money Received − Total Money Paid/Invested
 * 
 * Money Received:
 *  - Starting/Member Money
 *  - Member Deposits
 *  - Share Purchase Money
 *  - Loan Repayments
 *  - Business Funding Repayments/Income
 *  - Profit
 *  - Other Income
 * 
 * Money Paid/Invested:
 *  - Loans Given
 *  - Business Funding Given
 *  - Withdrawals/Refunds
 *  - Other Expenses
 */
export function calculateAccountingSummary(
  transactions: Transaction[] = [],
  vouchers: IncomeExpenseItem[] = [],
  members: Member[] = [],
  loans: Loan[] = [],
  businessFundings: BusinessFunding[] = [],
  bankBalances: number = 0,
  startingMoney: number = 0
): AccountingSummary {
  // Only strictly 'completed' transactions contribute. Any pending, rejected, cancelled, or reversed contribute 0.
  const completedTxs = (transactions || []).filter(t => t.status === 'completed');

  // Valid active/cleared records sets
  const validLoans = (loans || []).filter(
    l => l.status === 'active' || l.status === 'cleared'
  );
  const validLoanIds = new Set(validLoans.map(l => l.id));
  const validLoanNos = new Set(validLoans.map(l => l.loanNo).filter(Boolean));

  const validBusinessFundings = (businessFundings || []).filter(
    f => f.status === 'active' || f.status === 'completed' || !!f.disbursementDate
  );
  const validFundingIds = new Set(validBusinessFundings.map(f => f.id));
  const validAppNos = new Set(validBusinessFundings.map(f => f.applicationNo).filter(Boolean));

  // 1. Money Received Breakdown
  // - Member Deposits: deposit, dps_deposit, fdr_deposit, admission_fee
  const memberDepositsReceived = completedTxs
    .filter(t => ['deposit', 'dps_deposit', 'fdr_deposit', 'admission_fee'].includes(t.type))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // - Share Purchase Money
  const sharePurchaseReceived = completedTxs
    .filter(t => t.type === 'share_purchase')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // - Loan Repayments: only from valid loans (deleted or rejected loans contribute 0)
  const loanRepaymentsReceived = completedTxs
    .filter(t => {
      if (t.type !== 'loan_installment') return false;
      if (t.loanId && loans.length > 0) {
        const matchingLoan = loans.find(l => l.id === t.loanId);
        if (matchingLoan && (matchingLoan.status === 'rejected' || matchingLoan.isReversed)) {
          return false;
        }
      }
      return true;
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // - Business Funding Repayments / Income (capital return + profit return): only from valid existing fundings
  const businessFundingRepaymentsReceived = completedTxs
    .filter(t => {
      if (t.type !== 'business_funding_return' && t.type !== 'business_funding_profit') return false;
      if (validBusinessFundings.length === 0) return false;
      return (t.businessFundingId && validFundingIds.has(t.businessFundingId)) ||
        Array.from(validFundingIds).some(id => t.id.includes(id) || t.notes?.includes(id)) ||
        Array.from(validAppNos).some(appNo => t.notes?.includes(appNo)) ||
        validBusinessFundings.some(f => f.memberId === t.memberId);
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // - Profit
  const profitReceived = completedTxs
    .filter(t => t.type === 'profit_share')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // - Other Income: income, fine, income vouchers not in transactions
  const txIncome = completedTxs
    .filter(t => t.type === 'income' || t.type === 'fine')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const voucherIncome = (vouchers || [])
    .filter(v => v.type === 'income' && !completedTxs.some(t => t.voucherNo === v.voucherNo) && v.category !== 'ব্যবসায়িক লভ্যাংশ আয়')
    .reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  const otherIncomeReceived = txIncome + voucherIncome;

  const totalMoneyReceived =
    startingMoney +
    memberDepositsReceived +
    sharePurchaseReceived +
    loanRepaymentsReceived +
    businessFundingRepaymentsReceived +
    profitReceived +
    otherIncomeReceived;

  // 2. Money Paid / Invested Breakdown
  // - Loans Given:
  // A loan disbursement is ONLY valid if the loan exists in loans and is active/completed.
  // If the loan was deleted, pending, or rejected, its disbursement transaction contributes 0!
  const validLoanDisbursedTxs = completedTxs.filter(t => {
    if (t.type !== 'loan_disbursed') return false;
    if (validLoans.length === 0) return false;
    const matchesId = (t.loanId && validLoanIds.has(t.loanId)) ||
      Array.from(validLoanIds).some(id => t.id.includes(id) || t.notes?.includes(id));
    const matchesLoanNo = Array.from(validLoanNos).some(no => t.notes?.includes(no));
    const matchesMemberAndAmount = validLoans.some(l => 
      l.memberId === t.memberId && Number(t.amount) === Number(l.principalAmount)
    );
    return matchesId || matchesLoanNo || matchesMemberAndAmount;
  });

  const loansGiven = validLoans.length === 0
    ? 0
    : (validLoanDisbursedTxs.length > 0
        ? validLoanDisbursedTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
        : validLoans.reduce((sum, l) => sum + (Number(l.principalAmount) || 0), 0));

  // - Business Funding Given:
  // A business funding disbursement is ONLY valid if the funding exists in businessFundings
  // and is active or completed. If the funding was deleted, rejected, cancelled, or pending, it contributes 0!
  const validBusinessFundingTxs = completedTxs.filter(t => {
    if (t.type !== 'business_funding_disbursed') return false;
    if (validBusinessFundings.length === 0) return false;
    const matchesId = (t.businessFundingId && validFundingIds.has(t.businessFundingId)) ||
      Array.from(validFundingIds).some(id => t.id.includes(id) || t.notes?.includes(id));
    const matchesAppNo = Array.from(validAppNos).some(appNo => t.notes?.includes(appNo));
    return matchesId || matchesAppNo;
  });

  const businessFundingGivenFromTxs = validBusinessFundingTxs.reduce(
    (sum, t) => sum + (Number(t.amount) || 0), 0
  );

  const businessFundingGivenFromRecords = validBusinessFundings.reduce(
    (sum, f) => sum + (Number(f.approvedAmount || f.amountRequested) || 0), 0
  );

  // If there are NO active/completed business fundings (e.g. funding was deleted), businessFundingGiven MUST be 0!
  const businessFundingGiven = validBusinessFundings.length === 0
    ? 0
    : (validBusinessFundingTxs.length > 0 ? businessFundingGivenFromTxs : businessFundingGivenFromRecords);

  // - Withdrawals / Refunds: withdraw, share_surrender
  const withdrawalsAndRefunds = completedTxs
    .filter(t => t.type === 'withdraw' || t.type === 'share_surrender')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // - Other Expenses: expense, expense vouchers not in transactions
  const txExpense = completedTxs
    .filter(t => {
      if (t.type !== 'expense') return false;
      // Skip if it is already counted in business funding or is associated with a deleted business funding
      if (t.businessFundingId || t.category === 'ব্যবসা বিনিয়োগ বিতরণ' || t.notes?.includes('BF-') || t.notes?.includes('ব্যবসা ফান্ডিং')) {
        const matchesActiveFunding = validBusinessFundings.some(f => 
          (t.businessFundingId && f.id === t.businessFundingId) || 
          (f.applicationNo && t.notes?.includes(f.applicationNo)) ||
          (f.id && t.notes?.includes(f.id))
        );
        if (!matchesActiveFunding) return false;
      }
      return true;
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const voucherExpense = (vouchers || [])
    .filter(v => {
      if (v.type !== 'expense') return false;
      if (v.category === 'ব্যবসা বিনিয়োগ বিতরণ') return false;
      if (completedTxs.some(t => t.voucherNo === v.voucherNo)) return false;
      // If linked to a deleted business funding, contribute 0
      if (v.id?.startsWith('v-bf-') || v.notes?.includes('BF-')) {
        const matchesActiveFunding = validBusinessFundings.some(f => 
          v.id === `v-bf-${f.id}` || (f.applicationNo && v.notes?.includes(f.applicationNo))
        );
        if (!matchesActiveFunding) return false;
      }
      return true;
    })
    .reduce((sum, v) => sum + (Number(v.amount) || 0), 0);

  const otherExpenses = txExpense + voucherExpense;

  const totalMoneyPaidOrInvested =
    loansGiven +
    businessFundingGiven +
    withdrawalsAndRefunds +
    otherExpenses;

  // Available Balance = Total Money Received - Total Money Paid/Invested
  const availableBalance = totalMoneyReceived - totalMoneyPaidOrInvested;

  // 3. Total Member Savings across all active members (excluding Recycle Bin members)
  let totalMemberSavings = 0;
  for (const m of members || []) {
    if (m.isDeleted) continue;
    const breakdown = calculateMemberSavingsBreakdown(m, transactions);
    totalMemberSavings += breakdown.totalSavings;
  }

  // 4. Active Loans Out (excluding Recycle Bin members)
  const totalActiveLoansOut = calculateActiveLoansOut(loans, transactions, members);

  // 5. Total Business Capital
  const totalBusinessCapital = calculateTotalBusinessCapital(businessFundings, transactions);

  // 6. Cash and Bank breakdown
  const totalBankBalance = Math.max(0, bankBalances);
  const totalVaultCash = Math.max(0, availableBalance - totalBankBalance);

  return {
    totalMoneyReceived,
    totalMoneyPaidOrInvested,
    availableBalance,
    startingMoney,
    memberDepositsReceived,
    sharePurchaseReceived,
    loanRepaymentsReceived,
    businessFundingRepaymentsReceived,
    profitReceived,
    otherIncomeReceived,
    loansGiven,
    businessFundingGiven,
    withdrawalsAndRefunds,
    otherExpenses,
    totalMemberSavings,
    totalActiveLoansOut,
    totalBusinessCapital,
    totalBankBalance,
    totalVaultCash,
  };
}
