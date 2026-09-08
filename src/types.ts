export type MemberStatus = 'active' | 'inactive' | 'pending' | 'defaulter';

export type Gender = 'male' | 'female' | 'other';

export type TransactionType = 
  | 'deposit'           // সঞ্চয় জমা
  | 'withdraw'          // সঞ্চয় উত্তোলন
  | 'loan_disbursed'    // ঋণ বিতরণ
  | 'loan_installment'  // ঋণের কিস্তি আদায়
  | 'dps_deposit'       // ডিপিএস জমা
  | 'fdr_deposit'       // এফডিআর / স্থায়ী আমানত
  | 'admission_fee'     // ভর্তি ফি
  | 'share_purchase'    // শেয়ার ক্রয়
  | 'share_surrender'   // শেয়ার সমর্পণ / ক্লোজিং
  | 'fine'              // জরিমানা
  | 'profit_share'      // লভ্যাংশ প্রদান
  | 'income'            // বিবিধ আয়
  | 'expense';          // ব্যয়

export type PaymentMethod = 'cash' | 'bank' | 'bkash' | 'nagad' | 'rocket';

export interface ShareClosure {
  id: string;
  memberId: string;
  memberNo: string;
  memberName: string;
  closedSharesCount: number;
  unitPrice: number;
  principalAmount: number;     // closedSharesCount * unitPrice
  profitAmount: number;        // bonus or profit paid out
  totalRefundAmount: number;   // principalAmount + profitAmount
  closureDate: string;
  voucherNo: string;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  handledBy: string;
  notes?: string;
  remainingActiveShares: number;
  createdAt: string;
}

export interface Nominee {
  id: string;
  name: string;
  relation: string;
  phone: string;
  nid: string;
  dob?: string;
  address: string;
  percentage: number;
  photoUrl?: string;
}

export interface SavingsScheme {
  id: string;
  memberId: string;
  type: 'general' | 'dps' | 'fdr';
  schemeName: string;
  accountNo: string;
  monthlyAmount?: number;
  principalAmount: number;
  interestRate: number; // percentage
  durationMonths: number;
  startDate: string;
  maturityDate: string;
  totalDeposited: number;
  profitAccrued: number;
  status: 'running' | 'matured' | 'closed';
}

export interface LoanInstallmentSchedule {
  installmentNo: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  paidDate?: string;
  paidAmount?: number;
  fine?: number;
  status: 'paid' | 'unpaid' | 'overdue';
  receiptNo?: string;
}

export interface Loan {
  id: string;
  loanNo: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  principalAmount: number;
  interestRate: number; // percentage
  totalAmount: number; // principal + total interest
  termMonths: number;
  installmentFrequency: 'daily' | 'weekly' | 'monthly';
  totalInstallments: number;
  installmentAmount: number;
  disbursedDate: string;
  purpose: string;
  guarantorMemberId?: string;
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorRelation?: string;
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  status: 'active' | 'cleared' | 'defaulted';
  schedule: LoanInstallmentSchedule[];
}

export interface Member {
  id: string;
  memberNo: string;
  name: string;
  nameEn: string;
  phone: string;
  email?: string;
  nid: string;
  dob: string;
  gender: Gender;
  fatherName: string;
  motherName: string;
  spouseName?: string;
  presentAddress: string;
  permanentAddress: string;
  occupation: string;
  monthlyIncome: number;
  joiningDate: string;
  status: MemberStatus;
  photoUrl: string;
  signatureUrl?: string;
  shareCount: number;
  shareValue: number;
  admissionFee: number;
  generalSavingsBalance: number;
  dpsSavingsBalance: number;
  fdrSavingsBalance: number;
  totalSavings: number;
  activeLoanBalance: number;
  nominees: Nominee[];
  assignedCollectorId?: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  voucherNo: string;
  memberId?: string;
  memberName?: string;
  memberNo?: string;
  type: TransactionType;
  amount: number;
  date: string;
  time: string;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  collectedBy: string;
  verifiedBy?: string;
  fineAmount?: number;
  discountAmount?: number;
  loanId?: string;
  installmentNo?: number;
  savingsSchemeId?: string;
  shareCount?: number;          // e.g. 2 shares
  unitPrice?: number;           // e.g. 1000 tk/share
  selectedShares?: number[];      // e.g. [1, 2]
  totalMemberShares?: number;   // e.g. 4
  shareRate?: number;           // e.g. 500
  shareAmounts?: { [shareNo: number]: number }; // e.g. { 1: 1000, 2: 500 }
  unpaidShares?: number[];        // e.g. [3, 4]
  depositMonth?: string;        // e.g. "মার্চ" or "03"
  depositYear?: number;         // e.g. 2026
  billingPeriod?: string;       // e.g. "মার্চ ২০২৬" / "March 2026"
  category?: string;
  notes?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface IncomeExpenseItem {
  id: string;
  voucherNo: string;
  type: 'income' | 'expense';
  category: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  handledBy: string;
  notes?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  branchName: string;
  accountName: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'mfs';
  balance: number;
  updatedAt: string;
}

export type UserRole = 'admin' | 'president' | 'secretary' | 'cashier' | 'manager' | 'field_officer';

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  avatarUrl: string;
  assignedArea?: string;
  dailyTarget?: number;
  collectedToday?: number;
  status: 'active' | 'inactive';
}

