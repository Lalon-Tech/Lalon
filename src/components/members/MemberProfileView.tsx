import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  ArrowDownRight, 
  ArrowUpRight, 
  CreditCard, 
  Coins, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  FileSignature,
  Lock,
  Camera,
  X,
  Check,
  User,
  Users,
  UserPlus,
  Archive,
  TrendingUp,
  PieChart,
  Edit3,
  Trash2,
  PiggyBank,
  Layers,
  Search,
  Sparkles
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PhotoUploadField } from '../common/PhotoUploadField';
import { ShareClosureModal } from './ShareClosureModal';
import { BuyShareModal } from './BuyShareModal';
import { ShareClosuresList } from './ShareClosuresList';
import { EditMemberModal } from './EditMemberModal';
import { DeleteMemberModal } from './DeleteMemberModal';
import { EditTransactionModal } from '../transactions/EditTransactionModal';
import { NewDepositModal } from '../transactions/NewDepositModal';
import { NewWithdrawModal } from '../transactions/NewWithdrawModal';
import { NewLoanModal } from '../transactions/NewLoanModal';
import { Transaction } from '../../types';
import { MemberBusinessFundingTab } from '../business/MemberBusinessFundingTab';
import { 
  formatCurrency, 
  formatInteger, 
  formatBengaliDate, 
  formatMemberDate,
  formatDateOnly,
  getTransactionTypeName, 
  toBengaliNumber,
  compareTransactionsDesc,
  formatLedgerSerial
} from '../../utils/bengaliUtils';

