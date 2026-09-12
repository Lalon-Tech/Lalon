import { 
  Member, 
  Loan, 
  SavingsScheme, 
  BusinessFunding, 
  MonthlyProfitDistribution, 
  BusinessProfitRecord, 
  Transaction, 
  SomitiSettings 
} from '../types';

export interface PendingRecordItem {
  key: 'deposit_savings' | 'loan' | 'business_funding' | 'profit_sharing' | 'pending_tx';
  labelEn: string;
  labelBn: string;
  amount: number;
  count?: number;
  detailsEn?: string;
  detailsBn?: string;
}

export interface MemberRemovalValidationResult {
  canRemove: boolean;
  depositSavingsAmount: number;
  outstandingLoanAmount: number;
  businessFundingAmount: number;
  pendingProfitSharingAmount: number;
  pendingTxCount: number;
  pendingRecords: PendingRecordItem[];
}

export interface ValidationContextData {
  loans?: Loan[];
  savingsSchemes?: SavingsScheme[];
  businessFundings?: BusinessFunding[];
  profitDistributions?: MonthlyProfitDistribution[];
  businessProfitRecords?: BusinessProfitRecord[];
  transactions?: Transaction[];
  settings?: SomitiSettings;
}

/**
 * Validates whether a member can be removed from the system.
 * A member must NOT be removable if they have any active, pending, or unsettled financial records:
 * 1. Deposits / Savings – Any amount deposited or any outstanding deposit balance.
 * 2. Loans – Any active, outstanding, or unpaid loan amount.
 * 3. Business Funding – Any active or outstanding business funding/investment amount.
 * 4. Profit Sharing – Any pending, unsettled, or payable profit-sharing amount.
 * + Unclosed shares / pending transactions.
 */
