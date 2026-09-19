import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ArrowDownRight, 
  ArrowUpRight,
  CreditCard, 
  Coins, 
  ChevronRight,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Lock,
  ShieldCheck,
  Edit3,
  FileText,
  RotateCcw,
  Archive,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { EditMemberModal } from './EditMemberModal';
import { DeleteMemberModal } from './DeleteMemberModal';
import { PermanentDeleteMemberModal } from './PermanentDeleteMemberModal';
import { MemberDataCollectionModal } from './MemberDataCollectionModal';
import { Member } from '../../types';
import { 
  formatCurrency, 
  formatInteger, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const MemberList: React.FC = () => {
  const { language, t } = useLanguage();
  const isBn = language === 'bn';

  const { 
    activeTab,
    setActiveTab,
    members, 
    transactions,
    businessProfitRecords,
    profitDistributions,
    totalApprovedProfit,
    useBengaliDigits, 
    setSelectedMemberId, 
    setShowNewMemberModal,
    setShowQuickDepositModal,
    setShowQuickWithdrawModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal,
    deleteMember,
    restoreMemberFromRecycleBin,
    permanentlyDeleteMember,
    isUserAdmin,
    canViewMemberFinancials
  } = useSomiti();

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberToPermanentlyDelete, setMemberToPermanentlyDelete] = useState<Member | null>(null);
  const [restoringMemberId, setRestoringMemberId] = useState<string | null>(null);
  const [showDataCollectionModal, setShowDataCollectionModal] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'has_loan' | 'recycle_bin'>(() => {
    if (activeTab === 'active_members' || activeTab === 'members_active') return 'active';
    if (activeTab === 'recycle_bin' || activeTab === 'member_recycle_bin') return 'recycle_bin';
    return 'all';
  });

  useEffect(() => {
    if (activeTab === 'active_members' || activeTab === 'members_active') {
      setStatusFilter('active');
    } else if (activeTab === 'recycle_bin' || activeTab === 'member_recycle_bin') {
      setStatusFilter('recycle_bin');
    } else if (activeTab === 'all_members' || activeTab === 'members_all' || activeTab === 'members') {
      setStatusFilter('all');
    }
  }, [activeTab]);

  const nonDeletedMembers = members.filter(m => !m.isDeleted);
  const recycledMembers = members.filter(m => m.isDeleted);

  // Memoized profit calculation per member from actual completed records
  const memberProfitMap = useMemo(() => {
    const map: Record<string, number> = {};

    // 1. Calculate from completed profit transactions
    transactions.forEach(t => {
      if (t.status === 'completed' && (t.type === 'profit_share' || t.type === 'business_funding_profit') && t.memberId) {
        map[t.memberId] = (map[t.memberId] || 0) + (Number(t.amount) || 0);
      }
    });

    // 2. Check if any distributions exist in profitDistributions from approved business profit records
    const activeRecordIds = new Set(businessProfitRecords.filter(r => r.status === 'completed').map(r => r.id));
    profitDistributions.forEach(dist => {
      const recordTag = (dist as any).businessProfitRecordId 
        || (dist.id.startsWith('pd-bpr-') ? dist.id.slice(7) : (dist.id.startsWith('dist-bpr-') ? dist.id.slice(9) : dist.notes?.match(/\[(bpr-[^\]]+)\]/)?.[1]));
      if (recordTag && !activeRecordIds.has(recordTag)) {
        return;
      }
      (dist.memberDistributions || []).forEach(md => {
        if (md.memberId && (!map[md.memberId] || map[md.memberId] === 0) && (Number(md.allocatedProfit) || 0) > 0) {
          map[md.memberId] = (map[md.memberId] || 0) + (Number(md.allocatedProfit) || 0);
        }
      });
    });

    return map;
  }, [transactions, businessProfitRecords, profitDistributions]);

  const filteredMembers = (statusFilter === 'recycle_bin' ? recycledMembers : nonDeletedMembers).filter((m) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (m.name ?? '').toLowerCase().includes(q) ||
      (m.nameEn ?? '').toLowerCase().includes(q) ||
      (m.memberNo ?? '').toLowerCase().includes(q) ||
      (m.phone ?? '').includes(searchTerm) ||
      (m.nid ?? '').includes(searchTerm);

    if (!matchesSearch) return false;

    if (statusFilter === 'recycle_bin') return true;
    if (statusFilter === 'active') return m.status === 'active';
    if (statusFilter === 'inactive') return m.status !== 'active';
    if (statusFilter === 'has_loan') return m.activeLoanBalance > 0;

    return true;
  });

  const exportToExcel = () => {
    const dataToExport = filteredMembers.map(m => ({
      [isBn ? 'সদস্য নং' : 'Member No']: m.memberNo,
      [isBn ? 'নাম' : 'Name']: m.name,
      [isBn ? 'নাম (ইংরেজি)' : 'Name (English)']: m.nameEn || '',
      [isBn ? 'মোবাইল' : 'Phone']: m.phone,
      [isBn ? 'জাতীয় পরিচয়পত্র' : 'NID']: m.nid,
      [isBn ? 'পেশা' : 'Occupation']: m.occupation,
      [isBn ? 'শেয়ার সংখ্যা' : 'Share Count']: m.shareCount,
      [isBn ? 'মোট সঞ্চয় (৳)' : 'Total Savings (৳)']: m.totalSavings,
      [isBn ? 'মোট লভ্যাংশ (৳)' : 'Total Profit (৳)']: memberProfitMap[m.id] || 0,
      [isBn ? 'চলতি ঋণ (৳)' : 'Active Loan (৳)']: m.activeLoanBalance,
      [isBn ? 'যোগদানের তারিখ' : 'Joining Date']: m.joiningDate,
      [isBn ? 'অবস্থা' : 'Status']: m.isDeleted ? (isBn ? 'রিসাইকেল বিন' : 'Recycle Bin') : (m.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'সদস্য তালিকা' : 'Member List');
    XLSX.writeFile(wb, `bondhu_members_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalMembersCount = nonDeletedMembers.length;
  const activeMembersCount = nonDeletedMembers.filter(m => m.status === 'active').length;
  const hasLoanMembersCount = nonDeletedMembers.filter(m => m.activeLoanBalance > 0).length;
  const totalSavingsSum = nonDeletedMembers.reduce((s, m) => s + m.totalSavings, 0);
  const totalLoansSum = nonDeletedMembers.reduce((s, m) => s + m.activeLoanBalance, 0);
  const totalSharesCount = nonDeletedMembers.reduce((s, m) => s + (m.shareCount || 0), 0);
  const recycleBinCount = recycledMembers.length;

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stats Cards: 5 Core Financial & Member Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'মোট নিবন্ধিত সদস্য' : 'Total Registered Members'}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {displayCount(totalMembersCount)} {isBn ? 'জন' : 'Members'}
          </div>
          <span className="text-xs text-emerald-600 font-medium">
            {isBn ? 'সক্রিয়' : 'Active'}: {displayCount(activeMembersCount)} {isBn ? 'জন' : ''}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'মোট সঞ্চয় স্থিতি' : 'Total Savings Balance'}</span>
            <span className="text-xs text-emerald-600 font-bold">{isBn ? 'সঞ্চয় তহবিল' : 'Savings Fund'}</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalSavingsSum, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">{isBn ? 'সাধারণ + ডিপিএস + এফডিআর' : 'General + DPS + FDR'}</span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-teal-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-teal-800">{isBn ? 'মোট অর্জিত লভ্যাংশ' : 'Total Profit'}</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">
            {formatCurrency(totalApprovedProfit, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-teal-600 font-medium">{isBn ? 'অনুমোদিত মুনাফা তহবিল' : 'Approved Profit Fund'}</span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'মোট বকেয়া ঋণ স্থিতি' : 'Total Outstanding Loans'}</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            {formatCurrency(totalLoansSum, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">{isBn ? 'মাঠে বিনিয়োগকৃত কিস্তি' : 'Active Field Investments'}</span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'মোট সক্রিয় শেয়ার' : 'Total Active Shares'}</span>
            <span className="text-xs text-blue-600 font-bold">{isBn ? 'শেয়ার সংখ্যা' : 'Shares'}</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {displayCount(totalSharesCount)} {isBn ? 'টি' : 'Shares'}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'সমিতির সকল সক্রিয় সদস্যের মোট অংশীদারিত্ব' : 'All active members equity shares'}
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Add button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? "সদস্য খুঁজুন (নাম, সদস্য নং, ফোন, NID)..." : "Search member (Name, A/C No, Phone, NID)..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Status Filter buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium flex-wrap gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {isBn ? `সকল (${displayCount(totalMembersCount)})` : `All (${displayCount(totalMembersCount)})`}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {isBn ? `সক্রিয় (${displayCount(activeMembersCount)})` : `Active (${displayCount(activeMembersCount)})`}
            </button>
            <button
              onClick={() => setStatusFilter('has_loan')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'has_loan' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {isBn ? `চলতি ঋণ (${displayCount(hasLoanMembersCount)})` : `Active Loan (${displayCount(hasLoanMembersCount)})`}
            </button>
            {isUserAdmin && (
              <button
                onClick={() => setStatusFilter('recycle_bin')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'recycle_bin'
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{isBn ? 'রিসাইকেল বিন' : 'Recycle Bin'}</span>
                {recycleBinCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    statusFilter === 'recycle_bin' ? 'bg-white text-amber-700' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {displayCount(recycleBinCount)}
                  </span>
                )}
              </button>
            )}
          </div>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'এক্সেল' : 'Excel'}</span>
          </button>

          {/* Member Admission Form & Messenger Data Collector */}
          <button
            onClick={() => setShowDataCollectionModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
            title={isBn ? 'মেসেঞ্জার গ্রুপে দেওয়ার টেক্সট ও Word (.doc) ফরম ডাউনলোড' : 'Messenger text and Word form download'}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isBn ? 'ভর্তি ফরম (Word/মেসেঞ্জার)' : 'Admission Form (Word)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('new_member')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isBn ? 'নতুন সদস্য ভর্তি' : 'New Member'}</span>
          </button>
        </div>
      </div>

      {/* Recycle Bin Informative Banner */}
      {statusFilter === 'recycle_bin' && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 shadow-2xs">
          <Archive className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-sm text-amber-950 mb-1">
              {isBn ? 'সদস্য রিসাইকেল বিন (Member Recycle Bin)' : 'Member Recycle Bin'}
            </h4>
            <p className="text-amber-800 leading-relaxed">
              {isBn
                ? 'এখানে থাকা সদস্যদের শেয়ার, সঞ্চয়, ঋণ, কিস্তি এবং আর্থিক হিস্ট্রি শতভাগ নিরাপদে সংরক্ষিত রয়েছে। তারা সমিতির সাধারণ সক্রিয় সদস্য বা মূলধনে যুক্ত নন। আপনি যেকোনো সময় সদস্যকে তার পূর্বাবস্থায় "পুনরুদ্ধার" করতে পারেন অথবা চূড়ান্ত সতর্কতার সাথে "চিরতরে মুছে" ফেলতে পারেন।'
                : 'All removed members here retain 100% of their shares, savings, loans, and ledger history. They do not affect normal active calculations. You can Restore them with all data intact, or permanently delete them.'}
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {deleteSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{deleteSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setDeleteSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'সদস্য তথ্য' : 'Member Info'}</th>
                <th className="py-3 px-4">{isBn ? 'মোবাইল ও ঠিকানা' : 'Phone & Address'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'শেয়ার' : 'Shares'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'মোট সঞ্চয়' : 'Total Savings'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'মোট লভ্যাংশ' : 'Total Profit'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'চলতি ঋণ' : 'Active Loan'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {isBn ? 'কোনো সদস্য পাওয়া যায়নি।' : 'No members found.'}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setActiveTab('member_profile');
                    }}
                  >
                    {/* Member Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover object-top border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[11px] font-semibold">
                              {member.memberNo}
                            </span>
                            <span>• {member.occupation}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact & Address */}
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-slate-700">{member.phone}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">{member.presentAddress}</div>
                    </td>

                    {/* Shares */}
                    <td className="py-3 px-4 text-center">
                      {canViewMemberFinancials(member.id) ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {displayCount(member.shareCount || 0)} {isBn ? 'টি' : 'Shares'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{isBn ? 'সংরক্ষিত' : 'Private'}</span>
                        </span>
                      )}
                    </td>

                    {/* Total Savings */}
                    <td className="py-3 px-4 text-right">
                      {canViewMemberFinancials(member.id) ? (
                        <>
                          <div className="font-bold text-emerald-700">
                            {formatCurrency(member.totalSavings, isBn && useBengaliDigits)}
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            DPS: {formatCurrency(member.dpsSavingsBalance, isBn && useBengaliDigits)}
                          </span>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{isBn ? 'গোপনীয়' : 'Private'}</span>
                        </span>
                      )}
                    </td>

                    {/* Total Profit */}
                    <td className="py-3 px-4 text-right">
                      {canViewMemberFinancials(member.id) ? (
                        (memberProfitMap[member.id] || 0) > 0 ? (
                          <div className="font-bold text-teal-700">
                            +{formatCurrency(memberProfitMap[member.id] || 0, isBn && useBengaliDigits)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">৳০</span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{isBn ? 'গোপনীয়' : 'Private'}</span>
                        </span>
                      )}
                    </td>

                    {/* Active Loan */}
                    <td className="py-3 px-4 text-right">
                      {canViewMemberFinancials(member.id) ? (
                        member.activeLoanBalance > 0 ? (
                          <div className="font-bold text-indigo-700">
                            {formatCurrency(member.activeLoanBalance, isBn && useBengaliDigits)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          <span>{isBn ? 'গোপনীয়' : 'Private'}</span>
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      {member.isDeleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                          <Archive className="w-3 h-3 text-amber-700" />
                          <span>{isBn ? 'রিসাইকেল বিন' : 'Recycle Bin'}</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            member.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setActiveTab('member_profile');
                          }}
                          title={isBn ? "প্রোফাইল ও পাসবুক দেখুন" : "View Profile & Passbook"}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {member.isDeleted ? (
                          isUserAdmin && (
                            <>
                              <button
                                onClick={async () => {
                                  setRestoringMemberId(member.id);
                                  const ok = await restoreMemberFromRecycleBin(member.id);
                                  setRestoringMemberId(null);
                                  if (ok) {
                                    setDeleteSuccessMsg(
                                      isBn 
                                        ? `সদস্য #${member.memberNo} সফলভাবে পুনরুদ্ধার করা হয়েছে।` 
                                        : `Member #${member.memberNo} successfully restored.`
                                    );
                                    setTimeout(() => setDeleteSuccessMsg(null), 4000);
                                  }
                                }}
                                disabled={restoringMemberId === member.id}
                                title={isBn ? "পুনরুদ্ধার করুন" : "Restore Member"}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${restoringMemberId === member.id ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">{isBn ? 'পুনরুদ্ধার' : 'Restore'}</span>
                              </button>
                              <button
                                onClick={() => setMemberToPermanentlyDelete(member)}
                                title={isBn ? "স্থায়ীভাবে মুছে ফেলুন" : "Permanently Delete"}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span className="hidden sm:inline">{isBn ? 'চিরতরে মুছুন' : 'Delete'}</span>
                              </button>
                            </>
                          )
                        ) : (
                          isUserAdmin && (
                            <>
                              <button
                                onClick={() => setEditingMember(member)}
                                title={isBn ? "সদস্য তথ্য ও শেয়ার এডিট করুন" : "Edit Member Info & Shares"}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMemberId(member.id);
                                  setShowQuickDepositModal(true);
                                }}
                                title={isBn ? "টাকা জমা নিন" : "Deposit Money"}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMemberId(member.id);
                                  setShowQuickWithdrawModal(true);
                                }}
                                title={isBn ? "টাকা উত্তোলন করুন" : "Withdraw Money"}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                              {member.activeLoanBalance > 0 && (
                                <button
                                  onClick={() => {
                                    setSelectedMemberId(member.id);
                                    setShowQuickKistiModal(true);
                                  }}
                                  title={isBn ? "কিস্তি আদায়" : "Collect Installment"}
                                  className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Coins className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMemberToDelete(member);
                                }}
                                title={isBn ? "রিসাইকেল বিনে পাঠান" : "Move to Recycle Bin"}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
      />

      {/* Move to Recycle Bin Confirmation Modal */}
      <DeleteMemberModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        member={memberToDelete}
        onDeleted={() => {
          setDeleteSuccessMsg(
            isBn
              ? 'সদস্যকে রিসাইকেল বিনে স্থানান্তর করা হয়েছে। সকল রেকর্ড অক্ষুণ্ণ রয়েছে।'
              : 'Member moved to Recycle Bin. All records preserved.'
          );
          setTimeout(() => setDeleteSuccessMsg(null), 4000);
        }}
      />

      {/* Permanent Delete Member Confirmation Modal */}
      <PermanentDeleteMemberModal
        isOpen={!!memberToPermanentlyDelete}
        onClose={() => setMemberToPermanentlyDelete(null)}
        member={memberToPermanentlyDelete}
        onPermanentlyDeleted={() => {
          setDeleteSuccessMsg(
            isBn
              ? 'সদস্য এবং তার সংশ্লিষ্ট সকল রেকর্ড স্থায়ীভাবে মুছে ফেলা হয়েছে।'
              : 'Member and all related records have been permanently deleted.'
          );
          setTimeout(() => setDeleteSuccessMsg(null), 4000);
        }}
      />

      {/* Member Data Collection / Admission Form Modal (Word & Messenger) */}
      <MemberDataCollectionModal
        isOpen={showDataCollectionModal}
        onClose={() => setShowDataCollectionModal(false)}
      />
    </div>
  );
};