export const MemberProfileView: React.FC<{ memberId: string; onBack: () => void }> = ({ memberId, onBack }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    loans, 
    savingsSchemes, 
    shareClosures,
    businessFundings,
    transactions, 
    useBengaliDigits,
    selectedMemberId,
    setSelectedMemberId,
    setShowNewMemberModal,
    openReceiptForTx,
    setShowQuickDepositModal,
    setShowQuickWithdrawModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal,
    payLoanInstallment,
    updateMember,
    settings,
    isUserAdmin,
    canViewMemberFinancials,
    businessProfitRecords,
    profitDistributions,
    currentUser
  } = useSomiti();

  const isMember = currentUser?.role === 'member';

  const [activeTab, setActiveTab] = useState<'profile' | 'passbook' | 'savings' | 'shares' | 'loans' | 'business' | 'nominee' | 'agreement'>('profile');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showNomineePhotoModal, setShowNomineePhotoModal] = useState(false);
  const [selectedNomineeId, setSelectedNomineeId] = useState<string>('');
  const [newNomineePhotoUrl, setNewNomineePhotoUrl] = useState('');
  const [showShareClosureModal, setShowShareClosureModal] = useState(false);
  const [showBuyShareModal, setShowBuyShareModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Dedicated member-locked transaction modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);

  // Member Agreement & Undertaking Signatures Customization
  const [agrConfigTab, setAgrConfigTab] = useState<'president' | 'secretary'>('president');
  
  // President & Seal
  const [agrPresidentSource, setAgrPresidentSource] = useState<'member' | 'other'>('other');
  const [agrPresidentMemberId, setAgrPresidentMemberId] = useState<string>(members[0]?.id || '');
  const [agrPresidentCustomName, setAgrPresidentCustomName] = useState<string>(settings.presidentName || '');
  const [agrPresidentDesignation, setAgrPresidentDesignation] = useState<string>('সভাপতি');

  const selectedAgrPresidentMember = members.find(m => m.id === agrPresidentMemberId);
  const agrPresidentDisplayName = agrPresidentSource === 'member'
    ? (selectedAgrPresidentMember?.name || (members.length > 0 ? members[0].name : ''))
    : (agrPresidentCustomName.trim() || settings.presidentName || (isBn ? 'সভাপতি' : 'President'));

  // Secretary
  const [agrSecretarySource, setAgrSecretarySource] = useState<'member' | 'other'>('other');
  const [agrSecretaryMemberId, setAgrSecretaryMemberId] = useState<string>(members[0]?.id || '');
  const [agrSecretaryCustomName, setAgrSecretaryCustomName] = useState<string>(settings.secretaryName || '');
  const [agrSecretaryDesignation, setAgrSecretaryDesignation] = useState<string>('সাধারণ সম্পাদক');

  const selectedAgrSecretaryMember = members.find(m => m.id === agrSecretaryMemberId);
  const agrSecretaryDisplayName = agrSecretarySource === 'member'
    ? (selectedAgrSecretaryMember?.name || (members.length > 0 ? members[0].name : ''))
    : (agrSecretaryCustomName.trim() || settings.secretaryName || (isBn ? 'সাধারণ সম্পাদক' : 'General Secretary'));

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  // Determine active member reactively from prop memberId or selectedMemberId
  const effectiveMemberId = (isMember && currentUser?.memberId)
    ? currentUser.memberId
    : (selectedMemberId && members.some(m => m.id === selectedMemberId))
      ? selectedMemberId
      : (memberId && members.some(m => m.id === memberId))
        ? memberId
        : (members[0]?.id || '');

  const member = members.find(m => m.id === effectiveMemberId) || (members.length > 0 ? members[0] : undefined);

  // Keep active member synced in context for all operations
  React.useEffect(() => {
    if (member?.id && selectedMemberId !== member.id) {
      setSelectedMemberId(member.id);
    }
  }, [member?.id, selectedMemberId, setSelectedMemberId]);

  if (!member) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4 my-8">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">
            {isBn ? 'কোনো সদস্য নিবন্ধিত নেই' : 'No Members Registered'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {isBn 
              ? 'সদস্যের সম্পূর্ণ প্রোফাইল, পাসবুক ও হিসাব লেজার দেখতে অনুগ্রহ করে প্রথমে নতুন সদস্য ভর্তি করুন।'
              : 'To view a member profile, passbook, and ledger, please register a new member first.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {isBn ? 'তালিকায় ফিরে যান' : 'Back to Member List'}
          </button>
          <button
            onClick={() => setShowNewMemberModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isBn ? 'নতুন সদস্য ভর্তি করুন' : 'Register New Member'}</span>
          </button>
        </div>
      </div>
    );
  }

  const hasFinancialAccess = canViewMemberFinancials(member.id);

  const memberTransactions = transactions.filter(t => t.memberId === member.id);
  const memberLoans = loans.filter(l => l.memberId === member.id);
  const memberSavings = savingsSchemes.filter(s => s.memberId === member.id);
  const memberShareClosures = shareClosures.filter(c => c.memberId === member.id);
  const memberBusinessFundings = businessFundings.filter(f => f.memberId === member.id);

  // Profit calculations for this member:
  // Only the Somiti profit pool distribution (divided among members based on deposits)
  // is credited to the member's profile and savings. Entrepreneur personal profit is NOT calculated or added anywhere in Somiti.
  const activeRecordIds = new Set(businessProfitRecords.map(r => r.id));

  const totalMemberProfitFromPool = profitDistributions.reduce((sum, dist) => {
    const recordTag = dist.id.startsWith('pd-') 
      ? dist.id.slice(3) 
      : (dist.id.startsWith('dist-bpr-') 
          ? dist.id.slice(9) 
          : dist.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]);
    if (recordTag && !activeRecordIds.has(recordTag)) {
      return sum;
    }
    const share = dist.memberDistributions?.find(m => m.memberId === member.id);
    return sum + (Number(share?.allocatedProfit) || 0);
  }, 0);

  const memberProfitTxs = memberTransactions.filter(t => {
    if (t.type !== 'profit_share' || t.category === 'business_profit_member_share') return false;
    const bprTag = t.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]
      || (t.id.startsWith('tx-bpr-') ? t.id.replace('tx-', '').split('-')[0] : null);
    if (bprTag && !activeRecordIds.has(bprTag)) {
      return false;
    }
    return true;
  });
  const totalProfitFromTxs = memberProfitTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalMemberProfitEarned = totalMemberProfitFromPool > 0
    ? totalMemberProfitFromPool
    : totalProfitFromTxs;

  // Pure principal deposit (Total deposit collected minus withdrawals + term deposits, excluding any distributed profit)
  const pureBaseDeposit = useMemo(() => {
    if (!member) return 0;
    const completedTxs = memberTransactions.filter(t => t.status === 'completed');
    const depAmount = completedTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const withdrAmount = completedTxs.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const dpsFdr = (Number(member.dpsSavingsBalance) || 0) + (Number(member.fdrSavingsBalance) || 0);

    if (depAmount > 0 || withdrAmount > 0) {
      return Math.max(0, Number((depAmount - withdrAmount + dpsFdr).toFixed(2)));
    }
    const rawSavings = Number(member.totalSavings ?? member.generalSavingsBalance ?? 0);
    return Math.max(0, Number((rawSavings - totalMemberProfitEarned).toFixed(2)));
  }, [memberTransactions, member, totalMemberProfitEarned]);

  const [passbookFilter, setPassbookFilter] = useState<'all' | 'deposit' | 'withdraw' | 'profit_share' | 'loan'>('all');
  const [passbookSearch, setPassbookSearch] = useState<string>('');

  const filteredMemberTransactions = useMemo(() => {
    return memberTransactions.filter(tx => {
      if (passbookFilter !== 'all') {
        if (passbookFilter === 'deposit' && tx.type !== 'deposit') return false;
        if (passbookFilter === 'withdraw' && tx.type !== 'withdraw') return false;
        if (passbookFilter === 'profit_share' && tx.type !== 'profit_share') return false;
        if (passbookFilter === 'loan' && !['loan_disbursement', 'loan_installment', 'loan_fee'].includes(tx.type)) return false;
      }
      if (passbookSearch.trim()) {
        const q = passbookSearch.toLowerCase();
        const vNo = (tx.voucherNo || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const method = (tx.paymentMethod || '').toLowerCase();
        const typeInfo = getTransactionTypeName(tx.type, isBn);
        const typeLabel = (typeInfo.label || '').toLowerCase();
        if (!vNo.includes(q) && !notes.includes(q) && !method.includes(q) && !typeLabel.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [memberTransactions, passbookFilter, passbookSearch, isBn]);

  const sortedMemberTransactions = useMemo(() => {
    return [...filteredMemberTransactions].sort(compareTransactionsDesc);
  }, [filteredMemberTransactions]);

  const passbookTotals = useMemo(() => {
    return filteredMemberTransactions.reduce(
      (acc, tx) => {
        const typeInfo = getTransactionTypeName(tx.type, isBn);
        const amt = Number(tx.amount) || 0;
        if (typeInfo.isCredit) {
          acc.credit = Number((acc.credit + amt).toFixed(2));
        } else {
          acc.debit = Number((acc.debit + amt).toFixed(2));
        }
        return acc;
      },
      { credit: 0, debit: 0 }
    );
  }, [filteredMemberTransactions, isBn]);

  const printPassbook = () => {
    window.print();
  };

  const renderPrivacyProtectedNotice = () => (
    <div className="p-10 text-center bg-slate-50/70 rounded-2xl border border-slate-200/80 my-4 space-y-3">
      <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
        <Lock className="w-6 h-6" />
      </div>
      <h4 className="font-bold text-slate-800 text-sm">
        {isBn ? 'ব্যক্তিগত আর্থিক তথ্য গোপনীয় ও সংরক্ষিত' : 'Private Financial Information Protected'}
      </h4>
      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
        {isBn 
          ? 'সমিতির নিরাপত্তা নীতিমালা ও ফায়ারবেস সিকিউরিটি রুলস অনুযায়ী অন্য সদস্যের আর্থিক হিসাব (সঞ্চয় ব্যালেন্স, ঋণ, কিস্তি শিডিউল ও লেনদেন বিবরণী) সংরক্ষিত। শুধুমাত্র উক্ত সদস্য বা অনুমোদিত অ্যাডমিন এই তথ্য দেখতে পারবেন।'
          : 'In accordance with privacy policies and backend security rules, this member’s financial accounts (savings, loans, installment schedules, and transaction ledger) are restricted. Only the member themselves or authorized admins can view this.'}
      </p>
    </div>
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Back & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 text-xs font-bold transition-colors w-fit cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isMember ? (isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard') : (isBn ? 'সকল সদস্য তালিকা' : 'Member List')}</span>
          </button>

          {!isMember && members.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-500 font-semibold">{isBn ? 'সদস্য পরিবর্তন:' : 'Switch Member:'}</span>
              <select
                value={member.id}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-0 focus:outline-hidden cursor-pointer"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.memberNo} - {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasFinancialAccess && (
            <button
              onClick={printPassbook}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBn ? 'পাসবুক প্রিন্ট' : 'Print Passbook'}</span>
            </button>
          )}
          {isUserAdmin && (
            <>
              <button
                onClick={() => setShowEditMemberModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer border border-slate-600"
                title="সদস্যের তথ্য, শেয়ার সংখ্যা বা ভুল হিসাব সংশোধন করুন"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>{isBn ? 'সদস্য তথ্য ও শেয়ার এডিট' : 'Edit Member & Shares'}</span>
              </button>
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{isBn ? 'টাকা জমা' : 'Deposit'}</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{isBn ? 'উত্তোলন' : 'Withdraw'}</span>
              </button>
              <button
                onClick={() => setShowShareClosureModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="শেয়ার ক্লোজ বা সমর্পণ করুন"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isBn ? 'শেয়ার সমর্পণ/ক্লোজ' : 'Surrender Shares'}</span>
              </button>
              <button
                onClick={() => setShowBuyShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="নতুন শেয়ার ক্রয় করুন"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{isBn ? 'শেয়ার ক্রয়' : 'Buy Shares'}</span>
              </button>
              <button
                onClick={() => setShowLoanModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isBn ? 'নতুন ঋণ' : 'New Loan'}</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title={isBn ? "সদস্য মুছে ফেলুন" : "Delete Member"}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{isBn ? 'সদস্য মুছুন' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Member Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 px-6 py-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover object-top ring-4 ring-white/20 shadow-md bg-slate-800"
                />
                {isUserAdmin && (
                  <button
                    onClick={() => {
                      setNewPhotoUrl(member.photoUrl);
                      setShowPhotoModal(true);
                    }}
                    title={isBn ? "সদস্যের ছবি পরিবর্তন/আপলোড করুন" : "Change Member Photo"}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-md border-2 border-slate-900 transition-all cursor-pointer hover:scale-110"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold">{member.name}</h1>
                  <span className="font-mono px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    {member.memberNo}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {member.status === 'active' ? (isBn ? 'সক্রিয় সদস্য' : 'Active Member') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {member.nameEn} • {member.occupation}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-blue-300" />
                    {member.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-300" />
                    {isBn ? `যোগদান: ${formatMemberDate(member.joiningDate, isBn)}` : `Joined: ${formatMemberDate(member.joiningDate, isBn)}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                    NID: {member.nid}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Balance Header Badges */}
            <div className="shrink-0">
              {hasFinancialAccess ? (
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-2.5">
                  {/* Card 1: Total Deposit (Pure principal deposit without profit) */}
                  <div 
                    className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10 text-center min-w-[105px] transition-all hover:bg-white/15"
                    title={isBn ? 'সদস্যের আসল সঞ্চয় জমা (লাভ ব্যতীত প্রকৃত মূল আমানত)' : 'Actual pure deposit deposited (excluding profit)'}
                  >
                    <span className="text-[11px] text-cyan-200 block flex items-center justify-center gap-1 font-medium">
                      <PiggyBank className="w-3.5 h-3.5 text-cyan-300 inline shrink-0" />
                      <span>{isBn ? 'আসল সঞ্চয় জমা' : 'Total Deposit'}</span>
                    </span>
                    <span className="text-sm sm:text-base font-bold text-cyan-300 block mt-0.5">
                      ৳{formatCurrency(pureBaseDeposit, isBn && useBengaliDigits)}
                    </span>
                    <span className="text-[9px] text-cyan-200/70 block mt-0.5">
                      {isBn ? 'প্রকৃত মূল জমা' : 'Pure Principal'}
                    </span>
                  </div>

                  {/* Card 2: Total Savings (Deposit + Profit) */}
                  <div 
                    className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10 text-center min-w-[105px] transition-all hover:bg-white/15"
                    title={isBn ? 'মোট সঞ্চয় স্থিতি (আসল জমা + অর্জিত লভ্যাংশ)' : 'Total Savings balance (Deposit + Profit)'}
                  >
                    <span className="text-[11px] text-emerald-200 block flex items-center justify-center gap-1 font-medium">
                      <Layers className="w-3.5 h-3.5 text-emerald-300 inline shrink-0" />
                      <span>{isBn ? 'মোট সঞ্চয় স্থিতি' : 'Total Savings'}</span>
                    </span>
                    <span className="text-sm sm:text-base font-bold text-emerald-300 block mt-0.5">
                      ৳{formatCurrency(member.totalSavings, isBn && useBengaliDigits)}
                    </span>
                    <span className="text-[9px] text-emerald-200/70 block mt-0.5">
                      {isBn ? 'আমানত + লাভ' : 'Deposit + Profit'}
                    </span>
                  </div>

                  {/* Card 3: Total Profit */}
                  <div 
                    className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10 text-center min-w-[105px] transition-all hover:bg-white/15"
                    title={isBn ? 'সমিতি থেকে অর্জিত মোট লভ্যাংশ' : 'Total dividend & profit earned'}
                  >
                    <span className="text-[11px] text-amber-200 block flex items-center justify-center gap-1 font-medium">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-300 inline shrink-0" />
                      <span>{isBn ? 'অর্জিত মোট লাভ' : 'Total Profit'}</span>
                    </span>
                    <span className="text-sm sm:text-base font-bold text-amber-300 block mt-0.5">
                      +৳{formatCurrency(totalMemberProfitEarned, isBn && useBengaliDigits)}
                    </span>
                    <span className="text-[9px] text-amber-200/70 block mt-0.5">
                      {isBn ? 'বণ্টনকৃত লাভ' : 'Earned Profit'}
                    </span>
                  </div>

                  {/* Card 4: Active Loan Due */}
                  <div 
                    className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10 text-center min-w-[105px] transition-all hover:bg-white/15"
                    title={isBn ? 'চলতি ঋণ বকেয়া কিস্তিসহ' : 'Active loan due balance'}
                  >
                    <span className="text-[11px] text-rose-200 block flex items-center justify-center gap-1 font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-rose-300 inline shrink-0" />
                      <span>{isBn ? 'চলতি বকেয়া ঋণ' : 'Active Loan Due'}</span>
                    </span>
                    <span className="text-sm sm:text-base font-bold text-rose-300 block mt-0.5">
                      ৳{formatCurrency(member.activeLoanBalance, isBn && useBengaliDigits)}
                    </span>
                    <span className="text-[9px] text-rose-200/70 block mt-0.5">
                      {member.activeLoanBalance > 0 ? (isBn ? 'পরিশোধ বাকি' : 'Outstanding') : (isBn ? 'কোনো ঋণ নেই' : 'No Due')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2.5 text-blue-100">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <div className="text-left">
                    <span className="text-[11px] text-blue-200 block font-semibold">{isBn ? 'আর্থিক তথ্য' : 'Financial Data'}</span>
                    <span className="text-xs text-amber-200 font-medium">
                      {isBn ? '🔒 ব্যক্তিগত ও সংরক্ষিত' : '🔒 Private & Restricted'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation (Frozen / Sticky on scroll) */}
        <div className="flex border-b border-slate-200 bg-slate-50/95 backdrop-blur-xs overflow-x-auto sticky top-[57px] z-20 shadow-2xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-blue-600" />
            <span>{isBn ? 'সদস্য পরিচিতি ও প্রোফাইল' : 'Member Profile'}</span>
          </button>
          <button
            onClick={() => setActiveTab('passbook')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'passbook'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isBn ? `পাসবুক ও লেনদেন হিস্ট্রি (${displayCount(memberTransactions.length)})` : `Passbook & Ledger (${displayCount(memberTransactions.length)})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'savings'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{isBn ? `সঞ্চয় ও ডিপিএস হিসাব (${displayCount(memberSavings.length)})` : `Savings & DPS (${displayCount(memberSavings.length)})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('shares')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'shares'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="w-4 h-4 text-amber-600" />
            <span>{isBn ? `শেয়ার ও সমর্পণ আর্কাইভ (${displayCount(memberShareClosures.length)})` : `Shares & Closures (${displayCount(memberShareClosures.length)})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'loans'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{isBn ? `ঋণ ও কিস্তি শিডিউল (${displayCount(memberLoans.length)})` : `Loans & Schedules (${displayCount(memberLoans.length)})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('business')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'business'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? `ব্যবসা ফান্ডিং ও লাভ (${displayCount(memberBusinessFundings.length)})` : `Business Funding (${displayCount(memberBusinessFundings.length)})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('nominee')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'nominee'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{isBn ? `নমিনি তথ্য (${displayCount(member.nominees.length)})` : `Nominees (${displayCount(member.nominees.length)})`}</span>
          </button>
          <button
            onClick={() => setActiveTab('agreement')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'agreement'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>{isBn ? 'চুক্তিপত্র ও ফরম' : 'Agreements & Forms'}</span>
          </button>
        </div>

        {/* Tab 0: Comprehensive Member Profile (Bilingual Field Labels & Full Sync) */}
        {activeTab === 'profile' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Quick Profile Summary Banner */}
            <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-16 h-16 rounded-2xl object-cover object-top border-2 border-white shadow-sm ring-1 ring-slate-200"
                  />
                  {isUserAdmin && (
                    <button
                      onClick={() => {
                        setNewPhotoUrl(member.photoUrl);
                        setShowPhotoModal(true);
                      }}
                      title={isBn ? "ছবি পরিবর্তন" : "Change Photo"}
                      className="absolute -bottom-1 -right-1 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900">{member.name}</h3>
                    <span className="text-sm font-semibold text-slate-500">({member.nameEn || 'N/A'})</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      #{member.memberNo}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {member.status === 'active' ? (isBn ? 'সক্রিয় সদস্য / Active' : 'Active / সক্রিয়') : (isBn ? 'নিষ্ক্রিয় / Inactive' : 'Inactive')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      {member.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {isBn ? `যোগদানের তারিখ: ${formatMemberDate(member.joiningDate, isBn)}` : `Joining Date: ${formatMemberDate(member.joiningDate, isBn)}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      {member.occupation || (isBn ? 'পেশা উল্লেখ নেই' : 'No Occupation')}
                    </span>
                  </div>
                </div>
              </div>

              {isUserAdmin && (
                <button
                  onClick={() => setShowEditMemberModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isBn ? 'প্রোফাইল তথ্য ও শেয়ার এডিট' : 'Edit Profile & Shares'}</span>
                </button>
              )}
            </div>

            {/* Main Information Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section 1: Personal Information / ব্যক্তিগত তথ্য */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {isBn ? 'ব্যক্তিগত তথ্য / Personal Information' : 'Personal Information / ব্যক্তিগত তথ্য'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{isBn ? 'সদস্য পরিচিতি' : 'Member Identity'}</span>
                </div>

                <div className="p-5 divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Name / নাম (বাংলা)</span>
                    <span className="font-bold text-slate-800 text-right">{member.name}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Name in English / নাম (ইংরেজি)</span>
                    <span className="font-semibold text-slate-800 text-right">{member.nameEn || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Mobile Number / মোবাইল নম্বর</span>
                    <span className="font-bold text-blue-700 text-right font-mono">{member.phone}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">NID Number / NID নম্বর</span>
                    <span className="font-semibold text-slate-800 text-right font-mono">{member.nid || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Date of Birth / জন্ম তারিখ</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {member.dob ? formatMemberDate(member.dob, isBn) : (isBn ? 'দেওয়া হয়নি' : 'N/A')}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Gender / লিঙ্গ</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {member.gender === 'male' ? (isBn ? 'পুরুষ / Male' : 'Male / পুরুষ') : member.gender === 'female' ? (isBn ? 'মহিলা / Female' : 'Female / মহিলা') : (isBn ? 'অন্যান্য / Other' : 'Other')}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Occupation / পেশা</span>
                    <span className="font-semibold text-slate-800 text-right">{member.occupation || (isBn ? 'উল্লেখ নেই' : 'N/A')}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Monthly Income / মাসিক আয়</span>
                    <span className="font-bold text-emerald-700 text-right">
                      ৳{formatCurrency(member.monthlyIncome, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Email / ইমেইল</span>
                    <span className="font-semibold text-slate-800 text-right">{member.email || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Family & Address Details / পারিবারিক ও যোগাযোগের ঠিকানা */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {isBn ? 'পারিবারিক ও যোগাযোগের ঠিকানা / Family & Address' : 'Family & Address / পারিবারিক ও ঠিকানা'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{isBn ? 'স্থায়ী ও বর্তমান তথ্য' : 'Address Info'}</span>
                </div>

                <div className="p-5 divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Father's Name / পিতার নাম</span>
                    <span className="font-bold text-slate-800 text-right">{member.fatherName || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Mother's Name / মাতার নাম</span>
                    <span className="font-bold text-slate-800 text-right">{member.motherName || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Spouse's Name / স্বামী বা স্ত্রীর নাম</span>
                    <span className="font-semibold text-slate-800 text-right">{member.spouseName || (isBn ? 'প্রযোজ্য নয়' : 'N/A')}</span>
                  </div>
                  <div className="py-3 flex flex-col gap-1">
                    <span className="text-slate-500 font-medium">Present Address / বর্তমান ঠিকানা</span>
                    <p className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {member.presentAddress || (isBn ? 'কোনো বর্তমান ঠিকানা সংরক্ষিত নেই' : 'N/A')}
                    </p>
                  </div>
                  <div className="py-3 flex flex-col gap-1">
                    <span className="text-slate-500 font-medium">Permanent Address / স্থায়ী ঠিকানা</span>
                    <p className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {member.permanentAddress || (isBn ? 'কোনো স্থায়ী ঠিকানা সংরক্ষিত নেই' : 'N/A')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Membership & Institutional Information / সদস্যপদ ও প্রাতিষ্ঠানিক তথ্য */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {isBn ? 'সমিতি সদস্যপদ ও প্রাতিষ্ঠানিক তথ্য / Membership Details' : 'Membership Details / সদস্যপদ তথ্য'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{isBn ? 'অফিশিয়াল রেকর্ড' : 'Official Record'}</span>
                </div>

                <div className="p-5 divide-y divide-slate-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Member Number / সদস্য নম্বর</span>
                    <span className="font-bold text-slate-900 text-right font-mono bg-slate-100 px-2 py-0.5 rounded">
                      #{member.memberNo}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Membership Status / সদস্যপদ স্ট্যাটাস</span>
                    <span className="font-bold text-emerald-700 text-right">
                      {member.status === 'active' ? (isBn ? 'সক্রিয় সদস্য / Active' : 'Active / সক্রিয়') : (isBn ? 'নিষ্ক্রিয় / Inactive' : 'Inactive')}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Joining Date / যোগদানের তারিখ</span>
                    <span className="font-bold text-blue-700 text-right">
                      {formatMemberDate(member.joiningDate, isBn)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Active Shares / মোট শেয়ার সংখ্যা</span>
                    <span className="font-bold text-slate-800 text-right">
                      {displayCount(member.shareCount)} টি (মূলধন: ৳{formatCurrency(member.shareValue, isBn && useBengaliDigits)})
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Admission Fee / সদস্য ভর্তি ফি</span>
                    <span className="font-semibold text-slate-800 text-right">
                      ৳{formatCurrency(member.admissionFee, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">General Savings / সাধারণ সঞ্চয় স্থিতি</span>
                    <span className="font-bold text-emerald-600 text-right">
                      ৳{formatCurrency(member.generalSavingsBalance, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">DPS Savings / ডিপিএস সঞ্চয় স্থিতি</span>
                    <span className="font-bold text-teal-600 text-right">
                      ৳{formatCurrency(member.dpsSavingsBalance, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">FDR Savings / স্থায়ী আমানত (FDR)</span>
                    <span className="font-bold text-cyan-600 text-right">
                      ৳{formatCurrency(member.fdrSavingsBalance, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Total Savings / সর্বমোট সঞ্চয় স্থিতি</span>
                    <span className="font-black text-emerald-700 text-right text-sm">
                      ৳{formatCurrency(member.totalSavings, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium">Active Loan Due / চলতি বকেয়া ঋণ</span>
                    <span className="font-bold text-rose-600 text-right">
                      ৳{formatCurrency(member.activeLoanBalance, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  {member.notes && (
                    <div className="py-3 flex flex-col gap-1">
                      <span className="text-slate-500 font-medium">Office Notes / প্রাতিষ্ঠানিক মন্তব্য</span>
                      <p className="font-medium text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                        {member.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Nominee Information / নমিনি তথ্য */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      {isBn ? 'মনোনীত নমিনি তথ্য / Nominee Information' : 'Nominee Information / নমিনি তথ্য'}
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {displayCount(member.nominees?.length || 0)} {isBn ? 'জন নমিনি' : 'Nominees'}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {(!member.nominees || member.nominees.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 space-y-2">
                      <UserCheck className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs">{isBn ? 'কোনো নমিনি তথ্য নিবন্ধিত নেই' : 'No Nominee Registered'}</p>
                      {isUserAdmin && (
                        <button
                          onClick={() => setShowEditMemberModal(true)}
                          className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          {isBn ? '+ নমিনি তথ্য যোগ করুন' : '+ Add Nominee'}
                        </button>
                      )}
                    </div>
                  ) : (
                    member.nominees.map((nom, idx) => (
                      <div key={nom.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden border border-blue-200">
                              {nom.photoUrl ? (
                                <img src={nom.photoUrl} alt={nom.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{nom.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs sm:text-sm">{nom.name}</h5>
                              <span className="text-[11px] font-semibold text-blue-600">
                                {isBn ? `সম্পর্ক: ${nom.relation}` : `Relation: ${nom.relation}`}
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {displayCount(nom.percentage)}% {isBn ? 'অংশ' : 'Share'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Mobile / মোবাইল নম্বর:</span>
                            <span className="font-bold text-slate-700 font-mono">{nom.phone || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">NID Number / NID নম্বর:</span>
                            <span className="font-semibold text-slate-700 font-mono">{nom.nid || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-slate-400 block text-[10px]">Address / ঠিকানা:</span>
                            <span className="font-medium text-slate-700">{nom.address || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Specimen Signature & Certification */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-500">
                  <FileSignature className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isBn ? 'নমুনা স্বাক্ষর ও তথ্যের সত্যতা / Specimen Signature' : 'Specimen Signature / নমুনা স্বাক্ষর'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBn 
                      ? 'সমিতির কেন্দ্রীয় ডাটাবেসে নিবন্ধিত সদস্য প্রোফাইল ও স্বাক্ষর রেকর্ড' 
                      : 'Verified member profile and signature record in society central database'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {member.signatureUrl ? (
                  <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                    <img src={member.signatureUrl} alt="Signature" className="h-7 max-w-[120px] object-contain" />
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isBn ? 'স্বাক্ষর সত্যায়িত' : 'Verified'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    {isBn ? 'নমুনা স্বাক্ষর আপলোড করা নেই' : 'No Specimen Signature'}
                  </span>
                )}
                {isUserAdmin && (
                  <button
                    onClick={() => setShowEditMemberModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isBn ? 'স্বাক্ষর পরিবর্তন' : 'Update'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Passbook & Ledger */}
        {activeTab === 'passbook' && (
          !hasFinancialAccess ? (
            renderPrivacyProtectedNotice()
          ) : (
            <div className="p-4 sm:p-6 space-y-3">
              {/* Frozen / Sticky Header up to Passbook & General Ledger */}
              <div className="sticky top-[105px] z-10 bg-white/95 backdrop-blur-xs py-2.5 px-3.5 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {isBn ? 'সদস্যের পাসবুক ও সার্বিক লেজার বিবরণী' : 'Member Passbook & General Ledger'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isBn ? 'সমস্ত ক্রেডিট (জমা) ও ডেবিট (উত্তোলন) লেনদেনের অডিট লেজার' : 'Full credit & debit audit ledger of this member'}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/70 px-2.5 py-0.5 rounded-full ml-1">
                    {isBn ? `মোট লেনদেন: ${displayCount(filteredMemberTransactions.length)} টি` : `Total transactions: ${displayCount(filteredMemberTransactions.length)}`}
                  </span>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Type Filter */}
                  <select
                    value={passbookFilter}
                    onChange={(e) => setPassbookFilter(e.target.value as any)}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল লেনদেন' : 'All Types'}</option>
                    <option value="deposit">{isBn ? 'শুধুমাত্র জমা (Deposit)' : 'Deposit only'}</option>
                    <option value="withdraw">{isBn ? 'শুধুমাত্র উত্তোলন (Withdraw)' : 'Withdraw only'}</option>
                    <option value="profit_share">{isBn ? 'লভ্যাংশ (Profit Share)' : 'Profit Share'}</option>
                    <option value="loan">{isBn ? 'ঋণ সংক্রান্ত' : 'Loan related'}</option>
                  </select>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={passbookSearch}
                      onChange={(e) => setPassbookSearch(e.target.value)}
                      placeholder={isBn ? 'ভাউচার / বিবরণ খুঁজুন...' : 'Search voucher/notes...'}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 w-36 sm:w-44 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                    {passbookSearch && (
                      <button
                        onClick={() => setPassbookSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scrollable Transaction Table Container with Sticky Column Headers */}
              <div className="passbook-scroll-container border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto max-h-[520px] shadow-2xs relative bg-white">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="bg-slate-100/95 backdrop-blur-xs font-bold text-slate-700 border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="py-2.5 px-2.5 text-center whitespace-nowrap bg-slate-100">{isBn ? 'লেজার ক্রমিক' : 'Ledger Serial'}</th>
                      <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                      <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">{isBn ? 'ভাউচার নং' : 'Voucher No'}</th>
                      <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">{isBn ? 'বিবরণ / ধরন' : 'Type / Description'}</th>
                      <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">{isBn ? 'মাধ্যম' : 'Method'}</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap bg-slate-100 text-emerald-800">{isBn ? 'আদায় / জমা (৳)' : 'Credit / Deposit (৳)'}</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap bg-slate-100 text-rose-700">{isBn ? 'উত্তোলন / বিতরণ (৳)' : 'Debit / Paid (৳)'}</th>
                      <th className="py-2.5 px-3 whitespace-nowrap bg-slate-100">{isBn ? 'কালেক্টর' : 'Collector'}</th>
                      <th className="py-2.5 px-3 text-center whitespace-nowrap bg-slate-100">{isBn ? 'রসিদ' : 'Receipt'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedMemberTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          {isBn ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transaction records found.'}
                        </td>
                      </tr>
                    ) : (
                      sortedMemberTransactions.map((tx, idx) => {
                        const typeInfo = getTransactionTypeName(tx.type, isBn);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 font-mono whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                                  {tx.serialNo ? formatLedgerSerial(tx.serialNo, isBn, useBengaliDigits) : (isBn || useBengaliDigits ? toBengaliNumber(idx + 1) : (idx + 1))}
                                </span>
                                {idx === 0 && !passbookSearch && passbookFilter === 'all' && (
                                  <span className="text-[8px] font-black uppercase px-1 py-0.2 bg-emerald-100 text-emerald-700 rounded-sm">
                                    {isBn ? 'নতুন' : 'NEW'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                              {formatBengaliDate(tx.date, isBn)}
                              <span className="block text-[10px] text-slate-400 font-mono">{tx.time}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">
                              {tx.voucherNo}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${typeInfo.badge}`}>
                                {typeInfo.label}
                              </span>
                              {tx.notes && <span className="block text-[10px] text-slate-400 truncate max-w-xs">{tx.notes}</span>}
                            </td>
                            <td className="py-2.5 px-3 uppercase font-medium text-slate-500 whitespace-nowrap">
                              {tx.paymentMethod}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                              {typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                              {!typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                              {tx.collectedBy}
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openReceiptForTx(tx)}
                                  className="px-2 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                >
                                  {isBn ? 'রসিদ' : 'Receipt'}
                                </button>
                                {isUserAdmin && (
                                  <button
                                    onClick={() => setEditingTx(tx)}
                                    title={isBn ? 'ভুল লেনদেন বা শেয়ার এন্ট্রি সংশোধন করুন' : 'Edit or correct this transaction'}
                                    className="px-2 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded transition-colors cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>{isBn ? 'সংশোধন' : 'Edit'}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {/* Sticky Footer with Totals */}
                  {sortedMemberTransactions.length > 0 && (
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-xs sticky bottom-0 z-10 shadow-2xs">
                      <tr>
                        <td colSpan={5} className="py-2.5 px-3 text-slate-800 font-black bg-slate-100">
                          {isBn ? 'মোট যোগফল (Total Summary)' : 'Total Summary'}
                          <span className="text-[10px] font-normal text-slate-500 ml-2">
                            ({displayCount(sortedMemberTransactions.length)} {isBn ? 'টি এন্ট্রি' : 'entries'})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-700 bg-slate-100">
                          ৳{formatCurrency(passbookTotals.credit, isBn && useBengaliDigits)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-600 bg-slate-100">
                          ৳{formatCurrency(passbookTotals.debit, isBn && useBengaliDigits)}
                        </td>
                        <td colSpan={2} className="py-2.5 px-3 text-center text-slate-700 font-bold bg-slate-100">
                          <span className="text-[10px] text-slate-500 mr-1">{isBn ? 'নীট স্থিতি:' : 'Net:'}</span>
                          <span className={passbookTotals.credit >= passbookTotals.debit ? 'text-emerald-700 font-black' : 'text-rose-600 font-black'}>
                            ৳{formatCurrency(passbookTotals.credit - passbookTotals.debit, isBn && useBengaliDigits)}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )
        )}

        {/* Tab 2: Savings & DPS */}
        {activeTab === 'savings' && (
          !hasFinancialAccess ? (
            renderPrivacyProtectedNotice()
          ) : (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-900 block">
                      {isBn ? 'সক্রিয় শেয়ার মূলধন' : 'Active Share Capital'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 font-mono">
                      {displayCount(member.shareCount || 0)} {isBn ? 'টি' : ''}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-950">
                    {formatCurrency(member.shareValue || 0, isBn && useBengaliDigits)}
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-amber-200/60">
                    <button
                      onClick={() => setShowShareClosureModal(true)}
                      className="text-[11px] font-bold text-rose-700 hover:underline cursor-pointer"
                    >
                      {isBn ? 'সমর্পণ' : 'Surrender'}
                    </button>
                    <span className="text-amber-300">•</span>
                    <button
                      onClick={() => setShowBuyShareModal(true)}
                      className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                    >
                      {isBn ? 'বৃদ্ধি / ক্রয়' : 'Buy More'}
                    </button>
                  </div>
                </div>

                {/* Pure Base Deposit Card */}
                <div className="bg-cyan-50 border border-cyan-200 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-cyan-900 block">
                      {isBn ? 'আসল সঞ্চয় আমানত' : 'Base Deposit'}
                    </span>
                    <PiggyBank className="w-3.5 h-3.5 text-cyan-600" />
                  </div>
                  <div className="text-lg font-bold text-cyan-950">
                    ৳{formatCurrency(pureBaseDeposit, isBn && useBengaliDigits)}
                  </div>
                  <span className="text-[10px] text-cyan-700 mt-1 block truncate">
                    {isBn ? 'লাভ ব্যতীত আসল জমা' : 'Principal without profit'}
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-800 block mb-1">
                    {isBn ? 'সাধারণ সঞ্চয় স্থিতি' : 'General Savings'}
                  </span>
                  <div className="text-lg font-bold text-emerald-900">
                    {formatCurrency(member.generalSavingsBalance, isBn && useBengaliDigits)}
                  </div>
                  <span className="text-[10px] text-emerald-700 mt-1 block">
                    {isBn ? 'উত্তোলনযোগ্য স্থিতি' : 'Withdrawable'}
                  </span>
                </div>

                <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-teal-900 block">
                      {isBn ? 'অর্জিত মোট লভ্যাংশ' : 'Total Profit Earned'}
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="text-lg font-bold text-teal-950">
                    {formatCurrency(totalMemberProfitEarned, isBn && useBengaliDigits)}
                  </div>
                  <span className="text-[10px] text-teal-700 mt-1 block truncate">
                    {isBn ? 'ব্যবসা ও সমিতির মুনাফা' : 'Business & dividend pool'}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl">
                  <span className="text-xs font-semibold text-blue-800 block mb-1">
                    {isBn ? 'মাসিক ডিপিএস স্থিতি' : 'Monthly DPS Balance'}
                  </span>
                  <div className="text-lg font-bold text-blue-900">
                    {formatCurrency(member.dpsSavingsBalance, isBn && useBengaliDigits)}
                  </div>
                  <span className="text-[10px] text-blue-700 mt-1 block">
                    {isBn ? 'মেয়াদি সঞ্চয় আমানত' : 'Term savings deposit'}
                  </span>
                </div>

                <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl">
                  <span className="text-xs font-semibold text-purple-800 block mb-1">
                    {isBn ? 'স্থায়ী আমানত (FDR)' : 'Fixed Deposit (FDR)'}
                  </span>
                  <div className="text-lg font-bold text-purple-900">
                    {formatCurrency(member.fdrSavingsBalance, isBn && useBengaliDigits)}
                  </div>
                  <span className="text-[10px] text-purple-700 mt-1 block">
                    {isBn ? 'নির্দিষ্ট মেয়াদে লাভজনক' : 'Fixed term deposit'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800">
                  {isBn ? 'চলমান সঞ্চয় ও ডিপিএস হিসাবসমূহ' : 'Active Savings & DPS Accounts'}
                </h4>

                {memberSavings.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                    {isBn ? 'কোনো আলাদা ডিপিএস বা এফডিআর স্কিম চালু নেই।' : 'No active DPS or FDR schemes.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memberSavings.map((s) => (
                      <div key={s.id} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {s.accountNo}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {s.status === 'running' ? (isBn ? 'চলমান' : 'Running') : (isBn ? 'মেয়াদোত্তীর্ণ' : 'Matured')}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-slate-800">{s.schemeName}</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block">{isBn ? 'জমা স্থিতি:' : 'Deposited:'}</span>
                            <span className="font-bold text-emerald-700">{formatCurrency(s.totalDeposited, isBn && useBengaliDigits)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">{isBn ? 'অর্জিত মুনাফা:' : 'Profit Accrued:'}</span>
                            <span className="font-bold text-blue-700">{formatCurrency(s.profitAccrued, isBn && useBengaliDigits)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">{isBn ? 'মুনাফার হার:' : 'Interest Rate:'}</span>
                            <span className="font-bold">{displayCount(s.interestRate)}% {isBn ? 'বার্ষিক' : 'p.a.'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">{isBn ? 'মেয়াদ পূর্ণ:' : 'Maturity:'}</span>
                            <span className="font-bold">{formatBengaliDate(s.maturityDate, isBn)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Member Profit & Dividend Ledger */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      <span>{isBn ? 'সদস্যের অর্জিত সমিতির লভ্যাংশ বিবরণী' : 'Earned Somiti Profit & Dividend Ledger'}</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      {isBn 
                        ? 'মাসিক জমার স্থিতি ও অনুপাত অনুযায়ী সমিতি বণ্টন হতে অর্জিত মুনাফা (যা প্রোফাইলে লভ্যাংশ হিসেবে জমা হয়েছে)' 
                        : 'Dividends earned from Somiti profit pool distribution based on monthly deposit ratio'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-bold">
                      {isBn ? 'প্রোফাইলে অর্জিত মোট লাভ: ' : 'Total Profit Earned: '} 
                      {formatCurrency(totalMemberProfitEarned, isBn && useBengaliDigits)}
                    </span>
                  </div>
                </div>

                {profitDistributions.filter(dist => dist.memberDistributions?.some(m => m.memberId === member.id && m.allocatedProfit > 0)).length === 0 && memberProfitTxs.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-slate-400 text-xs">
                    {isBn ? 'এখনো কোনো ব্যবসায়িক লভ্যাংশের রেকর্ড নেই।' : 'No business profit or dividend records yet.'}
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">{isBn ? 'তারিখ / মাস' : 'Date / Month'}</th>
                            <th className="py-2.5 px-3">{isBn ? 'উৎস ও বিবরণ' : 'Source & Description'}</th>
                            <th className="py-2.5 px-3 text-center">{isBn ? 'বণ্টন অনুপাত' : 'Share %'}</th>
                            <th className="py-2.5 px-3 text-right">{isBn ? 'সমিতি লাভ তহবিল' : 'Somiti Profit'}</th>
                            <th className="py-2.5 px-3 text-right">{isBn ? 'প্রোফাইলে যুক্ত লাভ' : 'Profit Credited (৳)'}</th>
                            <th className="py-2.5 px-3 text-center">{isBn ? 'অবস্থা' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {/* Monthly Pool Profit Distributions based on member deposits */}
                          {profitDistributions
                            .filter(dist => dist.memberDistributions?.some(m => m.memberId === member.id && m.allocatedProfit > 0))
                            .map((dist) => {
                              const myShare = dist.memberDistributions?.find(m => m.memberId === member.id);
                              if (!myShare) return null;
                              return (
                                <tr key={dist.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="py-2.5 px-3 font-medium">
                                    {dist.monthName}
                                    <span className="block text-[10px] text-slate-400">{formatBengaliDate(dist.distributionDate, isBn)}</span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className="font-bold text-slate-800 block">
                                      {dist.notes || (isBn ? 'সমিতির ব্যবসায়িক লভ্যাংশ বণ্টন' : 'Somiti Business Profit Dividend')}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {isBn ? `সদস্য জমার অনুপাত অনুযায়ী বণ্টন (${formatCurrency(myShare.dailyWeightedDeposit, isBn && useBengaliDigits)} স্থিতি)` : 'Distributed based on monthly deposit ratio'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                      {isBn && useBengaliDigits ? toBengaliNumber((myShare.weightPercentage || 0).toFixed(2)) : (myShare.weightPercentage || 0).toFixed(2)}%
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                                    {formatCurrency(dist.totalSomitiProfitPool, isBn && useBengaliDigits)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-teal-700">
                                    +{formatCurrency(myShare.allocatedProfit, isBn && useBengaliDigits)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                      <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                      <span>{dist.creditToSavings ? (isBn ? 'সঞ্চয়ে যুক্ত' : 'Credited') : (isBn ? 'নগদে প্রদত্ত' : 'Paid in cash')}</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}

                          {/* Non-distribution profit share transactions (e.g. earlier dividends) */}
                          {memberProfitTxs
                            .filter(t => !profitDistributions.some(d => d.memberDistributions?.some(m => m.transactionId === t.id)))
                            .map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 font-medium">
                                  {formatBengaliDate(tx.date, isBn)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="font-bold text-slate-800 block">
                                    {tx.notes || (isBn ? 'সঞ্চিত জমার লভ্যাংশ' : 'Profit Dividend')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    #{tx.voucherNo}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    -
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                                  -
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-teal-700">
                                  +{formatCurrency(tx.amount, isBn && useBengaliDigits)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                    <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                    <span>{isBn ? 'সঞ্চয়ে যুক্ত' : 'Credited'}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* Tab: Shares & Closure Archive */}
        {activeTab === 'shares' && (
          !hasFinancialAccess ? (
            renderPrivacyProtectedNotice()
          ) : (
            <div className="p-6 space-y-6">
              {/* Member Active Shares Status Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                        <PieChart className="w-5 h-5" />
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">
                          {isBn ? 'সদস্যের বর্তমান সক্রিয় শেয়ার মূলধন' : 'Member Active Share Capital'}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {isBn ? 'সমিতিতে সদস্যের বর্তমান অংশীদারিত্ব ও মূলধন স্থিতি' : 'Current equity holding and share status in the somiti'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBuyShareModal(true)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{isBn ? 'নতুন শেয়ার কিনুন' : 'Buy Shares'}</span>
                    </button>
                    <button
                      onClick={() => setShowShareClosureModal(true)}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Archive className="w-4 h-4" />
                      <span>{isBn ? 'শেয়ার সমর্পণ/ক্লোজ' : 'Surrender Shares'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-amber-200/60">
                  <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block font-medium">বর্তমান সক্রিয় শেয়ার</span>
                    <span className="text-xl font-black text-blue-700 font-mono">
                      {displayCount(member.shareCount || 0)} টি
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">সদস্যের অর্জিত অংশীদারিত্ব</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block font-medium">মোট জমাকৃত সঞ্চয় স্থিতি</span>
                    <span className="text-xl font-black text-emerald-700">
                      {formatCurrency(member.totalSavings || 0, isBn && useBengaliDigits)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">ডিপোজিটকৃত আসল জমা</span>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[11px] text-slate-500 block font-medium">পূর্বে সমর্পিত/বন্ধকৃত শেয়ার</span>
                    <span className="text-xl font-bold text-slate-600 font-mono">
                      {displayCount(memberShareClosures.reduce((s, c) => s + (c.closedSharesCount || 0), 0))} টি
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">ক্লোজকৃত শেয়ার রেকর্ড</span>
                  </div>
                </div>
              </div>

              {/* Closed Shares Archive List for this member */}
              <div>
                <ShareClosuresList 
                  memberId={member.id} 
                  onOpenClosureModal={() => setShowShareClosureModal(true)} 
                />
              </div>
            </div>
          )
        )}

        {/* Tab 3: Loans & Installment Schedules */}
        {activeTab === 'loans' && (
          !hasFinancialAccess ? (
            renderPrivacyProtectedNotice()
          ) : (
            <div className="p-6 space-y-6">
              {memberLoans.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                  {isBn ? 'এই সদস্যের কোনো ঋণ হিসাব চালু নেই।' : 'No active loan accounts for this member.'}
                </div>
              ) : (
                memberLoans.map((loan) => (
                  <div key={loan.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs space-y-4 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                            {loan.loanNo}
                          </span>
                          <h4 className="font-bold text-sm text-slate-800">{loan.purpose}</h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {isBn ? `বিতরণের তারিখ: ${formatBengaliDate(loan.disbursedDate, isBn)} • জামিনদার: ${loan.guarantorName || 'তথ্য নেই'}` : `Disbursement Date: ${formatBengaliDate(loan.disbursedDate, isBn)} • Guarantor: ${loan.guarantorName || 'N/A'}`}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          loan.status === 'cleared' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {loan.status === 'cleared' ? (isBn ? 'ঋণ পরিশোধিত' : 'Cleared') : (isBn ? 'চলমান কিস্তি' : 'Active')}
                        </span>
                      </div>
                    </div>

                    {/* Loan Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400 block">{isBn ? 'মূল ঋণ:' : 'Principal:'}</span>
                        <span className="font-bold text-slate-800">{formatCurrency(loan.principalAmount, isBn && useBengaliDigits)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{isBn ? 'মোট প্রদেয় (লাভসহ):' : 'Total Payable:'}</span>
                        <span className="font-bold text-slate-800">{formatCurrency(loan.totalAmount, isBn && useBengaliDigits)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{isBn ? 'মোট পরিশোধ:' : 'Total Repaid:'}</span>
                        <span className="font-bold text-emerald-700">{formatCurrency(loan.paidAmount, isBn && useBengaliDigits)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">{isBn ? 'অবশিষ্ট বকেয়া:' : 'Remaining:'}</span>
                        <span className="font-bold text-rose-600">{formatCurrency(loan.remainingAmount, isBn && useBengaliDigits)}</span>
                      </div>
                    </div>

                    {/* Installment Table */}
                    <div>
                      <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        {isBn ? 'কিস্তি পরিশোধের বিস্তারিত শিডিউল' : 'Installment Repayment Schedule'}
                      </h5>
                      <div className="border border-slate-200 rounded-lg overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3">{isBn ? 'কিস্তি নং' : 'Installment No'}</th>
                              <th className="py-2 px-3">{isBn ? 'প্রদেয় তারিখ' : 'Due Date'}</th>
                              <th className="py-2 px-3 text-right">{isBn ? 'কিস্তির পরিমাণ' : 'Amount'}</th>
                              <th className="py-2 px-3 text-center">{isBn ? 'পরিশোধের অবস্থা' : 'Status'}</th>
                              <th className="py-2 px-3">{isBn ? 'পরিশোধের তারিখ' : 'Paid Date'}</th>
                              <th className="py-2 px-3 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {loan.schedule.map((sch) => (
                              <tr key={sch.installmentNo} className={sch.status === 'paid' ? 'bg-emerald-50/40' : ''}>
                                <td className="py-2 px-3 font-mono font-bold">
                                  #{displayCount(sch.installmentNo)}
                                </td>
                                <td className="py-2 px-3">
                                  {formatBengaliDate(sch.dueDate, isBn)}
                                </td>
                                <td className="py-2 px-3 text-right font-bold">
                                  {formatCurrency(sch.amount, isBn && useBengaliDigits)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    sch.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {sch.status === 'paid' ? (isBn ? 'পরিশোধিত ✓' : 'Paid ✓') : (isBn ? 'অপরিশোধিত' : 'Due')}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-500">
                                  {sch.paidDate ? formatBengaliDate(sch.paidDate, isBn) : '-'}
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {isUserAdmin && sch.status !== 'paid' && (
                                    <button
                                      onClick={() => {
                                        payLoanInstallment({
                                          loanId: loan.id,
                                          installmentNo: sch.installmentNo,
                                          amount: sch.amount,
                                          paymentMethod: 'cash',
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                                    >
                                      {isBn ? 'কিস্তি আদায়' : 'Collect'}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        )}

        {/* Tab 4: Nominee */}
        {activeTab === 'nominee' && (
          <div className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">
              {isBn ? 'নমিনি বা আইনগত উত্তরাধিকারী বিবরণ' : 'Nominee / Legal Beneficiary Information'}
            </h4>

            {member.nominees.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                {isBn ? 'কোনো নমিনি তথ্য সংরক্ষিত নেই।' : 'No nominee information saved.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.nominees.map((nom) => (
                  <div key={nom.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative group shrink-0">
                        {nom.photoUrl ? (
                          <img
                            src={nom.photoUrl}
                            alt={nom.name}
                            className="w-12 h-12 rounded-full object-cover object-top border border-slate-300 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                            {nom.name[0]}
                          </div>
                        )}
                        {isUserAdmin && (
                          <button
                            onClick={() => {
                              setSelectedNomineeId(nom.id);
                              setNewNomineePhotoUrl(nom.photoUrl || '');
                              setShowNomineePhotoModal(true);
                            }}
                            title={isBn ? "নমিনির ছবি পরিবর্তন বা আপলোড করুন" : "Change or Upload Nominee Photo"}
                            className="absolute -bottom-1 -right-1 p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-xs border border-white transition-all cursor-pointer hover:scale-110"
                          >
                            <Camera className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-800">{nom.name}</h5>
                        <span className="text-xs text-blue-600 font-semibold">{isBn ? `সম্পর্ক: ${nom.relation}` : `Relation: ${nom.relation}`}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Mobile Number / মোবাইল নম্বর:</span>
                        <span className="font-bold text-slate-700 font-mono">{nom.phone || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">NID Number / NID নম্বর:</span>
                        <span className="font-semibold text-slate-700 font-mono">{nom.nid || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Share Percentage / অংশীদারিত্ব হার (%):</span>
                        <span className="font-bold text-emerald-700">{displayCount(nom.percentage)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Address / ঠিকানা:</span>
                        <span className="font-medium truncate max-w-xs">{nom.address || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Agreements & Contracts */}
        {activeTab === 'agreement' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">
                {isBn ? 'সমিতি সদস্য চুক্তিপত্র ও অঙ্গীকারনামা' : 'Member Agreement & Undertaking'}
              </h4>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isBn ? 'চুক্তিপত্র প্রিন্ট করুন' : 'Print Agreement'}</span>
              </button>
            </div>

            {/* Signatures & Seal Customization Panel (no-print) */}
            <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs space-y-3.5 no-print">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <span>{isBn ? 'চুক্তিপত্রের কর্মকর্তা ও সিলমোহর স্বাক্ষর নির্ধারণ' : 'Agreement Signatures & Seal Configuration'}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {agrConfigTab === 'president'
                          ? (agrPresidentSource === 'member' ? (isBn ? 'সভাপতি: সদস্য তালিকা' : 'Pres: Member') : (isBn ? 'সভাপতি: কাস্টম/অন্য ব্যক্তি' : 'Pres: Custom'))
                          : (agrSecretarySource === 'member' ? (isBn ? 'সম্পাদক: সদস্য তালিকা' : 'Sec: Member') : (isBn ? 'সম্পাদক: কাস্টম/অন্য ব্যক্তি' : 'Sec: Custom'))
                        }
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isBn 
                        ? 'সদস্য চুক্তিপত্র ও অঙ্গীকারনামায় "সাধারণ সম্পাদক" ও "সভাপতি / সিলমোহর" স্বাক্ষরকারী নির্বাচন বা টাইপ করুন' 
                        : 'Configure General Secretary and President / Seal signatures for this member undertaking'}
                    </p>
                  </div>
                </div>

                {/* Active Preview Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs shadow-2xs">
                    <span className="text-slate-500 text-[11px]">{isBn ? 'সভাপতি / সিলমোহর:' : 'Pres / Seal:'}</span>
                    <span className="font-bold text-blue-950">{agrPresidentDisplayName}</span>
                    {agrPresidentDesignation && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-semibold text-blue-700 border border-blue-100">
                        {agrPresidentDesignation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
                    <span className="text-slate-500 text-[11px]">{isBn ? 'সাধারণ সম্পাদক:' : 'Secretary:'}</span>
                    <span className="font-bold text-slate-800">{agrSecretaryDisplayName}</span>
                    {agrSecretaryDesignation && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700 border border-slate-200">
                        {agrSecretaryDesignation}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: President & Seal vs Secretary */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAgrConfigTab('president')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    agrConfigTab === 'president'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isBn ? '১. সভাপতি / সিলমোহর স্বাক্ষর' : '1. President / Seal Signature'}
                </button>
                <button
                  type="button"
                  onClick={() => setAgrConfigTab('secretary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    agrConfigTab === 'secretary'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isBn ? '২. সাধারণ সম্পাদক স্বাক্ষর' : '2. General Secretary Signature'}
                </button>
              </div>

              {/* Configuration Form for President & Seal */}
              {agrConfigTab === 'president' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-4 flex rounded-xl bg-slate-200/80 p-1">
                      <button
                        type="button"
                        onClick={() => setAgrPresidentSource('member')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          agrPresidentSource === 'member'
                            ? 'bg-white text-blue-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সদস্য তালিকা থেকে' : 'From Members'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgrPresidentSource('other')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          agrPresidentSource === 'other'
                            ? 'bg-white text-blue-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অন্য ব্যক্তি / কাস্টম' : 'Other Person'}</span>
                      </button>
                    </div>

                    <div className="md:col-span-8 flex flex-col sm:flex-row items-center gap-2.5">
                      {agrPresidentSource === 'member' ? (
                        <div className="w-full sm:flex-1">
                          <select
                            value={agrPresidentMemberId}
                            onChange={(e) => setAgrPresidentMemberId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          >
                            {members.length === 0 ? (
                              <option value="">{isBn ? 'কোনো সদস্য নেই' : 'No members found'}</option>
                            ) : (
                              members.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.memberNo} - {m.name} {m.phone ? `(${m.phone})` : ''}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      ) : (
                        <div className="w-full sm:flex-1">
                          <input
                            type="text"
                            value={agrPresidentCustomName}
                            onChange={(e) => setAgrPresidentCustomName(e.target.value)}
                            placeholder={isBn ? 'সভাপতির নাম লিখুন (যেমন: মোঃ মোস্তফা কামাল)' : 'Enter President name'}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                      )}

                      <div className="w-full sm:w-60">
                        <input
                          type="text"
                          value={agrPresidentDesignation}
                          onChange={(e) => setAgrPresidentDesignation(e.target.value)}
                          placeholder={isBn ? 'পদবী (যেমন: সভাপতি)' : 'Designation (e.g. President)'}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Presets for President */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {isBn ? 'দ্রুত পদবী বাছাই:' : 'Designation Presets:'}
                    </span>
                    {['সভাপতি', 'চেয়ারম্যান', 'ম্যানেজিং ডিরেক্টর', 'প্রধান নির্বাহী', 'কার্যনির্বাহী সদস্য'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAgrPresidentDesignation(role)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          agrPresidentDesignation === role
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        {role}
                      </button>
                    ))}

                    {agrPresidentSource === 'other' && settings.presidentName && (
                      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                        <span className="text-slate-400">|</span>
                        <span className="font-semibold text-slate-500">{isBn ? 'সমিতির সভাপতি লোড:' : 'Quick President:'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAgrPresidentCustomName(settings.presidentName);
                            setAgrPresidentDesignation('সভাপতি');
                          }}
                          className="px-2 py-0.5 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-900 text-[10px] font-semibold border border-blue-300 cursor-pointer"
                        >
                          {isBn ? 'সভাপতি:' : 'Pres:'} {settings.presidentName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Configuration Form for Secretary */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-4 flex rounded-xl bg-slate-200/80 p-1">
                      <button
                        type="button"
                        onClick={() => setAgrSecretarySource('member')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          agrSecretarySource === 'member'
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সদস্য তালিকা থেকে' : 'From Members'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgrSecretarySource('other')}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          agrSecretarySource === 'other'
                            ? 'bg-white text-slate-900 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অন্য ব্যক্তি / কাস্টম' : 'Other Person'}</span>
                      </button>
                    </div>

                    <div className="md:col-span-8 flex flex-col sm:flex-row items-center gap-2.5">
                      {agrSecretarySource === 'member' ? (
                        <div className="w-full sm:flex-1">
                          <select
                            value={agrSecretaryMemberId}
                            onChange={(e) => setAgrSecretaryMemberId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          >
                            {members.length === 0 ? (
                              <option value="">{isBn ? 'কোনো সদস্য নেই' : 'No members found'}</option>
                            ) : (
                              members.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.memberNo} - {m.name} {m.phone ? `(${m.phone})` : ''}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      ) : (
                        <div className="w-full sm:flex-1">
                          <input
                            type="text"
                            value={agrSecretaryCustomName}
                            onChange={(e) => setAgrSecretaryCustomName(e.target.value)}
                            placeholder={isBn ? 'সাধারণ সম্পাদকের নাম লিখুন' : 'Enter Secretary name'}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                        </div>
                      )}

                      <div className="w-full sm:w-60">
                        <input
                          type="text"
                          value={agrSecretaryDesignation}
                          onChange={(e) => setAgrSecretaryDesignation(e.target.value)}
                          placeholder={isBn ? 'পদবী (যেমন: সাধারণ সম্পাদক)' : 'Designation'}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Presets for Secretary */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {isBn ? 'দ্রুত পদবী বাছাই:' : 'Designation Presets:'}
                    </span>
                    {['সাধারণ সম্পাদক', 'যুগ্ম সম্পাদক', 'কোষাধ্যক্ষ', 'ব্যবস্থাপক / ম্যানেজার'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAgrSecretaryDesignation(role)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          agrSecretaryDesignation === role
                            ? 'bg-blue-600 text-white font-bold shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        {role}
                      </button>
                    ))}

                    {agrSecretarySource === 'other' && settings.secretaryName && (
                      <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                        <span className="text-slate-400">|</span>
                        <span className="font-semibold text-slate-500">{isBn ? 'সমিতির সম্পাদক লোড:' : 'Quick Secretary:'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAgrSecretaryCustomName(settings.secretaryName);
                            setAgrSecretaryDesignation('সাধারণ সম্পাদক');
                          }}
                          className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-semibold border border-blue-200 cursor-pointer"
                        >
                          {isBn ? 'সম্পাদক:' : 'Sec:'} {settings.secretaryName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Printable Agreement Document Container */}
            <div className="border-2 border-slate-800 p-8 rounded-xl bg-white space-y-6 text-slate-800 font-serif leading-relaxed">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-800 pb-4">
                <h2 className="text-xl font-bold uppercase tracking-wide">
                  {settings.somitiName || (isBn ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bondhu Somobay Somiti Ltd.')}
                </h2>
                <p className="text-xs font-sans text-slate-600 mt-1">
                  {settings.registrationNo} • {settings.address}
                </p>
                <h3 className="text-base font-bold underline mt-3">
                  {isBn ? 'সদস্যপদ গ্রহণ ও সঞ্চয় আমানতের অঙ্গীকারনামা' : 'Membership Agreement & Savings Undertaking'}
                </h3>
              </div>

              {/* Body text */}
              <div className="text-sm space-y-3 font-sans">
                {isBn ? (
                  <>
                    <p>
                      আমি নিম্নস্বাক্ষরকারী, <strong>{member.name}</strong>, পিতা: {member.fatherName || 'মৃত'}, মাতা: {member.motherName}, বর্তমান ঠিকানা: {member.presentAddress}—স্বেচ্ছায় ও সুস্থ মস্তিষ্কে {settings.somitiName}-এর সদস্যপদ লাভের আবেদন করিতেছি এবং সমিতির সকল উপ-আইন ও পরিচালনা পর্ষদের সিদ্ধান্ত মানিয়া চলার অঙ্গীকার করিতেছি।
                    </p>
                    <p>
                      আমার সদস্য নম্বর <strong>{member.memberNo}</strong>। আমি সমিতিতে {toBengaliNumber(member.shareCount)} টি শেয়ার বাবদ {formatCurrency(member.shareValue, useBengaliDigits)} টাকা এবং ভর্তি ফি বাবদ {formatCurrency(member.admissionFee, useBengaliDigits)} টাকা জমা প্রদান করিয়াছি।
                    </p>
                    <p>
                      আমার অবর্তমানে আমার সকল সঞ্চয়, শেয়ার এবং আমানতের আইনগত হকদার থাকিবেন আমার মনোনীত নমিনি: <strong>{member.nominees[0]?.name || 'মনোনীত নমিনি'}</strong> (সম্পর্ক: {member.nominees[0]?.relation || 'পরিবার'}, অংশ: {toBengaliNumber(member.nominees[0]?.percentage || 100)}%)।
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      I, the undersigned, <strong>{member.nameEn || member.name}</strong>, Father: {member.fatherName || 'Deceased'}, Mother: {member.motherName}, Present Address: {member.presentAddress}, hereby willingly and soundly apply for membership in {settings.somitiName || 'Bondhu Somobay Somiti Ltd.'} and undertake to abide by all bylaws and board decisions.
                    </p>
                    <p>
                      My member registration number is <strong>{member.memberNo}</strong>. I have deposited {formatCurrency(member.shareValue, false)} for {member.shareCount} shares and {formatCurrency(member.admissionFee, false)} as membership admission fee.
                    </p>
                    <p>
                      In my absence, my designated legal nominee <strong>{member.nominees[0]?.name || 'Nominee'}</strong> (Relationship: {member.nominees[0]?.relation || 'Family'}, Share: {member.nominees[0]?.percentage || 100}%) shall be the sole rightful heir to all my savings, shares, and deposits.
                    </p>
                  </>
                )}
              </div>

              {/* Signatures */}
              <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-sans border-t border-slate-300 mt-12">
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                    {member.name}
                  </div>
                  <span className="text-slate-500">{isBn ? 'সদস্যের স্বাক্ষর' : 'Member Signature'}</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                    {agrSecretaryDisplayName}
                  </div>
                  {agrSecretaryDesignation && (
                    <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                      {agrSecretaryDesignation}
                    </div>
                  )}
                  <span className="text-slate-500">{isBn ? 'সাধারণ সম্পাদক' : 'General Secretary'}</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                    {agrPresidentDisplayName}
                  </div>
                  {agrPresidentDesignation && (
                    <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                      {agrPresidentDesignation}
                    </div>
                  )}
                  <span className="text-slate-500">{isBn ? 'সভাপতি / সিলমোহর' : 'President / Seal'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Business Funding */}
        {activeTab === 'business' && (
          <div className="p-6">
            <MemberBusinessFundingTab member={member} isBn={isBn} />
          </div>
        )}
      </div>

      {/* Member Photo Change Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>{isBn ? `${member.name} - এর ছবি পরিবর্তন ও আপলোড` : `Change Photo - ${member.name}`}</span>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <PhotoUploadField
                label={isBn ? "নতুন ছবি নির্বাচন বা আপলোড করুন" : "Select or Upload New Photo"}
                value={newPhotoUrl}
                onChange={setNewPhotoUrl}
                helperText={isBn ? "গ্যালারি/ক্যামেরা থেকে ফাইল বেছে নিন বা নমুনা ছবি নির্বাচন করুন" : "Pick from device or select avatar preset"}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (newPhotoUrl) {
                      updateMember(member.id, { photoUrl: newPhotoUrl });
                      setShowPhotoModal(false);
                    }
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Photo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nominee Photo Change Modal */}
      {showNomineePhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Camera className="w-4 h-4 text-blue-400" />
                <span>
                  {isBn 
                    ? `${member.nominees.find(n => n.id === selectedNomineeId)?.name || 'নমিনি'} - এর ছবি পরিবর্তন ও আপলোড` 
                    : `Change Nominee Photo - ${member.nominees.find(n => n.id === selectedNomineeId)?.name || 'Nominee'}`}
                </span>
              </div>
              <button
                onClick={() => setShowNomineePhotoModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <PhotoUploadField
                label={isBn ? "নমিনির নতুন ছবি নির্বাচন বা আপলোড করুন" : "Select or Upload Nominee Photo"}
                value={newNomineePhotoUrl}
                onChange={setNewNomineePhotoUrl}
                helperText={isBn ? "গ্যালারি/ক্যামেরা থেকে ফাইল বেছে নিন বা নমুনা ছবি নির্বাচন করুন" : "Pick from device or select avatar preset"}
              />

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNomineePhotoModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = member.nominees.map(n => 
                      n.id === selectedNomineeId ? { ...n, photoUrl: newNomineePhotoUrl } : n
                    );
                    updateMember(member.id, { nominees: updated });
                    setShowNomineePhotoModal(false);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Photo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Closure Modal */}
      <ShareClosureModal
        isOpen={showShareClosureModal}
        onClose={() => setShowShareClosureModal(false)}
        preselectedMemberId={member.id}
        lockMember={true}
      />

      {/* Buy Share Modal */}
      <BuyShareModal
        isOpen={showBuyShareModal}
        onClose={() => setShowBuyShareModal(false)}
        preselectedMemberId={member.id}
        lockMember={true}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={showEditMemberModal}
        onClose={() => setShowEditMemberModal(false)}
        member={member}
      />

      {/* Member-Locked Direct Modals */}
      <NewDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        initialMemberId={member.id}
        lockMember={true}
      />

      <NewWithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        initialMemberId={member.id}
        lockMember={true}
      />

      <NewLoanModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        initialMemberId={member.id}
        lockMember={true}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteMemberModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        member={member}
        onDeleted={onBack}
      />
    </div>
  );
};
