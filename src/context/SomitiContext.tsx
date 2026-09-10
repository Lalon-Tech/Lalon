import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db, safeSetDoc, safeBatchSet } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  Member, 
  Loan, 
  SavingsScheme, 
  Transaction, 
  IncomeExpenseItem, 
  BankAccount, 
  AppUser, 
  SomitiSettings,
  TransactionType,
  PaymentMethod,
  Nominee,
  LoanInstallmentSchedule,
  ShareClosure,
  BusinessFunding,
  BusinessFundingStatus,
  BusinessProfitRecord,
  MonthlyProfitDistribution,
  MemberProfitShareItem,
  AuditLog
} from '../types';
import { 
  initialMembers, 
  initialLoans, 
  initialSavingsSchemes, 
  initialTransactions, 
  initialVouchers, 
  initialBankAccounts, 
  initialUsers, 
  initialSettings,
  sampleDemoMembers,
  sampleDemoLoans,
  sampleDemoSavingsSchemes,
  sampleDemoTransactions,
  sampleDemoVouchers,
  sampleDemoBankAccounts,
  sampleDemoUsers
} from '../utils/mockData';
import { calculateProportionalProfit, getMemberSavingsBalance } from '../utils/profitCalculation';
import { formatBengaliDate, compareTransactionsDesc } from '../utils/bengaliUtils';

// Sanitization helpers to eliminate any NaN or undefined data
const sanitizeMember = (m: any): Member => {
  const general = Number(m.generalSavingsBalance) || 0;
  const dps = Number(m.dpsSavingsBalance) || 0;
  const fdr = Number(m.fdrSavingsBalance) || 0;
  const shareValue = Number(m.shareValue) || 0;
  const shareCount = Number(m.shareCount) || 0;
  const activeLoan = Number(m.activeLoanBalance) || 0;
  const admissionFee = Number(m.admissionFee) || 0;
  // Total savings strictly represents accumulated member deposits (general + dps + fdr), share value is fixed equity
  const totalSavings = general + dps + fdr;

  return {
    ...m,
    id: m.id || `mem-${Date.now()}`,
    name: m.name || 'সদস্য',
    memberNo: m.memberNo || 'BS-000',
    phone: m.phone || '',
    presentAddress: m.presentAddress || '',
    occupation: m.occupation || '',
    status: m.status || 'active',
    photoUrl: m.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    shareCount,
    shareValue,
    admissionFee,
    generalSavingsBalance: general,
    dpsSavingsBalance: dps,
    fdrSavingsBalance: fdr,
    totalSavings,
    activeLoanBalance: activeLoan,
    nominees: Array.isArray(m.nominees) ? m.nominees : [],
  };
};

const sanitizeLoan = (l: any): Loan => {
  const principal = Number(l.principalAmount) || 0;
  const interestRate = Number(l.interestRate) || 0;
  const totalInterest = Number(l.totalInterest ?? l.interestAmount) || (principal * (interestRate / 100));
  const totalAmount = Number(l.totalAmount ?? l.totalPayable) || (principal + totalInterest);
  const paidAmount = Number(l.paidAmount) || 0;
  const remaining = Number(l.remainingAmount) !== undefined && !isNaN(Number(l.remainingAmount)) 
    ? Number(l.remainingAmount) 
    : Math.max(0, totalAmount - paidAmount);

  const sched = Array.isArray(l.schedule) && l.schedule.length > 0
    ? l.schedule
    : (Array.isArray(l.installmentSchedule) ? l.installmentSchedule : []);

  return {
    ...l,
    id: l.id || `loan-${Date.now()}`,
    principalAmount: principal,
    interestRate,
    totalInterest,
    interestAmount: totalInterest,
    totalAmount,
    totalPayable: totalAmount,
    installmentAmount: Number(l.installmentAmount) || 0,
    totalInstallments: Number(l.totalInstallments) || (sched.length || 1),
    paidInstallments: Number(l.paidInstallments ?? l.paidInstallmentsCount) || 0,
    paidInstallmentsCount: Number(l.paidInstallmentsCount ?? l.paidInstallments) || 0,
    paidAmount,
    remainingAmount: remaining,
    fineCollected: Number(l.fineCollected) || 0,
    discountGiven: Number(l.discountGiven) || 0,
    status: l.status || (remaining <= 0 ? 'cleared' : 'active'),
    schedule: sched,
    installmentSchedule: sched,
  };
};

const sanitizeSavings = (s: any): SavingsScheme => {
  return {
    ...s,
    id: s.id || `sav-${Date.now()}`,
    monthlyAmount: Number(s.monthlyAmount) || 0,
    principalAmount: Number(s.principalAmount) || 0,
    interestRate: Number(s.interestRate) || 0,
    durationMonths: Number(s.durationMonths) || 0,
    totalDeposited: Number(s.totalDeposited) || 0,
    profitAccrued: Number(s.profitAccrued) || 0,
    status: s.status || 'active',
  };
};

const sanitizeBank = (b: any): BankAccount => {
  return {
    ...b,
    id: b.id || `bank-${Date.now()}`,
    balance: Number(b.balance) || 0,
    bankName: b.bankName || 'ব্যাংক হিসাব',
    accountNumber: b.accountNumber || '',
  };
};

const sanitizeTransaction = (t: any): Transaction => {
  return {
    ...t,
    id: t.id || `tx-${Date.now()}`,
    serialNo: typeof t.serialNo === 'number' && t.serialNo > 0 ? t.serialNo : undefined,
    amount: Number(t.amount) || 0,
    fineAmount: Number(t.fineAmount) || 0,
    discountAmount: Number(t.discountAmount) || 0,
    paymentMethod: t.paymentMethod || 'cash',
    status: t.status || 'completed',
  };
};

/**
 * Ensures every transaction has a permanent, unique, strictly monotonic serial number.
 * Never duplicates existing serial numbers.
 */
const ensureTransactionSerials = (rawList: Transaction[]): Transaction[] => {
  let maxSerial = 0;
  rawList.forEach(t => {
    if (typeof t.serialNo === 'number' && t.serialNo > maxSerial) {
      maxSerial = t.serialNo;
    }
  });

  // If no serials exist at all, sort chronologically ascending and assign 1, 2, 3...
  if (maxSerial === 0 && rawList.length > 0) {
    const ascending = [...rawList].sort((a, b) => {
      const timeA = `${a.date || ''} ${a.time || ''}`;
      const timeB = `${b.date || ''} ${b.time || ''}`;
      return timeA.localeCompare(timeB);
    });
    const serialMap = new Map<string, number>();
    ascending.forEach((tx, idx) => {
      serialMap.set(tx.id, idx + 1);
    });
    return rawList.map(tx => ({
      ...tx,
      serialNo: serialMap.get(tx.id) || 1,
    }));
  }

  // If some are missing serialNo, assign next serials starting from maxSerial + 1
  let next = maxSerial + 1;
  return rawList.map(tx => {
    if (typeof tx.serialNo === 'number' && tx.serialNo > 0) {
      return tx;
    }
    return {
      ...tx,
      serialNo: next++,
    };
  });
};

const sanitizeUser = (u: any): AppUser => {
  return {
    ...u,
    id: u.id || `usr-${Date.now()}`,
    name: u.name || 'ইউজার',
    email: u.email || '',
    phone: u.phone || '',
    role: u.role || 'admin',
    roleTitle: u.roleTitle || (u.role === 'admin' ? 'অ্যাডমিন ও সিইও' : u.role === 'manager' ? 'ব্রাঞ্চ ম্যানেজার' : u.role === 'cashier' ? 'ক্যাশ অফিসার' : 'সদস্য'),
    avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dailyTarget: Number(u.dailyTarget) || 0,
    collectedToday: Number(u.collectedToday) || 0,
    status: u.status || 'active',
  };
};

const sanitizeShareClosure = (c: any): ShareClosure => {
  return {
    id: c.id || `sc-${Date.now()}`,
    memberId: c.memberId || '',
    memberNo: c.memberNo || '',
    memberName: c.memberName || '',
    closedSharesCount: Number(c.closedSharesCount) || 0,
    unitPrice: Number(c.unitPrice) || 0,
    principalAmount: Number(c.principalAmount) || 0,
    profitAmount: Number(c.profitAmount) || 0,
    totalRefundAmount: Number(c.totalRefundAmount) || 0,
    closureDate: c.closureDate || new Date().toISOString().split('T')[0],
    voucherNo: c.voucherNo || `SCV-${Date.now()}`,
    paymentMethod: c.paymentMethod || 'cash',
    bankAccountId: c.bankAccountId,
    handledBy: c.handledBy || 'Admin',
    notes: c.notes || '',
    remainingActiveShares: Number(c.remainingActiveShares) || 0,
    createdAt: c.createdAt || new Date().toISOString(),
  };
};

const sanitizeBusinessFunding = (b: any): BusinessFunding => {
  return {
    id: b?.id || `bf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    applicationNo: b?.applicationNo || `BF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    memberId: b?.memberId || '',
    memberNo: b?.memberNo || '',
    memberName: b?.memberName || '',
    memberPhone: b?.memberPhone || '',
    amountRequested: Number(b?.amountRequested) || 0,
    approvedAmount: b?.approvedAmount !== undefined ? Number(b?.approvedAmount) : (Number(b?.amountRequested) || 0),
    durationMonths: Number(b?.durationMonths) || 12,
    businessName: b?.businessName || '',
    businessPurpose: b?.businessPurpose || '',
    businessType: b?.businessType || 'সাধারণ ব্যবসা',
    memberProfitSharePercent: Number(b?.memberProfitSharePercent) !== undefined && !isNaN(Number(b?.memberProfitSharePercent)) ? Number(b?.memberProfitSharePercent) : 50,
    somitiProfitSharePercent: Number(b?.somitiProfitSharePercent) !== undefined && !isNaN(Number(b?.somitiProfitSharePercent)) ? Number(b?.somitiProfitSharePercent) : 50,
    applicationDate: b?.applicationDate || new Date().toISOString().split('T')[0],
    disbursementDate: b?.disbursementDate || undefined,
    maturityDate: b?.maturityDate || undefined,
    paymentMethod: b?.paymentMethod || 'cash',
    bankAccountId: b?.bankAccountId || undefined,
    status: b?.status || 'pending',
    totalProfitRecorded: Number(b?.totalProfitRecorded) || 0,
    totalMemberProfitPaid: Number(b?.totalMemberProfitPaid) || 0,
    totalSomitiProfitEarned: Number(b?.totalSomitiProfitEarned) || 0,
    repaidPrincipal: Number(b?.repaidPrincipal) || 0,
    notes: b?.notes || '',
    approvedBy: b?.approvedBy || undefined,
    createdAt: b?.createdAt || new Date().toISOString(),
  };
};

