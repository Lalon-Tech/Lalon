import React, { useState } from 'react';
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
  Users,
  UserPlus,
  Archive,
  TrendingUp,
  PieChart,
  Edit3,
  Trash2
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
import { Transaction } from '../../types';
import { MemberBusinessFundingTab } from '../business/MemberBusinessFundingTab';
import { 
  formatCurrency, 
  formatInteger, 
  formatBengaliDate, 
  getTransactionTypeName, 
  toBengaliNumber 
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
    profitDistributions
  } = useSomiti();

  const [activeTab, setActiveTab] = useState<'passbook' | 'savings' | 'shares' | 'loans' | 'business' | 'nominee' | 'agreement'>('passbook');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showShareClosureModal, setShowShareClosureModal] = useState(false);
  const [showBuyShareModal, setShowBuyShareModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  const member = members.find(m => m.id === memberId) || (members.length > 0 ? members[0] : undefined);

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
  const totalMemberProfitFromPool = profitDistributions.reduce((sum, dist) => {
    const share = dist.memberDistributions?.find(m => m.memberId === member.id);
    return sum + (Number(share?.allocatedProfit) || 0);
  }, 0);

  const memberProfitTxs = memberTransactions.filter(
    t => t.type === 'profit_share' && t.category !== 'business_profit_member_share'
  );
  const totalProfitFromTxs = memberProfitTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalMemberProfitEarned = Math.max(
    totalMemberProfitFromPool,
    totalProfitFromTxs
  );

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
            <span>{isBn ? 'সকল সদস্য তালিকা' : 'Member List'}</span>
          </button>

          {members.length > 1 && (
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
                onClick={() => setShowQuickDepositModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>{isBn ? 'টাকা জমা' : 'Deposit'}</span>
              </button>
              <button
                onClick={() => setShowQuickWithdrawModal(true)}
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
                onClick={() => setShowQuickLoanModal(true)}
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
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-white/20 shadow-md bg-slate-800"
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
                    {isBn ? `যোগদান: ${formatBengaliDate(member.joiningDate, isBn)}` : `Joined: ${formatBengaliDate(member.joiningDate, isBn)}`}
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
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10 text-center min-w-[95px]">
                    <span className="text-[11px] text-blue-200 block">{isBn ? 'মোট সঞ্চয় স্থিতি' : 'Total Savings'}</span>
                    <span className="text-sm sm:text-base font-bold text-emerald-300">
                      {formatCurrency(member.totalSavings, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10 text-center min-w-[95px]">
                    <span className="text-[11px] text-amber-200 block flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3 text-amber-300 inline" />
                      <span>{isBn ? 'অর্জিত মোট লাভ' : 'Total Profit'}</span>
                    </span>
                    <span className="text-sm sm:text-base font-bold text-amber-300">
                      {formatCurrency(totalMemberProfitEarned, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xs p-2.5 sm:p-3 rounded-xl border border-white/10 text-center min-w-[95px]">
                    <span className="text-[11px] text-blue-200 block">{isBn ? 'চলতি বকেয়া ঋণ' : 'Active Loan Due'}</span>
                    <span className="text-sm sm:text-base font-bold text-rose-300">
                      {formatCurrency(member.activeLoanBalance, isBn && useBengaliDigits)}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
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

        {/* Tab 1: Passbook & Ledger */}
        {activeTab === 'passbook' && (
          !hasFinancialAccess ? (
            renderPrivacyProtectedNotice()
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-800">
                  {isBn ? 'সদস্যের পাসবুক ও সার্বিক লেজার বিবরণী' : 'Member Passbook & General Ledger'}
                </h3>
                <span className="text-xs text-slate-500">
                  {isBn ? `সর্বমোট লেনদেন: ${displayCount(memberTransactions.length)} টি` : `Total transactions: ${displayCount(memberTransactions.length)}`}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'ভাউচার নং' : 'Voucher No'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'বিবরণ / ধরন' : 'Type / Description'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'মাধ্যম' : 'Method'}</th>
                      <th className="py-2.5 px-3 text-right">{isBn ? 'আদায় / জমা (৳)' : 'Credit / Deposit (৳)'}</th>
                      <th className="py-2.5 px-3 text-right">{isBn ? 'উত্তোলন / বিতরণ (৳)' : 'Debit / Paid (৳)'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'কালেক্টর' : 'Collector'}</th>
                      <th className="py-2.5 px-3 text-center">{isBn ? 'রসিদ' : 'Receipt'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {memberTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          {isBn ? 'এখনো কোনো লেনদেনের রেকর্ড নেই।' : 'No transaction records yet.'}
                        </td>
                      </tr>
                    ) : (
                      memberTransactions.map((tx) => {
                        const typeInfo = getTransactionTypeName(tx.type, isBn);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-medium">
                              {formatBengaliDate(tx.date, isBn)}
                              <span className="block text-[10px] text-slate-400">{tx.time}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                              {tx.voucherNo}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${typeInfo.badge}`}>
                                {typeInfo.label}
                              </span>
                              {tx.notes && <span className="block text-[10px] text-slate-400 truncate max-w-xs">{tx.notes}</span>}
                            </td>
                            <td className="py-2.5 px-3 uppercase font-medium text-slate-500">
                              {tx.paymentMethod}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              {typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                              {!typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {tx.collectedBy}
                            </td>
                            <td className="py-2.5 px-3 text-center">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
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
                      {nom.photoUrl ? (
                        <img
                          src={nom.photoUrl}
                          alt={nom.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-300 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                          {nom.name[0]}
                        </div>
                      )}
                      <div>
                        <h5 className="font-bold text-sm text-slate-800">{nom.name}</h5>
                        <span className="text-xs text-blue-600 font-semibold">{isBn ? `সম্পর্ক: ${nom.relation}` : `Relation: ${nom.relation}`}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isBn ? 'মোবাইল:' : 'Phone:'}</span>
                        <span className="font-semibold">{nom.phone || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isBn ? 'NID নম্বর:' : 'NID No:'}</span>
                        <span className="font-semibold">{nom.nid || (isBn ? 'দেওয়া হয়নি' : 'N/A')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isBn ? 'অংশীদারিত্ব হার:' : 'Share Percentage:'}</span>
                        <span className="font-bold text-emerald-700">{displayCount(nom.percentage)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{isBn ? 'ঠিকানা:' : 'Address:'}</span>
                        <span className="font-medium truncate max-w-xs">{nom.address}</span>
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
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    {member.name}
                  </div>
                  <span className="text-slate-500">{isBn ? 'সদস্যের স্বাক্ষর' : 'Member Signature'}</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    {settings.secretaryName || (isBn ? 'সম্পাদক' : 'Secretary')}
                  </div>
                  <span className="text-slate-500">{isBn ? 'সাধারণ সম্পাদক' : 'General Secretary'}</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 font-bold">
                    {settings.presidentName || (isBn ? 'সভাপতি' : 'President')}
                  </div>
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

      {/* Share Closure Modal */}
      <ShareClosureModal
        isOpen={showShareClosureModal}
        onClose={() => setShowShareClosureModal(false)}
        preselectedMemberId={member.id}
      />

      {/* Buy Share Modal */}
      <BuyShareModal
        isOpen={showBuyShareModal}
        onClose={() => setShowBuyShareModal(false)}
        preselectedMemberId={member.id}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={showEditMemberModal}
        onClose={() => setShowEditMemberModal(false)}
        member={member}
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
