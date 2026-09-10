import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ArrowDownRight, 
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
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { EditMemberModal } from './EditMemberModal';
import { DeleteMemberModal } from './DeleteMemberModal';
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
    useBengaliDigits, 
    setSelectedMemberId, 
    setShowNewMemberModal,
    setShowQuickDepositModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal,
    deleteMember,
    isUserAdmin,
    canViewMemberFinancials
  } = useSomiti();

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [showDataCollectionModal, setShowDataCollectionModal] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'has_loan'>(() => {
    if (activeTab === 'active_members' || activeTab === 'members_active') return 'active';
    return 'all';
  });

  useEffect(() => {
    if (activeTab === 'active_members' || activeTab === 'members_active') {
      setStatusFilter('active');
    } else if (activeTab === 'all_members' || activeTab === 'members_all' || activeTab === 'members') {
      setStatusFilter('all');
    }
  }, [activeTab]);

  const filteredMembers = members.filter((m) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (m.name ?? '').toLowerCase().includes(q) ||
      (m.nameEn ?? '').toLowerCase().includes(q) ||
      (m.memberNo ?? '').toLowerCase().includes(q) ||
      (m.phone ?? '').includes(searchTerm) ||
      (m.nid ?? '').includes(searchTerm);

    if (!matchesSearch) return false;

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
      [isBn ? 'শেয়ার মূল্য (৳)' : 'Share Value (৳)']: m.shareValue,
      [isBn ? 'মোট সঞ্চয় (৳)' : 'Total Savings (৳)']: m.totalSavings,
      [isBn ? 'চলতি ঋণ (৳)' : 'Active Loan (৳)']: m.activeLoanBalance,
      [isBn ? 'যোগদানের তারিখ' : 'Joining Date']: m.joiningDate,
      [isBn ? 'অবস্থা' : 'Status']: m.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive'),
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'সদস্য তালিকা' : 'Member List');
    XLSX.writeFile(wb, `bondhu_members_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalMembersCount = members.length;
  const activeMembersCount = members.filter(m => m.status === 'active').length;
  const totalSavingsSum = members.reduce((s, m) => s + m.totalSavings, 0);
  const totalLoansSum = members.reduce((s, m) => s + m.activeLoanBalance, 0);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {displayCount(members.reduce((s, m) => s + (m.shareCount || 0), 0))} {isBn ? 'টি' : 'Shares'}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'সমিতির সকল সদস্যের মোট অংশীদারিত্ব' : 'All members active equity shares'}
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
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {isBn ? `সকল (${displayCount(members.length)})` : `All (${displayCount(members.length)})`}
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
              {isBn ? `চলতি ঋণ (${displayCount(members.filter(m => m.activeLoanBalance > 0).length)})` : `Active Loan (${displayCount(members.filter(m => m.activeLoanBalance > 0).length)})`}
            </button>
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
                <th className="py-3 px-4 text-right">{isBn ? 'চলতি ঋণ' : 'Active Loan'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
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
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          member.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </span>
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
                        {isUserAdmin && (
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
                              title={isBn ? "সদস্য মুছে ফেলুন" : "Delete Member"}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      {/* Delete Member Confirmation Modal */}
      <DeleteMemberModal
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        member={memberToDelete}
        onDeleted={() => {
          setDeleteSuccessMsg(isBn ? 'সদস্য সফলভাবে মুছে ফেলা হয়েছে।' : 'Member successfully deleted.');
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
