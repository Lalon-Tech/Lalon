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
  ShareClosure
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

// Sanitization helpers to eliminate any NaN or undefined data
const sanitizeMember = (m: any): Member => {
  const general = Number(m.generalSavingsBalance) || 0;
  const dps = Number(m.dpsSavingsBalance) || 0;
  const fdr = Number(m.fdrSavingsBalance) || 0;
  const shareValue = Number(m.shareValue) || 0;
  const shareCount = Number(m.shareCount) || 0;
  const activeLoan = Number(m.activeLoanBalance) || 0;
  const admissionFee = Number(m.admissionFee) || 0;
  const totalSavings = Number(m.totalSavings) || (general + dps + fdr + shareValue);

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
  const totalInterest = Number(l.totalInterest) || (principal * (interestRate / 100));
  const totalPayable = Number(l.totalPayable) || (principal + totalInterest);
  const paidAmount = Number(l.paidAmount) || 0;
  const remaining = Number(l.remainingAmount) !== undefined && !isNaN(Number(l.remainingAmount)) 
    ? Number(l.remainingAmount) 
    : Math.max(0, totalPayable - paidAmount);

  return {
    ...l,
    id: l.id || `loan-${Date.now()}`,
    principalAmount: principal,
    interestRate,
    totalInterest,
    totalPayable,
    installmentAmount: Number(l.installmentAmount) || 0,
    totalInstallments: Number(l.totalInstallments) || 0,
    paidInstallments: Number(l.paidInstallments) || 0,
    paidAmount,
    remainingAmount: remaining,
    fineCollected: Number(l.fineCollected) || 0,
    discountGiven: Number(l.discountGiven) || 0,
    status: l.status || (remaining <= 0 ? 'paid' : 'active'),
    installmentSchedule: Array.isArray(l.installmentSchedule) ? l.installmentSchedule : [],
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
    amount: Number(t.amount) || 0,
    fineAmount: Number(t.fineAmount) || 0,
    discountAmount: Number(t.discountAmount) || 0,
    paymentMethod: t.paymentMethod || 'cash',
    status: t.status || 'completed',
  };
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
  deleteMember: (id: string) => void;
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
    unpaidShares?: number[];
    notes?: string;
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

  payLoanInstallment: (params: {
    loanId: string;
    installmentNo: number;
    amount: number;
    fine?: number;
    discount?: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Transaction;

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
    return raw.map(sanitizeMember);
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const raw = safeParse('bondhu_loans', initialLoans, true);
    return raw.map(sanitizeLoan);
  });

  const [savingsSchemes, setSavingsSchemes] = useState<SavingsScheme[]>(() => {
    const raw = safeParse('bondhu_savings', initialSavingsSchemes, true);
    return raw.map(sanitizeSavings);
  });

  const [shareClosures, setShareClosures] = useState<ShareClosure[]>(() => {
    const raw = safeParse('bondhu_share_closures', [], true);
    return raw.map(sanitizeShareClosure);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const raw = safeParse('bondhu_transactions', initialTransactions, true);
    return raw.map(sanitizeTransaction);
  });

  const [vouchers, setVouchers] = useState<IncomeExpenseItem[]>(() => {
    return safeParse('bondhu_vouchers', initialVouchers, true);
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const raw = safeParse('bondhu_bank_accounts', initialBankAccounts, true);
    return raw.map(sanitizeBank);
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    const raw = safeParse('bondhu_users', initialUsers, true);
    return raw.map(sanitizeUser);
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

  // Helper date
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];
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
            // If cloud is empty but local state has members, seed local members to Firestore!
            setFirestoreConnected(true);
            if (members.length > 0 && !isInitialLoadDone.current) {
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
            if (loans.length > 0 && !isInitialLoadDone.current) {
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
            if (savingsSchemes.length > 0 && !isInitialLoadDone.current) {
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
            if (shareClosures.length > 0 && !isInitialLoadDone.current) {
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
            list.sort((a, b) => b.id.localeCompare(a.id));
            setTransactions(list);
          } else {
            if (transactions.length > 0 && !isInitialLoadDone.current) {
              const batch = writeBatch(db);
              transactions.forEach(t => safeBatchSet(batch, doc(db, 'transactions', t.id), t));
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
            if (vouchers.length > 0 && !isInitialLoadDone.current) {
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
        usersSnap
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
        txSnap.forEach(d => list.push(d.data() as Transaction));
        list.sort((a, b) => b.id.localeCompare(a.id));
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
      totalSavings: (memberData.shareCount || 0) * (settings.sharePricePerUnit || 100),
      activeLoanBalance: 0,
    };

    setMembers(prev => [newMember, ...prev]);
    // Save to Firestore
    safeSetDoc(doc(db, 'members', newMember.id), newMember).catch(console.error);

    // Record admission fee & share purchase transaction if amount > 0
    if (newMember.admissionFee > 0) {
      const txId = `tx-${Date.now()}`;
      const tx: Transaction = {
        id: txId,
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

    if (newMember.shareValue > 0) {
      const tx: Transaction = {
        id: `tx-${Date.now() + 1}`,
        voucherNo: `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId: newMember.id,
        memberName: newMember.name,
        memberNo: newMember.memberNo,
        type: 'share_purchase',
        amount: newMember.shareValue,
        date: getTodayDateStr(),
        time: getCurrentTimeStr(),
        paymentMethod: 'cash',
        collectedBy: currentUser.name,
        verifiedBy: currentUser.name,
        notes: `${newMember.shareCount} টি শেয়ার ক্রয় বাবদ`,
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

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    deleteDoc(doc(db, 'members', id)).catch(console.error);
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

    const unitPrice = Number(params.unitPrice) || settings.sharePricePerUnit || 100;
    const principalAmount = sharesToClose * unitPrice;
    const profitAmount = Number(params.profitAmount) || 0;
    const totalRefundAmount = principalAmount + profitAmount;
    const remainingShares = Math.max(0, currentShares - sharesToClose);
    const remainingShareValue = Math.max(0, (member.shareValue || 0) - principalAmount);
    const remainingTotalSavings = (member.generalSavingsBalance || 0) + (member.dpsSavingsBalance || 0) + (member.fdrSavingsBalance || 0) + remainingShareValue;

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
    const unitPrice = Number(params.unitPrice) || settings.sharePricePerUnit || 100;
    const totalAmount = sharesToBuy * unitPrice;
    const newShareCount = (member.shareCount || 0) + sharesToBuy;
    const newShareValue = (member.shareValue || 0) + totalAmount;
    const newTotalSavings = (member.generalSavingsBalance || 0) + (member.dpsSavingsBalance || 0) + (member.fdrSavingsBalance || 0) + newShareValue;

    const voucherNo = `SPV-${Date.now().toString().slice(-6)}`;
    const txId = `tx-sp-${Date.now()}`;
    const txDate = params.date || getTodayDateStr();

    const newTx: Transaction = {
      id: txId,
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
    unpaidShares?: number[];
    notes?: string;
  }): Transaction => {
    const member = members.find(m => m.id === params.memberId);
    const voucherNo = `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const txType: TransactionType = params.schemeType === 'dps' ? 'dps_deposit' : params.schemeType === 'fdr' ? 'fdr_deposit' : 'deposit';

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      voucherNo,
      memberId: params.memberId,
      memberName: member?.name || 'অজ্ঞাত সদস্য',
      memberNo: member?.memberNo || '',
      type: txType,
      amount: params.amount,
      date: getTodayDateStr(),
      time: getCurrentTimeStr(),
      paymentMethod: params.paymentMethod,
      bankAccountId: params.bankAccountId,
      collectedBy: currentUser.name,
      verifiedBy: currentUser.name,
      savingsSchemeId: params.schemeId,
      selectedShares: params.selectedShares,
      totalMemberShares: params.totalMemberShares,
      shareRate: params.shareRate,
      unpaidShares: params.unpaidShares,
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
        totalSavings: gen + dps + fdr + (m.shareValue || 0),
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
        totalSavings: gen + m.dpsSavingsBalance + m.fdrSavingsBalance + (m.shareValue || 0),
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

    // If amount changed for deposit, adjust member balance accordingly
    if (existingTx.memberId && ['deposit', 'dps_deposit', 'fdr_deposit'].includes(existingTx.type) && updates.amount !== undefined) {
      const amountDiff = updates.amount - existingTx.amount;
      if (amountDiff !== 0) {
        setMembers(prev => prev.map(m => {
          if (m.id !== existingTx.memberId) return m;
          let gen = m.generalSavingsBalance;
          let dps = m.dpsSavingsBalance;
          let fdr = m.fdrSavingsBalance;

          if (existingTx.type === 'deposit') gen = Math.max(0, gen + amountDiff);
          if (existingTx.type === 'dps_deposit') dps = Math.max(0, dps + amountDiff);
          if (existingTx.type === 'fdr_deposit') fdr = Math.max(0, fdr + amountDiff);

          const updated = {
            ...m,
            generalSavingsBalance: gen,
            dpsSavingsBalance: dps,
            fdrSavingsBalance: fdr,
            totalSavings: gen + dps + fdr + (m.shareValue || 0),
          };
          safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
          return updated;
        }));
      }
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

    // 1. Revert member balances if applicable
    if (tx.memberId) {
      setMembers(prev => prev.map(m => {
        if (m.id !== tx.memberId) return m;
        let gen = m.generalSavingsBalance;
        let dps = m.dpsSavingsBalance;
        let fdr = m.fdrSavingsBalance;
        let activeLoan = m.activeLoanBalance;

        if (tx.type === 'deposit') gen = Math.max(0, gen - tx.amount);
        if (tx.type === 'dps_deposit') dps = Math.max(0, dps - tx.amount);
        if (tx.type === 'fdr_deposit') fdr = Math.max(0, fdr - tx.amount);
        if (tx.type === 'withdraw') gen += tx.amount;
        if (tx.type === 'profit_share') gen = Math.max(0, gen - tx.amount);
        if (tx.type === 'loan_installment') activeLoan += tx.amount;

        const updated = {
          ...m,
          generalSavingsBalance: gen,
          dpsSavingsBalance: dps,
          fdrSavingsBalance: fdr,
          activeLoanBalance: activeLoan,
          totalSavings: gen + dps + fdr + (m.shareValue || 0),
        };
        safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
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

    if (activeReceipt?.id === id) {
      setActiveReceipt(null);
    }
  };

  // Add Loan
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

    // Record disbursement transaction
    const txDisburse: Transaction = {
      id: `tx-${Date.now()}`,
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

  // Pay Loan Installment
  const payLoanInstallment = (params: {
    loanId: string;
    installmentNo: number;
    amount: number;
    fine?: number;
    discount?: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Transaction => {
    const loan = loans.find(l => l.id === params.loanId);
    const member = members.find(m => m.id === loan?.memberId);
    const voucherNo = `V-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const totalCollected = params.amount + (params.fine || 0) - (params.discount || 0);

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
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
      installmentNo: params.installmentNo,
      fineAmount: params.fine,
      discountAmount: params.discount,
      collectedBy: currentUser.name,
      verifiedBy: currentUser.name,
      notes: params.notes || `ঋণ কিস্তি #${params.installmentNo} আদায় (${loan?.loanNo})`,
      status: 'completed',
    };

    setTransactions(prev => [newTx, ...prev]);
    safeSetDoc(doc(db, 'transactions', newTx.id), newTx).catch(console.error);

    // Update Loan Schedule
    setLoans(prev => prev.map(l => {
      if (l.id !== params.loanId) return l;
      const updatedSchedule = l.schedule.map(s => {
        if (s.installmentNo === params.installmentNo) {
          return {
            ...s,
            status: 'paid' as const,
            paidDate: getTodayDateStr(),
            paidAmount: params.amount,
            fine: params.fine,
            receiptNo: voucherNo,
          };
        }
        return s;
      });

      const paidCount = updatedSchedule.filter(s => s.status === 'paid').length;
      const newPaidAmount = l.paidAmount + params.amount;
      const newRemaining = Math.max(0, l.totalAmount - newPaidAmount);
      const isCleared = newRemaining <= 0 || paidCount >= l.totalInstallments;

      const updated = {
        ...l,
        paidAmount: newPaidAmount,
        remainingAmount: newRemaining,
        paidInstallmentsCount: paidCount,
        status: isCleared ? ('cleared' as const) : ('active' as const),
        schedule: updatedSchedule,
      };
      safeSetDoc(doc(db, 'loans', l.id), updated).catch(console.error);
      return updated;
    }));

    // Update Member balance
    if (loan?.memberId) {
      setMembers(prev => prev.map(m => {
        if (m.id !== loan.memberId) return m;
        const updated = {
          ...m,
          activeLoanBalance: Math.max(0, m.activeLoanBalance - params.amount),
        };
        safeSetDoc(doc(db, 'members', m.id), updated).catch(console.error);
        return updated;
      }));
    }

    setActiveReceipt(newTx);
    return newTx;
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
        totalSavings: m.generalSavingsBalance + dps + fdr + (m.shareValue || 0),
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

  // Calculate Aggregates
  const totalBankCash = bankAccounts.reduce((sum, b) => sum + b.balance, 0);

  let vaultIn = 0;
  let vaultOut = 0;
  transactions.forEach(t => {
    if (t.paymentMethod === 'cash' && t.status === 'completed') {
      if (['deposit', 'dps_deposit', 'fdr_deposit', 'loan_installment', 'admission_fee', 'share_purchase', 'fine', 'income'].includes(t.type)) {
        vaultIn += t.amount;
      } else if (['withdraw', 'loan_disbursed', 'expense', 'profit_share', 'share_surrender'].includes(t.type)) {
        vaultOut += t.amount;
      }
    }
  });

  const baseVault = 0;
  const totalVaultCash = Math.max(0, baseVault + vaultIn - vaultOut);
  const totalAvailableBalance = totalVaultCash + totalBankCash;

  const totalSavingsInSomiti = members.reduce((sum, m) => sum + m.totalSavings, 0);
  const totalActiveLoanBalance = loans.filter(l => l.status === 'active').reduce((sum, l) => sum + l.remainingAmount, 0);
  const totalCapital = totalAvailableBalance + totalActiveLoanBalance;

  // Today stats
  const todayStr = getTodayDateStr();
  let todayCollection = 0;
  let todayDisbursement = 0;
  let todayExpense = 0;
  let todayProfit = 0;
  let todayFine = 0;

  transactions.forEach(t => {
    if (t.date === todayStr && t.status === 'completed') {
      if (['deposit', 'dps_deposit', 'fdr_deposit', 'loan_installment', 'admission_fee', 'share_purchase', 'income'].includes(t.type)) {
        todayCollection += t.amount;
      }
      if (t.type === 'loan_disbursed' || t.type === 'withdraw' || t.type === 'share_surrender') {
        todayDisbursement += t.amount;
      }
      if (t.type === 'expense') {
        todayExpense += t.amount;
      }
      if (t.fineAmount) {
        todayFine += t.fineAmount;
      }
      if (t.type === 'loan_installment') {
        todayProfit += Math.round(t.amount * 0.1);
      }
      if (t.type === 'income') {
        todayProfit += t.amount;
      }
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
    setMembers([]);
    setLoans([]);
    setSavingsSchemes([]);
    setShareClosures([]);
    setTransactions([]);
    setVouchers([]);
    setUsers(initialUsers);
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
      'bondhu_vouchers', 'bondhu_bank_accounts', 'bondhu_users', 'bondhu_somiti_members',
      'bondhu_somiti_loans', 'bondhu_somiti_savings', 'bondhu_somiti_transactions',
      'bondhu_somiti_income_expense', 'bondhu_somiti_bank_accounts', 'bondhu_somiti_users'
    ];
    storageKeys.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    });

    // Clear Firestore documents if connected
    try {
      const collectionsToClear = ['members', 'loans', 'savings', 'shareClosures', 'transactions', 'vouchers', 'systemUsers'];
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

      // Seed clean admin
      await safeSetDoc(doc(db, 'systemUsers', initialUsers[0].id), initialUsers[0]);
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
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bondhu_somiti_backup_${getTodayDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        return sum + ((m.shareCount || 0) * (settings.sharePricePerUnit || 100));
      }
      return sum + (m.generalSavingsBalance + m.dpsSavingsBalance + m.fdrSavingsBalance);
    }, 0);

    if (totalDepositBase <= 0) {
      return { success: false, count: 0, totalDistributed: 0 };
    }

    const newTransactions: Transaction[] = [];
    const profitMap: Record<string, number> = {};
    let totalCredited = 0;

    members.forEach((m, idx) => {
      const memberBalance = params.criteria === 'share_capital'
        ? (m.shareCount || 0) * (settings.sharePricePerUnit || 100)
        : (m.generalSavingsBalance + m.dpsSavingsBalance + m.fdrSavingsBalance);

      if (memberBalance <= 0) return;

      const shareRatio = memberBalance / totalDepositBase;
      const profitShare = Math.round(params.profitAmount * shareRatio);

      if (profitShare > 0) {
        profitMap[m.id] = profitShare;
        totalCredited += profitShare;

        const tx: Transaction = {
          id: `tx-${Date.now()}-${idx}`,
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
        totalSavings: newGen + m.dpsSavingsBalance + m.fdrSavingsBalance + (m.shareValue || 0),
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
        addLoan,
        payLoanInstallment,
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
        totalSavingsInSomiti,
        totalActiveLoanBalance,
        todayStats,

        clearAllData,
        resetToDemoData,
        exportDatabaseJson,
        importDatabaseJson,
        distributeProfitToSavings,
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