const sanitizeBusinessProfitRecord = (p: any): BusinessProfitRecord => {
  return {
    id: p?.id || `bpr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    businessFundingId: p?.businessFundingId || '',
    applicationNo: p?.applicationNo || '',
    memberId: p?.memberId || '',
    memberName: p?.memberName || '',
    month: p?.month || new Date().toISOString().slice(0, 7),
    totalBusinessProfit: Number(p?.totalBusinessProfit) || 0,
    memberProfitPercent: Number(p?.memberProfitPercent) !== undefined && !isNaN(Number(p?.memberProfitPercent)) ? Number(p?.memberProfitPercent) : 50,
    somitiProfitPercent: Number(p?.somitiProfitPercent) !== undefined && !isNaN(Number(p?.somitiProfitPercent)) ? Number(p?.somitiProfitPercent) : 50,
    memberProfitAmount: Number(p?.memberProfitAmount) || 0,
    somitiProfitAmount: Number(p?.somitiProfitAmount) || 0,
    date: p?.date || new Date().toISOString().split('T')[0],
    notes: p?.notes || '',
    recordedBy: p?.recordedBy || 'Admin',
    createdAt: p?.createdAt || new Date().toISOString(),
  };
};

const sanitizeMonthlyProfitDistribution = (d: any): MonthlyProfitDistribution => {
  return {
    id: d?.id || `pd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    distributionNo: d?.distributionNo || `PD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    year: Number(d?.year) || new Date().getFullYear(),
    month: Number(d?.month) || (new Date().getMonth() + 1),
    monthName: d?.monthName || '',
    totalSomitiProfitPool: Number(d?.totalSomitiProfitPool) || 0,
    totalWeightedDeposit: Number(d?.totalWeightedDeposit) || 0,
    totalMembersDistributed: Number(d?.totalMembersDistributed) || 0,
    distributionDate: d?.distributionDate || new Date().toISOString().split('T')[0],
    distributedBy: d?.distributedBy || 'Admin',
    status: d?.status || 'completed',
    memberDistributions: Array.isArray(d?.memberDistributions) ? d.memberDistributions : [],
    notes: d?.notes || '',
    createdAt: d?.createdAt || new Date().toISOString(),
  };
};

interface SomitiContextType {
  // Navigation & UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  useBengaliDigits: boolean;
  setUseBengaliDigits: (val: boolean) => void;
  currentUser: AppUser;
  setCurrentUser: (user: AppUser) => void;
  
  // Cloud Firestore Sync State
  firestoreConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  syncAllToFirestore: () => Promise<boolean>;
  syncAllFromFirestore: () => Promise<boolean>;

  // Data State
  settings: SomitiSettings;
  updateSettings: (settings: Partial<SomitiSettings>) => void;
  members: Member[];
  loans: Loan[];
  savingsSchemes: SavingsScheme[];
  shareClosures: ShareClosure[];
  transactions: Transaction[];
  vouchers: IncomeExpenseItem[];
  incomeExpenses: IncomeExpenseItem[];
  bankAccounts: BankAccount[];
  users: AppUser[];

  // Actions - Members & Shares
  addMember: (memberData: Omit<Member, 'id' | 'memberNo' | 'totalSavings' | 'generalSavingsBalance' | 'dpsSavingsBalance' | 'fdrSavingsBalance' | 'activeLoanBalance'>) => Member;
  updateMember: (id: string, memberData: Partial<Member>) => void;
  deleteMember: (id: string) => Promise<boolean>;
  importMembersFromList: (newMembers: Member[]) => void;
  closeMemberShares: (params: {
    memberId: string;
    sharesToClose: number;
    unitPrice: number;
    profitAmount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    notes?: string;
    date?: string;
  }) => Promise<{ success: boolean; error?: string; closure?: ShareClosure }>;
  buyMemberShares: (params: {
    memberId: string;
    sharesToBuy: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    notes?: string;
    date?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Actions - Transactions
  addDeposit: (params: {
    memberId: string;
    schemeType: 'general' | 'dps' | 'fdr';
    schemeId?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    selectedShares?: number[];
    totalMemberShares?: number;
    shareRate?: number;
    shareAmounts?: { [shareNo: number]: number };
    unpaidShares?: number[];
    notes?: string;
    date?: string;
    depositMonth?: string;
    depositYear?: number;
    billingPeriod?: string;
  }) => Transaction;
  
  addWithdrawal: (params: {
    memberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    notes?: string;
  }) => Transaction;

  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getNextLedgerSerial: () => number;

  addLoan: (params: {
    memberId: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    installmentFrequency: 'daily' | 'weekly' | 'monthly';
    purpose: string;
    guarantorMemberId?: string;
    guarantorName?: string;
    guarantorPhone?: string;
    guarantorRelation?: string;
    disbursementMethod: PaymentMethod;
    bankAccountId?: string;
    processingFee?: number;
  }) => Loan;

  applyForLoan: (params: {
    memberId: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    installmentFrequency: 'daily' | 'weekly' | 'monthly';
    purpose: string;
    guarantorMemberId?: string;
    guarantorName?: string;
    guarantorPhone?: string;
    guarantorRelation?: string;
    disbursementMethod?: PaymentMethod;
    bankAccountId?: string;
    processingFee?: number;
  }) => { success: boolean; message: string; loan?: Loan };

  approveLoan: (params: {
    loanId: string;
    disbursementMethod?: PaymentMethod;
    bankAccountId?: string;
    processingFee?: number;
    adminComment?: string;
  }) => { success: boolean; message: string };

  rejectLoan: (params: {
    loanId: string;
    reason: string;
  }) => { success: boolean; message: string };

  updateLoan: (
    loanId: string, 
    updatedFields: Partial<Loan>, 
    auditReason?: string
  ) => { success: boolean; message: string; loan?: Loan };

  deleteLoan: (
    loanId: string, 
    options: { mode: 'safe_reversal' | 'permanent_delete'; reason: string }
  ) => { success: boolean; message: string };

  payLoanInstallment: (params: {
    loanId: string;
    installmentNo?: number;
    amount?: number;
    collectedAmount?: number;
    fine?: number;
    lateFee?: number;
    discount?: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Transaction & { success: boolean; message: string };

  auditLogs: AuditLog[];
  addAuditLog: (logData: Omit<AuditLog, 'id' | 'timestamp' | 'date' | 'time'>) => AuditLog;

  addSavingsScheme: (params: {
    memberId: string;
    type: 'dps' | 'fdr';
    schemeName: string;
    monthlyAmount?: number;
    principalAmount: number;
    interestRate: number;
    durationMonths: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
  }) => SavingsScheme;

  addVoucher: (voucherData: Omit<IncomeExpenseItem, 'id' | 'voucherNo'>) => IncomeExpenseItem;
  deleteVoucher: (id: string) => void;
  addIncomeExpense: (voucherData: Omit<IncomeExpenseItem, 'id' | 'voucherNo'>) => IncomeExpenseItem;
  deleteIncomeExpense: (id: string) => void;

  // Users & Staff
  addUser: (userData: Omit<AppUser, 'id'>) => AppUser;
  updateUser: (id: string, userData: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  // Banking
  transferFunds: (params: {
    fromType: 'vault' | 'bank';
    toType: 'vault' | 'bank';
    fromBankId?: string;
    toBankId?: string;
    amount: number;
    notes?: string;
  }) => void;
  updateBankAccountBalance: (bankId: string, newBalance: number) => void;

  // Modals & Receipt Printing
  activeReceipt: Transaction | null;
  setActiveReceipt: (tx: Transaction | null) => void;
  openReceiptForTx: (tx: Transaction) => void;
  showQuickDepositModal: boolean;
  setShowQuickDepositModal: (show: boolean) => void;
  showQuickWithdrawModal: boolean;
  setShowQuickWithdrawModal: (show: boolean) => void;
  showQuickLoanModal: boolean;
  setShowQuickLoanModal: (show: boolean) => void;
  showQuickKistiModal: boolean;
  setShowQuickKistiModal: (show: boolean) => void;
  showNewMemberModal: boolean;
  setShowNewMemberModal: (show: boolean) => void;

  // Permission & Role Checks
  isUserAdmin: boolean;
  isCurrentMember: (memberId: string) => boolean;
  canViewMemberFinancials: (memberId: string) => boolean;

  // Aggregate Metrics
  totalVaultCash: number;
  totalBankCash: number;
  cashInHand: number;
  totalAvailableBalance: number;
  totalCapital: number;
  totalBusinessCapital: number;
  totalSavingsInSomiti: number;
  totalActiveLoanBalance: number;
  todayStats: {
    collection: number;
    disbursement: number;
    expense: number;
    profit: number;
    fine: number;
    netCash: number;
  };
  
  // Data Reset & Backup
  clearAllData: () => Promise<void> | void;
  resetToDemoData: () => void;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonString: string) => boolean;

  // Profit Distribution to Member Balances
  distributeProfitToSavings: (params: {
    profitAmount: number;
    criteria: 'total_deposit' | 'share_capital';
    targetMonth?: string;
    notes?: string;
  }) => { success: boolean; count: number; totalDistributed: number };

  // Business Funding & Monthly Profit Distribution
  businessFundings: BusinessFunding[];
  businessProfitRecords: BusinessProfitRecord[];
  profitDistributions: MonthlyProfitDistribution[];
  addBusinessFunding: (fundingData: Omit<BusinessFunding, 'id' | 'applicationNo' | 'status' | 'totalProfitRecorded' | 'totalMemberProfitPaid' | 'totalSomitiProfitEarned' | 'createdAt'>) => Promise<BusinessFunding>;
  updateBusinessFundingStatus: (id: string, status: BusinessFundingStatus, approvedAmount?: number, notes?: string, rejectionReason?: string) => Promise<void>;
  approveBusinessFunding: (params: { fundingId: string; approvedAmount?: number; notes?: string }) => Promise<{ success: boolean; message: string }>;
  rejectBusinessFunding: (params: { fundingId: string; reason: string }) => Promise<{ success: boolean; message: string }>;
  updateBusinessFunding: (id: string, fundingData: Partial<BusinessFunding>) => Promise<void>;
  deleteBusinessFunding: (id: string) => Promise<void>;
  disburseBusinessFunding: (id: string, paymentMethod: PaymentMethod, bankAccountId?: string, notes?: string) => Promise<void>;
  recordBusinessProfit: (data: { 
    businessFundingId?: string; 
    memberId?: string;
    memberName?: string;
    month: string; 
    date?: string;
    profitAmount?: number;
    totalBusinessProfit?: number; 
    somitiProfitAmount?: number;
    notes?: string;
    distributeSomitiProfitNow?: boolean;
  }) => Promise<{ record: BusinessProfitRecord; distribution?: MonthlyProfitDistribution }>;
  updateBusinessProfitRecord: (id: string, data: { 
    memberId?: string;
    month: string; 
    date?: string; 
    profitAmount?: number;
    totalBusinessProfit?: number; 
    somitiProfitAmount?: number; 
    notes?: string;
  }) => Promise<void>;
  deleteBusinessProfitRecord: (id: string) => Promise<void>;
  calculateMemberProfitShares: (distributableProfit?: number, year?: number, month?: number) => {
    items: {
      member: Member;
      savings: number;
      dailyBalances: number[];
      dailyWeightedDeposit: number;
      dailyAverage: number;
      weightPercentage: number;
      profitRatio: number;
      rawAllocated: number;
      allocatedProfit: number;
    }[];
    totalSavings: number;
    totalWeightedDeposit: number;
    profitRatio: number;
    daysInMonth: number;
  };
  calculateDailyWeightedDeposits: (year: number, month: number, profitAmount?: number) => {
    items: {
      member: Member;
      savings: number;
      dailyBalances: number[];
      dailyWeightedDeposit: number;
      dailyAverage: number;
      weightPercentage: number;
      profitRatio: number;
      rawAllocated: number;
      allocatedProfit: number;
    }[];
    totalSavings: number;
    totalWeightedDeposit: number;
    profitRatio: number;
    daysInMonth: number;
  };
  executeMonthlyProfitDistribution: (data: {
    year: number;
    month: number;
    monthName: string;
    totalSomitiProfitPool: number;
    creditToSavings: boolean;
    notes?: string;
    distributionId?: string;
    businessProfitRecordId?: string;
    distributionDate?: string;
  }) => Promise<MonthlyProfitDistribution>;
  deleteMonthlyProfitDistribution: (id: string) => Promise<boolean>;
  clearAllProfitDistributions: () => Promise<boolean>;
  resetMemberProfitShare: (memberId: string) => Promise<boolean>;
  getMemberSavingsBalance: (m: Member | any) => number;
}

const SomitiContext = createContext<SomitiContextType | undefined>(undefined);

export const SomitiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();

  const safeParse = <T,>(key: string, fallback: T, isArray = false): T => {
    try {
      const saved = localStorage.getItem(key);
      if (!saved || saved === 'undefined' || saved === 'null') return fallback;
      const parsed = JSON.parse(saved);
      if (isArray && !Array.isArray(parsed)) return fallback;
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  // Read initial from localStorage or defaults with automatic data sanitization
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [useBengaliDigits, setUseBengaliDigits] = useState<boolean>(() => {
    return safeParse('bondhu_use_bengali_digits', true);
  });

  const [settings, setSettings] = useState<SomitiSettings>(() => {
    return safeParse('bondhu_settings', initialSettings);
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const raw = safeParse('bondhu_members', initialMembers, true);
    const list = (raw && raw.length > 0) ? raw : sampleDemoMembers;
    return list.map(sanitizeMember);
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const raw = safeParse('bondhu_loans', initialLoans, true);
    const list = (raw && raw.length > 0) ? raw : sampleDemoLoans;
    return list.map(sanitizeLoan);
  });

  const [savingsSchemes, setSavingsSchemes] = useState<SavingsScheme[]>(() => {
    const raw = safeParse('bondhu_savings', initialSavingsSchemes, true);
    const list = (raw && raw.length > 0) ? raw : sampleDemoSavingsSchemes;
    return list.map(sanitizeSavings);
  });

  const [shareClosures, setShareClosures] = useState<ShareClosure[]>(() => {
    const raw = safeParse('bondhu_share_closures', [], true);
    return raw.map(sanitizeShareClosure);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const raw = safeParse('bondhu_transactions', initialTransactions, true);
    const list = (raw && raw.length > 0) ? raw : sampleDemoTransactions;
    return list.map(sanitizeTransaction).sort(compareTransactionsDesc);
  });

  const [vouchers, setVouchers] = useState<IncomeExpenseItem[]>(() => {
    const raw = safeParse('bondhu_vouchers', initialVouchers, true);
    return (raw && raw.length > 0) ? raw : sampleDemoVouchers;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const raw = safeParse('bondhu_bank_accounts', initialBankAccounts, true);
    return raw.map(sanitizeBank);
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const raw = safeParse('bondhu_users', initialUsers, true);
    return raw.map(sanitizeUser);
  });

  const [businessFundings, setBusinessFundings] = useState<BusinessFunding[]>(() => {
    const raw = safeParse('bondhu_business_fundings', [], true);
    return raw.map(sanitizeBusinessFunding);
  });

  const [businessProfitRecords, setBusinessProfitRecords] = useState<BusinessProfitRecord[]>(() => {
    const raw = safeParse('bondhu_business_profit_records', [], true);
    return raw.map(sanitizeBusinessProfitRecord);
  });

  const [profitDistributions, setProfitDistributions] = useState<MonthlyProfitDistribution[]>(() => {
    const raw = safeParse('bondhu_profit_distributions', [], true);
    return raw.map(sanitizeMonthlyProfitDistribution);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    return safeParse('bondhu_audit_logs', []);
  });

  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    return (users[0] ? sanitizeUser(users[0]) : sanitizeUser(initialUsers[0]));
  });

  // Dynamically synchronize currentUser with the logged-in Auth User
  useEffect(() => {
    if (authUser) {
      const authEmail = (authUser.email || '').toLowerCase().trim();
      const authName = authUser.displayName || (authEmail ? authEmail.split('@')[0] : 'ইউজার');
      
      const matched = users.find(u => 
        (u.email && u.email.toLowerCase() === authEmail) || 
        u.id === authUser.uid
      );

      if (matched) {
        setCurrentUser(sanitizeUser({
          ...matched,
          name: matched.name || authName,
          avatarUrl: authUser.photoURL || matched.avatarUrl,
        }));
      } else {
        const dynamicUser: AppUser = {
          id: authUser.uid,
          name: authName,
          phone: '01752012365',
          email: authEmail || 'admin@bondhusomiti.com',
          role: 'admin',
          roleTitle: 'অ্যাডমিন ও সিইও',
          avatarUrl: authUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          assignedArea: 'হেড অফিস',
          dailyTarget: 50000,
          collectedToday: 0,
          status: 'active',
        };
        setCurrentUser(dynamicUser);
      }
    } else {
      if (users.length > 0) {
        setCurrentUser(sanitizeUser(users[0]));
      }
    }
  }, [authUser, users]);

  // Permission & Role Checks - Ensure authorized user can view and manage all modules
  const isUserAdmin = Boolean(authUser) || 
                      currentUser?.role === 'admin' || 
                      currentUser?.role === 'president' || 
                      currentUser?.role === 'secretary' || 
                      currentUser?.role === 'cashier' || 
                      currentUser?.role === 'manager';

  const isCurrentMember = (memberId: string): boolean => {
    if (!memberId) return false;
    if (currentUser?.id === memberId) return true;
    const m = members.find(item => item.id === memberId);
    if (m && m.email && currentUser?.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) {
      return true;
    }
    if (m && m.phone && currentUser?.phone && m.phone === currentUser.phone) {
      return true;
    }
    if (authUser && authUser.email && m && m.email && m.email.toLowerCase() === authUser.email.toLowerCase()) {
      return true;
    }
    return false;
  };

  const canViewMemberFinancials = (memberId: string): boolean => {
    if (isUserAdmin) return true;
    return isCurrentMember(memberId);
  };

  // Firestore sync state
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const isInitialLoadDone = useRef<boolean>(false);
  const activeDistributionLocks = useRef<Set<string>>(new Set());
  const activeProfitRecording = useRef<boolean>(false);

  // Modal triggers
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [showQuickDepositModal, setShowQuickDepositModal] = useState<boolean>(false);
  const [showQuickWithdrawModal, setShowQuickWithdrawModal] = useState<boolean>(false);
  const [showQuickLoanModal, setShowQuickLoanModal] = useState<boolean>(false);
  const [showQuickKistiModal, setShowQuickKistiModal] = useState<boolean>(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('bondhu_use_bengali_digits', JSON.stringify(useBengaliDigits));
  }, [useBengaliDigits]);

  useEffect(() => {
    localStorage.setItem('bondhu_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('bondhu_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('bondhu_loans', JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem('bondhu_savings', JSON.stringify(savingsSchemes));
  }, [savingsSchemes]);

  useEffect(() => {
    localStorage.setItem('bondhu_share_closures', JSON.stringify(shareClosures));
  }, [shareClosures]);

  useEffect(() => {
    localStorage.setItem('bondhu_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('bondhu_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('bondhu_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('bondhu_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('bondhu_business_fundings', JSON.stringify(businessFundings));
  }, [businessFundings]);

  useEffect(() => {
    localStorage.setItem('bondhu_business_profit_records', JSON.stringify(businessProfitRecords));
  }, [businessProfitRecords]);

  useEffect(() => {
    localStorage.setItem('bondhu_profit_distributions', JSON.stringify(profitDistributions));
  }, [profitDistributions]);

  useEffect(() => {
    localStorage.setItem('bondhu_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Self-healing automatic reconciliation:
  // Whenever the app loads or businessProfitRecords/profitDistributions change, detect and purge any
  // orphaned profit distributions or orphaned profit_share transactions left behind by previously deleted profit records,
  // and auto-reconcile member savings balances so that all metrics stay 100% accurate and consistent.
  useEffect(() => {
    if (businessProfitRecords.length === 0 && profitDistributions.length === 0 && transactions.length === 0) return;

    const activeRecordIds = new Set(businessProfitRecords.map(r => r.id));

    // 1. Detect orphaned profit distributions whose underlying business profit record was deleted
    const orphanedDistIds = new Set<string>();
    profitDistributions.forEach(d => {
      const bprTag = d.id.startsWith('pd-')
        ? d.id.slice(3)
        : (d.id.startsWith('dist-bpr-')
            ? d.id.slice(9)
            : d.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]);
      if (bprTag && !activeRecordIds.has(bprTag)) {
        orphanedDistIds.add(d.id);
      }
    });

    if (orphanedDistIds.size > 0) {
      setProfitDistributions(prev => {
        const cleaned = prev.filter(d => !orphanedDistIds.has(d.id));
        localStorage.setItem('bondhu_profit_distributions', JSON.stringify(cleaned));
        return cleaned;
      });
      orphanedDistIds.forEach(id => deleteDoc(doc(db, 'profitDistributions', id)).catch(console.error));
    }

    // 2. Detect orphaned profit_share transactions whose underlying business profit record or distribution was deleted
    const activeDistIds = new Set(profitDistributions.filter(d => !orphanedDistIds.has(d.id)).map(d => d.id));
    const orphanedTxIds = new Set<string>();
    const memberOrphanDeductions: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.type !== 'profit_share' || t.category === 'business_profit_member_share') return;

      const bprTag = t.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]
        || (t.id.startsWith('tx-bpr-') ? t.id.replace('tx-', '').split('-')[0] : null);
      const distTag = t.notes?.match(/\[(dist-[^\]]+|pd-[^\]]+)\]/)?.[1];

      let isOrphan = false;
      if (bprTag && !activeRecordIds.has(bprTag)) {
        isOrphan = true;
      } else if (distTag && !activeDistIds.has(distTag) && !activeRecordIds.has(distTag.replace('pd-', '').replace('dist-', ''))) {
        isOrphan = true;
      }

      if (isOrphan) {
        orphanedTxIds.add(t.id);
        if (t.memberId && t.amount > 0) {
          memberOrphanDeductions[t.memberId] = (memberOrphanDeductions[t.memberId] || 0) + Number(t.amount);
        }
      }
    });

    if (orphanedTxIds.size > 0) {
      setTransactions(prev => {
        const cleaned = prev.filter(t => !orphanedTxIds.has(t.id));
        localStorage.setItem('bondhu_transactions', JSON.stringify(cleaned));
        return cleaned;
      });
      orphanedTxIds.forEach(id => deleteDoc(doc(db, 'transactions', id)).catch(console.error));

      // Reconcile affected members
      if (Object.keys(memberOrphanDeductions).length > 0) {
        setMembers(prev => prev.map(m => {
          const deduct = memberOrphanDeductions[m.id];
          if (!deduct) return m;
          const newGen = Math.max(0, Number(((m.generalSavingsBalance || 0) - deduct).toFixed(2)));
          const newTot = Math.max(0, Number(((m.totalSavings || 0) - deduct).toFixed(2)));
          const updated: Member = { ...m, generalSavingsBalance: newGen, totalSavings: newTot };
          safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
          safeSetDoc(doc(db, 'memberFinancials', m.id), {
            generalSavingsBalance: newGen,
            totalSavings: newTot,
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(console.error);
          return updated;
        }));
      }
    }
  }, [businessProfitRecords, profitDistributions.length]);

  // Helper date - returns local YYYY-MM-DD to match browser date pickers precisely
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const getCurrentTimeStr = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Setup Firestore Real-time Listeners with anti-wipe protection & automatic cloud seeding
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const initFirestoreSync = async () => {
      try {
        // 1. Settings listener
        const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
          if (snap.exists()) {
            setSettings(snap.data() as SomitiSettings);
            setFirestoreConnected(true);
          } else {
            // Seed settings to Firestore if not present
            safeSetDoc(doc(db, 'settings', 'general'), settings).catch(console.error);
          }
        }, (err) => {
          console.warn('Firestore settings snapshot error:', err);
        });
        unsubs.push(unsubSettings);

        // 2. Members listener with sanitization & protection against empty wipe
        const unsubMembers = onSnapshot(collection(db, 'members'), (snapshot) => {
          if (!snapshot.empty) {
            const list: Member[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeMember({ ...data, id: docSnap.id }));
            });
            setMembers(list);
            setFirestoreConnected(true);
            setLastSyncTime(new Date().toLocaleTimeString());
          } else {
            setFirestoreConnected(true);
            if (isInitialLoadDone.current) {
              setMembers([]);
              localStorage.setItem('bondhu_members', JSON.stringify([]));
            } else if (members.length > 0) {
              const batch = writeBatch(db);
              members.forEach(m => safeBatchSet(batch, doc(db, 'members', m.id), m));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore members snapshot error:', err);
        });
        unsubs.push(unsubMembers);

        // 3. Loans listener with sanitization & protection
        const unsubLoans = onSnapshot(collection(db, 'loans'), (snapshot) => {
          if (!snapshot.empty) {
            const list: Loan[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeLoan({ ...data, id: docSnap.id }));
            });
            setLoans(list);
          } else {
            if (isInitialLoadDone.current) {
              setLoans([]);
              localStorage.setItem('bondhu_loans', JSON.stringify([]));
            } else if (loans.length > 0) {
              const batch = writeBatch(db);
              loans.forEach(l => safeBatchSet(batch, doc(db, 'loans', l.id), l));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore loans snapshot error:', err);
        });
        unsubs.push(unsubLoans);

        // 4. Savings Schemes listener with sanitization & protection
        const unsubSavings = onSnapshot(collection(db, 'savings'), (snapshot) => {
          if (!snapshot.empty) {
            const list: SavingsScheme[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeSavings({ ...data, id: docSnap.id }));
            });
            setSavingsSchemes(list);
          } else {
            if (isInitialLoadDone.current) {
              setSavingsSchemes([]);
              localStorage.setItem('bondhu_savings', JSON.stringify([]));
            } else if (savingsSchemes.length > 0) {
              const batch = writeBatch(db);
              savingsSchemes.forEach(s => safeBatchSet(batch, doc(db, 'savings', s.id), s));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore savings snapshot error:', err);
        });
        unsubs.push(unsubSavings);

        // 4b. Share Closures listener with sanitization & protection
        const unsubShareClosures = onSnapshot(collection(db, 'shareClosures'), (snapshot) => {
          if (!snapshot.empty) {
            const list: ShareClosure[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeShareClosure({ ...data, id: docSnap.id }));
            });
            list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setShareClosures(list);
          } else {
            if (isInitialLoadDone.current) {
              setShareClosures([]);
              localStorage.setItem('bondhu_share_closures', JSON.stringify([]));
            } else if (shareClosures.length > 0) {
              const batch = writeBatch(db);
              shareClosures.forEach(c => safeBatchSet(batch, doc(db, 'shareClosures', c.id), c));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore shareClosures snapshot error:', err);
        });
        unsubs.push(unsubShareClosures);

        // 5. Transactions listener with sanitization & protection
        const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
          if (!snapshot.empty) {
            const list: Transaction[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeTransaction({ ...data, id: docSnap.id }));
            });
            list.sort(compareTransactionsDesc);
            setTransactions(list);
          } else {
            if (isInitialLoadDone.current) {
              setTransactions([]);
              localStorage.setItem('bondhu_transactions', JSON.stringify([]));
            } else {
              const listToSeed = transactions.length > 0 ? transactions : sampleDemoTransactions;
              if (transactions.length === 0) {
                setTransactions(listToSeed);
              }
              const batch = writeBatch(db);
              listToSeed.forEach(t => safeBatchSet(batch, doc(db, 'transactions', t.id), t));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore transactions snapshot error:', err);
        });
        unsubs.push(unsubTx);

        // 6. Income/Expenses Vouchers listener with protection
        const unsubVouchers = onSnapshot(collection(db, 'incomeExpenses'), (snapshot) => {
          if (!snapshot.empty) {
            const list: IncomeExpenseItem[] = [];
            snapshot.forEach(docSnap => list.push(docSnap.data() as IncomeExpenseItem));
            setVouchers(list);
          } else {
            if (isInitialLoadDone.current) {
              setVouchers([]);
              localStorage.setItem('bondhu_vouchers', JSON.stringify([]));
            } else if (vouchers.length > 0) {
              const batch = writeBatch(db);
              vouchers.forEach(v => safeBatchSet(batch, doc(db, 'incomeExpenses', v.id), v));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore incomeExpenses snapshot error:', err);
        });
        unsubs.push(unsubVouchers);

        // 7. Bank Accounts listener with sanitization
        const unsubBanks = onSnapshot(collection(db, 'bankAccounts'), (snapshot) => {
          if (!snapshot.empty) {
            const list: BankAccount[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeBank({ ...data, id: docSnap.id }));
            });
            setBankAccounts(list);
          } else {
            if (bankAccounts.length > 0 && !isInitialLoadDone.current) {
              const batch = writeBatch(db);
              bankAccounts.forEach(b => safeBatchSet(batch, doc(db, 'bankAccounts', b.id), b));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore bankAccounts snapshot error:', err);
        });
        unsubs.push(unsubBanks);

        // 8. Users listener with sanitization
        const unsubUsers = onSnapshot(collection(db, 'systemUsers'), (snapshot) => {
          if (!snapshot.empty) {
            const list: AppUser[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeUser({ ...data, id: docSnap.id }));
            });
            setUsers(list);
          } else {
            if (users.length > 0 && !isInitialLoadDone.current) {
              const batch = writeBatch(db);
              users.forEach(u => safeBatchSet(batch, doc(db, 'systemUsers', u.id), u));
              batch.commit().catch(console.error);
            }
          }
        }, (err) => {
          console.warn('Firestore users snapshot error:', err);
        });
        unsubs.push(unsubUsers);

        // 9. Business Fundings listener with sanitization
        const unsubBusinessFundings = onSnapshot(collection(db, 'businessFundings'), (snapshot) => {
          if (!snapshot.empty) {
            const list: BusinessFunding[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeBusinessFunding({ ...data, id: docSnap.id }));
            });
            list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
            setBusinessFundings(list);
          } else {
            setBusinessFundings([]);
            localStorage.setItem('bondhu_business_fundings', JSON.stringify([]));
          }
        }, (err) => {
          console.warn('Firestore businessFundings snapshot error:', err);
        });
        unsubs.push(unsubBusinessFundings);

        // 10. Business Profit Records listener with sanitization
        const unsubProfitRecords = onSnapshot(collection(db, 'businessProfitRecords'), (snapshot) => {
          if (!snapshot.empty) {
            const list: BusinessProfitRecord[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeBusinessProfitRecord({ ...data, id: docSnap.id }));
            });
            list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            setBusinessProfitRecords(list);
          } else {
            setBusinessProfitRecords([]);
            localStorage.setItem('bondhu_business_profit_records', JSON.stringify([]));
          }
        }, (err) => {
          console.warn('Firestore businessProfitRecords snapshot error:', err);
        });
        unsubs.push(unsubProfitRecords);

        // 11. Monthly Profit Distributions listener with sanitization
        const unsubDistributions = onSnapshot(collection(db, 'profitDistributions'), (snapshot) => {
          if (!snapshot.empty) {
            const list: MonthlyProfitDistribution[] = [];
            snapshot.forEach(docSnap => {
              const data = docSnap.data();
              list.push(sanitizeMonthlyProfitDistribution({ ...data, id: docSnap.id }));
            });
            list.sort((a, b) => (b.distributionDate || '').localeCompare(a.distributionDate || ''));
            setProfitDistributions(list);
          } else {
            setProfitDistributions([]);
            localStorage.setItem('bondhu_profit_distributions', JSON.stringify([]));
          }
        }, (err) => {
          console.warn('Firestore profitDistributions snapshot error:', err);
        });
        unsubs.push(unsubDistributions);

        if (!isInitialLoadDone.current) {
          isInitialLoadDone.current = true;
        }
      } catch (e) {
        console.error('Error initializing Firestore:', e);
      }
    };

    initFirestoreSync();

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Sync all local state up to Firestore
  const syncAllToFirestore = async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);

      // Settings
      safeBatchSet(batch, doc(db, 'settings', 'general'), settings);

      // Members (Public profile & Private Financial isolation)
      members.forEach(m => {
        safeBatchSet(batch, doc(db, 'members', m.id), {
          id: m.id,
          memberNo: m.memberNo,
          name: m.name,
          nameEn: m.nameEn || '',
          phone: m.phone,
          email: m.email || '',
          nid: m.nid || '',
          dob: m.dob || '',
          gender: m.gender || 'male',
          fatherName: m.fatherName || '',
          motherName: m.motherName || '',
          spouseName: m.spouseName || '',
          presentAddress: m.presentAddress || '',
          permanentAddress: m.permanentAddress || '',
          occupation: m.occupation || '',
          joiningDate: m.joiningDate,
          status: m.status,
          photoUrl: m.photoUrl,
          signatureUrl: m.signatureUrl || '',
          nominees: m.nominees || [],
          assignedCollectorId: m.assignedCollectorId || '',
          notes: m.notes || ''
        });

        // Private Member Financial Document
        safeBatchSet(batch, doc(db, 'memberFinancials', m.id), {
          memberId: m.id,
          memberNo: m.memberNo,
          totalSavings: m.totalSavings || 0,
          generalSavingsBalance: m.generalSavingsBalance || 0,
          dpsSavingsBalance: m.dpsSavingsBalance || 0,
          fdrSavingsBalance: m.fdrSavingsBalance || 0,
          activeLoanBalance: m.activeLoanBalance || 0,
          shareCount: m.shareCount || 0,
          shareValue: m.shareValue || 0,
          admissionFee: m.admissionFee || 0,
          monthlyIncome: m.monthlyIncome || 0,
          updatedAt: new Date().toISOString()
        });
      });

      // Loans
      loans.forEach(l => {
        safeBatchSet(batch, doc(db, 'loans', l.id), l);
      });

      // Savings
      savingsSchemes.forEach(s => {
        safeBatchSet(batch, doc(db, 'savings', s.id), s);
      });

      // Share Closures
      shareClosures.forEach(c => {
        safeBatchSet(batch, doc(db, 'shareClosures', c.id), c);
      });

      // Transactions
      transactions.forEach(t => {
        safeBatchSet(batch, doc(db, 'transactions', t.id), t);
      });

      // Income / Expense vouchers
      vouchers.forEach(v => {
        safeBatchSet(batch, doc(db, 'incomeExpenses', v.id), v);
      });

      // Bank Accounts
      bankAccounts.forEach(b => {
        safeBatchSet(batch, doc(db, 'bankAccounts', b.id), b);
      });

      // Users
      users.forEach(u => {
        safeBatchSet(batch, doc(db, 'systemUsers', u.id), u);
      });

      // Business Fundings
      businessFundings.forEach(bf => {
        safeBatchSet(batch, doc(db, 'businessFundings', bf.id), bf);
      });

      // Business Profit Records
      businessProfitRecords.forEach(bpr => {
        safeBatchSet(batch, doc(db, 'businessProfitRecords', bpr.id), bpr);
      });

      // Monthly Profit Distributions
      profitDistributions.forEach(pd => {
        safeBatchSet(batch, doc(db, 'profitDistributions', pd.id), pd);
      });

      await batch.commit();
      setFirestoreConnected(true);
      setLastSyncTime(new Date().toLocaleTimeString());
      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error('Error pushing data to Firestore:', error);
      setIsSyncing(false);
      return false;
    }
  };

  // Fetch all collections from Firestore
  const syncAllFromFirestore = async (): Promise<boolean> => {
    try {
      setIsSyncing(true);

      const [
        settingsSnap,
        membersSnap,
        loansSnap,
        savingsSnap,
        shareClosuresSnap,
        txSnap,
        vouchersSnap,
        banksSnap,
        usersSnap,
        businessFundingsSnap,
        businessProfitRecordsSnap,
        profitDistributionsSnap
      ] = await Promise.all([
        getDocs(collection(db, 'settings')),
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'loans')),
        getDocs(collection(db, 'savings')),
        getDocs(collection(db, 'shareClosures')),
        getDocs(collection(db, 'transactions')),
        getDocs(collection(db, 'incomeExpenses')),
        getDocs(collection(db, 'bankAccounts')),
        getDocs(collection(db, 'systemUsers')),
        getDocs(collection(db, 'businessFundings')),
        getDocs(collection(db, 'businessProfitRecords')),
        getDocs(collection(db, 'profitDistributions')),
      ]);

      if (!settingsSnap.empty) {
        const generalDoc = settingsSnap.docs.find(d => d.id === 'general');
        if (generalDoc) setSettings(generalDoc.data() as SomitiSettings);
      }

      if (!membersSnap.empty) {
        const list: Member[] = [];
        membersSnap.forEach(d => list.push(d.data() as Member));
        setMembers(list);
      }

      if (!loansSnap.empty) {
        const list: Loan[] = [];
        loansSnap.forEach(d => list.push(d.data() as Loan));
        setLoans(list);
      }

      if (!savingsSnap.empty) {
        const list: SavingsScheme[] = [];
        savingsSnap.forEach(d => list.push(d.data() as SavingsScheme));
        setSavingsSchemes(list);
      }

      if (!shareClosuresSnap.empty) {
        const list: ShareClosure[] = [];
        shareClosuresSnap.forEach(d => list.push(sanitizeShareClosure(d.data())));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setShareClosures(list);
      }

      if (!txSnap.empty) {
        const list: Transaction[] = [];
        txSnap.forEach(d => list.push(sanitizeTransaction(d.data())));
        list.sort(compareTransactionsDesc);
        setTransactions(list);
      }

      if (!vouchersSnap.empty) {
        const list: IncomeExpenseItem[] = [];
        vouchersSnap.forEach(d => list.push(d.data() as IncomeExpenseItem));
        setVouchers(list);
      }

      if (!banksSnap.empty) {
        const list: BankAccount[] = [];
        banksSnap.forEach(d => list.push(d.data() as BankAccount));
        setBankAccounts(list);
      }

      if (!usersSnap.empty) {
        const list: AppUser[] = [];
        usersSnap.forEach(d => list.push(d.data() as AppUser));
        setUsers(list);
      }

      if (!businessFundingsSnap.empty) {
        const list: BusinessFunding[] = [];
        businessFundingsSnap.forEach(d => list.push(sanitizeBusinessFunding({ ...d.data(), id: d.id })));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setBusinessFundings(list);
      } else {
        setBusinessFundings([]);
        localStorage.setItem('bondhu_business_fundings', JSON.stringify([]));
      }

      if (!businessProfitRecordsSnap.empty) {
        const list: BusinessProfitRecord[] = [];
        businessProfitRecordsSnap.forEach(d => list.push(sanitizeBusinessProfitRecord({ ...d.data(), id: d.id })));
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setBusinessProfitRecords(list);
      } else {
        setBusinessProfitRecords([]);
        localStorage.setItem('bondhu_business_profit_records', JSON.stringify([]));
      }

      if (!profitDistributionsSnap.empty) {
        const rawList: MonthlyProfitDistribution[] = [];
        profitDistributionsSnap.forEach(d => rawList.push(sanitizeMonthlyProfitDistribution({ ...d.data(), id: d.id })));

        // Deduplicate only true duplicate documents (same ID or duplicate business profit record tag)
        // This ensures different members / business fundings in the same month are preserved!
        const seenIds = new Set<string>();
        const seenBprTags = new Set<string>();
        const list: MonthlyProfitDistribution[] = [];
        const obsoleteDistributions: MonthlyProfitDistribution[] = [];

        rawList.forEach(d => {
          if (seenIds.has(d.id)) {
            obsoleteDistributions.push(d);
            return;
          }
          seenIds.add(d.id);

          const bprTag = d.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1];
          if (bprTag) {
            if (seenBprTags.has(bprTag)) {
              obsoleteDistributions.push(d);
              return;
            }
            seenBprTags.add(bprTag);
          }

          list.push(d);
        });

        list.sort((a, b) => (b.distributionDate || '').localeCompare(a.distributionDate || ''));
        setProfitDistributions(list);
        localStorage.setItem('bondhu_profit_distributions', JSON.stringify(list));

        // Purge obsolete duplicate distributions from Firestore and reconcile member savings
        if (obsoleteDistributions.length > 0) {
          obsoleteDistributions.forEach(async (obsDist) => {
            console.log('[Deduplication] Purging obsolete duplicate distribution doc:', obsDist.id, obsDist.distributionNo);
            deleteDoc(doc(db, 'profitDistributions', obsDist.id)).catch(console.error);

            const txIds = new Set((obsDist.memberDistributions || []).map(m => m.transactionId).filter(Boolean));
            const duplicateTxs = (txSnap?.docs || [])
              .map(d => ({ ...d.data(), id: d.id } as Transaction))
              .filter(t => (t.id && txIds.has(t.id)) || (t.type === 'profit_share' && t.notes?.includes(obsDist.distributionNo)));

            if (duplicateTxs.length > 0) {
              const dupMap: Record<string, number> = {};
              duplicateTxs.forEach(t => {
                dupMap[t.memberId] = (dupMap[t.memberId] || 0) + (Number(t.amount) || 0);
                deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
              });

              // Revert duplicate savings from members in Firestore
              setMembers(prev => prev.map(m => {
                if (!dupMap[m.id]) return m;
                const deduct = dupMap[m.id];
                const newGen = Math.max(0, (m.generalSavingsBalance || 0) - deduct);
                const newTot = Math.max(0, (m.totalSavings || 0) - deduct);
                const updated = { ...m, generalSavingsBalance: newGen, totalSavings: newTot };
                safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
                safeSetDoc(doc(db, 'memberFinancials', m.id), {
                  generalSavingsBalance: newGen,
                  totalSavings: newTot,
                  updatedAt: new Date().toISOString(),
                }, { merge: true }).catch(console.error);
                return updated;
              }));

              setTransactions(prev => prev.filter(t => !txIds.has(t.id)));
            }
          });
        }
      } else {
        setProfitDistributions([]);
        localStorage.setItem('bondhu_profit_distributions', JSON.stringify([]));
      }

      setFirestoreConnected(true);
      setLastSyncTime(new Date().toLocaleTimeString());
      setIsSyncing(false);
      return true;
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
      setIsSyncing(false);
      return false;
    }
  };

  const updateSettings = (newSet: Partial<SomitiSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSet };
      safeSetDoc(doc(db, 'settings', 'general'), updated).catch(console.error);
      return updated;
    });
  };

  // Unique Serial Generator for Ledger Transactions (never duplicate, strictly monotonic)
  const getNextLedgerSerial = (sourceList?: Transaction[]): number => {
    const list = sourceList || transactions;
    let max = 0;
    for (const t of list) {
      if (typeof t.serialNo === 'number' && t.serialNo > max) {
        max = t.serialNo;
      }
    }
    return max + 1;
  };

  // Add Member
  const addMember = (memberData: Omit<Member, 'id' | 'memberNo' | 'totalSavings' | 'generalSavingsBalance' | 'dpsSavingsBalance' | 'fdrSavingsBalance' | 'activeLoanBalance'>): Member => {
    const nextNo = members.length + 101;
    const memberNo = `BS-${nextNo}`;
    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
      memberNo,
      generalSavingsBalance: 0,
      dpsSavingsBalance: 0,
      fdrSavingsBalance: 0,
      totalSavings: 0,
      activeLoanBalance: 0,
    };

    setMembers(prev => [newMember, ...prev]);
    // Save to Firestore
    safeSetDoc(doc(db, 'members', newMember.id), newMember).catch(console.error);

    // Record admission fee transaction only if amount > 0
    if (newMember.admissionFee > 0) {
      const txId = `tx-${Date.now()}`;
      const tx: Transaction = {
        id: txId,
        serialNo: getNextLedgerSerial(),
        voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId: newMember.id,
        memberName: newMember.name,
        memberNo: newMember.memberNo,
        type: 'admission_fee',
        amount: newMember.admissionFee,
        date: getTodayDateStr(),
        time: getCurrentTimeStr(),
        paymentMethod: 'cash',
        collectedBy: currentUser.name,
        verifiedBy: currentUser.name,
        notes: 'নতুন সদস্য ভর্তি ফি',
        status: 'completed',
      };
      setTransactions(prev => [tx, ...prev]);
      safeSetDoc(doc(db, 'transactions', tx.id), tx).catch(console.error);
    }

    return newMember;
  };

  const updateMember = (id: string, data: Partial<Member>) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, ...data };
      safeSetDoc(doc(db, 'members', id), updated).catch(console.error);
      return updated;
    }));
  };

  const deleteMember = async (id: string): Promise<boolean> => {
    try {
      setMembers(prev => prev.filter(m => m.id !== id));
      setLoans(prev => prev.filter(l => l.memberId !== id));
      setSavingsSchemes(prev => prev.filter(s => s.memberId !== id));
      setBusinessFundings(prev => prev.filter(b => b.memberId !== id));
      setTransactions(prev => prev.filter(t => t.memberId !== id));

      await deleteDoc(doc(db, 'members', id));
      await deleteDoc(doc(db, 'memberFinancials', id)).catch(() => {});

      // Clean up member's transactions in Firestore
      const txsToDelete = transactions.filter(t => t.memberId === id);
      txsToDelete.forEach(t => {
        deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
      });

      // Clean up member's loans, savings schemes, and business fundings in Firestore
      const loansToDelete = loans.filter(l => l.memberId === id);
      loansToDelete.forEach(l => {
        deleteDoc(doc(db, 'loans', l.id)).catch(console.error);
      });
      const savingsToDelete = savingsSchemes.filter(s => s.memberId === id);
      savingsToDelete.forEach(s => {
        deleteDoc(doc(db, 'savings', s.id)).catch(console.error);
      });
      const fundingsToDelete = businessFundings.filter(b => b.memberId === id);
      fundingsToDelete.forEach(b => {
        deleteDoc(doc(db, 'businessFundings', b.id)).catch(console.error);
      });

      return true;
    } catch (err) {
      console.error('Error deleting member from Firestore:', err);
      return false;
    }
  };

  const importMembersFromList = (newMembers: Member[]) => {
    setMembers(prev => [...newMembers, ...prev]);
    const batch = writeBatch(db);
    newMembers.forEach(m => {
      safeBatchSet(batch, doc(db, 'members', m.id), m);
    });
    batch.commit().catch(console.error);
  };

  // Close Member Shares (Partial or Full Share Surrender with principal + profit refund)
  const closeMemberShares = async (params: {
    memberId: string;
    sharesToClose: number;
    unitPrice: number;
    profitAmount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    notes?: string;
    date?: string;
  }): Promise<{ success: boolean; error?: string; closure?: ShareClosure }> => {
    const member = members.find(m => m.id === params.memberId);
    if (!member) {
      return { success: false, error: 'সদস্য খুঁজে পাওয়া যায়নি।' };
    }
    const currentShares = Number(member.shareCount) || 0;
    const sharesToClose = Number(params.sharesToClose) || 0;
    if (sharesToClose <= 0) {
      return { success: false, error: 'কমপক্ষে ১টি শেয়ার নির্বাচন করুন।' };
    }
    if (sharesToClose > currentShares) {
      return { success: false, error: `সদস্যের বর্তমান শেয়ার (${currentShares} টি) এর চেয়ে বেশি ক্লোজ করা সম্ভব নয়।` };
    }

    const unitPrice = Number(params.unitPrice) || settings.sharePricePerUnit || 1000;
    const principalAmount = sharesToClose * unitPrice;
    const profitAmount = Number(params.profitAmount) || 0;
    const totalRefundAmount = principalAmount + profitAmount;
    const remainingShares = Math.max(0, currentShares - sharesToClose);
    const remainingShareValue = Math.max(0, (member.shareValue || 0) - principalAmount);
    const remainingTotalSavings = (member.generalSavingsBalance || 0) + (member.dpsSavingsBalance || 0) + (member.fdrSavingsBalance || 0);

    const voucherNo = `SCV-${Date.now().toString().slice(-6)}`;
    const txId = `tx-sc-${Date.now()}`;
    const closureId = `sc-${Date.now()}`;
    const closureDate = params.date || getTodayDateStr();

    const closureRecord: ShareClosure = {
      id: closureId,
      memberId: member.id,
      memberNo: member.memberNo,
      memberName: member.name,
      closedSharesCount: sharesToClose,
      unitPrice,
      principalAmount,
      profitAmount,
      totalRefundAmount,
      closureDate,
      voucherNo,
      paymentMethod: params.paymentMethod,
      bankAccountId: params.paymentMethod === 'bank' ? params.bankAccountId : undefined,
      handledBy: currentUser?.name || 'Admin',
      notes: params.notes || `${sharesToClose} টি শেয়ার সমর্পণ ও নিষ্পত্তি (মূলধন ৳${principalAmount} + লাভ ৳${profitAmount})`,
      remainingActiveShares: remainingShares,
      createdAt: new Date().toISOString(),
    };

    // 1. Transaction record for financial ledger
    const newTx: Transaction = {
      id: txId,
      serialNo: getNextLedgerSerial(),
      voucherNo,
      memberId: member.id,
      memberName: member.name,
      memberNo: member.memberNo,
      type: 'share_surrender',
      amount: totalRefundAmount,
      date: closureDate,
      time: getCurrentTimeStr(),
      paymentMethod: params.paymentMethod,
      bankAccountId: params.paymentMethod === 'bank' ? params.bankAccountId : undefined,
      collectedBy: currentUser?.name || 'Admin',
      verifiedBy: currentUser?.name || 'Admin',
      notes: `${sharesToClose} টি শেয়ার সমর্পণ ও নিষ্পত্তি বাবদ সদস্যকে মোট ৳${totalRefundAmount} প্রদান (মূলধন ৳${principalAmount} + লভ্যাংশ ৳${profitAmount})। অবশিষ্ট সক্রিয় শেয়ার: ${remainingShares} টি।`,
      status: 'completed',
    };

    // Update state
    setShareClosures(prev => [closureRecord, ...prev]);
    setTransactions(prev => [newTx, ...prev]);
    setMembers(prev => prev.map(m => {
      if (m.id === member.id) {
        return {
          ...m,
          shareCount: remainingShares,
          shareValue: remainingShareValue,
          totalSavings: remainingTotalSavings,
        };
      }
      return m;
    }));

    if (params.paymentMethod === 'bank' && params.bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id === params.bankAccountId) {
          return { ...b, balance: Math.max(0, b.balance - totalRefundAmount), updatedAt: new Date().toISOString() };
        }
        return b;
      }));
    }

    // Persist to Firestore
    try {
      await safeSetDoc(doc(db, 'shareClosures', closureRecord.id), closureRecord);
      await safeSetDoc(doc(db, 'transactions', newTx.id), newTx);
      await safeSetDoc(doc(db, 'members', member.id), {
        ...member,
        shareCount: remainingShares,
        shareValue: remainingShareValue,
        totalSavings: remainingTotalSavings,
      });
      await safeSetDoc(doc(db, 'memberFinancials', member.id), {
        memberId: member.id,
        memberNo: member.memberNo,
        totalSavings: remainingTotalSavings,
        generalSavingsBalance: member.generalSavingsBalance,
        dpsSavingsBalance: member.dpsSavingsBalance,
        fdrSavingsBalance: member.fdrSavingsBalance,
        activeLoanBalance: member.activeLoanBalance,
        shareCount: remainingShares,
        shareValue: remainingShareValue,
        admissionFee: member.admissionFee,
        monthlyIncome: member.monthlyIncome,
        updatedAt: new Date().toISOString()
      });
      if (params.paymentMethod === 'bank' && params.bankAccountId) {
        const targetBank = bankAccounts.find(b => b.id === params.bankAccountId);
        if (targetBank) {
          await safeSetDoc(doc(db, 'bankAccounts', targetBank.id), {
            ...targetBank,
            balance: Math.max(0, targetBank.balance - totalRefundAmount),
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('Firestore share closure sync error:', e);
    }

    return { success: true, closure: closureRecord };
  };

  // Buy Member Additional Shares
  const buyMemberShares = async (params: {
    memberId: string;
    sharesToBuy: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    notes?: string;
    date?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const member = members.find(m => m.id === params.memberId);
    if (!member) {
      return { success: false, error: 'সদস্য খুঁজে পাওয়া যায়নি।' };
    }
    const sharesToBuy = Number(params.sharesToBuy) || 0;
    if (sharesToBuy <= 0) {
      return { success: false, error: 'কমপক্ষে ১টি শেয়ার সংখ্যা উল্লেখ করুন।' };
    }
    const unitPrice = Number(params.unitPrice) || settings.sharePricePerUnit || 1000;
    const totalAmount = sharesToBuy * unitPrice;
    const newShareCount = (member.shareCount || 0) + sharesToBuy;
    const newShareValue = (member.shareValue || 0) + totalAmount;
    const newTotalSavings = (member.generalSavingsBalance || 0) + (member.dpsSavingsBalance || 0) + (member.fdrSavingsBalance || 0);

    const voucherNo = `SPV-${Date.now().toString().slice(-6)}`;
    const txId = `tx-sp-${Date.now()}`;
    const txDate = params.date || getTodayDateStr();

    const newTx: Transaction = {
      id: txId,
      serialNo: getNextLedgerSerial(),
      voucherNo,
      memberId: member.id,
      memberName: member.name,
      memberNo: member.memberNo,
      type: 'share_purchase',
      amount: totalAmount,
      date: txDate,
      time: getCurrentTimeStr(),
      paymentMethod: params.paymentMethod,
      bankAccountId: params.paymentMethod === 'bank' ? params.bankAccountId : undefined,
      collectedBy: currentUser?.name || 'Admin',
      verifiedBy: currentUser?.name || 'Admin',
      notes: params.notes || `${sharesToBuy} টি নতুন শেয়ার ক্রয় বাবদ জমা`,
      status: 'completed',
    };

    setTransactions(prev => [newTx, ...prev]);
    setMembers(prev => prev.map(m => {
      if (m.id === member.id) {
        return {
          ...m,
          shareCount: newShareCount,
          shareValue: newShareValue,
          totalSavings: newTotalSavings,
        };
      }
      return m;
    }));

    if (params.paymentMethod === 'bank' && params.bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id === params.bankAccountId) {
          return { ...b, balance: b.balance + totalAmount, updatedAt: new Date().toISOString() };
        }
        return b;
      }));
    }

    try {
      await safeSetDoc(doc(db, 'transactions', newTx.id), newTx);
      await safeSetDoc(doc(db, 'members', member.id), {
        ...member,
        shareCount: newShareCount,
        shareValue: newShareValue,
        totalSavings: newTotalSavings,
      });
      await safeSetDoc(doc(db, 'memberFinancials', member.id), {
        memberId: member.id,
        memberNo: member.memberNo,
        totalSavings: newTotalSavings,
        generalSavingsBalance: member.generalSavingsBalance,
        dpsSavingsBalance: member.dpsSavingsBalance,
        fdrSavingsBalance: member.fdrSavingsBalance,
        activeLoanBalance: member.activeLoanBalance,
        shareCount: newShareCount,
        shareValue: newShareValue,
        admissionFee: member.admissionFee,
        monthlyIncome: member.monthlyIncome,
        updatedAt: new Date().toISOString()
      });
      if (params.paymentMethod === 'bank' && params.bankAccountId) {
        const targetBank = bankAccounts.find(b => b.id === params.bankAccountId);
        if (targetBank) {
          await safeSetDoc(doc(db, 'bankAccounts', targetBank.id), {
            ...targetBank,
            balance: targetBank.balance + totalAmount,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (e) {
      console.warn('Firestore share buy sync error:', e);
    }

    return { success: true };
  };

  // Add Deposit
  const addDeposit = (params: {
    memberId: string;
    schemeType: 'general' | 'dps' | 'fdr';
    schemeId?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    selectedShares?: number[];
    totalMemberShares?: number;
    shareRate?: number;
    shareAmounts?: { [shareNo: number]: number };
    unpaidShares?: number[];
    notes?: string;
    date?: string;
    depositMonth?: string;
    depositYear?: number;
    billingPeriod?: string;
  }): Transaction => {
    const member = members.find(m => m.id === params.memberId);
    const voucherNo = `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txType: TransactionType = params.schemeType === 'dps' ? 'dps_deposit' : params.schemeType === 'fdr' ? 'fdr_deposit' : 'deposit';

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: getNextLedgerSerial(),
      voucherNo,
      memberId: params.memberId,
      memberName: member?.name || 'অজ্ঞাত সদস্য',
      memberNo: member?.memberNo || '',
      type: txType,
      amount: params.amount,
      date: params.date || getTodayDateStr(),
      time: getCurrentTimeStr(),
      paymentMethod: params.paymentMethod,
      bankAccountId: params.bankAccountId,
      collectedBy: currentUser.name,
      verifiedBy: currentUser.name,
      savingsSchemeId: params.schemeId,
      selectedShares: params.selectedShares,
      totalMemberShares: params.totalMemberShares,
      shareRate: params.shareRate,
      shareAmounts: params.shareAmounts,
      unpaidShares: params.unpaidShares,
      depositMonth: params.depositMonth,
      depositYear: params.depositYear,
      billingPeriod: params.billingPeriod,
      notes: params.notes || (params.schemeType === 'dps' ? 'ডিপিএস কিস্তি জমা' : params.schemeType === 'fdr' ? 'এফডিআর জমা' : 'সাধারণ সঞ্চয় জমা'),
      status: 'completed',
    };

    setTransactions(prev => [newTx, ...prev]);
    safeSetDoc(doc(db, 'transactions', newTx.id), newTx).catch(console.error);

    // Update Member balance
    setMembers(prev => prev.map(m => {
      if (m.id !== params.memberId) return m;
      let gen = m.generalSavingsBalance;
      let dps = m.dpsSavingsBalance;
      let fdr = m.fdrSavingsBalance;

      if (params.schemeType === 'general') gen += params.amount;
      if (params.schemeType === 'dps') dps += params.amount;
      if (params.schemeType === 'fdr') fdr += params.amount;

      const updated = {
        ...m,
        generalSavingsBalance: gen,
        dpsSavingsBalance: dps,
        fdrSavingsBalance: fdr,
        totalSavings: gen + dps + fdr,
      };
      safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
      return updated;
    }));

    // Update Scheme if applicable
    if (params.schemeId) {
      setSavingsSchemes(prev => prev.map(s => {
        if (s.id !== params.schemeId) return s;
        const updated = {
          ...s,
          totalDeposited: s.totalDeposited + params.amount,
          profitAccrued: s.profitAccrued + (params.amount * (s.interestRate / 100) / 12),
        };
        safeSetDoc(doc(db, 'savings', s.id), updated).catch(console.error);
        return updated;
      }));
    }

    // Update bank account if via bank
    if (params.paymentMethod === 'bank' && params.bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== params.bankAccountId) return b;
        const updated = { ...b, balance: b.balance + params.amount };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }

    setActiveReceipt(newTx);
    return newTx;
  };

  // Add Withdrawal
  const addWithdrawal = (params: {
    memberId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    notes?: string;
  }): Transaction => {
    const member = members.find(m => m.id === params.memberId);
    const voucherNo = `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: getNextLedgerSerial(),
      voucherNo,
      memberId: params.memberId,
      memberName: member?.name || 'অজ্ঞাত সদস্য',
      memberNo: member?.memberNo || '',
      type: 'withdraw',
      amount: params.amount,
      date: getTodayDateStr(),
      time: getCurrentTimeStr(),
      paymentMethod: params.paymentMethod,
      bankAccountId: params.bankAccountId,
      collectedBy: currentUser.name,
      verifiedBy: currentUser.name,
      notes: params.notes || 'সঞ্চয় তহবিল থেকে উত্তোলন',
      status: 'completed',
    };

    setTransactions(prev => [newTx, ...prev]);
    safeSetDoc(doc(db, 'transactions', newTx.id), newTx).catch(console.error);

    // Deduct from member general balance
    setMembers(prev => prev.map(m => {
      if (m.id !== params.memberId) return m;
      const gen = Math.max(0, m.generalSavingsBalance - params.amount);
      const updated = {
        ...m,
        generalSavingsBalance: gen,
        totalSavings: gen + m.dpsSavingsBalance + m.fdrSavingsBalance,
      };
      safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
      return updated;
    }));

    if (params.paymentMethod === 'bank' && params.bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== params.bankAccountId) return b;
        const updated = { ...b, balance: Math.max(0, b.balance - params.amount) };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }

    setActiveReceipt(newTx);
    return newTx;
  };

  // Update / Edit Transaction (ভুল এন্ট্রি সংশোধন)
  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const existingTx = transactions.find(t => t.id === id);
    if (!existingTx) return;

    const unitPrice = existingTx.unitPrice || settings.sharePricePerUnit || 1000;
    const oldAmount = existingTx.amount;
    const newAmount = updates.amount !== undefined ? updates.amount : oldAmount;
    const amountDiff = newAmount - oldAmount;

    // 1. Member balances adjustment
    if (existingTx.memberId) {
      setMembers(prev => prev.map(m => {
        if (m.id !== existingTx.memberId) return m;
        let gen = m.generalSavingsBalance;
        let dps = m.dpsSavingsBalance;
        let fdr = m.fdrSavingsBalance;
        let loanBal = m.activeLoanBalance;
        let sCount = m.shareCount || 0;
        let sVal = m.shareValue || 0;

        if (existingTx.type === 'deposit') gen = Math.max(0, gen + amountDiff);
        if (existingTx.type === 'dps_deposit') dps = Math.max(0, dps + amountDiff);
        if (existingTx.type === 'fdr_deposit') fdr = Math.max(0, fdr + amountDiff);
        if (existingTx.type === 'withdraw') gen = Math.max(0, gen - amountDiff);
        if (existingTx.type === 'loan_installment') loanBal = Math.max(0, loanBal - amountDiff);

        if (existingTx.type === 'share_purchase') {
          const oldShares = existingTx.shareCount ?? Math.max(1, Math.round(oldAmount / unitPrice));
          const newShares = updates.shareCount !== undefined ? updates.shareCount : Math.max(1, Math.round(newAmount / unitPrice));
          const shareDiff = newShares - oldShares;

          sCount = Math.max(0, sCount + shareDiff);
          sVal = Math.max(0, sVal + amountDiff);
        }

        if (existingTx.type === 'share_surrender') {
          const oldShares = existingTx.shareCount ?? Math.max(1, Math.round(oldAmount / unitPrice));
          const newShares = updates.shareCount !== undefined ? updates.shareCount : Math.max(1, Math.round(newAmount / unitPrice));
          const shareDiff = newShares - oldShares;

          sCount = Math.max(0, sCount - shareDiff);
          sVal = Math.max(0, sVal - amountDiff);
        }

        const updated: Member = {
          ...m,
          generalSavingsBalance: gen,
          dpsSavingsBalance: dps,
          fdrSavingsBalance: fdr,
          activeLoanBalance: loanBal,
          shareCount: sCount,
          shareValue: sVal,
          totalSavings: gen + dps + fdr,
        };
        safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
        return updated;
      }));
    }

    // 2. Bank balance adjustment if bank method involved
    const oldBankId = existingTx.paymentMethod === 'bank' ? existingTx.bankAccountId : undefined;
    const newBankId = updates.paymentMethod === 'bank' ? (updates.bankAccountId || oldBankId) : undefined;

    if (oldBankId || newBankId) {
      setBankAccounts(prev => prev.map(b => {
        let bal = b.balance;
        const isCreditType = ['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase', 'loan_installment', 'admission_fee', 'income'].includes(existingTx.type);

        // Revert old transaction on old bank
        if (oldBankId && b.id === oldBankId) {
          bal = isCreditType ? Math.max(0, bal - oldAmount) : bal + oldAmount;
        }

        // Apply new transaction on new bank
        if (newBankId && b.id === newBankId) {
          bal = isCreditType ? bal + newAmount : Math.max(0, bal - newAmount);
        }

        if (bal !== b.balance) {
          const updated = { ...b, balance: bal };
          safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
          return updated;
        }
        return b;
      }));
    }

    const updatedTx: Transaction = {
      ...existingTx,
      ...updates,
    };

    setTransactions(prev => prev.map(t => t.id === id ? updatedTx : t));
    safeSetDoc(doc(db, 'transactions', id), updatedTx).catch(console.error);

    if (activeReceipt?.id === id) {
      setActiveReceipt(updatedTx);
    }
  };

  // Delete / Revert Transaction (ভুল এন্ট্রি বাতিল ও হিসাব সমন্বয়)
  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const unitPrice = tx.unitPrice || settings.sharePricePerUnit || 1000;

    // 1. Revert member balances if applicable using ledger calculation
    if (tx.memberId) {
      setMembers(prev => prev.map(m => {
        if (m.id !== tx.memberId) return m;
        let activeLoan = m.activeLoanBalance;
        let sCount = m.shareCount || 0;
        let sVal = m.shareValue || 0;

        if (tx.type === 'loan_installment') activeLoan += tx.amount;

        if (tx.type === 'share_purchase') {
          const shares = tx.shareCount ?? Math.max(1, Math.round(tx.amount / unitPrice));
          sCount = Math.max(0, sCount - shares);
          sVal = Math.max(0, sVal - tx.amount);
        }

        if (tx.type === 'share_surrender') {
          const shares = tx.shareCount ?? Math.max(1, Math.round(tx.amount / unitPrice));
          sCount = sCount + shares;
          sVal = sVal + tx.amount;
        }

        // Reconcile savings balances strictly from remaining transactions
        const remainingTxs = transactions.filter(t => t.id !== id && t.memberId === m.id && t.status === 'completed');
        const totalDep = remainingTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const totalWith = remainingTxs.filter(t => t.type === 'withdraw').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const totalProf = remainingTxs.filter(t => t.type === 'profit_share').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const totalDps = remainingTxs.filter(t => t.type === 'dps_deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const totalFdr = remainingTxs.filter(t => t.type === 'fdr_deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);

        let gen = m.generalSavingsBalance;
        if (remainingTxs.some(t => t.type === 'deposit' || t.type === 'withdraw' || t.type === 'profit_share') || tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'profit_share') {
          gen = Math.max(0, totalDep + totalProf - totalWith);
        }
        const dps = totalDps > 0 || tx.type === 'dps_deposit' ? Math.max(0, totalDps) : (m.dpsSavingsBalance || 0);
        const fdr = totalFdr > 0 || tx.type === 'fdr_deposit' ? Math.max(0, totalFdr) : (m.fdrSavingsBalance || 0);

        const updated: Member = {
          ...m,
          generalSavingsBalance: gen,
          dpsSavingsBalance: dps,
          fdrSavingsBalance: fdr,
          activeLoanBalance: activeLoan,
          shareCount: sCount,
          shareValue: sVal,
          totalSavings: gen + dps + fdr,
        };
        safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
        safeSetDoc(doc(db, 'memberFinancials', m.id), {
          generalSavingsBalance: gen,
          dpsSavingsBalance: dps,
          fdrSavingsBalance: fdr,
          totalSavings: gen + dps + fdr,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(console.error);
        return updated;
      }));
    }

    // 2. Revert Bank Account if applicable
    if (tx.paymentMethod === 'bank' && tx.bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== tx.bankAccountId) return b;
        let newBalance = b.balance;
        if (['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase', 'loan_installment', 'admission_fee', 'income'].includes(tx.type)) {
          newBalance = Math.max(0, b.balance - tx.amount);
        } else if (['withdraw', 'loan_disbursed', 'expense', 'share_surrender'].includes(tx.type)) {
          newBalance = b.balance + tx.amount;
        }
        const updated = { ...b, balance: newBalance };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }

    // 3. Remove transaction from list and Firestore
    setTransactions(prev => prev.filter(t => t.id !== id));
    deleteDoc(doc(db, 'transactions', id)).catch(console.error);

    // 4. If this was a profit_share transaction, update profitDistributions so it doesn't linger
    if (tx.type === 'profit_share') {
      setProfitDistributions(prev => {
        const updated = prev.map(d => {
          const matchingMember = d.memberDistributions?.find(m => m.transactionId === tx.id || (m.memberId === tx.memberId && m.allocatedProfit === tx.amount));
          if (!matchingMember) return d;
          const updatedMembers = (d.memberDistributions || []).map(m => {
            if (m.transactionId === tx.id || (m.memberId === tx.memberId && m.allocatedProfit === tx.amount)) {
              return { ...m, allocatedProfit: 0, creditedToSavings: false };
            }
            return m;
          });
          const newTotalPool = updatedMembers.reduce((sum, m) => sum + (m.allocatedProfit || 0), 0);
          const updatedDist: MonthlyProfitDistribution = {
            ...d,
            memberDistributions: updatedMembers,
            totalMembersDistributed: updatedMembers.filter(m => m.allocatedProfit > 0).length,
            totalSomitiProfitPool: newTotalPool,
          };
          if (newTotalPool <= 0) {
            deleteDoc(doc(db, 'profitDistributions', d.id)).catch(console.error);
          } else {
            safeSetDoc(doc(db, 'profitDistributions', d.id), updatedDist, { merge: true }).catch(console.error);
          }
          return updatedDist;
        }).filter(d => d.totalSomitiProfitPool > 0);

        localStorage.setItem('bondhu_profit_distributions', JSON.stringify(updated));
        return updated;
      });
    }

    if (activeReceipt?.id === id) {
      setActiveReceipt(null);
    }
  };

  // Add Loan (সরাসরি ঋণ বিতরণ)
  const addLoan = (params: {
    memberId: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    installmentFrequency: 'daily' | 'weekly' | 'monthly';
    purpose: string;
    guarantorMemberId?: string;
    guarantorName?: string;
    guarantorPhone?: string;
    guarantorRelation?: string;
    disbursementMethod: PaymentMethod;
    bankAccountId?: string;
    processingFee?: number;
  }): Loan => {
    // 1. Duplicate Loan Check
    const existingActive = loans.find(l => l.memberId === params.memberId && l.status === 'active' && (l.remainingAmount || 0) > 0);
    if (existingActive) {
      alert(`এই সদস্যের ইতিমধ্যে একটি চলমান সক্রিয় ঋণ (#${existingActive.loanNo}, বকেয়া: ৳${existingActive.remainingAmount}) রয়েছে। পূর্বের ঋণ সম্পূর্ণ পরিশোধ না হওয়া পর্যন্ত নতুন ঋণ বিতরণ করা যাবে না।`);
      throw new Error(`Member already has an active loan #${existingActive.loanNo}`);
    }
    const existingPending = loans.find(l => l.memberId === params.memberId && l.status === 'pending');
    if (existingPending) {
      alert(`এই সদস্যের একটি ঋণ আবেদন (#${existingPending.loanNo || existingPending.applicationNo}) ইতিমধ্যে অনুমোদনের অপেক্ষমাণ রয়েছে।`);
      throw new Error(`Member has a pending loan application`);
    }

    const member = members.find(m => m.id === params.memberId);
    const guarantorMember = params.guarantorMemberId ? members.find(m => m.id === params.guarantorMemberId) : null;

    const totalInterest = params.principalAmount * (params.interestRate / 100);
    const totalAmount = params.principalAmount + totalInterest;
    
    let totalInstallments = params.termMonths;
    if (params.installmentFrequency === 'weekly') totalInstallments = params.termMonths * 4;
    if (params.installmentFrequency === 'daily') totalInstallments = params.termMonths * 30;

    const installmentAmount = Math.ceil(totalAmount / totalInstallments);
    const principalPerInst = Math.round(params.principalAmount / totalInstallments);
    const interestPerInst = Math.round(totalInterest / totalInstallments);

    const schedule: LoanInstallmentSchedule[] = Array.from({ length: totalInstallments }, (_, i) => {
      const d = new Date();
      if (params.installmentFrequency === 'monthly') d.setMonth(d.getMonth() + i + 1);
      else if (params.installmentFrequency === 'weekly') d.setDate(d.getDate() + (i + 1) * 7);
      else d.setDate(d.getDate() + i + 1);

      return {
        installmentNo: i + 1,
        dueDate: d.toISOString().split('T')[0],
        amount: installmentAmount,
        principal: principalPerInst,
        interest: interestPerInst,
        status: 'unpaid',
      };
    });

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanNo: `LN-${new Date().getFullYear()}-${String(loans.length + 1).padStart(3, '0')}`,
      memberId: params.memberId,
      memberName: member?.name || '',
      memberPhone: member?.phone || '',
      principalAmount: params.principalAmount,
      interestRate: params.interestRate,
      totalAmount,
      termMonths: params.termMonths,
      installmentFrequency: params.installmentFrequency,
      totalInstallments,
      installmentAmount,
      disbursedDate: getTodayDateStr(),
      purpose: params.purpose,
      guarantorMemberId: params.guarantorMemberId,
      guarantorName: guarantorMember ? guarantorMember.name : params.guarantorName,
      guarantorPhone: guarantorMember ? guarantorMember.phone : params.guarantorPhone,
      guarantorRelation: params.guarantorRelation || 'সমিতি সদস্য',
      paidAmount: 0,
      remainingAmount: totalAmount,
      paidInstallmentsCount: 0,
      status: 'active',
      schedule,
    };

    setLoans(prev => [newLoan, ...prev]);
    safeSetDoc(doc(db, 'loans', newLoan.id), newLoan).catch(console.error);

    // Update member active loan
    setMembers(prev => prev.map(m => {
      if (m.id !== params.memberId) return m;
      const updated = { ...m, activeLoanBalance: m.activeLoanBalance + totalAmount };
      safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
      return updated;
    }));

    // Record disbursement transaction with unique serial
    let nextSerial = getNextLedgerSerial();
    const txDisburse: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: nextSerial++,
      voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      memberId: params.memberId,
      memberName: member?.name,
      memberNo: member?.memberNo,
      type: 'loan_disbursed',
      amount: params.principalAmount,
      date: getTodayDateStr(),
      time: getCurrentTimeStr(),
      paymentMethod: params.disbursementMethod,
      bankAccountId: params.bankAccountId,
      loanId: newLoan.id,
      collectedBy: currentUser.name,
      verifiedBy: currentUser.name,
      notes: `ঋণ বিতরণ: ${params.purpose} (${newLoan.loanNo})`,
      status: 'completed',
    };

    const txList = [txDisburse];
    safeSetDoc(doc(db, 'transactions', txDisburse.id), txDisburse).catch(console.error);

    if (params.processingFee && params.processingFee > 0) {
      const txFee: Transaction = {
        id: `tx-${Date.now() + 2}`,
        serialNo: nextSerial++,
        voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId: params.memberId,
        memberName: member?.name,
        memberNo: member?.memberNo,
        type: 'income',
        amount: params.processingFee,
        date: getTodayDateStr(),
        time: getCurrentTimeStr(),
        paymentMethod: 'cash',
        category: 'ঋণ প্রসেসিং ফি',
        collectedBy: currentUser.name,
        verifiedBy: currentUser.name,
        notes: `ঋণ ফরম ও প্রসেসিং ফি (${newLoan.loanNo})`,
        status: 'completed',
      };
      txList.push(txFee);
      safeSetDoc(doc(db, 'transactions', txFee.id), txFee).catch(console.error);
    }

    setTransactions(prev => [...txList, ...prev]);

    if (params.disbursementMethod === 'bank' && params.bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== params.bankAccountId) return b;
        const updated = { ...b, balance: Math.max(0, b.balance - params.principalAmount) };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }

    setActiveReceipt(txDisburse);
    return newLoan;
  };

  // Apply for Loan (সদস্যের ঋণ আবেদন — এডমিন অনুমোদনের জন্য অপেক্ষমাণ থাকবে)
  const applyForLoan = (params: {
    memberId: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    installmentFrequency: 'daily' | 'weekly' | 'monthly';
    purpose: string;
    guarantorMemberId?: string;
    guarantorName?: string;
    guarantorPhone?: string;
    guarantorRelation?: string;
    disbursementMethod?: PaymentMethod;
    bankAccountId?: string;
    processingFee?: number;
  }): { success: boolean; message: string; loan?: Loan } => {
    // 1. Duplicate Loan Check
    const existingActive = loans.find(l => l.memberId === params.memberId && l.status === 'active' && (l.remainingAmount || 0) > 0);
    if (existingActive) {
      return {
        success: false,
        message: `এই সদস্যের ইতিমধ্যে একটি চলমান সক্রিয় ঋণ (#${existingActive.loanNo}, বকেয়া: ৳${existingActive.remainingAmount}) রয়েছে। পূর্বের ঋণ সম্পূর্ণ পরিশোধ না হওয়া পর্যন্ত নতুন ঋণ আবেদন গ্রহণযোগ্য নয়।`,
      };
    }

    const existingPending = loans.find(l => l.memberId === params.memberId && l.status === 'pending');
    if (existingPending) {
      return {
        success: false,
        message: `এই সদস্যের একটি ঋণ আবেদন (#${existingPending.loanNo || existingPending.applicationNo}) ইতিমধ্যে অনুমোদনের অপেক্ষমাণ রয়েছে। পূর্বের আবেদনটি নিষ্পত্তি না হওয়া পর্যন্ত নতুন আবেদন করা যাবে না।`,
      };
    }

    const member = members.find(m => m.id === params.memberId);
    if (!member) {
      return { success: false, message: 'সদস্য খুঁজে পাওয়া যায়নি।' };
    }

    const totalInterest = Math.round((params.principalAmount * params.interestRate) / 100);
    const totalAmount = params.principalAmount + totalInterest;

    let totalInstallments = params.termMonths;
    if (params.installmentFrequency === 'daily') totalInstallments = params.termMonths * 30;
    if (params.installmentFrequency === 'weekly') totalInstallments = params.termMonths * 4;

    const installmentAmount = Math.ceil(totalAmount / totalInstallments);
    const principalPerInst = Math.round(params.principalAmount / totalInstallments);
    const interestPerInst = Math.round(totalInterest / totalInstallments);

    const guarantorMember = params.guarantorMemberId ? members.find(m => m.id === params.guarantorMemberId) : null;

    const schedule: LoanInstallmentSchedule[] = Array.from({ length: totalInstallments }, (_, i) => {
      const d = new Date();
      if (params.installmentFrequency === 'daily') d.setDate(d.getDate() + i + 1);
      else if (params.installmentFrequency === 'weekly') d.setDate(d.getDate() + (i + 1) * 7);
      else d.setMonth(d.getMonth() + i + 1);

      return {
        installmentNo: i + 1,
        dueDate: d.toISOString().split('T')[0],
        amount: installmentAmount,
        principal: principalPerInst,
        interest: interestPerInst,
        status: 'unpaid',
      };
    });

    const newLoanIndex = loans.length + 1;
    const loanNo = `LN-${new Date().getFullYear()}-${String(newLoanIndex).padStart(3, '0')}`;
    const applicationNo = `APP-LN-${new Date().getFullYear()}-${String(newLoanIndex).padStart(3, '0')}`;

    const newLoan: Loan = {
      id: `loan-${Date.now()}`,
      loanNo,
      applicationNo,
      memberId: params.memberId,
      memberName: member.name,
      memberPhone: member.phone,
      memberNo: member.memberNo,
      principalAmount: params.principalAmount,
      interestRate: params.interestRate,
      totalAmount,
      termMonths: params.termMonths,
      installmentFrequency: params.installmentFrequency,
      totalInstallments,
      installmentAmount,
      disbursedDate: '',
      appliedDate: getTodayDateStr(),
      purpose: params.purpose,
      guarantorMemberId: params.guarantorMemberId,
      guarantorName: guarantorMember ? guarantorMember.name : params.guarantorName,
      guarantorPhone: guarantorMember ? guarantorMember.phone : params.guarantorPhone,
      guarantorRelation: params.guarantorRelation || 'সমিতি সদস্য',
      paidAmount: 0,
      remainingAmount: totalAmount,
      paidInstallmentsCount: 0,
      status: 'pending',
      schedule,
      disbursementMethod: params.disbursementMethod || 'cash',
      bankAccountId: params.bankAccountId,
      processingFee: params.processingFee,
    };

    setLoans(prev => [newLoan, ...prev]);
    safeSetDoc(doc(db, 'loans', newLoan.id), newLoan).catch(console.error);

    return {
      success: true,
      message: `ঋণ আবেদন (#${applicationNo}) সফলভাবে দাখিল করা হয়েছে। এডমিন অনুমোদনের পর অর্থ বিতরণ করা হবে।`,
      loan: newLoan,
    };
  };

  // Approve Loan (এডমিন কর্তৃক ঋণ আবেদন অনুমোদন ও অর্থ বিতরণ)
  const approveLoan = (params: {
    loanId: string;
    disbursementMethod?: PaymentMethod;
    bankAccountId?: string;
    processingFee?: number;
    adminComment?: string;
  }): { success: boolean; message: string } => {
    const loan = loans.find(l => l.id === params.loanId);
    if (!loan) {
      return { success: false, message: 'ঋণ রেকর্ডটি খুঁজে পাওয়া যায়নি।' };
    }
    if (loan.status !== 'pending') {
      return { success: false, message: 'এই ঋণটি ইতিমধ্যে প্রক্রিয়াজাত করা হয়েছে।' };
    }

    // Safety check against duplicate active loan
    const existingActive = loans.find(l => l.memberId === loan.memberId && l.id !== loan.id && l.status === 'active' && (l.remainingAmount || 0) > 0);
    if (existingActive) {
      return {
        success: false,
        message: `অনুমোদন ব্যর্থ: সদস্যের পূর্বের ঋণ (#${existingActive.loanNo}) এখনও সক্রিয় রয়েছে।`,
      };
    }

    const member = members.find(m => m.id === loan.memberId);
    const method = params.disbursementMethod || loan.disbursementMethod || 'cash';
    const bankId = params.bankAccountId || loan.bankAccountId;
    const fee = params.processingFee !== undefined ? params.processingFee : (loan.processingFee || 0);

    const updatedLoan: Loan = {
      ...loan,
      status: 'active',
      disbursedDate: getTodayDateStr(),
      disbursementMethod: method,
      bankAccountId: bankId,
      approvedBy: currentUser?.name || 'অ্যাডমিন',
      approvedAt: new Date().toISOString(),
      adminComment: params.adminComment?.trim() || 'অনুমোদিত ও বিতরণ সম্পন্ন',
    };

    setLoans(prev => prev.map(l => l.id === loan.id ? updatedLoan : l));
    safeSetDoc(doc(db, 'loans', loan.id), updatedLoan).catch(console.error);

    // Update Member active loan balance
    if (loan.memberId) {
      setMembers(prev => prev.map(m => {
        if (m.id !== loan.memberId) return m;
        const updated = { ...m, activeLoanBalance: (m.activeLoanBalance || 0) + loan.totalAmount };
        safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
        return updated;
      }));
    }

    // Record disbursement transaction with unique serial
    let nextSerial = getNextLedgerSerial();
    const txDisburse: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: nextSerial++,
      voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      memberId: loan.memberId,
      memberName: loan.memberName,
      memberNo: member?.memberNo || loan.memberNo,
      type: 'loan_disbursed',
      amount: loan.principalAmount,
      date: getTodayDateStr(),
      time: getCurrentTimeStr(),
      paymentMethod: method,
      bankAccountId: bankId,
      loanId: loan.id,
      collectedBy: currentUser?.name || 'অ্যাডমিন',
      verifiedBy: currentUser?.name || 'অ্যাডমিন',
      notes: `ঋণ বিতরণ অনুমোদন: ${loan.purpose} (${loan.loanNo})`,
      status: 'completed',
    };

    const newTxs = [txDisburse];
    safeSetDoc(doc(db, 'transactions', txDisburse.id), txDisburse).catch(console.error);

    if (fee > 0) {
      const txFee: Transaction = {
        id: `tx-${Date.now() + 2}`,
        serialNo: nextSerial++,
        voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId: loan.memberId,
        memberName: loan.memberName,
        memberNo: member?.memberNo || loan.memberNo,
        type: 'income',
        amount: fee,
        date: getTodayDateStr(),
        time: getCurrentTimeStr(),
        paymentMethod: 'cash',
        category: 'ঋণ প্রসেসিং ফি',
        collectedBy: currentUser?.name || 'অ্যাডমিন',
        verifiedBy: currentUser?.name || 'অ্যাডমিন',
        notes: `ঋণ ফরম ও প্রসেসিং ফি (${loan.loanNo})`,
        status: 'completed',
      };
      newTxs.push(txFee);
      safeSetDoc(doc(db, 'transactions', txFee.id), txFee).catch(console.error);
    }

    setTransactions(prev => [...newTxs, ...prev]);

    // Deduct from bank if bank payment
    if (method === 'bank' && bankId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== bankId) return b;
        const updated = { ...b, balance: Math.max(0, b.balance - loan.principalAmount) };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }

    setActiveReceipt(txDisburse);
    return { success: true, message: `ঋণ #${loan.loanNo} সফলভাবে অনুমোদিত এবং বিতরণ করা হয়েছে।` };
  };

  // Reject Loan (এডমিন কর্তৃক ঋণ আবেদন বাতিলকরণ — কারণ বাধ্যতামূলক)
  const rejectLoan = (params: {
    loanId: string;
    reason: string;
  }): { success: boolean; message: string } => {
    if (!params.reason || !params.reason.trim()) {
      return {
        success: false,
        message: 'ঋণ আবেদন প্রত্যাখ্যান করার জন্য কারণ (Comment/Reason) উল্লেখ করা বাধ্যতামূলক।',
      };
    }

    const loan = loans.find(l => l.id === params.loanId);
    if (!loan) {
      return { success: false, message: 'ঋণ রেকর্ডটি খুঁজে পাওয়া যায়নি।' };
    }

    const updatedLoan: Loan = {
      ...loan,
      status: 'rejected',
      rejectedBy: currentUser?.name || 'অ্যাডমিন',
      rejectedAt: new Date().toISOString(),
      rejectionReason: params.reason.trim(),
      adminComment: params.reason.trim(),
    };

    setLoans(prev => prev.map(l => l.id === loan.id ? updatedLoan : l));
    safeSetDoc(doc(db, 'loans', loan.id), updatedLoan).catch(console.error);

    return {
      success: true,
      message: `ঋণ আবেদন #${loan.loanNo || loan.applicationNo} সফলভাবে প্রত্যাখ্যান করা হয়েছে। কারণ রেকর্ডভুক্ত হয়েছে।`,
    };
  };

  // Audit Logging helper
  const addAuditLog = (logData: Omit<AuditLog, 'id' | 'timestamp' | 'date' | 'time'>): AuditLog => {
    const newLog: AuditLog = {
      ...logData,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      date: getTodayDateStr(),
      time: getCurrentTimeStr(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    safeSetDoc(doc(db, 'audit_logs', newLog.id), newLog).catch(console.error);
    return newLog;
  };

  // Pay Loan Installment (Enhanced with flexible input, safe schedule fallback, and audit logging)
  const payLoanInstallment = (params: {
    loanId: string;
    installmentNo?: number;
    amount?: number;
    collectedAmount?: number;
    fine?: number;
    lateFee?: number;
    discount?: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Transaction & { success: boolean; message: string } => {
    const loan = loans.find(l => l.id === params.loanId);
    const member = members.find(m => m.id === loan?.memberId);
    const voucherNo = `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payAmount = Number(params.amount ?? params.collectedAmount ?? 0);
    const fineAmount = Number(params.fine ?? params.lateFee ?? 0);
    const discountAmount = Number(params.discount ?? 0);
    const totalCollected = Math.max(0, payAmount + fineAmount - discountAmount);

    const actualInstallmentNo = params.installmentNo || (loan ? (loan.paidInstallmentsCount || 0) + 1 : 1);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: getNextLedgerSerial(),
      voucherNo,
      memberId: loan?.memberId,
      memberName: loan?.memberName,
      memberNo: member?.memberNo,
      type: 'loan_installment',
      amount: totalCollected,
      date: getTodayDateStr(),
      time: getCurrentTimeStr(),
      paymentMethod: params.paymentMethod,
      loanId: params.loanId,
      installmentNo: actualInstallmentNo,
      fineAmount: fineAmount,
      discountAmount: discountAmount,
      collectedBy: currentUser?.name || 'অ্যাডমিন',
      verifiedBy: currentUser?.name || 'অ্যাডমিন',
      notes: params.notes || `ঋণ কিস্তি #${actualInstallmentNo} আদায় (${loan?.loanNo || ''})`,
      status: 'completed',
    };

    setTransactions(prev => [newTx, ...prev]);
    safeSetDoc(doc(db, 'transactions', newTx.id), newTx).catch(console.error);

    // Update Loan Schedule & Loan Record
    if (loan) {
      const scheduleList: LoanInstallmentSchedule[] = Array.isArray(loan.schedule) && loan.schedule.length > 0
        ? [...loan.schedule]
        : (Array.isArray((loan as any).installmentSchedule) && (loan as any).installmentSchedule.length > 0
            ? [...(loan as any).installmentSchedule]
            : []);

      let updatedSchedule: LoanInstallmentSchedule[];
      if (scheduleList.length > 0) {
        let matched = false;
        updatedSchedule = scheduleList.map(s => {
          if (s.installmentNo === actualInstallmentNo || (!matched && s.status !== 'paid' && !params.installmentNo)) {
            matched = true;
            return {
              ...s,
              status: 'paid' as const,
              paidDate: getTodayDateStr(),
              paidAmount: payAmount,
              fine: fineAmount,
              receiptNo: voucherNo,
            };
          }
          return s;
        });
      } else {
        updatedSchedule = [{
          installmentNo: actualInstallmentNo,
          dueDate: getTodayDateStr(),
          amount: payAmount,
          principal: payAmount,
          interest: 0,
          status: 'paid',
          paidDate: getTodayDateStr(),
          paidAmount: payAmount,
          fine: fineAmount,
          receiptNo: voucherNo,
        }];
      }

      const paidCount = updatedSchedule.filter(s => s.status === 'paid').length;
      const newPaidAmount = (Number(loan.paidAmount) || 0) + payAmount;
      const newRemaining = Math.max(0, (Number(loan.totalAmount) || 0) - newPaidAmount);
      const isCleared = newRemaining <= 0 || paidCount >= (loan.totalInstallments || 1);

      const updatedLoan: Loan = {
        ...loan,
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        paidInstallmentsCount: paidCount,
        status: isCleared ? 'cleared' : 'active',
        schedule: updatedSchedule,
        installmentSchedule: updatedSchedule,
      };

      setLoans(prev => prev.map(l => l.id === params.loanId ? updatedLoan : l));
      safeSetDoc(doc(db, 'loans', loan.id), updatedLoan).catch(console.error);

      // Recalculate member active loan balance from single source of truth (all active loans)
      if (loan.memberId) {
        setMembers(prev => prev.map(m => {
          if (m.id !== loan.memberId) return m;
          const remainingForMember = loans
            .map(l => l.id === params.loanId ? updatedLoan : l)
            .filter(l => l.memberId === loan.memberId && l.status === 'active')
            .reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);

          const updatedM = { ...m, activeLoanBalance: Math.max(0, remainingForMember) };
          safeSetDoc(doc(db, 'members', m.id), updatedM).catch(console.error);
          return updatedM;
        }));
      }

      // Add audit log
      addAuditLog({
        action: 'installment',
        entityType: 'loan',
        entityId: loan.id,
        entityTitle: `${loan.loanNo} (${loan.memberName})`,
        performedBy: currentUser?.name || 'অ্যাডমিন',
        userRole: currentUser?.role || 'admin',
        details: `কিস্তি #${actualInstallmentNo} আদায়: ৳${payAmount} (জরিমানা: ৳${fineAmount}, ছাড়: ৳${discountAmount}). অবশিষ্ট বকেয়া: ৳${newRemaining}`,
      });
    }

    setActiveReceipt(newTx);
    return Object.assign(newTx, { 
      success: true, 
      message: `ঋণ কিস্তি #${actualInstallmentNo} বাবদ ৳${totalCollected} সফলভাবে আদায় ও সংরক্ষণ সম্পন্ন হয়েছে!` 
    });
  };

  // Update Loan (Edit Loan with automatic recalculation across all stats, member balances, and audit logs)
  const updateLoan = (
    loanId: string,
    updatedFields: Partial<Loan>,
    auditReason?: string
  ): { success: boolean; message: string; loan?: Loan } => {
    const oldLoan = loans.find(l => l.id === loanId);
    if (!oldLoan) {
      return { success: false, message: 'ঋণ হিসাব খুঁজে পাওয়া যায়নি।' };
    }

    const principalAmount = Number(updatedFields.principalAmount ?? oldLoan.principalAmount) || 0;
    const interestRate = Number(updatedFields.interestRate ?? oldLoan.interestRate) || 0;
    const totalInterest = Number(updatedFields.interestAmount ?? (principalAmount * (interestRate / 100))) || 0;
    const totalAmount = Number(updatedFields.totalAmount ?? (principalAmount + totalInterest)) || 0;
    const termMonths = Number(updatedFields.termMonths ?? oldLoan.termMonths) || 1;
    const installmentFrequency = updatedFields.installmentFrequency ?? oldLoan.installmentFrequency ?? 'monthly';
    const totalInstallments = Number(updatedFields.totalInstallments ?? oldLoan.totalInstallments) || 1;

    // Calculate regular installment amount
    const installmentAmount = updatedFields.installmentAmount 
      ? Number(updatedFields.installmentAmount) 
      : Math.round(totalAmount / Math.max(1, totalInstallments));

    // Sum actual installment payments collected
    const existingTx = transactions.filter(t => t.loanId === loanId && t.type === 'loan_installment' && t.status === 'completed');
    const calculatedPaidAmount = existingTx.length > 0 
      ? existingTx.reduce((sum, t) => sum + (Number(t.amount) - (Number(t.fineAmount) || 0) + (Number(t.discountAmount) || 0)), 0)
      : Number(updatedFields.paidAmount ?? oldLoan.paidAmount ?? 0);
    
    const paidInstallmentsCount = existingTx.length > 0 
      ? existingTx.length 
      : Number(updatedFields.paidInstallmentsCount ?? oldLoan.paidInstallmentsCount ?? 0);

    const remainingAmount = Math.max(0, totalAmount - calculatedPaidAmount);
    const isCleared = remainingAmount <= 0;
    const status = updatedFields.status 
      ? updatedFields.status 
      : (isCleared ? 'cleared' : (oldLoan.status === 'pending' ? 'pending' : (oldLoan.status === 'rejected' ? 'rejected' : 'active')));

    // Rebuild schedule preserving paid history
    const oldSchedule = (Array.isArray(oldLoan.schedule) && oldLoan.schedule.length > 0) 
      ? oldLoan.schedule 
      : ((oldLoan as any).installmentSchedule || []);

    const newSchedule: LoanInstallmentSchedule[] = [];
    const remainingSlots = Math.max(1, totalInstallments - paidInstallmentsCount);
    const perSlotAmount = Math.round(remainingAmount / remainingSlots);

    for (let i = 1; i <= totalInstallments; i++) {
      const existingSlot = oldSchedule.find((s: any) => s.installmentNo === i);
      if (existingSlot && existingSlot.status === 'paid') {
        newSchedule.push(existingSlot);
      } else {
        const principalPart = Math.round(principalAmount / Math.max(1, totalInstallments));
        const interestPart = Math.round(totalInterest / Math.max(1, totalInstallments));
        newSchedule.push({
          installmentNo: i,
          dueDate: existingSlot?.dueDate || getTodayDateStr(),
          amount: perSlotAmount,
          principal: principalPart,
          interest: interestPart,
          status: 'unpaid',
        });
      }
    }

    const updatedLoan: Loan = {
      ...oldLoan,
      ...updatedFields,
      principalAmount,
      interestRate,
      interestAmount: totalInterest,
      totalAmount,
      termMonths,
      installmentFrequency,
      totalInstallments,
      installmentAmount,
      paidAmount: calculatedPaidAmount,
      remainingAmount,
      paidInstallmentsCount,
      status,
      schedule: newSchedule,
      installmentSchedule: newSchedule,
    };

    const newLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
    setLoans(newLoans);
    safeSetDoc(doc(db, 'loans', loanId), updatedLoan).catch(console.error);

    // Update disbursement transaction if principal amount changed
    if (principalAmount !== oldLoan.principalAmount) {
      setTransactions(prev => {
        const updatedTxs = prev.map(t => {
          if (t.loanId === loanId && t.type === 'loan_disbursed') {
            const updatedT = { ...t, amount: principalAmount };
            safeSetDoc(doc(db, 'transactions', t.id), updatedT).catch(console.error);
            return updatedT;
          }
          return t;
        });
        return updatedTxs;
      });
    }

    // Recalculate Member activeLoanBalance accurately
    const memberId = oldLoan.memberId;
    if (memberId) {
      const memberActiveLoanBal = newLoans
        .filter(l => l.memberId === memberId && l.status === 'active')
        .reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);

      setMembers(prev => prev.map(m => {
        if (m.id !== memberId) return m;
        const updatedM = { ...m, activeLoanBalance: memberActiveLoanBal };
        safeSetDoc(doc(db, 'members', m.id), updatedM).catch(console.error);
        return updatedM;
      }));
    }

    // Record Audit Log
    addAuditLog({
      action: 'update',
      entityType: 'loan',
      entityId: loanId,
      entityTitle: `${oldLoan.loanNo} (${oldLoan.memberName})`,
      performedBy: currentUser?.name || 'অ্যাডমিন',
      userRole: currentUser?.role || 'admin',
      details: auditReason ? `ঋণ হিসাব তথ্য সংশোধন: ${auditReason}` : `ঋণ #${oldLoan.loanNo} হিসাব সংশোধন করা হয়েছে।`,
      changes: {
        principalAmount: { old: oldLoan.principalAmount, new: principalAmount },
        totalAmount: { old: oldLoan.totalAmount, new: totalAmount },
        remainingAmount: { old: oldLoan.remainingAmount, new: remainingAmount },
        status: { old: oldLoan.status, new: status },
      },
    });

    return {
      success: true,
      message: `ঋণ হিসাব #${oldLoan.loanNo} সফলভাবে আপডেট ও রিক্যালকুলেট করা হয়েছে।`,
      loan: updatedLoan,
    };
  };

  // Delete Loan (Safe Reversal or Permanent Deletion with automatic balance & ledger reconciliation)
  const deleteLoan = (
    loanId: string,
    options: { mode: 'safe_reversal' | 'permanent_delete'; reason: string }
  ): { success: boolean; message: string } => {
    const isAuthorized = 
      currentUser?.role === 'admin' || 
      currentUser?.role === 'president' || 
      currentUser?.role === 'secretary';

    if (!isAuthorized) {
      return {
        success: false,
        message: 'অনুমতি নেই: শুধুমাত্র অনুমোদিত অ্যাডমিন বা কর্মকর্তা ঋণ হিসাব ডিলিট বা রিভার্স করতে পারবেন।',
      };
    }

    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      return { success: false, message: 'ঋণ হিসাবটি পাওয়া যায়নি।' };
    }

    const memberId = loan.memberId;
    const reason = options.reason?.trim() || 'কোনো কারণ উল্লেখ করা হয়নি';

    if (options.mode === 'safe_reversal') {
      const reversedLoan: Loan = {
        ...loan,
        status: 'rejected',
        isReversed: true,
        reversalReason: reason,
        reversedAt: new Date().toISOString(),
        reversedBy: currentUser?.name || 'অ্যাডমিন',
        remainingAmount: 0,
        adminComment: `[রিভার্সড/বাতিল]: ${reason}`,
      };

      const newLoans = loans.map(l => l.id === loanId ? reversedLoan : l);
      setLoans(newLoans);
      safeSetDoc(doc(db, 'loans', loanId), reversedLoan).catch(console.error);

      // Mark related transactions cancelled
      setTransactions(prev => prev.map(t => {
        if (t.loanId === loanId) {
          const updatedT: Transaction = {
            ...t,
            status: 'cancelled',
            notes: `[রিভার্সড]: ${t.notes || ''} (${reason})`,
          };
          safeSetDoc(doc(db, 'transactions', t.id), updatedT).catch(console.error);
          return updatedT;
        }
        return t;
      }));

      // Recalculate member activeLoanBalance
      if (memberId) {
        const newBal = newLoans
          .filter(l => l.memberId === memberId && l.status === 'active')
          .reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);

        setMembers(prev => prev.map(m => {
          if (m.id !== memberId) return m;
          const updatedM = { ...m, activeLoanBalance: newBal };
          safeSetDoc(doc(db, 'members', m.id), updatedM).catch(console.error);
          return updatedM;
        }));
      }

      addAuditLog({
        action: 'reversal',
        entityType: 'loan',
        entityId: loanId,
        entityTitle: `${loan.loanNo} (${loan.memberName})`,
        performedBy: currentUser?.name || 'অ্যাডমিন',
        userRole: currentUser?.role || 'admin',
        details: `নিরাপদ রিভার্সাল সম্পন্ন: ${reason}. মূল ঋণ ছিল: ৳${loan.principalAmount}`,
      });

      return {
        success: true,
        message: `ঋণ #${loan.loanNo} নিরাপদভাবে রিভার্স ও ব্যালেন্স সমন্বয় করা হয়েছে।`,
      };
    } else {
      // Permanent Delete
      const newLoans = loans.filter(l => l.id !== loanId);
      setLoans(newLoans);
      deleteDoc(doc(db, 'loans', loanId)).catch(console.error);

      // Clean up transactions
      const relatedTxs = transactions.filter(t => t.loanId === loanId);
      relatedTxs.forEach(t => {
        deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
      });
      setTransactions(prev => prev.filter(t => t.loanId !== loanId));

      // Recalculate member activeLoanBalance
      if (memberId) {
        const newBal = newLoans
          .filter(l => l.memberId === memberId && l.status === 'active')
          .reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);

        setMembers(prev => prev.map(m => {
          if (m.id !== memberId) return m;
          const updatedM = { ...m, activeLoanBalance: newBal };
          safeSetDoc(doc(db, 'members', m.id), updatedM).catch(console.error);
          return updatedM;
        }));
      }

      addAuditLog({
        action: 'delete',
        entityType: 'loan',
        entityId: loanId,
        entityTitle: `${loan.loanNo} (${loan.memberName})`,
        performedBy: currentUser?.name || 'অ্যাডমিন',
        userRole: currentUser?.role || 'admin',
        details: `স্থায়ীভাবে ঋণ হিসাব ও সম্পর্কিত লেজার অপসারিত: ${reason}. মূল ঋণ: ৳${loan.principalAmount}`,
      });

      return {
        success: true,
        message: `ঋণ #${loan.loanNo} এবং সম্পর্কিত সকল হিসাব স্থায়ীভাবে অপসারিত হয়েছে।`,
      };
    }
  };

  // Add Savings Scheme
  const addSavingsScheme = (params: {
    memberId: string;
    type: 'dps' | 'fdr';
    schemeName: string;
    monthlyAmount?: number;
    principalAmount: number;
    interestRate: number;
    durationMonths: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
  }): SavingsScheme => {
    const member = members.find(m => m.id === params.memberId);
    const prefix = params.type === 'dps' ? 'DPS' : 'FDR';
    const accNo = `${prefix}-${member?.memberNo || '100'}-${String(savingsSchemes.length + 1).padStart(2, '0')}`;

    const d = new Date();
    const startDate = d.toISOString().split('T')[0];
    d.setMonth(d.getMonth() + params.durationMonths);
    const maturityDate = d.toISOString().split('T')[0];

    const newScheme: SavingsScheme = {
      id: `${params.type}-${Date.now()}`,
      memberId: params.memberId,
      type: params.type,
      schemeName: params.schemeName,
      accountNo: accNo,
      monthlyAmount: params.monthlyAmount,
      principalAmount: params.principalAmount,
      interestRate: params.interestRate,
      durationMonths: params.durationMonths,
      startDate,
      maturityDate,
      totalDeposited: params.principalAmount,
      profitAccrued: 0,
      status: 'running',
    };

    setSavingsSchemes(prev => [newScheme, ...prev]);
    safeSetDoc(doc(db, 'savings', newScheme.id), newScheme).catch(console.error);

    // Initial deposit transaction
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: getNextLedgerSerial(),
      voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      memberId: params.memberId,
      memberName: member?.name,
      memberNo: member?.memberNo,
      type: params.type === 'dps' ? 'dps_deposit' : 'fdr_deposit',
      amount: params.principalAmount,
      date: startDate,
      time: getCurrentTimeStr(),
      paymentMethod: params.paymentMethod,
      bankAccountId: params.bankAccountId,
      savingsSchemeId: newScheme.id,
      collectedBy: currentUser.name,
      verifiedBy: currentUser.name,
      notes: `নতুন ${params.type === 'dps' ? 'ডিপিএস' : 'স্থায়ী আমানত'} খোলা বাবদ জমা (${accNo})`,
      status: 'completed',
    };

    setTransactions(prev => [tx, ...prev]);
    safeSetDoc(doc(db, 'transactions', tx.id), tx).catch(console.error);

    // Update member's balance
    setMembers(prev => prev.map(m => {
      if (m.id !== params.memberId) return m;
      const dps = params.type === 'dps' ? m.dpsSavingsBalance + params.principalAmount : m.dpsSavingsBalance;
      const fdr = params.type === 'fdr' ? m.fdrSavingsBalance + params.principalAmount : m.fdrSavingsBalance;
      const updated = {
        ...m,
        dpsSavingsBalance: dps,
        fdrSavingsBalance: fdr,
        totalSavings: m.generalSavingsBalance + dps + fdr,
      };
      safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
      return updated;
    }));

    setActiveReceipt(tx);
    return newScheme;
  };

  // Add Voucher
  const addVoucher = (voucherData: Omit<IncomeExpenseItem, 'id' | 'voucherNo'>): IncomeExpenseItem => {
    const prefix = voucherData.type === 'income' ? 'INC' : 'EXP';
    const voucherNo = `${prefix}-${new Date().getFullYear()}-${String(vouchers.length + 1).padStart(3, '0')}`;
    const newVoucher: IncomeExpenseItem = {
      ...voucherData,
      id: `vch-${Date.now()}`,
      voucherNo,
    };

    setVouchers(prev => [newVoucher, ...prev]);
    safeSetDoc(doc(db, 'incomeExpenses', newVoucher.id), newVoucher).catch(console.error);

    // Record in transactions list
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: getNextLedgerSerial(),
      voucherNo,
      type: voucherData.type === 'income' ? 'income' : 'expense',
      amount: voucherData.amount,
      date: voucherData.date,
      time: getCurrentTimeStr(),
      paymentMethod: voucherData.paymentMethod,
      bankAccountId: voucherData.bankAccountId,
      category: voucherData.category,
      collectedBy: voucherData.handledBy,
      verifiedBy: currentUser.name,
      notes: voucherData.title + (voucherData.notes ? ` - ${voucherData.notes}` : ''),
      status: 'completed',
    };
    setTransactions(prev => [tx, ...prev]);
    safeSetDoc(doc(db, 'transactions', tx.id), tx).catch(console.error);

    // If through bank, update balance
    if (voucherData.paymentMethod === 'bank' && voucherData.bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== voucherData.bankAccountId) return b;
        const updated = {
          ...b,
          balance: voucherData.type === 'income' ? b.balance + voucherData.amount : Math.max(0, b.balance - voucherData.amount),
        };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }

    return newVoucher;
  };

  const deleteVoucher = (id: string) => {
    setVouchers(prev => prev.filter(v => v.id !== id));
    deleteDoc(doc(db, 'incomeExpenses', id)).catch(console.error);
  };

  // Fund Transfer
  const transferFunds = (params: {
    fromType: 'vault' | 'bank';
    toType: 'vault' | 'bank';
    fromBankId?: string;
    toBankId?: string;
    amount: number;
    notes?: string;
  }) => {
    if (params.fromType === 'bank' && params.fromBankId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== params.fromBankId) return b;
        const updated = { ...b, balance: Math.max(0, b.balance - params.amount) };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }
    if (params.toType === 'bank' && params.toBankId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id !== params.toBankId) return b;
        const updated = { ...b, balance: b.balance + params.amount };
        safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
        return updated;
      }));
    }

    const desc = `${params.fromType === 'vault' ? 'নগদ ক্যাশ ভল্ট' : 'ব্যাংক'} থেকে ${params.toType === 'vault' ? 'ক্যাশ ভল্ট' : 'ব্যাংক'}-এ স্থানান্তর`;
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      serialNo: getNextLedgerSerial(),
      voucherNo: `TRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'income',
      amount: params.amount,
      date: getTodayDateStr(),
      time: getCurrentTimeStr(),
      paymentMethod: params.fromType === 'bank' || params.toType === 'bank' ? 'bank' : 'cash',
      category: 'ফান্ড স্থানান্তর',
      collectedBy: currentUser.name,
      notes: `${desc}. ${params.notes || ''}`,
      status: 'completed',
    };
    setTransactions(prev => [tx, ...prev]);
    safeSetDoc(doc(db, 'transactions', tx.id), tx).catch(console.error);
  };

  const updateBankAccountBalance = (bankId: string, newBalance: number) => {
    setBankAccounts(prev => prev.map(b => {
      if (b.id !== bankId) return b;
      const updated = { ...b, balance: newBalance, updatedAt: getTodayDateStr() };
      safeSetDoc(doc(db, 'bankAccounts', b.id), updated).catch(console.error);
      return updated;
    }));
  };

  const openReceiptForTx = (tx: Transaction) => {
    setActiveReceipt(tx);
  };

  // 1. Total Business Funding Given (Money disbursed to members for business)
  const totalBusinessFundingGiven = businessFundings
    .filter(f => f.status === 'active' || f.status === 'completed' || !!f.disbursementDate)
    .reduce((sum, f) => sum + (Number(f.approvedAmount || f.amountRequested) || 0), 0);
  const totalBusinessCapital = totalBusinessFundingGiven;
  const totalCapital = totalBusinessCapital;

  // 2. Deposit Inflow (General Deposit + FDR + Share Purchases)
  const totalDepositInflow = transactions
    .filter(t => t.status === 'completed' && (t.type === 'deposit' || t.type === 'fdr_deposit' || t.type === 'share_purchase'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 3. DPS Deposits Inflow
  const totalDPSInflow = transactions
    .filter(t => t.status === 'completed' && t.type === 'dps_deposit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 4. Profit & Incomes
  // - Somiti profit earned from business fundings
  const totalSomitiBusinessProfit = businessProfitRecords
    .reduce((sum, r) => sum + (Number(r.somitiProfitAmount) || 0), 0);
  // - Income from transactions (office income, admission fee, fine, loan installment collections/profit)
  const totalTransactionIncome = transactions
    .filter(t => t.status === 'completed' && (t.type === 'income' || t.type === 'admission_fee' || t.type === 'fine' || t.type === 'loan_installment'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  // - Income vouchers not already in transactions
  const totalVoucherIncome = vouchers
    .filter(v => v.type === 'income' && !transactions.some(t => t.voucherNo === v.voucherNo) && v.category !== 'ব্যবসায়িক লভ্যাংশ আয়')
    .reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const totalProfitInflow = totalSomitiBusinessProfit + totalTransactionIncome + totalVoucherIncome;

  // 5. Expenses Outflow
  const totalExpenseTx = transactions
    .filter(t => t.status === 'completed' && t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalVoucherExpense = vouchers
    .filter(v => v.type === 'expense' && v.category !== 'ব্যবসা বিনিয়োগ বিতরণ' && !transactions.some(t => t.voucherNo === v.voucherNo))
    .reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
  const totalExpenses = totalExpenseTx + totalVoucherExpense;

  // 6. Withdrawals Outflow (Withdrawals + share surrender)
  const totalWithdrawals = transactions
    .filter(t => t.status === 'completed' && (t.type === 'withdraw' || t.type === 'share_surrender'))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 7. Loans Disbursed Outflow
  const totalLoansDisbursed = transactions
    .filter(t => t.status === 'completed' && t.type === 'loan_disbursed')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Formula requested by user:
  // Available Balance = profit + Deposit + DPS - Expense - withdrwal - loan - Business Funding
  const totalAvailableBalance = Math.max(
    0,
    (totalProfitInflow + totalDepositInflow + totalDPSInflow) -
    (totalExpenses + totalWithdrawals + totalLoansDisbursed + totalBusinessFundingGiven)
  );

  const totalBankCash = bankAccounts.reduce((sum, b) => sum + (Number(b.balance) || 0), 0);
  const totalVaultCash = Math.max(0, totalAvailableBalance - totalBankCash);

  // Total Member Savings (General Savings + DPS + FDR)
  const totalSavingsInSomiti = members.reduce((sum, m) => sum + (Number(m.totalSavings) || 0), 0);
  const totalActiveLoanBalance = loans.filter(l => l.status === 'active').reduce((sum, l) => sum + (Number(l.remainingAmount) || 0), 0);

  // Today stats
  const todayStr = getTodayDateStr();
  let todayCollection = 0;
  let todayDisbursement = 0;
  let todayExpense = 0;
  let todayProfit = 0;
  let todayFine = 0;

  transactions.forEach(t => {
    if (t.date === todayStr && t.status === 'completed') {
      if (['deposit', 'dps_deposit', 'fdr_deposit', 'loan_installment', 'admission_fee', 'income'].includes(t.type)) {
        todayCollection += Number(t.amount) || 0;
      }
      if (t.type === 'loan_disbursed' || t.type === 'withdraw' || t.type === 'share_surrender') {
        todayDisbursement += Number(t.amount) || 0;
      }
      if (t.type === 'expense') {
        todayExpense += Number(t.amount) || 0;
      }
      if (t.fineAmount) {
        todayFine += Number(t.fineAmount) || 0;
      }
      if (t.type === 'loan_installment') {
        todayProfit += Math.round((Number(t.amount) || 0) * 0.1);
      }
      if (t.type === 'income' || t.type === 'admission_fee') {
        todayProfit += Number(t.amount) || 0;
      }
      if (t.fineAmount) {
        todayProfit += Number(t.fineAmount) || 0;
      }
    }
  });

  // Include today's business funding disbursements in todayDisbursement
  businessFundings.forEach(f => {
    if (f.disbursementDate === todayStr && (f.status === 'active' || f.status === 'completed')) {
      todayDisbursement += Number(f.approvedAmount || f.amountRequested) || 0;
    }
  });

  // Include today's business profit in todayProfit
  businessProfitRecords.forEach(r => {
    if (r.date === todayStr) {
      todayProfit += Number(r.somitiProfitAmount) || 0;
    }
  });

  const todayStats = {
    collection: todayCollection,
    disbursement: todayDisbursement,
    expense: todayExpense,
    profit: todayProfit,
    fine: todayFine,
    netCash: todayCollection - todayDisbursement - todayExpense,
  };

  // User & Staff Management
  const addUser = (userData: Omit<AppUser, 'id'>): AppUser => {
    const newUser: AppUser = {
      ...userData,
      id: `usr-${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
    safeSetDoc(doc(db, 'systemUsers', newUser.id), newUser).catch(console.error);
    return newUser;
  };

  const updateUser = (id: string, userData: Partial<AppUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...userData } : u));
    safeSetDoc(doc(db, 'systemUsers', id), userData, { merge: true }).catch(console.error);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteDoc(doc(db, 'systemUsers', id)).catch(console.error);
  };

  const toggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;
      const newStatus = u.status === 'active' ? 'inactive' : 'active';
      const updated = { ...u, status: newStatus as 'active' | 'inactive' };
      safeSetDoc(doc(db, 'systemUsers', id), { status: newStatus }, { merge: true }).catch(console.error);
      return updated;
    }));
  };

  // Reset & Backup
  const clearAllData = async () => {
    isInitialLoadDone.current = true;
    setMembers([]);
    setLoans([]);
    setSavingsSchemes([]);
    setShareClosures([]);
    setTransactions([]);
    setVouchers([]);
    setBusinessFundings([]);
    setBusinessProfitRecords([]);
    setProfitDistributions([]);
    
    // Preserve existing admin/staff users so user doesn't get locked out
    const preservedUsers = users.length > 0 ? users : initialUsers;
    setUsers(preservedUsers);
    
    const cleanBank: BankAccount[] = [
      {
        id: 'bank-1',
        bankName: 'সোনালী ব্যাংক পিএলসি',
        branchName: 'প্রধান শাখা',
        accountName: settings.somitiName || 'সমিতি অ্যাকাউন্ট',
        accountNumber: '০২০০০০১০০৯৮৭২',
        accountType: 'current',
        balance: 0,
        updatedAt: getTodayDateStr(),
      }
    ];
    setBankAccounts(cleanBank);

    // Clear localStorage
    const storageKeys = [
      'bondhu_members', 'bondhu_loans', 'bondhu_savings', 'bondhu_share_closures', 'bondhu_transactions',
      'bondhu_vouchers', 'bondhu_somiti_members',
      'bondhu_somiti_loans', 'bondhu_somiti_savings', 'bondhu_somiti_transactions',
      'bondhu_somiti_income_expense',
      'bondhu_business_fundings', 'bondhu_business_profit_records', 'bondhu_profit_distributions'
    ];
    storageKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });
    try {
      localStorage.setItem('bondhu_members', JSON.stringify([]));
      localStorage.setItem('bondhu_loans', JSON.stringify([]));
      localStorage.setItem('bondhu_savings', JSON.stringify([]));
      localStorage.setItem('bondhu_share_closures', JSON.stringify([]));
      localStorage.setItem('bondhu_transactions', JSON.stringify([]));
      localStorage.setItem('bondhu_vouchers', JSON.stringify([]));
      localStorage.setItem('bondhu_business_fundings', JSON.stringify([]));
      localStorage.setItem('bondhu_business_profit_records', JSON.stringify([]));
      localStorage.setItem('bondhu_profit_distributions', JSON.stringify([]));
      localStorage.setItem('bondhu_bank_accounts', JSON.stringify(cleanBank));
      localStorage.setItem('bondhu_users', JSON.stringify(preservedUsers));
    } catch (_) {}

    // Clear Firestore documents if connected
    try {
      const collectionsToClear = [
        'members', 
        'loans', 
        'savings', 
        'shareClosures', 
        'transactions', 
        'incomeExpenses', 
        'vouchers', 
        'businessFundings', 
        'businessProfitRecords', 
        'profitDistributions'
      ];
      for (const col of collectionsToClear) {
        const snap = await getDocs(collection(db, col));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      }
      const bankSnap = await getDocs(collection(db, 'bankAccounts'));
      const bankBatch = writeBatch(db);
      bankSnap.forEach(d => bankBatch.delete(d.ref));
      safeBatchSet(bankBatch, doc(db, 'bankAccounts', 'bank-1'), cleanBank[0]);
      await bankBatch.commit();

      // Ensure preserved users exist in systemUsers
      for (const u of preservedUsers) {
        await safeSetDoc(doc(db, 'systemUsers', u.id), u);
      }
    } catch (e) {
      console.warn('Firestore clearing error:', e);
    }
  };

  const resetToDemoData = () => {
    setMembers(sampleDemoMembers);
    setLoans(sampleDemoLoans);
    setSavingsSchemes(sampleDemoSavingsSchemes);
    setShareClosures([]);
    setTransactions(sampleDemoTransactions);
    setVouchers(sampleDemoVouchers);
    setBankAccounts(sampleDemoBankAccounts);
    setUsers(sampleDemoUsers);
    setSettings(initialSettings);
    try {
      localStorage.clear();
    } catch (_) {}
    syncAllToFirestore();
  };

  const exportDatabaseJson = () => {
    const data = {
      settings,
      members,
      loans,
      savingsSchemes,
      shareClosures,
      transactions,
      vouchers,
      bankAccounts,
      users,
      businessFundings,
      businessProfitRecords,
      profitDistributions,
      exportedAt: new Date().toISOString(),
      version: '1.2.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bondhu_somiti_backup_${getTodayDateStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.members) setMembers(data.members);
      if (data.loans) setLoans(data.loans);
      if (data.savingsSchemes) setSavingsSchemes(data.savingsSchemes);
      if (data.shareClosures) setShareClosures(data.shareClosures);
      if (data.transactions) setTransactions(data.transactions);
      if (data.vouchers) setVouchers(data.vouchers);
      if (data.bankAccounts) setBankAccounts(data.bankAccounts);
      if (data.users) setUsers(data.users);
      if (data.businessFundings) setBusinessFundings(data.businessFundings);
      if (data.businessProfitRecords) setBusinessProfitRecords(data.businessProfitRecords);
      if (data.profitDistributions) setProfitDistributions(data.profitDistributions);
      if (data.settings) setSettings(data.settings);
      syncAllToFirestore();
      return true;
    } catch {
      return false;
    }
  };

  // Profit Distribution directly credited to member savings balances
  const distributeProfitToSavings = (params: {
    profitAmount: number;
    criteria: 'total_deposit' | 'share_capital';
    targetMonth?: string;
    notes?: string;
  }): { success: boolean; count: number; totalDistributed: number } => {
    if (params.profitAmount <= 0 || members.length === 0) {
      return { success: false, count: 0, totalDistributed: 0 };
    }

    const totalDepositBase = members.reduce((sum, m) => {
      if (params.criteria === 'share_capital') {
        return sum + ((m.shareCount || 0) * (settings.sharePricePerUnit || 1000));
      }
      return sum + (m.generalSavingsBalance + m.dpsSavingsBalance + m.fdrSavingsBalance);
    }, 0);

    if (totalDepositBase <= 0) {
      return { success: false, count: 0, totalDistributed: 0 };
    }

    const newTransactions: Transaction[] = [];
    const profitMap: Record<string, number> = {};
    let totalCredited = 0;
    let profitSerial = getNextLedgerSerial();

    members.forEach((m, idx) => {
      const memberBalance = params.criteria === 'share_capital'
        ? (m.shareCount || 0) * (settings.sharePricePerUnit || 1000)
        : (m.generalSavingsBalance + m.dpsSavingsBalance + m.fdrSavingsBalance);

      if (memberBalance <= 0) return;

      const shareRatio = memberBalance / totalDepositBase;
      const profitShare = Math.round(params.profitAmount * shareRatio);

      if (profitShare > 0) {
        profitMap[m.id] = profitShare;
        totalCredited += profitShare;

        const tx: Transaction = {
          id: `tx-${Date.now()}-${idx}`,
          serialNo: profitSerial++,
          voucherNo: `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          memberId: m.id,
          memberName: m.name,
          memberNo: m.memberNo,
          type: 'profit_share',
          amount: profitShare,
          date: getTodayDateStr(),
          time: getCurrentTimeStr(),
          paymentMethod: 'cash',
          collectedBy: currentUser.name,
          verifiedBy: currentUser.name,
          notes: params.notes || `মাসিক লভ্যাংশ বণ্টন (মোট ৳${params.profitAmount} হতে আনুপাতিক জমা)`,
          status: 'completed',
        };
        newTransactions.push(tx);
      }
    });

    if (newTransactions.length === 0) {
      return { success: false, count: 0, totalDistributed: 0 };
    }

    // 1. Update member balances
    setMembers(prev => prev.map(m => {
      const addedProfit = profitMap[m.id];
      if (!addedProfit) return m;

      const newGen = m.generalSavingsBalance + addedProfit;
      const updated = {
        ...m,
        generalSavingsBalance: newGen,
        totalSavings: newGen + m.dpsSavingsBalance + m.fdrSavingsBalance,
      };
      safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
      return updated;
    }));

    // 2. Add transactions to log & Firestore
    setTransactions(prev => [...newTransactions, ...prev]);
    const batch = writeBatch(db);
    newTransactions.forEach(t => safeBatchSet(batch, doc(db, 'transactions', t.id), t));
    batch.commit().catch(console.error);

    return {
      success: true,
      count: newTransactions.length,
      totalDistributed: totalCredited,
    };
  };

  // ==========================================
  // Business Funding Management
  // ==========================================
  const addBusinessFunding = async (
    fundingData: Omit<BusinessFunding, 'id' | 'applicationNo' | 'status' | 'totalProfitRecorded' | 'totalMemberProfitPaid' | 'totalSomitiProfitEarned' | 'createdAt'>
  ): Promise<BusinessFunding> => {
    const appNo = `BF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newFunding: BusinessFunding = {
      ...fundingData,
      id: `bf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      applicationNo: appNo,
      status: 'pending',
      approvedAmount: fundingData.approvedAmount || fundingData.amountRequested,
      totalProfitRecorded: 0,
      totalMemberProfitPaid: 0,
      totalSomitiProfitEarned: 0,
      createdAt: new Date().toISOString(),
    };

    setBusinessFundings(prev => [newFunding, ...prev]);
    await safeSetDoc(doc(db, 'businessFundings', newFunding.id), newFunding);
    return newFunding;
  };

  const updateBusinessFundingStatus = async (
    id: string,
    status: BusinessFundingStatus,
    approvedAmount?: number,
    notes?: string,
    rejectionReason?: string
  ): Promise<void> => {
    const updateData: Partial<BusinessFunding> = {
      status,
      ...(approvedAmount !== undefined ? { approvedAmount } : {}),
      ...(notes ? { notes } : {}),
      ...(status === 'approved' ? { 
        approvedBy: currentUser?.name || 'অ্যাডমিন',
        approvedAt: new Date().toISOString(),
      } : {}),
      ...(status === 'rejected' ? {
        rejectedBy: currentUser?.name || 'অ্যাডমিন',
        rejectedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || notes || '',
        adminComment: rejectionReason || notes || '',
      } : {}),
    };

    setBusinessFundings(prev => prev.map(f => f.id === id ? { ...f, ...updateData } : f));
    await safeSetDoc(doc(db, 'businessFundings', id), updateData, { merge: true });
  };

  const approveBusinessFunding = async (params: {
    fundingId: string;
    approvedAmount?: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const funding = businessFundings.find(f => f.id === params.fundingId);
    if (!funding) {
      return { success: false, message: 'ব্যবসা ফান্ডিং রেকর্ডটি খুঁজে পাওয়া যায়নি।' };
    }
    const finalAmount = params.approvedAmount !== undefined ? params.approvedAmount : funding.amountRequested;
    await updateBusinessFundingStatus(params.fundingId, 'approved', finalAmount, params.notes);
    return {
      success: true,
      message: `ব্যবসা ফান্ডিং আবেদন #${funding.applicationNo} সফলভাবে অনুমোদিত হয়েছে।`,
    };
  };

  const rejectBusinessFunding = async (params: {
    fundingId: string;
    reason: string;
  }): Promise<{ success: boolean; message: string }> => {
    if (!params.reason || !params.reason.trim()) {
      return {
        success: false,
        message: 'ব্যবসা ফান্ডিং আবেদন প্রত্যাখ্যান করতে কারণ (Comment/Reason) উল্লেখ করা বাধ্যতামূলক।',
      };
    }
    const funding = businessFundings.find(f => f.id === params.fundingId);
    if (!funding) {
      return { success: false, message: 'ব্যবসা ফান্ডিং রেকর্ডটি খুঁজে পাওয়া যায়নি।' };
    }
    await updateBusinessFundingStatus(params.fundingId, 'rejected', undefined, params.reason.trim(), params.reason.trim());
    return {
      success: true,
      message: `ব্যবসা ফান্ডিং আবেদন #${funding.applicationNo} সফলভাবে প্রত্যাখ্যান করা হয়েছে।`,
    };
  };

  const updateBusinessFunding = async (
    id: string,
    fundingData: Partial<BusinessFunding>
  ): Promise<void> => {
    const existing = businessFundings.find(f => f.id === id);
    if (!existing) return;

    const updated: BusinessFunding = {
      ...existing,
      ...fundingData,
    };

    setBusinessFundings(prev => prev.map(f => f.id === id ? updated : f));
    await safeSetDoc(doc(db, 'businessFundings', id), fundingData, { merge: true });
  };

  const deleteBusinessFunding = async (id: string): Promise<void> => {
    const existing = businessFundings.find(f => f.id === id);
    if (!existing) return;

    // 1. Delete associated business profit records and reverse their distributions
    const relatedProfits = businessProfitRecords.filter(
      p => p.businessFundingId === id || p.applicationNo === existing.applicationNo
    );
    for (const p of relatedProfits) {
      await deleteBusinessProfitRecord(p.id);
    }

    // 2. Delete any related disbursement voucher
    const relatedVouchers = vouchers.filter(v => 
      v.notes?.includes(existing.applicationNo) || 
      v.title?.includes(existing.applicationNo) ||
      v.id === `v-bf-${existing.id}`
    );
    for (const v of relatedVouchers) {
      setVouchers(prev => prev.filter(item => item.id !== v.id));
      deleteDoc(doc(db, 'incomeExpenses', v.id)).catch(console.error);
    }

    // 3. Delete from businessFundings
    setBusinessFundings(prev => prev.filter(f => f.id !== id));
    await deleteDoc(doc(db, 'businessFundings', id));
  };

  const disburseBusinessFunding = async (
    id: string,
    paymentMethod: PaymentMethod,
    bankAccountId?: string,
    notes?: string
  ): Promise<void> => {
    const funding = businessFundings.find(f => f.id === id);
    if (!funding) return;

    const amount = funding.approvedAmount || funding.amountRequested;
    const today = getTodayDateStr();
    
    // Calculate maturity date based on duration
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + (funding.durationMonths || 12));
    const maturityDateStr = maturity.toISOString().split('T')[0];

    const updateData: Partial<BusinessFunding> = {
      status: 'active',
      disbursementDate: today,
      maturityDate: maturityDateStr,
      paymentMethod,
      bankAccountId,
      notes: notes ? (funding.notes ? `${funding.notes} | ${notes}` : notes) : funding.notes,
      approvedBy: currentUser.name,
    };

    setBusinessFundings(prev => prev.map(f => f.id === id ? { ...f, ...updateData } : f));
    await safeSetDoc(doc(db, 'businessFundings', id), updateData, { merge: true });

    // Deduct bank account balance if payment method is bank or mfs
    if ((paymentMethod === 'bank' || paymentMethod === 'bkash' || paymentMethod === 'nagad') && bankAccountId) {
      setBankAccounts(prev => prev.map(b => {
        if (b.id === bankAccountId) {
          const newBal = Math.max(0, b.balance - amount);
          safeSetDoc(doc(db, 'bankAccounts', b.id), { balance: newBal, updatedAt: today }, { merge: true }).catch(console.error);
          return { ...b, balance: newBal, updatedAt: today };
        }
        return b;
      }));
    }

    // Record voucher / ledger expense entry
    const voucher: IncomeExpenseItem = {
      id: `v-bf-${Date.now()}`,
      voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'expense',
      category: 'ব্যবসা বিনিয়োগ বিতরণ',
      title: `ব্যবসা ফান্ডিং বিতরণ - ${funding.businessName} (${funding.memberName})`,
      amount,
      date: today,
      paymentMethod,
      bankAccountId,
      handledBy: currentUser.name,
      notes: `ব্যবসা ফান্ডিং আবেদন #${funding.applicationNo} অনুযায়ী বিনিয়োগকৃত অর্থ বিতরণ`,
    };
    setVouchers(prev => [voucher, ...prev]);
    safeSetDoc(doc(db, 'incomeExpenses', voucher.id), voucher).catch(console.error);

    // Record transaction for Member Ledger and Transaction Management
    const tx: Transaction = {
      id: `tx-bf-${funding.id}-${Date.now()}`,
      voucherNo: voucher.voucherNo,
      memberId: funding.memberId,
      memberName: funding.memberName,
      memberNo: funding.memberNo,
      type: 'business_funding_disbursed',
      amount,
      date: today,
      time: getCurrentTimeStr(),
      paymentMethod,
      bankAccountId: (paymentMethod === 'bank' || paymentMethod === 'bkash' || paymentMethod === 'nagad') ? bankAccountId : undefined,
      collectedBy: currentUser.name,
      notes: `ব্যবসা ফান্ডিং বিতরণ (#${funding.applicationNo}) - ${funding.businessName}`,
      status: 'completed',
    };
    setTransactions(prev => [tx, ...prev]);
    safeSetDoc(doc(db, 'transactions', tx.id), tx).catch(console.error);
  };

  const recordBusinessProfit = async (data: {
    businessFundingId?: string;
    memberId?: string;
    memberName?: string;
    month: string;
    date?: string;
    profitAmount?: number;
    totalBusinessProfit?: number;
    somitiProfitAmount?: number;
    notes?: string;
    distributeSomitiProfitNow?: boolean;
  }): Promise<{ record: BusinessProfitRecord; distribution?: MonthlyProfitDistribution }> => {
    if (activeProfitRecording.current) {
      console.warn('[recordBusinessProfit] Duplicate submission blocked by in-flight lock');
      throw new Error('একটি লভ্যাংশ প্রক্রিয়াকরণ এখনও চলছে। অনুগ্রহ করে একটু অপেক্ষা করুন।');
    }
    activeProfitRecording.current = true;

    try {
      // 1. Identify Profit Provider (Member / Business Funding)
      let funding = data.businessFundingId ? businessFundings.find(f => f.id === data.businessFundingId) : undefined;
      let providerMember = data.memberId ? members.find(m => m.id === data.memberId) : undefined;

      if (funding && !providerMember) {
        providerMember = members.find(m => m.id === funding!.memberId);
      } else if (!funding && providerMember) {
        funding = businessFundings.find(f => f.memberId === providerMember!.id && f.status === 'active');
      }

      if (!providerMember && !funding) {
        throw new Error('অনুগ্রহ করে মুনাফা প্রদানকারী সদস্য বা ব্যবসা নির্বাচন করুন।');
      }

      const providerId = providerMember?.id || funding!.memberId;
      const providerName = providerMember?.name || funding!.memberName;
      const providerNo = providerMember?.memberNo || funding!.memberNo || '';

      const recordDate = data.date || getTodayDateStr();

      // Determine clean profit amount
      const somitiAmount = data.somitiProfitAmount !== undefined
        ? Number(data.somitiProfitAmount)
        : (data.profitAmount !== undefined
            ? Number(data.profitAmount)
            : (data.totalBusinessProfit !== undefined ? Number(data.totalBusinessProfit) : 0));

      if (somitiAmount <= 0) {
        throw new Error('মুনাফার পরিমাণ অবশ্যই ০ এর চেয়ে বেশি হতে হবে।');
      }

      const totalProfit = data.totalBusinessProfit !== undefined && data.totalBusinessProfit > 0
        ? Number(data.totalBusinessProfit)
        : somitiAmount;
      const memberAmount = Math.max(0, totalProfit - somitiAmount);
      const somitiPct = totalProfit > 0 ? Math.round((somitiAmount / totalProfit) * 100) : 100;
      const memberPct = 100 - somitiPct;

      // Accidental rapid double-click duplicate protection (Requirement 3, 6, 12):
      // Only block if EXACT same member submits the EXACT same profit amount on the EXACT same date within 4 seconds
      const nowMs = Date.now();
      const recentTwin = businessProfitRecords.find(r => 
        r.memberId === providerId &&
        r.date === recordDate &&
        Number(r.somitiProfitAmount || r.profitAmount) === somitiAmount &&
        Math.abs(nowMs - new Date(r.createdAt || 0).getTime()) < 4000
      );
      if (recentTwin) {
        console.warn('[recordBusinessProfit] Duplicate click prevented within cooldown period');
        return { record: recentTwin };
      }

      // 2. Snapshot all member deposits at this exact moment in time (Requirement 8)
      const memberDepositSnapshots = members.map(m => ({
        memberId: m.id,
        memberNo: m.memberNo,
        memberName: m.name,
        depositAmount: getMemberSavingsBalance(m),
      }));

      // Calculate Proportional Distribution with exact 2-decimal precision & final adjustment (Requirement 2, 7)
      const calcResult = calculateProportionalProfit(somitiAmount, memberDepositSnapshots);

      const recordId = `bpr-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Prepare Member Profit Share Items
      const memberDistributions: MemberProfitShareItem[] = calcResult.memberShares.map(s => ({
        memberId: s.memberId,
        memberNo: s.memberNo,
        memberName: s.memberName,
        totalSavingsSnapshot: s.depositSnapshot,
        dailyWeightedDeposit: s.depositSnapshot,
        weightPercentage: s.weightPercentage,
        profitRatio: s.profitRatio,
        rawAllocatedProfit: s.rawAllocated,
        allocatedProfit: s.allocatedProfit,
        creditedToSavings: data.distributeSomitiProfitNow !== false && s.allocatedProfit > 0,
        transactionId: `tx-${recordId}-${s.memberId}`,
      }));

      const newRecord: BusinessProfitRecord = {
        id: recordId,
        businessFundingId: funding?.id,
        applicationNo: funding?.applicationNo || `PR-${new Date().getFullYear()}-${recordId.slice(-4)}`,
        memberId: providerId,
        memberName: providerName,
        memberNo: providerNo,
        month: data.month,
        totalBusinessProfit: totalProfit,
        memberProfitPercent: memberPct,
        somitiProfitPercent: somitiPct,
        memberProfitAmount: memberAmount,
        somitiProfitAmount: somitiAmount,
        profitAmount: somitiAmount,
        date: recordDate,
        totalDepositSnapshot: calcResult.totalDeposit,
        profitRatio: calcResult.profitRatio,
        memberDistributions,
        totalDistributed: calcResult.totalDistributed,
        status: 'completed',
        notes: data.notes || '',
        recordedBy: currentUser.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Save to state & storage
      setBusinessProfitRecords(prev => [newRecord, ...prev]);
      localStorage.setItem('bondhu_business_profit_records', JSON.stringify([newRecord, ...businessProfitRecords]));
      await safeSetDoc(doc(db, 'businessProfitRecords', newRecord.id), newRecord);

      // 4. Update funding statistics if linked
      if (funding) {
        const updatedFunding: Partial<BusinessFunding> = {
          totalProfitRecorded: (funding.totalProfitRecorded || 0) + totalProfit,
          totalMemberProfitPaid: (funding.totalMemberProfitPaid || 0) + memberAmount,
          totalSomitiProfitEarned: (funding.totalSomitiProfitEarned || 0) + somitiAmount,
        };
        setBusinessFundings(prev => prev.map(f => f.id === funding!.id ? { ...f, ...updatedFunding } : f));
        safeSetDoc(doc(db, 'businessFundings', funding.id), updatedFunding, { merge: true }).catch(console.error);
      }

      // 5. Record income voucher for Somiti ledger
      const incomeVoucher: IncomeExpenseItem = {
        id: `v-${newRecord.id}`,
        voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'income',
        category: 'ব্যবসায়িক লভ্যাংশ আয়',
        title: `মুনাফা প্রাপ্তি - ${providerName} (${formatBengaliDate(recordDate, true, true)})`,
        amount: somitiAmount,
        date: recordDate,
        paymentMethod: 'cash',
        handledBy: currentUser.name,
        notes: `সদস্য ${providerName} (${providerNo}) হতে প্রাপ্ত লভ্যাংশ ৳${somitiAmount} [${newRecord.id}]`,
      };
      setVouchers(prev => [incomeVoucher, ...prev]);
      safeSetDoc(doc(db, 'incomeExpenses', incomeVoucher.id), incomeVoucher).catch(console.error);

      // 6. Proportional Distribution to Member Savings (Requirement 2 & 10)
      let distResult: MonthlyProfitDistribution | undefined = undefined;
      if (data.distributeSomitiProfitNow !== false && calcResult.totalDistributed > 0) {
        const profitMap = new Map<string, number>();
        const newTransactions: Transaction[] = [];
        let curSerial = getNextLedgerSerial();

        memberDistributions.forEach(item => {
          if (item.allocatedProfit > 0) {
            profitMap.set(item.memberId, item.allocatedProfit);
            const tx: Transaction = {
              id: item.transactionId || `tx-${recordId}-${item.memberId}`,
              serialNo: curSerial++,
              voucherNo: `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              memberId: item.memberId,
              memberName: item.memberName,
              memberNo: item.memberNo,
              type: 'profit_share',
              amount: item.allocatedProfit,
              date: recordDate,
              time: getCurrentTimeStr(),
              paymentMethod: 'cash',
              collectedBy: currentUser.name,
              verifiedBy: currentUser.name,
              category: 'business_profit_distribution',
              notes: `${providerName} এর লভ্যাংশ (৳${somitiAmount}) হতে মোট জমার আনুপাতিক বণ্টন [${newRecord.id}]`,
              status: 'completed',
            };
            newTransactions.push(tx);
          }
        });

        // Credit to member savings balances
        setMembers(prev => prev.map(m => {
          const added = profitMap.get(m.id);
          if (!added) return m;
          const newGen = Number(((m.generalSavingsBalance || 0) + added).toFixed(2));
          const newTot = Number(((m.totalSavings || 0) + added).toFixed(2));
          const updated = { ...m, generalSavingsBalance: newGen, totalSavings: newTot };
          safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
          safeSetDoc(doc(db, 'memberFinancials', m.id), {
            generalSavingsBalance: newGen,
            totalSavings: newTot,
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(console.error);
          return updated;
        }));

        if (newTransactions.length > 0) {
          setTransactions(prev => [...newTransactions, ...prev]);
          newTransactions.forEach(t => safeSetDoc(doc(db, 'transactions', t.id), t).catch(console.error));
        }

        // Create associated MonthlyProfitDistribution record
        distResult = {
          id: `pd-${newRecord.id}`,
          distributionNo: `PD-${data.month}-${newRecord.id.slice(-4)}`,
          year: parseInt(data.month.split('-')[0], 10) || new Date().getFullYear(),
          month: parseInt(data.month.split('-')[1], 10) || (new Date().getMonth() + 1),
          monthName: `${data.month} লভ্যাংশ বণ্টন`,
          totalSomitiProfitPool: somitiAmount,
          totalWeightedDeposit: calcResult.totalDeposit,
          totalSavingsPool: calcResult.totalDeposit,
          totalMembersDistributed: memberDistributions.filter(d => d.allocatedProfit > 0).length,
          distributionDate: recordDate,
          distributedBy: currentUser.name,
          status: 'completed',
          memberDistributions,
          notes: `${providerName} এর লভ্যাংশ বণ্টন [${newRecord.id}]`,
          createdAt: new Date().toISOString(),
        };
        setProfitDistributions(prev => [distResult!, ...prev.filter(d => d.id !== distResult!.id)]);
        safeSetDoc(doc(db, 'profitDistributions', distResult.id), distResult).catch(console.error);
      }

      return { record: newRecord, distribution: distResult };
    } finally {
      activeProfitRecording.current = false;
    }
  };

  const deleteBusinessProfitRecord = async (id: string): Promise<void> => {
    const record = businessProfitRecords.find(p => p.id === id);
    if (!record) return;

    // 1. Revert parent funding totals if linked
    if (record.businessFundingId) {
      const funding = businessFundings.find(f => f.id === record.businessFundingId);
      if (funding) {
        const newTotalProfit = Math.max(0, (funding.totalProfitRecorded || 0) - (record.totalBusinessProfit || 0));
        const newMemberProfit = Math.max(0, (funding.totalMemberProfitPaid || 0) - (record.memberProfitAmount || 0));
        const newSomitiProfit = Math.max(0, (funding.totalSomitiProfitEarned || 0) - (record.somitiProfitAmount || 0));

        const updatedFunding: Partial<BusinessFunding> = {
          totalProfitRecorded: newTotalProfit,
          totalMemberProfitPaid: newMemberProfit,
          totalSomitiProfitEarned: newSomitiProfit,
        };
        setBusinessFundings(prev => prev.map(f => f.id === funding.id ? { ...f, ...updatedFunding } : f));
        safeSetDoc(doc(db, 'businessFundings', funding.id), updatedFunding, { merge: true }).catch(console.error);
      }
    }

    // 2. Remove associated income voucher
    setVouchers(prev => {
      const updated = prev.filter(v => v.id !== `v-${record.id}` && !v.notes?.includes(record.id));
      localStorage.setItem('bondhu_vouchers', JSON.stringify(updated));
      return updated;
    });
    deleteDoc(doc(db, 'incomeExpenses', `v-${record.id}`)).catch(console.error);

    // 3. Find ALL associated profit distributions (by pd- prefix, dist- prefix, or notes)
    const associatedDistributions = profitDistributions.filter(d =>
      d.id === `pd-${record.id}` ||
      d.id === `dist-${record.id}` ||
      (d as any).businessProfitRecordId === record.id ||
      (d.notes && (d.notes.includes(record.id) || (record.applicationNo && d.notes.includes(record.applicationNo))))
    );
    const associatedDistIds = new Set([`pd-${record.id}`, `dist-${record.id}`, ...associatedDistributions.map(d => d.id)]);
    const distNos = new Set(associatedDistributions.map(d => d.distributionNo).filter(Boolean) as string[]);

    // 4. Identify all associated transaction IDs to delete
    const txIdsToDelete = new Set<string>();
    (record.memberDistributions || []).forEach(d => {
      if (d.transactionId) txIdsToDelete.add(d.transactionId);
      txIdsToDelete.add(`tx-${record.id}-${d.memberId}`);
    });
    associatedDistributions.forEach(dist => {
      (dist.memberDistributions || []).forEach(d => {
        if (d.transactionId) txIdsToDelete.add(d.transactionId);
        txIdsToDelete.add(`tx-${record.id}-${d.memberId}`);
      });
    });

    const linkedTxs = transactions.filter(t =>
      txIdsToDelete.has(t.id) ||
      (t.type === 'profit_share' && (
        (t.notes && (
          t.notes.includes(record.id) ||
          (record.applicationNo && t.notes.includes(record.applicationNo)) ||
          Array.from(distNos).some(no => t.notes?.includes(no)) ||
          Array.from(associatedDistIds).some(did => t.notes?.includes(did))
        )) ||
        (t.voucherNo && (t.voucherNo.includes(record.id) || t.voucherNo.includes(record.id.slice(-4))))
      ))
    );
    linkedTxs.forEach(t => txIdsToDelete.add(t.id));

    // 5. Calculate profit deduction per member
    const memberDeductionMap: Record<string, number> = {};
    linkedTxs.forEach(t => {
      if (t.memberId && t.amount > 0) {
        memberDeductionMap[t.memberId] = (memberDeductionMap[t.memberId] || 0) + Number(t.amount);
      }
    });
    const allDistItems = [
      ...(record.memberDistributions || []),
      ...associatedDistributions.flatMap(d => d.memberDistributions || [])
    ];
    allDistItems.forEach(d => {
      if (d.memberId && d.allocatedProfit > 0 && d.creditedToSavings !== false) {
        if (!memberDeductionMap[d.memberId]) {
          memberDeductionMap[d.memberId] = d.allocatedProfit;
        }
      }
    });

    // 6. Delete transactions from state, localStorage, and Firestore
    if (txIdsToDelete.size > 0) {
      setTransactions(prev => {
        const remaining = prev.filter(t => !txIdsToDelete.has(t.id));
        localStorage.setItem('bondhu_transactions', JSON.stringify(remaining));
        return remaining;
      });
      txIdsToDelete.forEach(txId => deleteDoc(doc(db, 'transactions', txId)).catch(console.error));
    }

    // 7. Delete associated profit distributions from state, localStorage, and Firestore
    setProfitDistributions(prev => {
      const remaining = prev.filter(d => !associatedDistIds.has(d.id) && !d.notes?.includes(record.id));
      localStorage.setItem('bondhu_profit_distributions', JSON.stringify(remaining));
      return remaining;
    });
    associatedDistIds.forEach(did => deleteDoc(doc(db, 'profitDistributions', did)).catch(console.error));

    // 8. Reconcile affected members' savings balance
    if (Object.keys(memberDeductionMap).length > 0) {
      setMembers(prev => prev.map(m => {
        const deduct = memberDeductionMap[m.id];
        if (!deduct) return m;

        const remainingMemberTxs = transactions.filter(
          t => t.memberId === m.id && t.status === 'completed' && !txIdsToDelete.has(t.id)
        );
        const dep = remainingMemberTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const withdr = remainingMemberTxs.filter(t => t.type === 'withdraw').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const prof = remainingMemberTxs.filter(t => t.type === 'profit_share').reduce((s, t) => s + (Number(t.amount) || 0), 0);

        const newGen = dep > 0 || withdr > 0 || prof > 0
          ? Math.max(0, dep + prof - withdr)
          : Math.max(0, Number(((m.generalSavingsBalance || 0) - deduct).toFixed(2)));
        const newTot = newGen + (Number(m.dpsSavingsBalance) || 0) + (Number(m.fdrSavingsBalance) || 0);

        const updated: Member = { ...m, generalSavingsBalance: newGen, totalSavings: newTot };
        safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
        safeSetDoc(doc(db, 'memberFinancials', m.id), {
          generalSavingsBalance: newGen,
          totalSavings: newTot,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(console.error);
        return updated;
      }));
    }

    // 9. Delete the profit record itself
    const remainingProfitRecords = businessProfitRecords.filter(p => p.id !== id);
    setBusinessProfitRecords(remainingProfitRecords);
    localStorage.setItem('bondhu_business_profit_records', JSON.stringify(remainingProfitRecords));
    await deleteDoc(doc(db, 'businessProfitRecords', id));
  };

  const updateBusinessProfitRecord = async (
    id: string,
    data: {
      memberId?: string;
      month: string;
      date?: string;
      profitAmount?: number;
      totalBusinessProfit?: number;
      somitiProfitAmount?: number;
      notes?: string;
    }
  ): Promise<void> => {
    const existing = businessProfitRecords.find(p => p.id === id);
    if (!existing) return;

    // First revert old distribution, transactions, and vouchers (Requirement 5)
    await deleteBusinessProfitRecord(id);

    // Re-record with updated profit values
    const profitVal = data.profitAmount !== undefined 
      ? data.profitAmount 
      : (data.somitiProfitAmount !== undefined 
          ? data.somitiProfitAmount 
          : (data.totalBusinessProfit !== undefined ? data.totalBusinessProfit : existing.somitiProfitAmount));

    await recordBusinessProfit({
      businessFundingId: existing.businessFundingId,
      memberId: data.memberId || existing.memberId,
      month: data.month || existing.month,
      date: data.date || existing.date,
      profitAmount: profitVal,
      totalBusinessProfit: data.totalBusinessProfit || profitVal,
      somitiProfitAmount: profitVal,
      notes: data.notes !== undefined ? data.notes : existing.notes,
      distributeSomitiProfitNow: true,
    });
  };

  // Safe Deduplication Effect for rapid accidental identical submits only
  const isDeduplicatingProfitRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isInitialLoadDone.current || isDeduplicatingProfitRef.current || businessProfitRecords.length === 0) return;

    // Only flag exact identical submissions (same memberId, date, amount, and within 3000ms)
    const exactTwinIdsToDelete: string[] = [];
    const seen = new Set<string>();

    for (const r of businessProfitRecords) {
      const key = `${r.memberId}_${r.date}_${r.somitiProfitAmount}`;
      if (seen.has(key)) {
        // Only consider duplicate if id is different
        exactTwinIdsToDelete.push(r.id);
      } else {
        seen.add(key);
      }
    }

    if (exactTwinIdsToDelete.length > 0) {
      isDeduplicatingProfitRef.current = true;
      Promise.all(exactTwinIdsToDelete.map(id => deleteBusinessProfitRecord(id)))
        .catch(console.error)
        .finally(() => {
          isDeduplicatingProfitRef.current = false;
        });
    }
  }, [businessProfitRecords]);

  // Automated Ledger Reconciliation & Self-Healing Engine:
  // Guarantees that each member's generalSavingsBalance and totalSavings strictly match their
  // actual transaction ledger (deposits + profit share - withdrawals).
  // This completely eliminates any balance corruption, double deductions, or desynchronization.
  useEffect(() => {
    if (members.length === 0) return;

    let hasAnyCorrection = false;
    const reconciledMembers = members.map(member => {
      const memberTxs = transactions.filter(t => t.memberId === member.id && t.status === 'completed');
      
      // Reconcile if this member has recorded transactions
      if (memberTxs.length > 0) {
        const totalDeposits = memberTxs
          .filter(t => t.type === 'deposit')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const totalWithdrawals = memberTxs
          .filter(t => t.type === 'withdraw')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const totalProfitShare = memberTxs
          .filter(t => t.type === 'profit_share')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const expectedGen = Math.max(0, totalDeposits + totalProfitShare - totalWithdrawals);
        const expectedTot = expectedGen + (Number(member.dpsSavingsBalance) || 0) + (Number(member.fdrSavingsBalance) || 0);

        if (
          Math.abs((member.generalSavingsBalance || 0) - expectedGen) > 0.01 ||
          Math.abs((member.totalSavings || 0) - expectedTot) > 0.01
        ) {
          hasAnyCorrection = true;
          const updated: Member = {
            ...member,
            generalSavingsBalance: expectedGen,
            totalSavings: expectedTot,
          };
          safeSetDoc(doc(db, 'members', member.id), updated, { merge: true }).catch(console.error);
          safeSetDoc(doc(db, 'memberFinancials', member.id), {
            memberId: member.id,
            memberNo: member.memberNo,
            generalSavingsBalance: expectedGen,
            totalSavings: expectedTot,
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(console.error);
          return updated;
        }
      }
      return member;
    });

    if (hasAnyCorrection) {
      setMembers(reconciledMembers);
    }
  }, [transactions]);

  // Automated Cleanup: Automatically purge orphan transactions belonging to members that were deleted
  useEffect(() => {
    if (!isInitialLoadDone.current || members.length === 0 || transactions.length === 0) return;
    const memberIdSet = new Set(members.map(m => m.id));
    const orphanTxs = transactions.filter(t => t.memberId && !memberIdSet.has(t.memberId));
    if (orphanTxs.length > 0) {
      const orphanIds = new Set(orphanTxs.map(t => t.id));
      setTransactions(prev => prev.filter(t => !orphanIds.has(t.id)));
      orphanTxs.forEach(t => {
        deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
      });
    }
  }, [members, transactions]);

  // Helper to get active member's actual total deposit / savings
  // (Uses central getMemberSavingsBalance from utils)

  // Calculate Profit Share based on member's Total Savings (সদস্যদের মোট জমার ভিত্তিতে লভ্যাংশ হিসাব)
  // Single source of truth powered by calculateProportionalProfit
  const calculateMemberProfitShares = (distributableProfit: number = 0, year?: number, month?: number) => {
    const daysInMonth = year && month ? new Date(year, month, 0).getDate() : 30;

    const activeMembers = members.filter(m => m.status === 'active' || getMemberSavingsBalance(m) > 0);
    const snapshots = activeMembers.map(m => ({
      memberId: m.id,
      memberNo: m.memberNo,
      memberName: m.name,
      depositAmount: getMemberSavingsBalance(m),
    }));

    const result = calculateProportionalProfit(distributableProfit, snapshots);

    const items = result.memberShares.map((item) => {
      const member = activeMembers.find(m => m.id === item.memberId) || members.find(m => m.id === item.memberId)!;
      return {
        member,
        savings: item.depositSnapshot,
        dailyBalances: [item.depositSnapshot],
        dailyWeightedDeposit: item.depositSnapshot, // backwards-compatible alias
        dailyAverage: item.depositSnapshot,
        weightPercentage: item.weightPercentage,
        profitRatio: result.profitRatio,
        rawAllocated: item.rawAllocated,
        allocatedProfit: item.allocatedProfit,
      };
    });

    return {
      items,
      totalSavings: result.totalDeposit,
      totalWeightedDeposit: result.totalDeposit, // alias for backwards compatibility
      profitRatio: result.profitRatio,
      daysInMonth,
    };
  };

  // Provide alias calculateDailyWeightedDeposits pointing to the savings-based formula so no caller breaks
  const calculateDailyWeightedDeposits = (year: number, month: number, profitAmount: number = 0) => {
    return calculateMemberProfitShares(profitAmount, year, month);
  };

  // Execute Monthly Profit Distribution based on Member Total Savings
  const executeMonthlyProfitDistribution = async (data: {
    year: number;
    month: number;
    monthName: string;
    totalSomitiProfitPool: number;
    creditToSavings: boolean;
    notes?: string;
    distributionId?: string;
    businessProfitRecordId?: string;
    distributionDate?: string;
  }): Promise<MonthlyProfitDistribution> => {
    // 1. Identify deterministic record tag and lock key
    const recordTag = data.businessProfitRecordId || data.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1];
    const lockKey = recordTag 
      ? `dist-${recordTag}` 
      : (data.distributionId || `dist-${data.year}-${data.month}-${data.totalSomitiProfitPool}`);

    if (activeDistributionLocks.current.has(lockKey)) {
      console.warn(`[executeMonthlyProfitDistribution] Concurrent distribution blocked for key: ${lockKey}`);
      const existing = profitDistributions.find(d => 
        (recordTag && d.notes?.includes(recordTag)) ||
        (data.distributionId && d.id === data.distributionId) ||
        (d.year === data.year && d.month === data.month && d.totalSomitiProfitPool === data.totalSomitiProfitPool)
      );
      if (existing) return existing;
      throw new Error('এই লভ্যাংশ বণ্টনটি ইতিমধ্যে প্রক্রিয়াকরণাধীন রয়েছে।');
    }

    const distNo = recordTag 
      ? `PD-${data.year}-${String(data.month).padStart(2, '0')}-${recordTag.replace(/^bpr-/, '').slice(-6)}`
      : `PD-${data.year}-${String(data.month).padStart(2, '0')}`;

    // 2. Identify any prior distributions for THIS SPECIFIC RECORD to replace safely without affecting other members' distributions
    const priorDists = profitDistributions.filter(d => 
      (recordTag && d.notes?.includes(recordTag)) ||
      (data.distributionId && d.id === data.distributionId) ||
      (!recordTag && !data.distributionId && !d.notes?.includes('[bpr-') && d.distributionNo === distNo)
    );

    activeDistributionLocks.current.add(lockKey);

    try {
      // Revert any prior distributions for this specific record before applying new calculation
      if (priorDists.length > 0) {
        console.log(`[executeMonthlyProfitDistribution] Reverting ${priorDists.length} prior distribution(s) for ${distNo} to guarantee single entry.`);
        const priorDeductionMap: Record<string, number> = {};
        const priorTxIdsToDelete = new Set<string>();

        priorDists.forEach(oldDist => {
          (oldDist.memberDistributions || []).forEach(m => {
            if (m.allocatedProfit > 0 && m.creditedToSavings !== false) {
              priorDeductionMap[m.memberId] = (priorDeductionMap[m.memberId] || 0) + m.allocatedProfit;
            }
            if (m.transactionId) priorTxIdsToDelete.add(m.transactionId);
          });
          deleteDoc(doc(db, 'profitDistributions', oldDist.id)).catch(console.error);
        });

        // Also search transactions directly for any profit_share transactions linked to distNo or oldDist
        const linkedOldTxs = transactions.filter(t => 
          (t.id && priorTxIdsToDelete.has(t.id)) ||
          (t.type === 'profit_share' && (t.notes?.includes(distNo) || (recordTag && t.notes?.includes(recordTag))))
        );
        linkedOldTxs.forEach(t => {
          priorTxIdsToDelete.add(t.id);
          deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
        });

        if (Object.keys(priorDeductionMap).length > 0) {
          setMembers(prev => prev.map(m => {
            const deduct = priorDeductionMap[m.id];
            if (!deduct) return m;
            const newGen = Math.max(0, (m.generalSavingsBalance || 0) - deduct);
            const newTot = Math.max(0, (m.totalSavings || 0) - deduct);
            const updated = { ...m, generalSavingsBalance: newGen, totalSavings: newTot };
            safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
            safeSetDoc(doc(db, 'memberFinancials', m.id), {
              generalSavingsBalance: newGen,
              totalSavings: newTot,
              updatedAt: new Date().toISOString(),
            }, { merge: true }).catch(console.error);
            return updated;
          }));
        }

        if (priorTxIdsToDelete.size > 0) {
          setTransactions(prev => prev.filter(t => !priorTxIdsToDelete.has(t.id)));
        }
      }

      const { items, totalSavings } = calculateMemberProfitShares(data.totalSomitiProfitPool, data.year, data.month);

      const today = getTodayDateStr();
      const distDate = data.distributionDate || today;

      // Eligible items with positive savings
      const eligibleItems = items.filter(i => i.savings > 0);
      const effectiveTotalSavings = totalSavings;

      const memberDistributions: MemberProfitShareItem[] = [];
      const newTransactions: Transaction[] = [];
      let execSerial = getNextLedgerSerial();

      const uniqueDistId = data.distributionId || (recordTag ? `pd-${recordTag}` : `pd-${data.year}-${String(data.month).padStart(2, '0')}-${Date.now()}`);

      eligibleItems.forEach((item) => {
        const allocated = item.allocatedProfit;

        let txId: string | undefined = undefined;

        if (data.creditToSavings && allocated > 0) {
          txId = `tx-${uniqueDistId}-${item.member.id}`;
          const txAlreadyExists = transactions.some(t => t.id === txId);
          if (!txAlreadyExists) {
            const tx: Transaction = {
              id: txId,
              serialNo: execSerial++,
              voucherNo: `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              memberId: item.member.id,
              memberName: item.member.name,
              memberNo: item.member.memberNo,
              type: 'profit_share',
              amount: allocated,
              date: distDate,
              time: getCurrentTimeStr(),
              paymentMethod: 'cash',
              collectedBy: currentUser.name,
              verifiedBy: currentUser.name,
              category: 'business_profit_distribution',
              notes: `${data.monthName} ব্যবসায়িক লভ্যাংশ বণ্টন (মোট জমার অনুপাতে লাভ যুক্ত)`,
              status: 'completed',
            };
            newTransactions.push(tx);
          }
        }

        memberDistributions.push({
          memberId: item.member.id,
          memberNo: item.member.memberNo,
          memberName: item.member.name,
          totalSavingsSnapshot: item.savings,
          dailyWeightedDeposit: item.savings,
          weightPercentage: Number(item.weightPercentage.toFixed(3)),
          profitRatio: item.profitRatio,
          rawAllocatedProfit: item.rawAllocated,
          allocatedProfit: allocated,
          creditedToSavings: data.creditToSavings && allocated > 0,
          transactionId: txId,
        });
      });

      const newDistribution: MonthlyProfitDistribution = {
        id: uniqueDistId,
        distributionNo: distNo,
        year: data.year,
        month: data.month,
        monthName: data.monthName,
        totalSomitiProfitPool: data.totalSomitiProfitPool,
        totalWeightedDeposit: effectiveTotalSavings,
        totalSavingsPool: effectiveTotalSavings,
        totalMembersDistributed: memberDistributions.filter(d => d.allocatedProfit > 0).length,
        distributionDate: distDate,
        distributedBy: currentUser.name,
        status: 'completed',
        memberDistributions,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      };

      // 1. If creditToSavings, update member balances & save transactions
      if (newTransactions.length > 0) {
        const profitMap = new Map<string, number>();
        newTransactions.forEach(t => {
          profitMap.set(t.memberId, (profitMap.get(t.memberId) || 0) + t.amount);
        });

        setMembers(prev => prev.map(m => {
          const added = profitMap.get(m.id);
          if (!added) return m;

          const newGeneral = (m.generalSavingsBalance || 0) + added;
          const newTotal = (m.totalSavings || 0) + added;
          const updated = {
            ...m,
            generalSavingsBalance: newGeneral,
            totalSavings: newTotal,
          };

          safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
          safeSetDoc(doc(db, 'memberFinancials', m.id), {
            memberId: m.id,
            memberNo: m.memberNo,
            totalSavings: newTotal,
            generalSavingsBalance: newGeneral,
            dpsSavingsBalance: m.dpsSavingsBalance || 0,
            fdrSavingsBalance: m.fdrSavingsBalance || 0,
            activeLoanBalance: m.activeLoanBalance || 0,
            updatedAt: new Date().toISOString(),
          }, { merge: true }).catch(console.error);

          return updated;
        }));

        setTransactions(prev => [...newTransactions, ...prev]);
        const batch = writeBatch(db);
        newTransactions.forEach(t => safeBatchSet(batch, doc(db, 'transactions', t.id), t));
        batch.commit().catch(console.error);
      }

      // 2. Save distribution record (replacing only prior distributions for this specific record)
      const priorIds = new Set(priorDists.map(d => d.id));
      setProfitDistributions(prev => [
        newDistribution,
        ...prev.filter(d => !priorIds.has(d.id) && d.id !== newDistribution.id)
      ]);
      await safeSetDoc(doc(db, 'profitDistributions', newDistribution.id), newDistribution);

      return newDistribution;
    } finally {
      activeDistributionLocks.current.delete(lockKey);
    }
  };

  // Delete Monthly Profit Distribution (revert member savings, delete profit transactions, remove distribution)
  const deleteMonthlyProfitDistribution = async (id: string): Promise<boolean> => {
    try {
      const dist = profitDistributions.find(d => d.id === id);
      if (!dist) return false;

      // 1. Calculate deductions for each member whose savings were credited
      const memberDeductionMap: Record<string, number> = {};
      (dist.memberDistributions || []).forEach(m => {
        if (m.allocatedProfit > 0 && m.creditedToSavings !== false) {
          memberDeductionMap[m.memberId] = (memberDeductionMap[m.memberId] || 0) + m.allocatedProfit;
        }
      });

      // 2. Identify related transactions
      const txIds = new Set((dist.memberDistributions || []).map(m => m.transactionId).filter(Boolean));
      const distTxs = transactions.filter(t => 
        (t.id && txIds.has(t.id)) ||
        (t.type === 'profit_share' && (
          (dist.notes && t.notes?.includes(dist.notes)) ||
          (dist.distributionNo && t.notes?.includes(dist.distributionNo)) ||
          (dist.monthName && t.notes?.includes(dist.monthName)) ||
          (dist.notes && dist.notes.includes(t.id))
        ))
      );

      // Ensure deductions accurately match transaction amounts
      distTxs.forEach(t => {
        if (t.memberId && t.amount > 0) {
          memberDeductionMap[t.memberId] = Math.max(memberDeductionMap[t.memberId] || 0, t.amount);
        }
      });

      // Delete transactions
      const toDeleteTxIds = new Set(distTxs.map(t => t.id));
      if (distTxs.length > 0) {
        setTransactions(prev => prev.filter(t => !toDeleteTxIds.has(t.id)));
        distTxs.forEach(t => {
          deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
        });
      }

      // 3. Reconcile affected members' savings balances directly from remaining transactions
      setMembers(prev => prev.map(m => {
        if (!memberDeductionMap[m.id]) return m;
        const remainingMemberTxs = transactions.filter(
          t => t.memberId === m.id && t.status === 'completed' && !toDeleteTxIds.has(t.id)
        );
        const dep = remainingMemberTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const withdr = remainingMemberTxs.filter(t => t.type === 'withdraw').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const prof = remainingMemberTxs.filter(t => t.type === 'profit_share').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const newGen = Math.max(0, dep + prof - withdr);
        const newTot = newGen + (Number(m.dpsSavingsBalance) || 0) + (Number(m.fdrSavingsBalance) || 0);

        const updated: Member = {
          ...m,
          generalSavingsBalance: newGen,
          totalSavings: newTot,
        };
        safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
        safeSetDoc(doc(db, 'memberFinancials', m.id), {
          generalSavingsBalance: newGen,
          totalSavings: newTot,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(console.error);
        return updated;
      }));

      // 4. Delete profit distribution doc from state, localStorage, and Firestore
      setProfitDistributions(prev => {
        const updated = prev.filter(d => d.id !== id);
        localStorage.setItem('bondhu_profit_distributions', JSON.stringify(updated));
        return updated;
      });
      await deleteDoc(doc(db, 'profitDistributions', id));

      // 5. If this distribution was linked to a businessProfitRecord, clean up that record and funding too!
      const recordTag = dist.id.startsWith('pd-')
        ? dist.id.slice(3)
        : (dist.id.startsWith('dist-bpr-')
            ? dist.id.slice(9)
            : dist.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]);
      if (recordTag) {
        const linkedRecord = businessProfitRecords.find(p => p.id === recordTag);
        if (linkedRecord) {
          if (linkedRecord.businessFundingId) {
            const funding = businessFundings.find(f => f.id === linkedRecord.businessFundingId);
            if (funding) {
              const newTotalProfit = Math.max(0, (funding.totalProfitRecorded || 0) - (linkedRecord.totalBusinessProfit || 0));
              const newMemberProfit = Math.max(0, (funding.totalMemberProfitPaid || 0) - (linkedRecord.memberProfitAmount || 0));
              const newSomitiProfit = Math.max(0, (funding.totalSomitiProfitEarned || 0) - (linkedRecord.somitiProfitAmount || 0));
              const updatedFunding: Partial<BusinessFunding> = {
                totalProfitRecorded: newTotalProfit,
                totalMemberProfitPaid: newMemberProfit,
                totalSomitiProfitEarned: newSomitiProfit,
              };
              setBusinessFundings(prev => prev.map(f => f.id === funding.id ? { ...f, ...updatedFunding } : f));
              safeSetDoc(doc(db, 'businessFundings', funding.id), updatedFunding, { merge: true }).catch(console.error);
            }
          }
          setBusinessProfitRecords(prev => {
            const remaining = prev.filter(p => p.id !== recordTag);
            localStorage.setItem('bondhu_business_profit_records', JSON.stringify(remaining));
            return remaining;
          });
          deleteDoc(doc(db, 'businessProfitRecords', recordTag)).catch(console.error);
        }
      }

      return true;
    } catch (err) {
      console.error('Error deleting profit distribution:', err);
      return false;
    }
  };

  const clearAllProfitDistributions = async (): Promise<boolean> => {
    try {
      // 1. Collect all member deductions from all distributions and profit transactions
      const memberDeductionMap: Record<string, number> = {};

      // From profit distributions where credited to savings
      profitDistributions.forEach(dist => {
        (dist.memberDistributions || []).forEach(m => {
          if (m.allocatedProfit > 0 && m.creditedToSavings !== false) {
            memberDeductionMap[m.memberId] = (memberDeductionMap[m.memberId] || 0) + m.allocatedProfit;
          }
        });
      });

      // From all profit_share transactions
      const profitTxs = transactions.filter(t => t.type === 'profit_share');
      profitTxs.forEach(t => {
        if (t.memberId && t.amount > 0) {
          memberDeductionMap[t.memberId] = Math.max(memberDeductionMap[t.memberId] || 0, t.amount);
        }
      });

      // 2. Delete all profit_share transactions from state and Firestore
      if (profitTxs.length > 0) {
        const profitTxIds = new Set(profitTxs.map(t => t.id));
        setTransactions(prev => prev.filter(t => !profitTxIds.has(t.id)));
        profitTxs.forEach(t => {
          deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
        });
      }

      // 3. Reconcile all member savings balances directly from remaining non-profit transactions
      setMembers(prev => prev.map(m => {
        const remainingMemberTxs = transactions.filter(
          t => t.memberId === m.id && t.status === 'completed' && t.type !== 'profit_share'
        );
        if (remainingMemberTxs.length === 0) return m;
        const dep = remainingMemberTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const withdr = remainingMemberTxs.filter(t => t.type === 'withdraw').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const newGen = Math.max(0, dep - withdr);
        const newTot = newGen + (Number(m.dpsSavingsBalance) || 0) + (Number(m.fdrSavingsBalance) || 0);

        const updated: Member = {
          ...m,
          generalSavingsBalance: newGen,
          totalSavings: newTot,
        };
        safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
        safeSetDoc(doc(db, 'memberFinancials', m.id), {
          generalSavingsBalance: newGen,
          totalSavings: newTot,
          updatedAt: new Date().toISOString(),
        }, { merge: true }).catch(console.error);
        return updated;
      }));

      // 4. Delete all profit distributions from Firestore and state
      for (const dist of profitDistributions) {
        deleteDoc(doc(db, 'profitDistributions', dist.id)).catch(console.error);
      }
      setProfitDistributions([]);
      localStorage.setItem('bondhu_profit_distributions', JSON.stringify([]));
      return true;
    } catch (err) {
      console.error('Error clearing all profit distributions:', err);
      return false;
    }
  };

  const resetMemberProfitShare = async (memberId: string): Promise<boolean> => {
    try {
      // 1. Identify all profit_share transactions for this member
      const memberProfitTxs = transactions.filter(t => t.memberId === memberId && t.type === 'profit_share');
      const totalTxProfit = memberProfitTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

      if (memberProfitTxs.length > 0) {
        const txIds = new Set(memberProfitTxs.map(t => t.id));
        setTransactions(prev => prev.filter(t => !txIds.has(t.id)));
        memberProfitTxs.forEach(tx => {
          deleteDoc(doc(db, 'transactions', tx.id)).catch(console.error);
        });
      }

      // 2. Clear this member's allocation in profitDistributions
      let foundDistributionProfit = 0;
      for (const dist of profitDistributions) {
        const myItem = dist.memberDistributions?.find(m => m.memberId === memberId);
        if (myItem && myItem.allocatedProfit > 0) {
          if (myItem.creditedToSavings !== false) {
            foundDistributionProfit += myItem.allocatedProfit;
          }
          const updatedMembers = (dist.memberDistributions || []).map(m => {
            if (m.memberId === memberId) {
              return { ...m, allocatedProfit: 0, creditedToSavings: false };
            }
            return m;
          });
          const remainingAllocations = updatedMembers.filter(m => m.allocatedProfit > 0);
          if (remainingAllocations.length === 0) {
            deleteDoc(doc(db, 'profitDistributions', dist.id)).catch(console.error);
            setProfitDistributions(prev => prev.filter(d => d.id !== dist.id));
          } else {
            const updatedDist: MonthlyProfitDistribution = {
              ...dist,
              memberDistributions: updatedMembers,
              totalMembersDistributed: remainingAllocations.length,
              totalSomitiProfitPool: remainingAllocations.reduce((sum, m) => sum + (m.allocatedProfit || 0), 0),
            };
            setProfitDistributions(prev => prev.map(d => d.id === dist.id ? updatedDist : d));
            await safeSetDoc(doc(db, 'profitDistributions', dist.id), updatedDist, { merge: true });
          }
        }
      }

      // 3. Reconcile this member's savings directly from remaining transactions
      setMembers(prev => prev.map(m => {
        if (m.id !== memberId) return m;
        const remainingMemberTxs = transactions.filter(
          t => t.memberId === memberId && t.status === 'completed' && !memberProfitTxs.some(pt => pt.id === t.id)
        );
        const dep = remainingMemberTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const withdr = remainingMemberTxs.filter(t => t.type === 'withdraw').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const prof = remainingMemberTxs.filter(t => t.type === 'profit_share').reduce((s, t) => s + (Number(t.amount) || 0), 0);
        const newGen = Math.max(0, dep + prof - withdr);
        const newTot = newGen + (Number(m.dpsSavingsBalance) || 0) + (Number(m.fdrSavingsBalance) || 0);

        const updated = { ...m, generalSavingsBalance: newGen, totalSavings: newTot };
        safeSetDoc(doc(db, 'members', m.id), updated, { merge: true }).catch(console.error);
        safeSetDoc(doc(db, 'memberFinancials', m.id), {
          generalSavingsBalance: newGen,
          totalSavings: newTot,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(console.error);
        return updated;
      }));

      return true;
    } catch (err) {
      console.error('Error resetting member profit share:', err);
      return false;
    }
  };

  return (
    <SomitiContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedMemberId,
        setSelectedMemberId,
        searchQuery,
        setSearchQuery,
        useBengaliDigits,
        setUseBengaliDigits,
        currentUser,
        setCurrentUser,
        isUserAdmin,
        isCurrentMember,
        canViewMemberFinancials,

        firestoreConnected,
        isSyncing,
        lastSyncTime,
        syncAllToFirestore,
        syncAllFromFirestore,

        settings,
        updateSettings,
        members,
        loans,
        savingsSchemes,
        shareClosures,
        transactions,
        vouchers,
        incomeExpenses: vouchers || [],
        bankAccounts,
        users,

        addMember,
        updateMember,
        deleteMember,
        importMembersFromList,
        closeMemberShares,
        buyMemberShares,

        addDeposit,
        addWithdrawal,
        updateTransaction,
        deleteTransaction,
        getNextLedgerSerial,
        addLoan,
        applyForLoan,
        approveLoan,
        rejectLoan,
        updateLoan,
        deleteLoan,
        payLoanInstallment,
        auditLogs,
        addAuditLog,
        addSavingsScheme,
        addVoucher,
        deleteVoucher,
        addIncomeExpense: addVoucher,
        deleteIncomeExpense: deleteVoucher,

        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,

        transferFunds,
        updateBankAccountBalance,

        activeReceipt,
        setActiveReceipt,
        openReceiptForTx,
        showQuickDepositModal,
        setShowQuickDepositModal,
        showQuickWithdrawModal,
        setShowQuickWithdrawModal,
        showQuickLoanModal,
        setShowQuickLoanModal,
        showQuickKistiModal,
        setShowQuickKistiModal,
        showNewMemberModal,
        setShowNewMemberModal,

        totalVaultCash,
        totalBankCash,
        cashInHand: totalVaultCash,
        totalAvailableBalance,
        totalCapital,
        totalBusinessCapital,
        totalSavingsInSomiti,
        totalActiveLoanBalance,
        todayStats,

        clearAllData,
        resetToDemoData,
        exportDatabaseJson,
        importDatabaseJson,
        distributeProfitToSavings,

        businessFundings,
        businessProfitRecords,
        profitDistributions,
        addBusinessFunding,
        updateBusinessFundingStatus,
        approveBusinessFunding,
        rejectBusinessFunding,
        updateBusinessFunding,
        deleteBusinessFunding,
        disburseBusinessFunding,
        recordBusinessProfit,
        updateBusinessProfitRecord,
        deleteBusinessProfitRecord,
        calculateDailyWeightedDeposits,
        calculateMemberProfitShares,
        getMemberSavingsBalance,
        executeMonthlyProfitDistribution,
        deleteMonthlyProfitDistribution,
        clearAllProfitDistributions,
        resetMemberProfitShare,
      }}
    >
      {children}
    </SomitiContext.Provider>
  );
};

export const useSomiti = () => {
  const context = useContext(SomitiContext);
  if (!context) {
    throw new Error('useSomiti must be used within a SomitiProvider');
  }
  return context;
};
