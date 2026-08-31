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