export interface SomitiSettings {
  somitiName: string;
  somitiNameEn: string;
  registrationNo: string;
  establishedDate: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  presidentName: string;
  secretaryName: string;
  cashierName: string;
  logoUrl: string;
  sharePricePerUnit: number;
  defaultAdmissionFee: number;
  defaultDpsInterestRate: number;
  defaultLoanInterestRate: number;
  lateFeePerInstallment: number;
  smsNotificationEnabled: boolean;
  currencySymbol: string;
  useBengaliDigits: boolean;
}

export type BusinessFundingStatus = 'pending' | 'approved' | 'active' | 'completed' | 'rejected';

export interface BusinessFunding {
  id: string;
  applicationNo: string;
  memberId: string;
  memberNo: string;
  memberName: string;
  memberPhone?: string;
  amountRequested: number;      // 1. কত টাকা নেবে
  approvedAmount?: number;
  durationMonths: number;       // 2. কতদিনের জন্য নেবে
  businessName: string;         // 3. কোন Business/Purpose-এর জন্য নেবে
  businessPurpose: string;
  businessType?: string;
  memberProfitSharePercent: number; // 4. Business থেকে কত % লাভ Member পাবে
  somitiProfitSharePercent: number; // 5. কত % লাভ Somiti পাবে
  applicationDate: string;
  disbursementDate?: string;
  maturityDate?: string;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  status: BusinessFundingStatus;
  totalProfitRecorded: number;
  totalMemberProfitPaid: number;
  totalSomitiProfitEarned: number;
  repaidPrincipal?: number;
  notes?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface BusinessProfitRecord {
  id: string;
  businessFundingId?: string;
  applicationNo?: string;
  memberId: string;
  memberName: string;
  memberNo?: string;
  month: string;                // e.g. "2026-09"
  totalBusinessProfit: number;  // e.g. 30000
  memberProfitPercent: number;  // e.g. 50
  somitiProfitPercent: number;  // e.g. 50
  memberProfitAmount: number;   // e.g. 15000
  somitiProfitAmount: number;   // e.g. 15000
  profitAmount?: number;        // Explicit alias for original profit amount
  date: string;
  totalDepositSnapshot?: number;// Snapshot of total deposits at transaction time (e.g. 15000)
  profitRatio?: number;         // Ratio: profitAmount / totalDepositSnapshot
  memberDistributions?: MemberProfitShareItem[]; // Individual member distributions
  totalDistributed?: number;    // Guaranteed to equal original profit amount
  status?: 'completed' | 'active';
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MemberProfitShareItem {
  memberId: string;
  memberNo: string;
  memberName: string;
  totalSavingsSnapshot: number;  // Member's total savings/deposit at distribution time
  dailyWeightedDeposit?: number; // Kept for backwards compatibility, equal to totalSavingsSnapshot
  weightPercentage: number;      // (memberSavings / totalSavings) * 100
  profitRatio?: number;          // Sum = profit / totalSavings
  rawAllocatedProfit?: number;   // Exact floating point allocated profit
  allocatedProfit: number;       // Final allocated profit amount (Taka)
  creditedToSavings: boolean;
  transactionId?: string;
}

export interface MonthlyProfitDistribution {
  id: string;
  distributionNo: string;        // e.g. "PD-2026-09"
  year: number;
  month: number;                 // 1-12
  monthName: string;             // e.g. "সেপ্টেম্বর ২০২৬"
  totalSomitiProfitPool: number; // Monthly Distributable Profit
  totalWeightedDeposit: number;  // Total Somiti member savings/deposit pool
  totalSavingsPool?: number;     // Alias to total member savings
  totalMembersDistributed: number;
  distributionDate: string;
  distributedBy: string;
  status: 'draft' | 'completed';
  memberDistributions: MemberProfitShareItem[];
  notes?: string;
  createdAt: string;
}

