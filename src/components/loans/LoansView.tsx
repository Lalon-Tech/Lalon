import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Coins, 
  Search, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Calendar,
  Clock,
  XCircle,
  Calculator,
  PlusCircle,
  ShieldCheck,
  UserCheck,
  Phone,
  ArrowRight,
  ShieldAlert,
  Building2,
  Wallet,
  Check,
  X,
  Edit3,
  Trash2,
  History
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber,
  formatInteger
} from '../../utils/bengaliUtils';
import { Loan, PaymentMethod } from '../../types';
import { EditLoanModal } from './EditLoanModal';
import { DeleteLoanModal } from './DeleteLoanModal';
import { LoanAuditModal } from './LoanAuditModal';

export const LoansView: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    loans, 
    members,
    bankAccounts,
    activeTab,
    setActiveTab,
    useBengaliDigits, 
    setSelectedMemberId,
    applyForLoan,
    approveLoan,
    rejectLoan,
    payLoanInstallment,
    openReceiptForTx,
    currentUser
  } = useSomiti();

  const isMember = currentUser?.role === 'member';

  // Internal tab state synced with activeTab or local navigation
  const [currentTab, setCurrentTab] = useState<'overview' | 'apply' | 'pending' | 'kisti' | 'calculator'>('overview');

  useEffect(() => {
    if (activeTab === 'loans_apply') setCurrentTab('apply');
    else if (activeTab === 'loans_pending') setCurrentTab('pending');
    else if (activeTab === 'loans_kisti' || activeTab === 'transactions_kisti') setCurrentTab('kisti');
    else if (activeTab === 'loans_calculator') setCurrentTab('calculator');
    else if (activeTab === 'loans' || activeTab === 'loans_list' || activeTab === 'loans_active' || activeTab === 'loans_closed') setCurrentTab('overview');
  }, [activeTab]);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  // Pending loans count
  const pendingLoans = useMemo(() => loans.filter(l => l.status === 'pending'), [loans]);
  const activeLoans = useMemo(() => loans.filter(l => l.status === 'active'), [loans]);
  const clearedLoans = useMemo(() => loans.filter(l => l.status === 'cleared'), [loans]);
  const rejectedLoans = useMemo(() => loans.filter(l => l.status === 'rejected'), [loans]);

  // Search & Status filters for Overview table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cleared' | 'rejected'>('all');

  // Modal states for Loan Edit, Delete, and Audit history
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deletingLoan, setDeletingLoan] = useState<Loan | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      // Rule 7: Member can only view their own loans
      if (isMember && currentUser?.memberId && l.memberId !== currentUser.memberId) {
        return false;
      }

      // Exclude pending from standard overview unless search explicitly matches
      if (l.status === 'pending') return false;

      const q = (searchTerm || '').toLowerCase();
      const matchesSearch = 
        (l.loanNo ?? '').toLowerCase().includes(q) ||
        (l.memberName ?? '').toLowerCase().includes(q) ||
        (l.memberNo ?? '').toLowerCase().includes(q) ||
        (l.purpose ?? '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === 'active') return l.status === 'active';
      if (statusFilter === 'cleared') return l.status === 'cleared';
      if (statusFilter === 'rejected') return l.status === 'rejected';
      return true;
    });
  }, [loans, searchTerm, statusFilter]);

  const totalPrincipalDisbursed = useMemo(() => 
    loans.filter(l => l.status === 'active' || l.status === 'cleared').reduce((s, l) => s + l.principalAmount, 0),
  [loans]);

  const totalLoanRepaid = useMemo(() => 
    loans.reduce((s, l) => s + l.paidAmount, 0),
  [loans]);

  const totalOutstanding = useMemo(() => 
    loans.reduce((s, l) => s + (l.status === 'active' ? l.remainingAmount : 0), 0),
  [loans]);

  const recoveryPercentage = Math.round((totalLoanRepaid / (loans.reduce((s, l) => s + (l.status !== 'rejected' ? l.totalAmount : 0), 0) || 1)) * 100);

  // ==========================================
  // APPLY FORM STATE & DUPLICATE VALIDATION
  // ==========================================
  const [applyMemberId, setApplyMemberId] = useState('');
  const [applyPrincipal, setApplyPrincipal] = useState(50000);
  const [applyTermMonths, setApplyTermMonths] = useState(12);
  const [applyInterestRate, setApplyInterestRate] = useState(12);
  const [applyFrequency, setApplyFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [applyPurpose, setApplyPurpose] = useState('');
  const [applyGuarantorName, setApplyGuarantorName] = useState('');
  const [applyGuarantorPhone, setApplyGuarantorPhone] = useState('');
  const [applyGuarantorRelation, setApplyGuarantorRelation] = useState('পিতা');
  const [applyProcessingFee, setApplyProcessingFee] = useState(500);
  const [applyMethod, setApplyMethod] = useState<PaymentMethod>('cash');
  const [applyBankAccountId, setApplyBankAccountId] = useState('');
  const [applyFeedback, setApplyFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Duplicate active loan check for the chosen member
  const memberLoanStatus = useMemo(() => {
    if (!applyMemberId) return null;
    const member = members.find(m => m.id === applyMemberId);
    if (!member) return null;

    const existingActive = loans.find(l => l.memberId === applyMemberId && l.status === 'active');
    const existingPending = loans.find(l => l.memberId === applyMemberId && l.status === 'pending');

    const hasActiveBalance = (member.activeLoanBalance || 0) > 0;

    return {
      member,
      existingActive,
      existingPending,
      hasActiveBalance,
      isBlocked: !!existingActive || !!existingPending || hasActiveBalance
    };
  }, [applyMemberId, members, loans]);

  // Calculation for live application breakdown
  const liveApplyCalc = useMemo(() => {
    const p = Number(applyPrincipal) || 0;
    const r = Number(applyInterestRate) || 0;
    const m = Number(applyTermMonths) || 12;

    const totalInterest = Math.round(p * (r / 100) * (m / 12));
    const totalPayable = p + totalInterest;
    const installmentAmount = Math.ceil(totalPayable / m);

    return {
      principal: p,
      totalInterest,
      totalPayable,
      installmentCount: m,
      installmentAmount
    };
  }, [applyPrincipal, applyInterestRate, applyTermMonths]);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyFeedback(null);

    if (!applyMemberId) {
      setApplyFeedback({ success: false, message: isBn ? 'অনুগ্রহ করে সদস্য নির্বাচন করুন।' : 'Please select a member.' });
      return;
    }

    if (memberLoanStatus?.isBlocked) {
      setApplyFeedback({ 
        success: false, 
        message: isBn 
          ? 'এই সদস্যের ইতিমধ্যে সক্রিয় ঋণ বা পেন্ডিং আবেদন চলমান আছে। ডুপ্লিকেট আবেদন গ্রহণযোগ্য নয়।' 
          : 'This member already has an active loan or pending application. Duplicate application blocked.' 
      });
      return;
    }

    if (!applyPrincipal || applyPrincipal <= 0) {
      setApplyFeedback({ success: false, message: isBn ? 'সঠিক ঋণের পরিমাণ লিখুন।' : 'Please enter valid loan amount.' });
      return;
    }

    const res = applyForLoan({
      memberId: applyMemberId,
      principalAmount: Number(applyPrincipal),
      interestRate: Number(applyInterestRate),
      termMonths: Number(applyTermMonths),
      installmentFrequency: applyFrequency,
      purpose: applyPurpose.trim() || (isBn ? 'ব্যক্তিগত ব্যবসা' : 'Personal Business'),
      guarantorName: applyGuarantorName.trim(),
      guarantorPhone: applyGuarantorPhone.trim(),
      guarantorRelation: applyGuarantorRelation,
      processingFee: Number(applyProcessingFee) || 0,
      disbursementMethod: applyMethod,
      bankAccountId: applyBankAccountId || undefined,
    });

    if (res.success) {
      setApplyFeedback({ success: true, message: res.message });
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch (_) {}

      // Reset form
      setApplyMemberId('');
      setApplyPurpose('');
      setApplyGuarantorName('');
      setApplyGuarantorPhone('');

      // Auto redirect to pending tab after 1.2s
      setTimeout(() => {
        setCurrentTab('pending');
        setActiveTab('loans_pending');
      }, 1200);
    } else {
      setApplyFeedback({ success: false, message: res.message });
    }
  };

  // ==========================================
  // PENDING APPROVAL & REJECTION MODAL STATES
  // ==========================================
  const [approvingLoan, setApprovingLoan] = useState<Loan | null>(null);
  const [approveMethod, setApproveMethod] = useState<PaymentMethod>('cash');
  const [approveBankAccountId, setApproveBankAccountId] = useState('');
  const [approveComments, setApproveComments] = useState('');

  const [rejectingLoan, setRejectingLoan] = useState<Loan | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleConfirmApproval = () => {
    if (!approvingLoan) return;

    const res = approveLoan({
      loanId: approvingLoan.id,
      disbursementMethod: approveMethod,
      bankAccountId: approveBankAccountId || undefined,
      adminComment: approveComments.trim() || undefined,
    });

    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      } catch (_) {}
      setApprovingLoan(null);
      setApproveComments('');
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
  };

  const handleConfirmRejection = () => {
    if (!rejectingLoan) return;

    if (!rejectReason.trim()) {
      alert(isBn ? 'অনুগ্রহ করে ঋণ বাতিলের কারণ বা মন্তব্য লিখুন।' : 'Please provide a rejection reason.');
      return;
    }

    const res = rejectLoan({
      loanId: rejectingLoan.id,
      reason: rejectReason.trim(),
    });

    if (res.success) {
      setActionAlert({ type: 'success', message: res.message });
      setRejectingLoan(null);
      setRejectReason('');
    } else {
      setActionAlert({ type: 'error', message: res.message });
    }
  };

  // ==========================================
  // IN-PAGE KISTI POS STATE
  // ==========================================
  const [kistiMemberId, setKistiMemberId] = useState('');
  const [kistiLoanId, setKistiLoanId] = useState('');
  const [kistiAmount, setKistiAmount] = useState<number | ''>('');
  const [kistiFine, setKistiFine] = useState<number>(0);
  const [kistiDiscount, setKistiDiscount] = useState<number>(0);
  const [kistiMethod, setKistiMethod] = useState<PaymentMethod>('cash');
  const [kistiNotes, setKistiNotes] = useState('');
  const [kistiSuccessMsg, setKistiSuccessMsg] = useState<string | null>(null);

  // Available active loans for selected member or all active loans
  const availableKistiLoans = useMemo(() => {
    if (!kistiMemberId) return activeLoans;
    return activeLoans.filter(l => l.memberId === kistiMemberId);
  }, [activeLoans, kistiMemberId]);

  const selectedKistiLoan = useMemo(() => {
    return loans.find(l => l.id === kistiLoanId);
  }, [loans, kistiLoanId]);

  // When selected loan changes, initialize the manual installment amount from scheduled installment
  useEffect(() => {
    if (kistiLoanId) {
      const targetLoan = loans.find(l => l.id === kistiLoanId);
      if (targetLoan) {
        const sched = Array.isArray(targetLoan.schedule) && targetLoan.schedule.length > 0
          ? targetLoan.schedule
          : (Array.isArray(targetLoan.installmentSchedule) ? targetLoan.installmentSchedule : []);
        const nextUnpaid = sched.find((s: any) => s.status !== 'paid');
        const defaultAmt = nextUnpaid ? nextUnpaid.amount : (targetLoan.installmentAmount || 0);
        setKistiAmount(defaultAmt);
      }
    } else {
      setKistiAmount('');
    }
  }, [kistiLoanId]);

  const handleKistiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKistiSuccessMsg(null);

    if (!selectedKistiLoan) {
      alert(isBn ? 'অনুগ্রহ করে ঋণ হিসাব নির্বাচন করুন।' : 'Please select a loan account.');
      return;
    }

    const numericAmount = Number(kistiAmount);
    if (!numericAmount || numericAmount <= 0) {
      alert(isBn ? 'সঠিক কিস্তির টাকার পরিমাণ লিখুন।' : 'Please enter a valid installment amount.');
      return;
    }

    const sched = Array.isArray(selectedKistiLoan.schedule) && selectedKistiLoan.schedule.length > 0
      ? selectedKistiLoan.schedule
      : (Array.isArray(selectedKistiLoan.installmentSchedule) ? selectedKistiLoan.installmentSchedule : []);
    const nextUnpaid = sched.find((s: any) => s.status !== 'paid');
    const installmentNo = nextUnpaid ? nextUnpaid.installmentNo : ((selectedKistiLoan.paidInstallmentsCount || 0) + 1);

    const res = payLoanInstallment({
      loanId: selectedKistiLoan.id,
      installmentNo,
      amount: numericAmount,
      collectedAmount: numericAmount,
      fine: Number(kistiFine) || 0,
      lateFee: Number(kistiFine) || 0,
      discount: Number(kistiDiscount) || 0,
      paymentMethod: kistiMethod,
      notes: kistiNotes.trim() || undefined,
    });

    if (res && res.success) {
      setKistiSuccessMsg(res.message);
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}

      // Reset
      setKistiAmount('');
      setKistiFine(0);
      setKistiDiscount(0);
      setKistiNotes('');

      // Open receipt if transaction was generated
      if (res.id) {
        openReceiptForTx(res);
      }
    } else {
      alert(res?.message || (isBn ? 'কিস্তি সংগ্রহে সমস্যা হয়েছে।' : 'Failed to collect installment.'));
    }
  };

  // ==========================================
  // CALCULATOR TAB STATE
  // ==========================================
  const [calcPrincipal, setCalcPrincipal] = useState(100000);
  const [calcRate, setCalcRate] = useState(12);
  const [calcMonths, setCalcMonths] = useState(12);

  const calcOutput = useMemo(() => {
    const p = Number(calcPrincipal) || 0;
    const r = Number(calcRate) || 0;
    const m = Number(calcMonths) || 1;

    const totalInterest = Math.round(p * (r / 100) * (m / 12));
    const totalPayable = p + totalInterest;
    const emi = Math.ceil(totalPayable / m);

    return {
      principal: p,
      interest: totalInterest,
      total: totalPayable,
      emi,
      months: m
    };
  }, [calcPrincipal, calcRate, calcMonths]);

  // Excel Export
  const exportExcel = () => {
    const data = filteredLoans.map(l => ({
      [isBn ? 'ঋণ হিসাব নং' : 'Loan A/C No']: l.loanNo,
      [isBn ? 'সদস্য নাম' : 'Member Name']: l.memberName,
      [isBn ? 'সদস্য নং' : 'Member No']: l.memberNo,
      [isBn ? 'উদ্দেশ্য' : 'Purpose']: l.purpose,
      [isBn ? 'মূল ঋণ (৳)' : 'Principal (৳)']: l.principalAmount,
      [isBn ? 'সুদসহ মোট প্রদেয় (৳)' : 'Total Payable (৳)']: l.totalAmount,
      [isBn ? 'মোট আদায় (৳)' : 'Total Repaid (৳)']: l.paidAmount,
      [isBn ? 'অবশিষ্ট বকেয়া (৳)' : 'Outstanding (৳)']: l.remainingAmount,
      [isBn ? 'কিস্তি সংখ্যা' : 'Installment']: `${l.paidInstallmentsCount}/${l.totalInstallments}`,
      [isBn ? 'বিতরণের তারিখ' : 'Disbursement Date']: l.disbursedDate,
      [isBn ? 'অবস্থা' : 'Status']: l.status === 'active' ? (isBn ? 'চলমান' : 'Active') : (isBn ? 'পরিশোধিত' : 'Cleared'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'ঋণ হিসাব তালিকা' : 'Loans List');
    XLSX.writeFile(wb, `loans_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Module Navigation Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-xl">
          <button
            onClick={() => { setCurrentTab('overview'); setActiveTab('loans'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'overview'
                ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{isBn ? 'ঋণ তালিকা ও বিবরণী' : 'Loans Overview'}</span>
          </button>

          <button
            onClick={() => { setCurrentTab('apply'); setActiveTab('loans_apply'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'apply'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isBn ? 'নতুন ঋণের আবেদন' : 'Apply for Loan'}</span>
          </button>

          <button
            onClick={() => { setCurrentTab('pending'); setActiveTab('loans_pending'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative cursor-pointer ${
              currentTab === 'pending'
                ? 'bg-white text-amber-800 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{isBn ? 'অনুমোদন ও পেন্ডিং' : 'Approvals & Pending'}</span>
            {pendingLoans.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow-2xs">
                {displayCount(pendingLoans.length)}
              </span>
            )}
          </button>

          <button
            onClick={() => { setCurrentTab('kisti'); setActiveTab('loans_kisti'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'kisti'
                ? 'bg-white text-teal-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Coins className="w-4 h-4 text-teal-600" />
            <span>{isBn ? 'কিস্তি আদায় (POS)' : 'Kisti Collection POS'}</span>
          </button>

          <button
            onClick={() => { setCurrentTab('calculator'); setActiveTab('loans_calculator'); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              currentTab === 'calculator'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calculator className="w-4 h-4 text-slate-500" />
            <span>{isBn ? 'ঋণ ক্যালকুলেটর' : 'Loan Calculator'}</span>
          </button>
        </div>

        {/* Pending loan quick callout */}
        {pendingLoans.length > 0 && currentTab !== 'pending' && (
          <button
            onClick={() => { setCurrentTab('pending'); setActiveTab('loans_pending'); }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>{isBn ? `${displayCount(pendingLoans.length)} টি ঋণের আবেদন অনুমোদনের অপেক্ষায় আছে` : `${displayCount(pendingLoans.length)} loans pending approval`}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Global Action Notifications */}
      {actionAlert && (
        <div className={`p-4 rounded-xl border flex items-center justify-between animate-in fade-in ${
          actionAlert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {actionAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{actionAlert.message}</span>
          </div>
          <button 
            onClick={() => setActionAlert(null)}
            className="text-xs font-bold px-2 py-1 hover:bg-black/5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & LIST                                         */}
      {/* ============================================================== */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                {isBn ? 'সর্বমোট ঋণ বিতরণ' : 'Total Loans Disbursed'}
              </span>
              <div className="text-2xl font-bold text-indigo-700">
                {formatCurrency(totalPrincipalDisbursed, isBn && useBengaliDigits)}
              </div>
              <span className="text-xs text-slate-400">
                {isBn ? `মোট ${displayCount(activeLoans.length + clearedLoans.length)} টি ঋণ নিষ্পত্তি` : `Total ${displayCount(activeLoans.length + clearedLoans.length)} Loans`}
              </span>
            </div>

            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                {isBn ? 'মাঠে বকেয়া পাওনা' : 'Outstanding Balance'}
              </span>
              <div className="text-2xl font-bold text-rose-600">
                {formatCurrency(totalOutstanding, isBn && useBengaliDigits)}
              </div>
              <span className="text-xs text-slate-400">
                {isBn ? `চলমান ঋণ: ${displayCount(activeLoans.length)} টি` : `Active Loans: ${displayCount(activeLoans.length)}`}
              </span>
            </div>

            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                {isBn ? 'মোট কিস্তি আদায়' : 'Total Repaid Installments'}
              </span>
              <div className="text-2xl font-bold text-emerald-700">
                {formatCurrency(totalLoanRepaid, isBn && useBengaliDigits)}
              </div>
              <span className="text-xs text-emerald-600 font-medium">
                {isBn ? 'নিয়মিত আদায় হচ্ছে' : 'Regular Collections'}
              </span>
            </div>

            <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold block mb-1">
                {isBn ? 'ঋণ পরিশোধের হার' : 'Recovery Rate'}
              </span>
              <div className="text-2xl font-bold text-slate-800">
                {totalPrincipalDisbursed > 0 
                  ? `${displayCount(recoveryPercentage)}%`
                  : (isBn ? '০%' : '0%')}
              </div>
              <span className="text-xs text-slate-400">
                {isBn ? 'রিকভারি পারফরম্যান্স' : 'Recovery Performance'}
              </span>
            </div>
          </div>

          {/* Control Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isBn ? "ঋণ নং, সদস্যের নাম বা উদ্দেশ্য খুঁজুন..." : "Search loan no, member name or purpose..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'}`}
                >
                  {isBn ? `সকল (${displayCount(loans.filter(l => l.status !== 'pending').length)})` : `All (${displayCount(loans.filter(l => l.status !== 'pending').length)})`}
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'active' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'}`}
                >
                  {isBn ? `চলমান (${displayCount(activeLoans.length)})` : `Active (${displayCount(activeLoans.length)})`}
                </button>
                <button
                  onClick={() => setStatusFilter('cleared')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'cleared' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600'}`}
                >
                  {isBn ? `পরিশোধিত (${displayCount(clearedLoans.length)})` : `Cleared (${displayCount(clearedLoans.length)})`}
                </button>
              </div>

              <button
                onClick={exportExcel}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBn ? 'এক্সেল' : 'Excel'}</span>
              </button>

              <button
                onClick={() => setShowAuditModal(true)}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                title={isBn ? "ঋণ হিসাবের পরিবর্তন ও ডিলিট হিস্ট্রি দেখুন" : "View Loan Audit Logs"}
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isBn ? 'অডিট হিস্ট্রি' : 'Audit Logs'}</span>
              </button>

              <button
                onClick={() => { setCurrentTab('kisti'); setActiveTab('loans_kisti'); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>{isBn ? 'কিস্তি আদায়' : 'Collect Kisti'}</span>
              </button>

              <button
                onClick={() => { setCurrentTab('apply'); setActiveTab('loans_apply'); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isBn ? 'নতুন ঋণের আবেদন' : 'Apply for Loan'}</span>
              </button>
            </div>
          </div>

          {/* Loans Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{isBn ? 'ঋণ নং ও উদ্দেশ্য' : 'Loan No & Purpose'}</th>
                    <th className="py-3 px-4">{isBn ? 'সদস্য তথ্য' : 'Member Info'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'মূল ঋণ' : 'Principal'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'মোট প্রদেয়' : 'Total Payable'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'মোট আদায়' : 'Total Paid'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'অবশিষ্ট বকেয়া' : 'Remaining'}</th>
                    <th className="py-3 px-4 text-center">{isBn ? 'কিস্তি প্রগ্রেস' : 'Progress'}</th>
                    <th className="py-3 px-4 text-center">{isBn ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        {isBn ? 'কোনো ঋণ হিসাব পাওয়া যায়নি।' : 'No loan accounts found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 font-mono">{loan.loanNo}</div>
                          <span className="text-[11px] text-slate-500">{loan.purpose}</span>
                          <span className="block text-[10px] text-slate-400">
                            {formatBengaliDate(loan.disbursedDate, isBn)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div 
                            onClick={() => { setSelectedMemberId(loan.memberId); setActiveTab('member_profile'); }}
                            className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer"
                          >
                            {loan.memberName}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{loan.memberNo}</span>
                          {loan.guarantorName && (
                            <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                              {isBn ? `জামিনদার: ${loan.guarantorName}` : `Guarantor: ${loan.guarantorName}`}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-800 text-sm">
                          {formatCurrency(loan.principalAmount, isBn && useBengaliDigits)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-indigo-900 text-sm">
                          {formatCurrency(loan.totalAmount, isBn && useBengaliDigits)}
                          <span className="block text-[10px] text-slate-400">
                            {isBn ? `সুদ: ${formatCurrency(loan.interestAmount, isBn && useBengaliDigits)}` : `Interest: ${formatCurrency(loan.interestAmount, isBn && useBengaliDigits)}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                          {formatCurrency(loan.paidAmount, isBn && useBengaliDigits)}
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">
                          {formatCurrency(loan.remainingAmount, isBn && useBengaliDigits)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="font-bold text-slate-700 text-xs">
                            {displayCount(loan.paidInstallmentsCount)} / {displayCount(loan.totalInstallments)}
                          </div>
                          <div className="w-20 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full" 
                              style={{ width: `${(loan.paidInstallmentsCount / (loan.totalInstallments || 1)) * 100}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : loan.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {loan.status === 'cleared' 
                              ? (isBn ? 'পরিশোধিত ✓' : 'Cleared ✓') 
                              : loan.status === 'rejected'
                              ? (isBn ? 'বাতিল' : 'Rejected')
                              : (isBn ? 'চলমান কিস্তি' : 'Active')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {loan.status === 'active' && (
                              <button
                                onClick={() => {
                                  setKistiMemberId(loan.memberId);
                                  setKistiLoanId(loan.id);
                                  setCurrentTab('kisti');
                                }}
                                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                              >
                                {isBn ? 'কিস্তি আদায়' : 'Collect'}
                              </button>
                            )}
                            <button
                              onClick={() => { setSelectedMemberId(loan.memberId); setActiveTab('member_profile'); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                              title={isBn ? "সদস্য প্রোফাইল ও লেজার দেখুন" : "View Member Profile"}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setEditingLoan(loan)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded cursor-pointer transition-colors"
                              title={isBn ? "ঋণ হিসাব এডিট / সংশোধন করুন" : "Edit Loan Account"}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeletingLoan(loan)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                              title={isBn ? "ঋণ হিসাব ডিলিট বা রিভার্স করুন" : "Delete or Reverse Loan Account"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: APPLY FOR LOAN (IN-PAGE FORM WITH DUPLICATE VALIDATION) */}
      {/* ============================================================== */}
      {currentTab === 'apply' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isBn ? 'নতুন ঋণের আবেদন ফরম (Loan Application)' : 'New Loan Application'}
                </h3>
                <p className="text-xs text-slate-300">
                  {isBn ? 'সদস্যের ঋণের আবেদন গ্রহণ ও যাচাইকরণ' : 'Accept and verify member loan application'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentTab('overview')}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              {isBn ? '← ঋণ তালিকায় ফিরুন' : '← Back to Loans'}
            </button>
          </div>

          <form onSubmit={handleApplySubmit} className="p-6 space-y-6">
            {applyFeedback && (
              <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
                applyFeedback.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {applyFeedback.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
                <span>{applyFeedback.message}</span>
              </div>
            )}

            {/* Member Selection */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {isBn ? '১. ঋণগ্রহীতা সদস্য নির্বাচন করুন *' : '1. Select Borrower Member *'}
              </label>
              <select
                value={applyMemberId}
                onChange={(e) => setApplyMemberId(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{isBn ? '-- সদস্য নির্বাচন করুন --' : '-- Select Member --'}</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.memberNo} - {m.name} ({m.phone}) {m.activeLoanBalance > 0 ? (isBn ? ' [চলতি ঋণ আছে]' : ' [Has Active Loan]') : ''}
                  </option>
                ))}
              </select>

              {/* Duplicate Loan Warning Banner */}
              {memberLoanStatus?.isBlocked && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-900 mb-0.5">
                      {isBn ? 'ডুপ্লিকেট ঋণ আবেদন নিষিদ্ধ (Duplicate Loan Blocked)' : 'Duplicate Loan Application Blocked'}
                    </div>
                    <p className="leading-relaxed">
                      {isBn 
                        ? `এই সদস্যের (${memberLoanStatus.member.name}) ইতোমধ্যে সক্রিয় ঋণ (বকেয়া: ${formatCurrency(memberLoanStatus.member.activeLoanBalance, isBn && useBengaliDigits)}) অথবা পেন্ডিং আবেদন বিদ্যমান আছে। সমিতির নিয়ম অনুযায়ী পূর্বের ঋণ সম্পূর্ণ পরিশোধ না হওয়া পর্যন্ত নতুন ঋণ আবেদন গ্রহণযোগ্য নয়।`
                        : `This member already has an active loan (Remaining: ${formatCurrency(memberLoanStatus.member.activeLoanBalance)}) or pending application. Duplicate active loans are strictly blocked.`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Loan Principal & Term */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'ঋণের মূল পরিমাণ (৳) *' : 'Principal Amount (৳) *'}
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={applyPrincipal}
                  onChange={(e) => setApplyPrincipal(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'মেয়াদ (মাস) *' : 'Term (Months) *'}
                </label>
                <select
                  value={applyTermMonths}
                  onChange={(e) => setApplyTermMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={3}>{isBn ? '৩ মাস' : '3 Months'}</option>
                  <option value={6}>{isBn ? '৬ মাস' : '6 Months'}</option>
                  <option value={12}>{isBn ? '১২ মাস (১ বছর)' : '12 Months (1 Year)'}</option>
                  <option value={18}>{isBn ? '১৮ মাস' : '18 Months'}</option>
                  <option value={24}>{isBn ? '২৪ মাস (২ বছর)' : '24 Months (2 Years)'}</option>
                  <option value={36}>{isBn ? '৩৬ মাস (৩ বছর)' : '36 Months (3 Years)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'বার্ষিক লভ্যাংশ/সুদের হার (%) *' : 'Interest Rate (%) *'}
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={applyInterestRate}
                  onChange={(e) => setApplyInterestRate(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Frequency & Purpose */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'কিস্তি আদায়ের ধরন' : 'Installment Frequency'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'weekly', 'daily'] as const).map((freq) => (
                    <button
                      type="button"
                      key={freq}
                      onClick={() => setApplyFrequency(freq)}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        applyFrequency === freq
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {freq === 'monthly' ? (isBn ? 'মাসিক' : 'Monthly') : freq === 'weekly' ? (isBn ? 'সাপ্তাহিক' : 'Weekly') : (isBn ? 'দৈনিক' : 'Daily')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'ঋণ গ্রহণের উদ্দেশ্য *' : 'Loan Purpose *'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'উদা: ব্যবসা সম্প্রসারণ, কৃষি খামার, দোকান' : 'e.g. Business expansion'}
                  value={applyPurpose}
                  onChange={(e) => setApplyPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Guarantor Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>{isBn ? '২. জামিনদার / গ্যারান্টরের তথ্য' : '2. Guarantor Information'}</span>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isBn ? 'জামিনদারের নাম' : 'Guarantor Name'}
                  </label>
                  <input
                    type="text"
                    value={applyGuarantorName}
                    onChange={(e) => setApplyGuarantorName(e.target.value)}
                    placeholder={isBn ? 'নাম লিখুন' : 'Name'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isBn ? 'সম্পর্ক' : 'Relationship'}
                  </label>
                  <select
                    value={applyGuarantorRelation}
                    onChange={(e) => setApplyGuarantorRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="পিতা">{isBn ? 'পিতা' : 'Father'}</option>
                    <option value="মাতা">{isBn ? 'মাতা' : 'Mother'}</option>
                    <option value="স্বামী/স্ত্রী">{isBn ? 'স্বামী/স্ত্রী' : 'Spouse'}</option>
                    <option value="ভাই">{isBn ? 'ভাই' : 'Brother'}</option>
                    <option value="বোন">{isBn ? 'বোন' : 'Sister'}</option>
                    <option value="ব্যবসায়ী পার্টনার">{isBn ? 'ব্যবসায়ী পার্টনার' : 'Business Partner'}</option>
                    <option value="অন্যান্য">{isBn ? 'অন্যান্য' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={applyGuarantorPhone}
                    onChange={(e) => setApplyGuarantorPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Processing Fee & Preferred Disbursement Method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'প্রসেসিং / ফরম ফি (৳)' : 'Processing Fee (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={applyProcessingFee}
                  onChange={(e) => setApplyProcessingFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'বিতরণের মাধ্যম পছন্দ' : 'Preferred Disbursement'}
                </label>
                <select
                  value={applyMethod}
                  onChange={(e) => setApplyMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cash">{isBn ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
                  <option value="bank">{isBn ? 'ব্যাংক ট্রান্সফার (Bank)' : 'Bank Transfer'}</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                </select>
              </div>

              {applyMethod === 'bank' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'ব্যাংক অ্যাকাউন্ট' : 'Bank Account'}
                  </label>
                  <select
                    value={applyBankAccountId}
                    onChange={(e) => setApplyBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{isBn ? '-- ব্যাংক নির্বাচন করুন --' : '-- Select Bank --'}</option>
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4.5">
              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">
                {isBn ? '📊 ঋণের প্রাক্কলিত হিসাব বিবরণী (Live Breakdown)' : '📊 Loan Breakdown Summary'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block mb-0.5">{isBn ? 'মূল ঋণ:' : 'Principal:'}</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(liveApplyCalc.principal, isBn && useBengaliDigits)}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block mb-0.5">{isBn ? 'মোট লাভ/সুদ:' : 'Total Interest:'}</span>
                  <span className="text-sm font-bold text-indigo-700">{formatCurrency(liveApplyCalc.totalInterest, isBn && useBengaliDigits)}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block mb-0.5">{isBn ? 'মোট প্রদেয়:' : 'Total Payable:'}</span>
                  <span className="text-sm font-bold text-emerald-700">{formatCurrency(liveApplyCalc.totalPayable, isBn && useBengaliDigits)}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100">
                  <span className="text-slate-500 block mb-0.5">{isBn ? 'প্রতি কিস্তি:' : 'Per Installment:'}</span>
                  <span className="text-sm font-bold text-blue-700">{formatCurrency(liveApplyCalc.installmentAmount, isBn && useBengaliDigits)}</span>
                  <span className="block text-[10px] text-slate-400">
                    ({displayCount(liveApplyCalc.installmentCount)} {isBn ? 'টি কিস্তি' : 'installments'})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentTab('overview')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={memberLoanStatus?.isBlocked}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                  memberLoanStatus?.isBlocked
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-indigo-700 hover:bg-indigo-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{isBn ? 'ঋণ আবেদন জমা দিন' : 'Submit Loan Application'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PENDING APPROVALS & REJECTIONS (WORKFLOW)                */}
      {/* ============================================================== */}
      {currentTab === 'pending' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{isBn ? 'পেন্ডিং ঋণের আবেদন ও অ্যাডমিন অনুমোদন' : 'Pending Loan Applications & Admin Approval'}</span>
                {pendingLoans.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                    {displayCount(pendingLoans.length)} {isBn ? 'টি পেন্ডিং' : 'Pending'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isBn ? 'এখানে নতুন ঋণের আবেদনগুলো যাচাই করে অ্যাডমিন অনুমোদন বা বাতিল করতে পারবেন।' : 'Review member loan requests to disburse or reject.'}
              </p>
            </div>

            <button
              onClick={() => setCurrentTab('apply')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isBn ? 'নতুন ঋণের আবেদন' : 'New Application'}</span>
            </button>
          </div>

          {/* Pending Applications List */}
          {pendingLoans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {isBn ? 'বর্তমানে কোনো পেন্ডিং ঋণের আবেদন নেই' : 'No Pending Loan Applications'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {isBn 
                  ? 'সকল ঋণ আবেদন প্রক্রিয়া সম্পন্ন হয়েছে। নতুন ঋণের আবেদন গ্রহণের জন্য "নতুন ঋণের আবেদন" বোতামে ক্লিক করুন।' 
                  : 'All applications have been processed. Click "New Application" to add a new request.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingLoans.map((loan) => (
                <div key={loan.id} className="bg-white rounded-2xl border border-amber-200 shadow-xs hover:shadow-md transition-all p-5 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                          {loan.loanNo}
                        </span>
                        <span className="text-xs font-bold text-slate-800">
                          {loan.memberName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                        {loan.memberNo} • {isBn ? 'আবেদনের তারিখ:' : 'Applied:'} {formatBengaliDate(loan.disbursedDate, isBn)}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                      <span>{isBn ? 'অনুমোদন অপেক্ষমাণ' : 'Pending Approval'}</span>
                    </span>
                  </div>

                  {/* Financial Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isBn ? 'মূল ঋণ' : 'Principal'}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(loan.principalAmount, isBn && useBengaliDigits)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isBn ? 'সুদসহ মোট' : 'Total'}</span>
                      <span className="font-bold text-indigo-700">{formatCurrency(loan.totalAmount, isBn && useBengaliDigits)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isBn ? 'মেয়াদ' : 'Term'}</span>
                      <span className="font-bold text-slate-700">{displayCount(loan.termMonths)} {isBn ? 'মাস' : 'Mo'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{isBn ? 'প্রতি কিস্তি' : 'EMI'}</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(loan.installmentAmount, isBn && useBengaliDigits)}</span>
                    </div>
                  </div>

                  {/* Purpose & Guarantor */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">{isBn ? 'উদ্দেশ্য:' : 'Purpose:'}</span>
                      <span className="font-medium text-slate-800">{loan.purpose}</span>
                    </div>
                    {loan.guarantorName && (
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-slate-500">{isBn ? 'জামিনদার:' : 'Guarantor:'}</span>
                        <span>{loan.guarantorName} ({loan.guarantorRelation}) {loan.guarantorPhone && `• ${loan.guarantorPhone}`}</span>
                      </div>
                    )}
                    {loan.processingFee ? (
                      <div className="text-[11px] text-slate-500">
                        {isBn ? `প্রসেসিং ফি: ${formatCurrency(loan.processingFee, isBn && useBengaliDigits)}` : `Processing Fee: ${formatCurrency(loan.processingFee)}`}
                      </div>
                    ) : null}
                  </div>

                  {/* Approval Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRejectingLoan(loan);
                        setRejectReason('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>{isBn ? 'বাতিল করুন (Reject)' : 'Reject'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setApprovingLoan(loan);
                        setApproveMethod(loan.disbursementMethod || 'cash');
                        setApproveBankAccountId(loan.bankAccountId || '');
                        setApproveComments('');
                      }}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{isBn ? 'অনুমোদন ও বিতরণ (Approve)' : 'Approve & Disburse'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* APPROVAL CONFIRMATION MODAL */}
          {approvingLoan && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95">
                <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5" />
                    <div>
                      <h4 className="text-sm font-bold">{isBn ? 'ঋণ অনুমোদন ও তহবিল বিতরণ' : 'Approve & Disburse Loan'}</h4>
                      <p className="text-[11px] text-emerald-100">{approvingLoan.loanNo} • {approvingLoan.memberName}</p>
                    </div>
                  </div>
                  <button onClick={() => setApprovingLoan(null)} className="text-emerald-200 hover:text-white">✕</button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold">{isBn ? 'বিতরণযোগ্য মূল ঋণ:' : 'Principal to Disburse:'}</span>
                      <span className="font-bold text-sm">{formatCurrency(approvingLoan.principalAmount, isBn && useBengaliDigits)}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>{isBn ? 'সুদসহ মোট আদায় হবে:' : 'Total to be collected:'}</span>
                      <span>{formatCurrency(approvingLoan.totalAmount, isBn && useBengaliDigits)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'বিতরণের মাধ্যম (Disbursement Method) *' : 'Disbursement Method *'}
                    </label>
                    <select
                      value={approveMethod}
                      onChange={(e) => setApproveMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900"
                    >
                      <option value="cash">{isBn ? 'নগদ ক্যাশ বক্স (Cash)' : 'Cash'}</option>
                      <option value="bank">{isBn ? 'ব্যাংক ট্রান্সফার (Bank Transfer)' : 'Bank Transfer'}</option>
                      <option value="bkash">bKash</option>
                      <option value="nagad">Nagad</option>
                    </select>
                  </div>

                  {approveMethod === 'bank' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {isBn ? 'সমিতির প্রেরক ব্যাংক অ্যাকাউন্ট' : 'Somiti Sender Bank Account'}
                      </label>
                      <select
                        value={approveBankAccountId}
                        onChange={(e) => setApproveBankAccountId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                      >
                        <option value="">{isBn ? '-- ব্যাংক নির্বাচন করুন --' : '-- Select Bank --'}</option>
                        {bankAccounts.map(b => (
                          <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber} (ব্যালেন্স: ৳{formatInteger(b.currentBalance)})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {isBn ? 'অ্যাডমিন মন্তব্য / নোট (ঐচ্ছিক)' : 'Admin Remarks / Notes (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={approveComments}
                      onChange={(e) => setApproveComments(e.target.value)}
                      placeholder={isBn ? 'অনুমোদনের কোনো বিশেষ শর্ত বা মন্তব্য লিখুন...' : 'Any approval conditions...'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setApprovingLoan(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleConfirmApproval}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isBn ? 'অনুমোদন নিশ্চিত করুন' : 'Confirm Approval'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REJECTION DIALOG (MANDATORY REASON) */}
          {rejectingLoan && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95">
                <div className="bg-rose-700 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <XCircle className="w-5 h-5" />
                    <div>
                      <h4 className="text-sm font-bold">{isBn ? 'ঋণ আবেদন বাতিলকরণ' : 'Reject Loan Application'}</h4>
                      <p className="text-[11px] text-rose-100">{rejectingLoan.loanNo} • {rejectingLoan.memberName}</p>
                    </div>
                  </div>
                  <button onClick={() => setRejectingLoan(null)} className="text-rose-200 hover:text-white">✕</button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      {isBn ? 'বাতিলের সুনির্দিষ্ট কারণ / মন্তব্য লিখুন *' : 'Rejection Reason / Remarks *'}
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={isBn ? 'উদা: জামিনদারের তথ্য অসত্য / পূর্ববর্তী ঋণ অপরিশোধিত / সদস্যের আয়ের উৎস অপর্যাপ্ত...' : 'State clear rejection reason...'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* Preset Reasons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      {isBn ? 'দ্রুত কারণ নির্বাচন করুন:' : 'Quick Presets:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        isBn ? 'জামিনদারের তথ্য অসত্য' : 'Guarantor info invalid',
                        isBn ? 'আয়ের উৎস অপর্যাপ্ত' : 'Insufficient income proof',
                        isBn ? 'সদস্যের অনুরোধে বাতিল' : 'Cancelled on member request',
                        isBn ? 'কমিটির অনুমোদন মেলেনি' : 'Not approved by committee'
                      ].map((preset) => (
                        <button
                          type="button"
                          key={preset}
                          onClick={() => setRejectReason(preset)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setRejectingLoan(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleConfirmRejection}
                      disabled={!rejectReason.trim()}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isBn ? 'বাতিল নিশ্চিত করুন' : 'Confirm Rejection'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: KISTI COLLECTION POS (EDITABLE NUMERIC INPUT)           */}
      {/* ============================================================== */}
      {currentTab === 'kisti' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden max-w-3xl mx-auto">
          <div className="bg-teal-700 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-800 rounded-xl">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isBn ? 'কিস্তি আদায় টার্মিনাল (Kisti POS Collection)' : 'Kisti Collection POS'}
                </h3>
                <p className="text-xs text-teal-100">
                  {isBn ? 'সদস্যের ঋণের কিস্তি সরাসরি আদায় করুন' : 'Directly collect loan installment'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentTab('overview')}
              className="text-xs text-teal-200 hover:text-white px-3 py-1.5 rounded-lg border border-teal-600 hover:bg-teal-800 transition-colors"
            >
              {isBn ? '← ঋণ তালিকায় ফিরুন' : '← Back to Loans'}
            </button>
          </div>

          <form onSubmit={handleKistiSubmit} className="p-6 space-y-5">
            {kistiSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{kistiSuccessMsg}</span>
              </div>
            )}

            {/* Select Active Borrower */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? '১. ঋণগ্রহীতা সদস্য নির্বাচন করুন' : '1. Select Borrower'}
                </label>
                <select
                  value={kistiMemberId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setKistiMemberId(mId);
                    const mLoan = activeLoans.find(l => l.memberId === mId);
                    if (mLoan) setKistiLoanId(mLoan.id);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{isBn ? '-- সকল ঋণগ্রহীতা --' : '-- All Borrowers --'}</option>
                  {members.filter(m => activeLoans.some(l => l.memberId === m.id)).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? '২. সক্রিয় ঋণ হিসাব নির্বাচন করুন *' : '2. Select Active Loan *'}
                </label>
                <select
                  value={kistiLoanId}
                  onChange={(e) => setKistiLoanId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{isBn ? '-- ঋণ হিসাব নির্বাচন করুন --' : '-- Select Loan Account --'}</option>
                  {availableKistiLoans.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.loanNo} - {l.memberName} (বকেয়া: ৳{formatInteger(l.remainingAmount)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Loan Status Card */}
            {selectedKistiLoan && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">{isBn ? 'মোট ঋণ:' : 'Total Loan:'}</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedKistiLoan.totalAmount, isBn && useBengaliDigits)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isBn ? 'পরিশোধিত:' : 'Paid:'}</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(selectedKistiLoan.paidAmount, isBn && useBengaliDigits)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isBn ? 'অবশিষ্ট বকেয়া:' : 'Remaining:'}</span>
                  <span className="font-bold text-rose-600">{formatCurrency(selectedKistiLoan.remainingAmount, isBn && useBengaliDigits)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">{isBn ? 'কিস্তি অগ্রগতি:' : 'Progress:'}</span>
                  <span className="font-bold text-indigo-700">
                    {displayCount(selectedKistiLoan.paidInstallmentsCount)} / {displayCount(selectedKistiLoan.totalInstallments)}
                  </span>
                </div>
              </div>
            )}

            {/* Installment Amount (Un-locked Editable Number Field) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  {isBn ? 'কিস্তির টাকার পরিমাণ (৳) *' : 'Installment Amount (৳) *'}
                  <span className="text-teal-700 font-normal ml-1">
                    ({isBn ? 'এডিটেবল' : 'Editable'})
                  </span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={kistiAmount === '' ? '' : kistiAmount}
                  onChange={(e) => {
                    const v = e.target.value;
                    setKistiAmount(v === '' ? '' : Number(v));
                  }}
                  required
                  placeholder={isBn ? "টাকার পরিমাণ লিখুন" : "Enter amount"}
                  className="w-full px-3 py-2.5 bg-white border-2 border-teal-500 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-teal-600 shadow-2xs"
                />
                {selectedKistiLoan && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sched = Array.isArray(selectedKistiLoan.schedule) && selectedKistiLoan.schedule.length > 0
                          ? selectedKistiLoan.schedule
                          : (Array.isArray(selectedKistiLoan.installmentSchedule) ? selectedKistiLoan.installmentSchedule : []);
                        const nextUnpaid = sched.find((s: any) => s.status !== 'paid');
                        setKistiAmount(nextUnpaid ? nextUnpaid.amount : (selectedKistiLoan.installmentAmount || 0));
                      }}
                      className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {isBn ? 'নিয়মিত কিস্তি' : 'Regular'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setKistiAmount(selectedKistiLoan.remainingAmount)}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {isBn ? 'পূর্ণ বকেয়া' : 'Full Due'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'বিলম্ব ফি / জরিমানা (৳)' : 'Late Fee (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={kistiFine}
                  onChange={(e) => setKistiFine(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? 'মওকুফ / ডিসকাউন্ট (৳)' : 'Discount (৳)'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={kistiDiscount}
                  onChange={(e) => setKistiDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Payment Method & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'পেমেন্ট মাধ্যম *' : 'Payment Method *'}
                </label>
                <select
                  value={kistiMethod}
                  onChange={(e) => setKistiMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900"
                >
                  <option value="cash">{isBn ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">{isBn ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'মন্তব্য / বিবরণ' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'উদা: কিস্তি আদায়' : 'e.g. Regular installment'}
                  value={kistiNotes}
                  onChange={(e) => setKistiNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Total Collect Preview */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-teal-800 font-semibold block">
                  {isBn ? 'মোট আদায়কৃত টাকা (Net Collection)' : 'Net Collection Amount'}
                </span>
                <span className="text-xl font-bold text-teal-900">
                  {formatCurrency((Number(kistiAmount) || 0) + (Number(kistiFine) || 0) - (Number(kistiDiscount) || 0), isBn && useBengaliDigits)}
                </span>
              </div>

              <button
                type="submit"
                disabled={!selectedKistiLoan || !kistiAmount}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Coins className="w-4 h-4" />
                <span>{isBn ? 'কিস্তি আদায় সম্পন্ন করুন' : 'Confirm Collection'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: LOAN CALCULATOR                                         */}
      {/* ============================================================== */}
      {currentTab === 'calculator' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isBn ? 'ঋণ ও কিস্তি ক্যালকুলেটর (Loan EMI Calculator)' : 'Loan EMI Calculator'}
              </h3>
              <p className="text-xs text-slate-500">
                {isBn ? 'ঋণের পরিমাণ, সুদের হার ও মেয়াদ অনুযায়ী কিস্তির পরিমাণ হিসাব করুন' : 'Calculate monthly EMI and total interest'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'ঋণের পরিমাণ (৳)' : 'Principal Amount (৳)'}
              </label>
              <input
                type="number"
                step="5000"
                min="5000"
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'বার্ষিক সুদের হার (%)' : 'Interest Rate (%)'}
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={calcRate}
                onChange={(e) => setCalcRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'পরিশোধের মেয়াদ (মাস)' : 'Term (Months)'}
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={calcMonths}
                onChange={(e) => setCalcMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Calculator Output Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">{isBn ? 'মূল ঋণ' : 'Principal'}</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(calcOutput.principal, isBn && useBengaliDigits)}</span>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <span className="text-xs text-indigo-700 block mb-1">{isBn ? 'মোট লাভ/সুদ' : 'Total Interest'}</span>
              <span className="text-lg font-bold text-indigo-800">{formatCurrency(calcOutput.interest, isBn && useBengaliDigits)}</span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-700 block mb-1">{isBn ? 'মোট পরিশোধযোগ্য' : 'Total Payable'}</span>
              <span className="text-lg font-bold text-emerald-800">{formatCurrency(calcOutput.total, isBn && useBengaliDigits)}</span>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <span className="text-xs text-blue-700 block mb-1">{isBn ? 'মাসিক কিস্তি (EMI)' : 'Monthly EMI'}</span>
              <span className="text-lg font-bold text-blue-800">{formatCurrency(calcOutput.emi, isBn && useBengaliDigits)}</span>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              onClick={() => {
                setApplyPrincipal(calcOutput.principal);
                setApplyInterestRate(calcRate);
                setApplyTermMonths(calcOutput.months);
                setCurrentTab('apply');
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isBn ? 'এই হিসাবে ঋণের আবেদন করুন' : 'Apply With These Values'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* LOAN EDIT, DELETE, AND AUDIT MODALS                            */}
      {/* ============================================================== */}
      <EditLoanModal
        isOpen={!!editingLoan}
        onClose={() => setEditingLoan(null)}
        loan={editingLoan}
        onUpdated={() => {
          setActionAlert({
            type: 'success',
            message: isBn 
              ? 'ঋণ হিসাবের তথ্য সফলভাবে হালনাগাদ ও সংশ্লিষ্ট সকল লেজার ও পরিসংখ্যান পুনরায় হিসাব করা হয়েছে।' 
              : 'Loan account successfully updated and all related ledgers recalculated.'
          });
          setEditingLoan(null);
        }}
      />

      <DeleteLoanModal
        isOpen={!!deletingLoan}
        onClose={() => setDeletingLoan(null)}
        loan={deletingLoan}
        onDeleted={() => {
          setActionAlert({
            type: 'success',
            message: isBn 
              ? 'ঋণ হিসাব সফলভাবে অপসারিত/রিভার্স করা হয়েছে এবং ব্যালেন্স সমন্বয় সম্পন্ন হয়েছে।' 
              : 'Loan account successfully deleted/reversed and balances reconciled.'
          });
          setDeletingLoan(null);
        }}
      />

      <LoanAuditModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
    </div>
  );
};