export function validateMemberRemoval(
  member: Member | null | undefined,
  context: ValidationContextData = {}
): MemberRemovalValidationResult {
  if (!member) {
    return {
      canRemove: false,
      depositSavingsAmount: 0,
      outstandingLoanAmount: 0,
      businessFundingAmount: 0,
      pendingProfitSharingAmount: 0,
      pendingTxCount: 0,
      pendingRecords: []
    };
  }

  const {
    loans = [],
    savingsSchemes = [],
    businessFundings = [],
    profitDistributions = [],
    transactions = [],
    settings
  } = context;

  const pendingRecords: PendingRecordItem[] = [];

  // ==========================================
  // 1. DEPOSITS / SAVINGS
  // ==========================================
  const generalSavings = Math.max(0, Number(member.generalSavingsBalance) || 0);
  const dpsSavings = Math.max(0, Number(member.dpsSavingsBalance) || 0);
  const fdrSavings = Math.max(0, Number(member.fdrSavingsBalance) || 0);
  const explicitTotalSavings = Math.max(0, Number(member.totalSavings) || 0);
  const sumSavings = generalSavings + dpsSavings + fdrSavings;

  const activeSavingsSchemes = savingsSchemes.filter(
    s => s.memberId === member.id && s.status !== 'closed'
  );
  const schemesBalance = activeSavingsSchemes.reduce(
    (sum, s) => sum + Math.max(0, Number(s.totalDeposited || s.principalAmount) || 0),
    0
  );

  const depositSavingsAmount = Math.max(explicitTotalSavings, sumSavings, schemesBalance);

  if (depositSavingsAmount > 0 || activeSavingsSchemes.length > 0) {
    pendingRecords.push({
      key: 'deposit_savings',
      labelEn: 'Deposit/Savings',
      labelBn: 'সঞ্চয় আমানত',
      amount: depositSavingsAmount,
      detailsEn: `General: ৳${generalSavings.toLocaleString()}, DPS: ৳${dpsSavings.toLocaleString()}, FDR: ৳${fdrSavings.toLocaleString()}`,
      detailsBn: `সাধারণ: ৳${generalSavings.toLocaleString()}, ডিপিএস: ৳${dpsSavings.toLocaleString()}, এফডিআর: ৳${fdrSavings.toLocaleString()}`
    });
  }

  // ==========================================
  // 2. LOANS
  // ==========================================
  const memberLoans = loans.filter(l => l.memberId === member.id && !l.isReversed);
  const activeLoans = memberLoans.filter(l => 
    l.status === 'active' || 
    l.status === 'pending' || 
    l.status === 'approved' || 
    l.status === 'defaulted' ||
    (l.status !== 'cleared' && l.status !== 'rejected')
  );

  const loansRemainingSum = activeLoans.reduce((sum, l) => {
    if (l.remainingAmount !== undefined) {
      return sum + Math.max(0, Number(l.remainingAmount) || 0);
    }
    const total = Number(l.totalAmount || l.principalAmount) || 0;
    const paid = Number(l.paidAmount) || 0;
    return sum + Math.max(0, total - paid);
  }, 0);

  const outstandingLoanAmount = Math.max(
    Number(member.activeLoanBalance) || 0,
    loansRemainingSum
  );

  if (outstandingLoanAmount > 0 || activeLoans.length > 0) {
    pendingRecords.push({
      key: 'loan',
      labelEn: 'Outstanding Loan',
      labelBn: 'বকেয়া ঋণ',
      amount: outstandingLoanAmount,
      count: activeLoans.length,
      detailsEn: `${activeLoans.length} active/pending loan account(s)`,
      detailsBn: `${activeLoans.length}টি সক্রিয় বা বকেয়া ঋণের হিসাব`
    });
  }

  // ==========================================
  // 3. BUSINESS FUNDING
  // ==========================================
  const memberFundings = businessFundings.filter(b => b.memberId === member.id);
  const activeFundings = memberFundings.filter(b => 
    b.status === 'active' || 
    b.status === 'approved' || 
    b.status === 'pending' ||
    (b.status !== 'completed' && b.status !== 'rejected')
  );

  const businessFundingAmount = activeFundings.reduce((sum, b) => {
    const total = Number(b.approvedAmount || b.amountRequested) || 0;
    const repaid = Number(b.repaidPrincipal) || 0;
    const remaining = Math.max(0, total - repaid);
    return sum + (remaining > 0 ? remaining : total);
  }, 0);

  if (businessFundingAmount > 0 || activeFundings.length > 0) {
    pendingRecords.push({
      key: 'business_funding',
      labelEn: 'Business Funding',
      labelBn: 'ব্যবসা বিনিয়োগ',
      amount: businessFundingAmount,
      count: activeFundings.length,
      detailsEn: `${activeFundings.length} active/pending business investment(s)`,
      detailsBn: `${activeFundings.length}টি সক্রিয় বা অনুমোদনাধীন ব্যবসা বিনিয়োগ`
    });
  }

  // ==========================================
  // 4. PROFIT SHARING
  // ==========================================
  let pendingProfitSharingAmount = 0;

  // 4a. Uncredited profit in monthly distributions
  profitDistributions.forEach(dist => {
    const myShare = dist.memberDistributions?.find(m => m.memberId === member.id);
    if (myShare && myShare.allocatedProfit > 0) {
      if (myShare.creditedToSavings === false || dist.status === 'draft') {
        pendingProfitSharingAmount += myShare.allocatedProfit;
      }
    }
  });

  // 4b. Unpaid entrepreneur profit in business fundings
  memberFundings.forEach(f => {
    const totalRecorded = Number(f.totalProfitRecorded) || 0;
    if (totalRecorded > 0) {
      const memberPct = Number(f.memberProfitSharePercent) || 50;
      const expectedMemberProfit = (totalRecorded * memberPct) / 100;
      const paid = Number(f.totalMemberProfitPaid) || 0;
      if (expectedMemberProfit > paid) {
        pendingProfitSharingAmount += (expectedMemberProfit - paid);
      }
    }
  });

  // 4c. Pending profit_share transactions
  const pendingProfitTxs = transactions.filter(
    t => t.memberId === member.id && t.type === 'profit_share' && t.status === 'pending'
  );
  pendingProfitSharingAmount += pendingProfitTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  if (pendingProfitSharingAmount > 0) {
    pendingRecords.push({
      key: 'profit_sharing',
      labelEn: 'Pending Profit Sharing',
      labelBn: 'অনিষ্পন্ন লভ্যাংশ',
      amount: pendingProfitSharingAmount,
      detailsEn: 'Uncredited or payable profit distribution share',
      detailsBn: 'অপ্রদেয় বা সঞ্চয়ে অননুমোদিত লভ্যাংশ বণ্টন'
    });
  }

  // ==========================================
  // 5. PENDING TRANSACTIONS
  // ==========================================
  const pendingTransactions = transactions.filter(
    t => t.memberId === member.id && t.status === 'pending'
  );
  const pendingTxCount = pendingTransactions.length;

  if (pendingTxCount > 0) {
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    pendingRecords.push({
      key: 'pending_tx',
      labelEn: 'Pending Transactions',
      labelBn: 'অনিষ্পন্ন লেনদেন',
      amount: pendingAmount,
      count: pendingTxCount,
      detailsEn: `${pendingTxCount} pending transaction(s) requiring approval`,
      detailsBn: `${pendingTxCount}টি অপেক্ষমাণ অনুমোদনহীন লেনদেন`
    });
  }

  const canRemove = pendingRecords.length === 0;

  return {
    canRemove,
    depositSavingsAmount,
    outstandingLoanAmount,
    businessFundingAmount,
    pendingProfitSharingAmount,
    pendingTxCount,
    pendingRecords
  };
}
