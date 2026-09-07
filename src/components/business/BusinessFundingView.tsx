import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  TrendingUp,
  DollarSign,
  PieChart,
  Building,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Check,
  X as XIcon,
  Edit,
  Trash2,
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { BusinessFunding, BusinessFundingStatus, PaymentMethod, BusinessProfitRecord, MonthlyProfitDistribution } from '../../types';
import { formatCurrency, toBengaliNumber, formatBengaliDate } from '../../utils/bengaliUtils';
import { BusinessApplyModal } from './BusinessApplyModal';
import { BusinessProfitRecordModal } from './BusinessProfitRecordModal';
import { MonthlyProfitDistributionModal } from './MonthlyProfitDistributionModal';
import { BusinessFundingEditModal } from './BusinessFundingEditModal';
import { BusinessProfitEditModal } from './BusinessProfitEditModal';

export const BusinessFundingView: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const {
    businessFundings,
    businessProfitRecords,
    profitDistributions,
    members,
    currentUser,
    isUserAdmin,
    updateBusinessFundingStatus,
    deleteBusinessFunding,
    deleteBusinessProfitRecord,
    disburseBusinessFunding,
    deleteMonthlyProfitDistribution,
    clearAllProfitDistributions,
    useBengaliDigits,
    setSelectedMemberId,
    setActiveTab,
  } = useSomiti();

  const [activeSubTab, setActiveSubTab] = useState<'applications' | 'profits' | 'distributions' | 'calculator'>('applications');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showProfitModal, setShowProfitModal] = useState<boolean>(false);
  const [showDistributeModal, setShowDistributeModal] = useState<boolean>(false);
  const [selectedFundingForProfit, setSelectedFundingForProfit] = useState<string | undefined>(undefined);

  // Edit & Delete state
  const [fundingToEdit, setFundingToEdit] = useState<BusinessFunding | null>(null);
  const [fundingToDelete, setFundingToDelete] = useState<BusinessFunding | null>(null);
  const [profitToEdit, setProfitToEdit] = useState<BusinessProfitRecord | null>(null);
  const [profitToDelete, setProfitToDelete] = useState<BusinessProfitRecord | null>(null);
  const [distributionToDelete, setDistributionToDelete] = useState<MonthlyProfitDistribution | null>(null);
  const [showClearAllDistributionsModal, setShowClearAllDistributionsModal] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Disbursement modal state
  const [disburseModalFunding, setDisburseModalFunding] = useState<BusinessFunding | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<PaymentMethod>('cash');
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [isProcessingDisburse, setIsProcessingDisburse] = useState<boolean>(false);

  // Filter based on user role (Admin sees all; Member sees only their own)
  const isMemberUser = !isUserAdmin && currentUser.memberId;
  const accessibleFundings = isMemberUser
    ? businessFundings.filter(f => f.memberId === currentUser.memberId)
    : businessFundings;

  const accessibleProfits = isMemberUser
    ? businessProfitRecords.filter(r => r.memberId === currentUser.memberId)
    : businessProfitRecords;

  const filteredFundings = accessibleFundings.filter(f => {
    const matchesSearch = 
      f.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.memberNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.applicationNo.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Overall Statistics
  const totalFundedActive = accessibleFundings
    .filter(f => f.status === 'active')
    .reduce((sum, f) => sum + (f.approvedAmount || f.amountRequested), 0);

  const totalProfitsRecorded = accessibleProfits.reduce(
    (sum, r) => sum + (r.totalBusinessProfit || 0),
    0
  );

  const totalSomitiProfitShare = accessibleProfits.reduce(
    (sum, r) => sum + (r.somitiProfitAmount || 0),
    0
  );

  const totalMembersDistributed = profitDistributions.reduce(
    (sum, d) => sum + (d.totalSomitiProfitPool || 0),
    0
  );

  const handleDisburseConfirm = async () => {
    if (!disburseModalFunding) return;
    setIsProcessingDisburse(true);
    try {
      await disburseBusinessFunding(disburseModalFunding.id, disburseMethod, undefined, disburseNotes);
      setDisburseModalFunding(null);
      setDisburseNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingDisburse(false);
    }
  };

  const getStatusBadge = (status: BusinessFundingStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {isBn ? 'চলতি ব্যবসা' : 'Active'}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            {isBn ? 'অনুমোদিত' : 'Approved'}
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            {isBn ? 'পর্যালোচনাধীন' : 'Pending Review'}
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {isBn ? 'সম্পন্ন' : 'Completed'}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            {isBn ? 'বাতিল' : 'Rejected'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-300" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              {isBn ? 'ব্যবসা ফান্ডিং ও লাভ বণ্টন সিস্টেম' : 'Business Funding & Profit Sharing'}
            </h1>
          </div>
          <p className="text-xs text-blue-200 mt-1.5 max-w-xl leading-relaxed">
            {isBn
              ? 'সদস্যদের ব্যবসায় সমিতি থেকে বিনিয়োগ প্রদান এবং অর্জিত ব্যবসায়িক লভ্যাংশ সমিতির সকল সদস্যদের মাঝে দৈনিক ব্যালেন্স (Daily Weighted Balance) অনুপাতে বণ্টন।'
              : 'Provide business capital to members and distribute Somiti profit pools back to all members proportional to their daily weighted savings balances.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'নতুন ফান্ডিং আবেদন' : 'New Funding Application'}</span>
          </button>

          {isUserAdmin && (
            <>
              <button
                onClick={() => {
                  setSelectedFundingForProfit(undefined);
                  setShowProfitModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>{isBn ? 'ব্যবসায়িক লাভ এন্ট্রি' : 'Record Business Profit'}</span>
              </button>

              <button
                onClick={() => setShowDistributeModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <PieChart className="w-4 h-4" />
                <span>{isBn ? 'মাসিক লাভ বণ্টন' : 'Monthly Profit Distribution'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">
              {isBn ? 'মোট চলতি ব্যবসা বিনিয়োগ' : 'Total Active Business Funding'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {formatCurrency(totalFundedActive, isBn && useBengaliDigits)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isBn
              ? `${toBengaliNumber(accessibleFundings.filter(f => f.status === 'active').length)} টি ব্যবসা চলছে`
              : `${accessibleFundings.filter(f => f.status === 'active').length} Active Businesses`}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">
              {isBn ? 'মোট নথিভুক্ত ব্যবসা লাভ' : 'Total Recorded Business Profit'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-700">
            {formatCurrency(totalProfitsRecorded, isBn && useBengaliDigits)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isBn ? 'ব্যবসা হতে অর্জিত মোট মুনাফা' : 'Gross Profit Generated from Businesses'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">
              {isBn ? 'সমিতির প্রাপ্ত মোট লাভ অংশ' : "Somiti's Total Profit Share"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-700">
            {formatCurrency(totalSomitiProfitShare, isBn && useBengaliDigits)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isBn ? 'সমিতির নিজস্ব অর্জিত আয়' : "Somiti's Retained Earnings"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">
              {isBn ? 'সদস্যদের বণ্টিত লভ্যাংশ' : 'Distributed to Members'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-teal-700">
            {formatCurrency(totalMembersDistributed, isBn && useBengaliDigits)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isBn
              ? `${toBengaliNumber(profitDistributions.length)} টি বণ্টন চক্র সম্পন্ন`
              : `${profitDistributions.length} Distribution Cycles Executed`}
          </span>
        </div>
      </div>

      {/* Main Container with Tab Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('applications')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'applications'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>
              {isBn
                ? `সকল ফান্ডিং আবেদন ও ব্যবসা (${toBengaliNumber(accessibleFundings.length)})`
                : `All Applications & Fundings (${accessibleFundings.length})`}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('profits')}
            className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'profits'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>
              {isBn
                ? `মাসিক ব্যবসায়িক লাভ লেজার (${toBengaliNumber(accessibleProfits.length)})`
                : `Business Profit Ledger (${accessibleProfits.length})`}
            </span>
          </button>

          {isUserAdmin && (
            <button
              onClick={() => setActiveSubTab('distributions')}
              className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'distributions'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>
                {isBn
                  ? `মাসিক লভ্যাংশ বণ্টন হিস্ট্রি (${toBengaliNumber(profitDistributions.length)})`
                  : `Monthly Distribution History (${profitDistributions.length})`}
              </span>
            </button>
          )}

          {isUserAdmin && (
            <button
              onClick={() => setActiveSubTab('calculator')}
              className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === 'calculator'
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>
                {isBn ? 'দৈনিক ওয়েটেড ব্যালেন্স ড্যাশবোর্ড' : 'Daily Weighted Formula Guide'}
              </span>
            </button>
          )}
        </div>

        {/* Tab 1: Applications & Business List */}
        {activeSubTab === 'applications' && (
          <div className="p-5 space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isBn ? 'ব্যবসার নাম, সদস্য বা আবেদন নং খুঁজুন...' : 'Search business, member or app no...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium">{isBn ? 'স্ট্যাটাস:' : 'Status:'}</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">{isBn ? 'সকল অবস্থা' : 'All Statuses'}</option>
                  <option value="active">{isBn ? 'চলতি ব্যবসা' : 'Active'}</option>
                  <option value="approved">{isBn ? 'অনুমোদিত' : 'Approved'}</option>
                  <option value="pending">{isBn ? 'পর্যালোচনাধীন / বিচারাধীন' : 'Pending Review'}</option>
                  <option value="completed">{isBn ? 'সম্পন্ন' : 'Completed'}</option>
                  <option value="rejected">{isBn ? 'বাতিল' : 'Rejected'}</option>
                </select>
              </div>
            </div>

            {/* Table of Fundings */}
            {filteredFundings.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {isBn ? 'কোনো ব্যবসা ফান্ডিং তথ্য পাওয়া যায়নি।' : 'No business funding records found.'}
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">{isBn ? 'আবেদন নং / তারিখ' : 'App No / Date'}</th>
                      <th className="py-3 px-4 font-bold">{isBn ? 'সদস্য' : 'Member'}</th>
                      <th className="py-3 px-4 font-bold">{isBn ? 'ব্যবসার নাম ও ধরণ' : 'Business & Purpose'}</th>
                      <th className="py-3 px-4 font-bold text-right">{isBn ? 'বিনিয়োগের পরিমাণ' : 'Amount'}</th>
                      <th className="py-3 px-4 font-bold text-center">{isBn ? 'মেয়াদ' : 'Duration'}</th>
                      <th className="py-3 px-4 font-bold text-center">{isBn ? 'সমিতির লভ্যাংশ' : 'Somiti Share'}</th>
                      <th className="py-3 px-4 font-bold text-right">{isBn ? 'অর্জিত মোট লাভ' : 'Total Profit'}</th>
                      <th className="py-3 px-4 font-bold text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                      {isUserAdmin && <th className="py-3 px-4 font-bold text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredFundings.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 font-mono">{f.applicationNo}</div>
                          <div className="text-[10px] text-slate-400">{formatBengaliDate(f.applicationDate, true, isBn)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setSelectedMemberId(f.memberId);
                              setActiveTab('member_profile');
                            }}
                            className="font-bold text-blue-700 hover:underline text-left block"
                          >
                            {f.memberName}
                          </button>
                          <div className="text-[10px] text-slate-400 font-mono">{f.memberNo}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{f.businessName}</div>
                          <div className="text-[10px] text-slate-500">{f.businessType}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(f.approvedAmount || f.amountRequested, isBn && useBengaliDigits)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isBn ? `${toBengaliNumber(f.durationMonths)} মাস` : `${f.durationMonths} Mos`}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                            {isBn
                              ? `সমিতির অংশ ${toBengaliNumber(f.somitiProfitSharePercent)}%`
                              : `Somiti ${f.somitiProfitSharePercent}%`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {formatCurrency(f.totalProfitRecorded, isBn && useBengaliDigits)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getStatusBadge(f.status)}
                        </td>
                        {isUserAdmin && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {f.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateBusinessFundingStatus(f.id, 'approved')}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                    title={isBn ? 'অনুমোদন করুন' : 'Approve'}
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                                  </button>
                                  <button
                                    onClick={() => updateBusinessFundingStatus(f.id, 'rejected')}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer border border-rose-200"
                                    title={isBn ? 'বাতিল করুন' : 'Reject'}
                                  >
                                    {isBn ? 'বাতিল' : 'Reject'}
                                  </button>
                                </>
                              )}

                              {f.status === 'approved' && (
                                <button
                                  onClick={() => setDisburseModalFunding(f)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  <span>{isBn ? 'বিতরণ করুন' : 'Disburse'}</span>
                                </button>
                              )}

                              {f.status === 'active' && (
                                <button
                                  onClick={() => {
                                    setSelectedFundingForProfit(f.id);
                                    setShowProfitModal(true);
                                  }}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  {isBn ? '+ লাভ এন্ট্রি' : '+ Record Profit'}
                                </button>
                              )}

                              {/* Edit Button */}
                              <button
                                onClick={() => setFundingToEdit(f)}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title={isBn ? 'সম্পাদন করুন (Edit)' : 'Edit Funding'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => setFundingToDelete(f)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title={isBn ? 'মুছে ফেলুন (Delete)' : 'Delete Funding'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profit Ledger */}
        {activeSubTab === 'profits' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {isBn ? 'ব্যবসায়িক লভ্যাংশ রেজিস্টার' : 'Business Profit Ledger'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? 'প্রতিটি বিনিয়োগ হতে প্রাপ্ত মোট ব্যবসা লাভ ও সমিতির লভ্যাংশ নথিভুক্তকরণ'
                    : 'Records of profit generated from each business funding and Somiti profit share'}
                </p>
              </div>

              {isUserAdmin && (
                <button
                  onClick={() => {
                    setSelectedFundingForProfit(undefined);
                    setShowProfitModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isBn ? '+ নতুন লাভ এন্ট্রি' : '+ Record Profit'}
                </button>
              )}
            </div>

            {accessibleProfits.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {isBn ? 'এখনো কোনো ব্যবসায়িক লাভ নথিভুক্ত হয়নি।' : 'No business profit records found.'}
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">{isBn ? 'মাস' : 'Month'}</th>
                      <th className="py-2.5 px-4 font-bold">{isBn ? 'সদস্য ও আবেদন' : 'Member & Application'}</th>
                      <th className="py-2.5 px-4 font-bold text-right">{isBn ? 'মোট ব্যবসা লাভ' : 'Total Profit'}</th>
                      <th className="py-2.5 px-4 font-bold text-right text-emerald-700">{isBn ? 'সমিতির লভ্যাংশ (সদস্যদের প্রোফাইলে বণ্টিত)' : 'Somiti Profit (Credited to Members)'}</th>
                      <th className="py-2.5 px-4 font-bold">{isBn ? 'তারিখ ও এন্ট্রি কারী' : 'Date & Recorded By'}</th>
                      {isUserAdmin && <th className="py-2.5 px-4 font-bold text-center">{isBn ? 'পদক্ষেপ' : 'Action'}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {accessibleProfits.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                          {p.month}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{p.memberName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">#{p.applicationNo}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(p.totalBusinessProfit, isBn && useBengaliDigits)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          +{formatCurrency(p.somitiProfitAmount, isBn && useBengaliDigits)}
                          <span className="text-[10px] text-teal-600 block font-normal">
                            ({isBn ? `সমিতির অংশ ${toBengaliNumber(p.somitiProfitPercent)}%` : `Somiti ${p.somitiProfitPercent}%`})
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          <div>{formatBengaliDate(p.date, true, isBn)}</div>
                          <div className="text-[10px] text-slate-400">{p.recordedBy}</div>
                        </td>
                        {isUserAdmin && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setProfitToEdit(p)}
                                className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title={isBn ? 'সম্পাদন করুন (Edit)' : 'Edit Profit Record'}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setProfitToDelete(p)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title={isBn ? 'মুছে ফেলুন (Delete)' : 'Delete Profit Record'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Monthly Distributions History */}
        {activeSubTab === 'distributions' && isUserAdmin && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800">
                  {isBn ? 'সমিতির মাসিক লাভ বণ্টন বিবরণী' : 'Monthly Profit Pool Distributions'}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isBn
                    ? 'দৈনিক ব্যালেন্স ও ওয়েটেড ডিপোজিট ফর্মুলা অনুযায়ী সদস্য বণ্টন ইতিহাস'
                    : 'History of Somiti profit pool distributed to members based on daily weighted deposits'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isUserAdmin && profitDistributions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearAllDistributionsModal(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    title={isBn ? 'সকল লভ্যাংশ বণ্টন মুছে ফেলুন ও সমন্বয় করুন' : 'Clear all profit distributions and revert savings'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সকল বণ্টন মুছুন' : 'Clear All'}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowDistributeModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {isBn ? '+ নতুন মাসিক বণ্টন কার্যকর করুন' : '+ Execute Monthly Distribution'}
                </button>
              </div>
            </div>

            {profitDistributions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                {isBn ? 'এখনো কোনো মাসিক লাভ বণ্টন রেকর্ড নেই।' : 'No monthly profit distributions recorded yet.'}
              </div>
            ) : (
              <div className="space-y-3">
                {profitDistributions.map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          <PieChart className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-800">
                            {d.monthName || `${d.year}-${d.month}`} {isBn ? 'লভ্যাংশ বণ্টন' : 'Profit Distribution'}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-400">
                            {isBn ? 'বণ্টন নং: ' : 'Dist No: '}{d.distributionNo} • {isBn ? 'তারিখ: ' : 'Date: '}{formatBengaliDate(d.distributionDate, true, isBn)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{isBn ? 'মোট বণ্টনকৃত লাভ' : 'Total Profit Distributed'}</span>
                          <span className="text-sm font-bold text-indigo-700">
                            {formatCurrency(d.totalSomitiProfitPool, isBn && useBengaliDigits)}
                          </span>
                        </div>
                        {isUserAdmin && (
                          <button
                            type="button"
                            onClick={() => setDistributionToDelete(d)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title={isBn ? 'এই বণ্টন রেকর্ড মুছে ফেলুন ও সঞ্চয় রিভার্ট করুন' : 'Delete distribution & revert savings'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isBn ? 'সুবিধাপ্রাপ্ত সদস্য' : 'Members Benefited'}</span>
                        <span className="font-bold text-slate-800">
                          {isBn ? `${toBengaliNumber(d.totalMembersDistributed)} জন` : `${d.totalMembersDistributed} Members`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isBn ? 'মোট ওয়েটেড ডিপোজিট' : 'Total Weighted Deposit'}</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {isBn ? toBengaliNumber(Math.round(d.totalWeightedDeposit)) : Math.round(d.totalWeightedDeposit).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isBn ? 'কার্যকরকারী কর্মকর্তা' : 'Executed By'}</span>
                        <span className="font-bold text-slate-800">{d.distributedBy}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">{isBn ? 'স্ট্যাটাস' : 'Status'}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isBn ? 'সঞ্চয়ে জমা সম্পন্ন' : 'Credited to Savings'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Calculator & Live Daily Weighted Explorer */}
        {activeSubTab === 'calculator' && isUserAdmin && (
          <div className="p-5 space-y-4">
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 text-xs space-y-2">
              <h4 className="font-bold text-indigo-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>
                  {isBn
                    ? 'দৈনিক ব্যালেন্সভিত্তিক লাভ বণ্টন সূত্র (Daily Weighted Balance Principles)'
                    : 'Daily Weighted Balance Profit Sharing Principles'}
                </span>
              </h4>
              <p className="text-indigo-900 leading-relaxed">
                {isBn
                  ? 'মাস শেষে কেবল শেষ দিনের ব্যালেন্স দেখে লাভ দিলে অনিয়ম হয়। তাই বন্ধু সমিতিতে প্রতি সদস্যের মাসের প্রতিটি দিনের জমার যোগফল (Monthly Weighted Deposit) নির্ণয় করা হয়। যে সদস্য পুরো মাস জুড়ে বেশি অর্থ সঞ্চয় রেখেছেন, তিনি সমানুপাতিক হারে বেশি মুনাফা লাভ করবেন।'
                  : 'Distributing profit based only on month-end balance is unfair to long-term savers. Bondhu Somiti calculates the sum of each day balance across all days of the month (Monthly Weighted Deposit). Members who maintained higher savings throughout the month receive a proportionally higher share.'}
              </p>
              <div className="bg-white px-3.5 py-2 rounded-lg border border-indigo-200 font-mono text-[11px] text-indigo-900 font-bold inline-block">
                {isBn
                  ? 'সদস্যের লাভ = (সদস্যের Monthly Weighted Deposit ÷ সকল সদস্যের মোট Weighted Deposit) × মোট বণ্টনযোগ্য লাভ'
                  : "Member Profit = (Member's Monthly Weighted Deposit ÷ Total Somiti Weighted Deposit) × Distributable Profit Pool"}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDistributeModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                <PieChart className="w-4 h-4" />
                <span>{isBn ? 'বর্তমান মাসের বণ্টন কার্যকর করুন' : 'Execute This Month Distribution'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disbursement Modal */}
      {disburseModalFunding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {isBn ? 'বিনিয়োগ অর্থ বিতরণ নিশ্চিতকরণ' : 'Confirm Funding Disbursement'}
              </h3>
              <button
                onClick={() => setDisburseModalFunding(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="font-bold text-slate-800 text-sm">{disburseModalFunding.businessName}</div>
                <div className="text-slate-600 mt-1">
                  {isBn ? 'সদস্য: ' : 'Member: '} <strong>{disburseModalFunding.memberName}</strong> ({disburseModalFunding.memberNo})
                </div>
                <div className="text-slate-600 mt-1">
                  {isBn ? 'বিতরণযোগ্য অর্থ: ' : 'Disbursement Amount: '}
                  <strong className="text-blue-800 text-sm">
                    {formatCurrency(disburseModalFunding.approvedAmount || disburseModalFunding.amountRequested, isBn && useBengaliDigits)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isBn ? 'প্রদানের মাধ্যম' : 'Payment Method'}
                </label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="cash">{isBn ? 'ক্যাশ ভল্ট থেকে নগদ প্রদান' : 'Cash Vault (Direct Cash)'}</option>
                  <option value="bank">{isBn ? 'ব্যাংক একাউন্ট ট্রান্সফার' : 'Bank Transfer'}</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {isBn ? 'মন্তব্য (ঐচ্ছিক)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'চেক নম্বর বা ট্রানজেকশন আইডি...' : 'Cheque number or reference ID...'}
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDisburseModalFunding(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isProcessingDisburse}
                  onClick={handleDisburseConfirm}
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md"
                >
                  {isProcessingDisburse
                    ? (isBn ? 'প্রক্রিয়াধীন...' : 'Processing...')
                    : (isBn ? 'বিতরণ নিশ্চিত করুন' : 'Confirm Disbursement')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Apply Modal */}
      <BusinessApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
      />

      {/* Business Profit Record Modal */}
      <BusinessProfitRecordModal
        isOpen={showProfitModal}
        onClose={() => {
          setShowProfitModal(false);
          setSelectedFundingForProfit(undefined);
        }}
        presetFundingId={selectedFundingForProfit}
      />

      {/* Monthly Profit Distribution Modal */}
      <MonthlyProfitDistributionModal
        isOpen={showDistributeModal}
        onClose={() => setShowDistributeModal(false)}
      />

      {/* Business Funding Edit Modal */}
      <BusinessFundingEditModal
        isOpen={!!fundingToEdit}
        onClose={() => setFundingToEdit(null)}
        funding={fundingToEdit}
      />

      {/* Business Profit Record Edit Modal */}
      <BusinessProfitEditModal
        isOpen={!!profitToEdit}
        onClose={() => setProfitToEdit(null)}
        record={profitToEdit}
      />

      {/* Delete Business Funding Confirmation Modal */}
      {fundingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {isBn ? 'ব্যবসা ফান্ডিং মুছে ফেলতে চান?' : 'Delete Business Funding?'}
                </h3>
              </div>
              <button
                onClick={() => setFundingToDelete(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <p className="font-bold text-sm">{fundingToDelete.businessName}</p>
                <p className="text-[11px] text-rose-600">
                  {isBn ? 'আবেদন নং: ' : 'App No: '}#{fundingToDelete.applicationNo} • {fundingToDelete.memberName} ({fundingToDelete.memberNo})
                </p>
                <p className="text-[11px] text-rose-600">
                  {isBn ? 'বিনিয়োগের পরিমাণ: ' : 'Funding Amount: '}৳{fundingToDelete.approvedAmount || fundingToDelete.amountRequested}
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {isBn
                  ? 'সতর্কতা: এই ব্যবসা ফান্ডিং রেকর্ডটি মুছে ফেললে এর সাথে যুক্ত কোনো লভ্যাংশ বণ্টন রেকর্ড থাকলে তাও অপসারিত হবে এবং সদস্যদের সঞ্চয় ব্যালেন্স সমন্বয় করা হবে। আপনি কি নিশ্চিত?'
                  : 'Warning: Deleting this funding application will also remove any related profit ledger records and adjust member balances accordingly. Are you sure?'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setFundingToDelete(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  {isBn ? 'না, বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!fundingToDelete) return;
                    setIsDeleting(true);
                    try {
                      await deleteBusinessFunding(fundingToDelete.id);
                      setFundingToDelete(null);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') : (isBn ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Business Profit Confirmation Modal */}
      {profitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {isBn ? 'ব্যবসায়িক লভ্যাংশ রেকর্ড মুছে ফেলতে চান?' : 'Delete Profit Record?'}
                </h3>
              </div>
              <button
                onClick={() => setProfitToDelete(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                <p className="font-bold text-sm">
                  {isBn ? `মাস: ${profitToDelete.month}` : `Month: ${profitToDelete.month}`}
                </p>
                <p className="text-[11px] text-rose-600">
                  #{profitToDelete.applicationNo} • {profitToDelete.memberName}
                </p>
                <div className="flex justify-between text-[11px] pt-1 border-t border-rose-200/60">
                  <span>{isBn ? 'মোট লাভ:' : 'Total:'} ৳{profitToDelete.totalBusinessProfit}</span>
                  <span className="font-bold text-rose-700">{isBn ? 'সমিতির অংশ:' : 'Somiti:'} ৳{profitToDelete.somitiProfitAmount}</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {isBn
                  ? `সতর্কতা: এই লাভের রেকর্ডটি মুছে ফেললে সমিতির ৳${profitToDelete.somitiProfitAmount} লভ্যাংশ যা সদস্যদের সঞ্চয়ে বণ্টিত হয়েছিল, তা সদস্যদের প্রোফাইল ও সঞ্চয় হতে কেটে বাদ দেওয়া হবে। আপনি কি নিশ্চিত?`
                  : `Warning: Deleting this record will reverse the ৳${profitToDelete.somitiProfitAmount} profit distribution from all members' savings balances. Are you sure?`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setProfitToDelete(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  {isBn ? 'না, বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    if (!profitToDelete) return;
                    setIsDeleting(true);
                    try {
                      await deleteBusinessProfitRecord(profitToDelete.id);
                      setProfitToDelete(null);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') : (isBn ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Distribution Modal */}
      {distributionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isBn ? 'মাসিক বণ্টন রেকর্ড মুছে ফেলা' : 'Delete Monthly Distribution'}
                </h3>
                <p className="text-xs text-slate-500">
                  {distributionToDelete.monthName || distributionToDelete.distributionNo}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBn
                  ? 'আপনি কি নিশ্চিত যে আপনি এই মাসিক বণ্টন রেকর্ডটি মুছে ফেলতে চান? এতে সদস্যদের সঞ্চয়ে জমা হওয়া সকল লভ্যাংশ স্বয়ংক্রিয়ভাবে রিভার্ট (সমন্বয়) হয়ে যাবে।'
                  : 'Are you sure you want to delete this monthly distribution? All profit credited to members will be automatically reverted from their savings.'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDistributionToDelete(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  {isBn ? 'না, বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteMonthlyProfitDistribution(distributionToDelete.id);
                      setDistributionToDelete(null);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? (isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') : (isBn ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Distributions Modal */}
      {showClearAllDistributionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {isBn ? 'সকল বণ্টন রেকর্ড ও জমা মুছে ফেলা' : 'Clear All Profit Distributions'}
                </h3>
                <p className="text-xs text-slate-500">
                  {profitDistributions.length} {isBn ? 'টি বণ্টন রেকর্ড' : 'distribution records'}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {isBn
                  ? 'আপনি কি নিশ্চিত যে আপনি সমিতির সকল মাসিক লভ্যাংশ বণ্টনের রেকর্ড ও লেনদেন মুছে ফেলতে চান? এটি নিশ্চিত করলে সদস্যদের সঞ্চয় থেকে লভ্যাংশ রিভার্ট হয়ে যাবে।'
                  : 'Are you sure you want to clear all monthly distributions and revert all distributed profits from member savings?'}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearAllDistributionsModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  {isBn ? 'না, বাতিল' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={isClearingAll}
                  onClick={async () => {
                    setIsClearingAll(true);
                    try {
                      await clearAllProfitDistributions();
                      setShowClearAllDistributionsModal(false);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setIsClearingAll(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl text-white bg-rose-600 hover:bg-rose-700 text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isClearingAll ? (isBn ? 'মুছে ফেলা হচ্ছে...' : 'Clearing...') : (isBn ? 'হ্যাঁ, সম্পূর্ণ মুছুন' : 'Yes, Clear All')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

