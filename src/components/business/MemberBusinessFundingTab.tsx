import React, { useState } from 'react';
import { Briefcase, Plus, TrendingUp, DollarSign, Calendar, Clock, CheckCircle2, AlertCircle, Lock, Building, FileText, ChevronRight, Check, X as XIcon, Edit, Trash2 } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { Member, BusinessFunding, BusinessProfitRecord, MonthlyProfitDistribution, PaymentMethod } from '../../types';
import { formatCurrency, toBengaliNumber, formatBengaliDate } from '../../utils/bengaliUtils';
import { BusinessApplyModal } from './BusinessApplyModal';
import { BusinessProfitRecordModal } from './BusinessProfitRecordModal';
import { BusinessFundingEditModal } from './BusinessFundingEditModal';
import { BusinessProfitEditModal } from './BusinessProfitEditModal';

interface MemberBusinessFundingTabProps {
  member: Member;
  isBn?: boolean;
}

export const MemberBusinessFundingTab: React.FC<MemberBusinessFundingTabProps> = ({
  member,
  isBn: propIsBn,
}) => {
  const { language } = useLanguage();
  const isBn = propIsBn !== undefined ? propIsBn : language === 'bn';

  const {
    businessFundings,
    businessProfitRecords,
    profitDistributions,
    transactions,
    canViewMemberFinancials,
    isUserAdmin,
    useBengaliDigits,
    updateBusinessFundingStatus,
    deleteBusinessFunding,
    deleteBusinessProfitRecord,
    disburseBusinessFunding,
  } = useSomiti();

  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showProfitModal, setShowProfitModal] = useState<boolean>(false);
  const [selectedFundingForProfit, setSelectedFundingForProfit] = useState<string | undefined>(undefined);
  const [fundingToEdit, setFundingToEdit] = useState<BusinessFunding | null>(null);
  const [fundingToDelete, setFundingToDelete] = useState<BusinessFunding | null>(null);
  const [profitToEdit, setProfitToEdit] = useState<BusinessProfitRecord | null>(null);
  const [profitToDelete, setProfitToDelete] = useState<BusinessProfitRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [disburseFunding, setDisburseFunding] = useState<BusinessFunding | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<PaymentMethod>('cash');
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [isProcessingDisburse, setIsProcessingDisburse] = useState<boolean>(false);

  // Access Control: Member can only view their own business & profit. Admin can view all.
  const hasAccess = canViewMemberFinancials(member.id);

  if (!hasAccess) {
    return (
      <div className="p-10 text-center bg-slate-50/70 rounded-2xl border border-slate-200/80 my-4 space-y-3">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-2xs">
          <Lock className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">
          {isBn ? 'ব্যবসায়িক তথ্য ও লাভ সংক্রান্ত হিসাব সংরক্ষিত' : 'Business & Profit Records Protected'}
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          {isBn
            ? 'নিরাপত্তা ও গোপনীয়তা বিধিমালার কারণে সদস্যের ব্যবসা ফান্ডিং ও অর্জিত লভ্যাংশের তথ্য শুধুমাত্র সংশ্লিষ্ট সদস্য এবং অ্যাডমিন দেখতে পারবেন।'
            : 'For privacy and security, business funding and profit sharing information can only be viewed by the respective member and system administrators.'}
        </p>
      </div>
    );
  }

  // Filter this member's business fundings & profits
  const myFundings = businessFundings.filter(f => f.memberId === member.id);
  const myProfitRecords = businessProfitRecords.filter(r => r.memberId === member.id);

  // Filter distributions where this member received a profit share
  const myDistributions = profitDistributions
    .map(dist => {
      const myShare = dist.memberDistributions?.find(m => m.memberId === member.id);
      return {
        dist,
        myShare,
      };
    })
    .filter(item => item.myShare && item.myShare.allocatedProfit > 0);

  // Totals
  const totalActiveFunding = myFundings
    .filter(f => f.status === 'active' || f.status === 'approved')
    .reduce((sum, f) => sum + (f.approvedAmount || f.amountRequested), 0);

  const totalSomitiProfitFromMyBusinesses = myFundings.reduce(
    (sum, f) => sum + (f.totalSomitiProfitEarned || 0),
    0
  );

  const totalReceivedFromSomitiDistribution = myDistributions.reduce(
    (sum, item) => sum + (item.myShare?.allocatedProfit || 0),
    0
  );

  // Total profit transactions credited to this member
  const memberProfitTxs = transactions.filter(
    t => t.memberId === member.id && t.type === 'profit_share' && t.category !== 'business_profit_member_share'
  );
  const totalMemberProfitCredited = Math.max(
    totalReceivedFromSomitiDistribution,
    memberProfitTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {isBn ? 'চলতি বিনিয়োগ' : 'Active Funding'}
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {isBn ? 'অনুমোদিত' : 'Approved'}
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            {isBn ? 'পর্যালোচনাধীন' : 'Under Review / Pending'}
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {isBn ? 'সম্পন্ন' : 'Completed'}
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {isBn ? 'বাতিল' : 'Rejected'}
          </span>
        );
      default:
        return null;
    }
  };

  const handleDisburseConfirm = async () => {
    if (!disburseFunding) return;
    setIsProcessingDisburse(true);
    try {
      await disburseBusinessFunding(disburseFunding.id, disburseMethod, undefined, disburseNotes);
      setDisburseFunding(null);
      setDisburseNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingDisburse(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-300" />
            <h3 className="font-bold text-base">
              {isBn ? 'ব্যবসা ফান্ডিং ও লাভ অংশীদারি' : 'Business Funding & Profit Sharing'}
            </h3>
          </div>
          <p className="text-xs text-blue-200 mt-1">
            {isBn
              ? 'সমিতি থেকে ব্যবসার জন্য বিনিয়োগ গ্রহণ এবং অর্জিত লভ্যাংশ বণ্টন তথ্য'
              : 'Member business financing from Somiti and monthly profit sharing records'}
          </p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isBn ? 'ব্যবসার জন্য ফান্ডিং আবেদন' : 'Apply for Business Funding'}</span>
        </button>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{isBn ? 'চলতি ব্যবসা বিনিয়োগ' : 'Active Business Funding'}</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-800">
            {formatCurrency(totalActiveFunding, isBn && useBengaliDigits)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isBn
              ? `${toBengaliNumber(myFundings.filter(f => f.status === 'active').length)} টি সক্রিয় ব্যবসা`
              : `${myFundings.filter(f => f.status === 'active').length} Active Businesses`}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{isBn ? 'সমিতির অর্জিত ব্যবসা লাভ' : 'Somiti Profit from Business'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700">
            {formatCurrency(totalSomitiProfitFromMyBusinesses, isBn && useBengaliDigits)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isBn ? 'চুক্তি অনুযায়ী সমিতির প্রাপ্তি' : 'Somiti share per agreement'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{isBn ? 'সমিতি হতে প্রাপ্ত লভ্যাংশ' : 'Somiti Profit Pool Received'}</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-indigo-700">
            {formatCurrency(totalReceivedFromSomitiDistribution, isBn && useBengaliDigits)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isBn ? 'মাসিক জমার অনুপাতে বণ্টন' : 'Monthly deposit weighted share'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">{isBn ? 'প্রোফাইলে অর্জিত মোট লাভ' : 'Total Profit Credited'}</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-bold text-teal-700">
            {formatCurrency(totalMemberProfitCredited, isBn && useBengaliDigits)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {isBn ? 'সদস্যের অর্জিত মোট লভ্যাংশ' : 'Total earned by member'}
          </span>
        </div>
      </div>

      {/* Business Applications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'ব্যবসা ফান্ডিং আবেদন ও প্রকল্পসমূহ' : 'Business Funding Applications & Projects'}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn
                ? 'এই সদস্য কর্তৃক জমাকৃত সকল ব্যবসা বিনিয়োগের বিবরণ ও মুনাফা বণ্টন'
                : 'All business investments and profit distributions for this member'}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
            {isBn ? `মোট: ${toBengaliNumber(myFundings.length)} টি` : `Total: ${myFundings.length}`}
          </span>
        </div>

        {myFundings.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {isBn ? 'কোনো ব্যবসা ফান্ডিং আবেদন পাওয়া যায়নি' : 'No business funding applications found'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isBn
                ? 'সদস্য নিজের ব্যবসার জন্য সমিতি থেকে ফান্ডিং বা বিনিয়োগ সুবিধা নিতে ওপরের বাটনে ক্লিক করে আবেদন করতে পারেন।'
                : 'Apply for business funding from Somiti to expand inventory and share monthly profits.'}
            </p>
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {isBn ? '+ নতুন ব্যবসা ফান্ডিং আবেদন' : '+ New Funding Application'}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myFundings.map((funding) => (
              <div key={funding.id} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-sm text-slate-800">{funding.businessName}</h5>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          #{funding.applicationNo}
                        </span>
                        {getStatusBadge(funding.status)}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {funding.businessType} • {funding.businessPurpose}
                      </p>
                    </div>
                  </div>

                  {/* Actions for Admin or user */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isUserAdmin && funding.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateBusinessFundingStatus(funding.id, 'approved')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isBn ? 'অনুমোদন করুন' : 'Approve'}</span>
                        </button>
                        <button
                          onClick={() => updateBusinessFundingStatus(funding.id, 'rejected')}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                        >
                          {isBn ? 'বাতিল' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {isUserAdmin && funding.status === 'approved' && (
                      <button
                        onClick={() => setDisburseFunding(funding)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{isBn ? 'টাকা বিতরণ করুন' : 'Disburse Funds'}</span>
                      </button>
                    )}

                    {isUserAdmin && funding.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedFundingForProfit(funding.id);
                          setShowProfitModal(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
                      >
                        {isBn ? '+ মাসিক লাভ এন্ট্রি' : '+ Record Profit'}
                      </button>
                    )}

                    {isUserAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setFundingToEdit(funding)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title={isBn ? 'সম্পাদন করুন (Edit)' : 'Edit Funding'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setFundingToDelete(funding)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title={isBn ? 'মুছে ফেলুন (Delete)' : 'Delete Funding'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Investment & Profit Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {isBn ? 'বিনিয়োগকৃত অর্থ' : 'Funding Amount'}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatCurrency(funding.approvedAmount || funding.amountRequested, isBn && useBengaliDigits)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {isBn ? 'সমিতির লভ্যাংশ চুক্তি' : 'Somiti Profit Share'}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {isBn
                        ? `সমিতির অংশ ${toBengaliNumber(funding.somitiProfitSharePercent)}%`
                        : `Somiti ${funding.somitiProfitSharePercent}%`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {isBn ? 'মেয়াদ' : 'Duration'}
                    </span>
                    <span className="font-bold text-slate-700">
                      {isBn ? `${toBengaliNumber(funding.durationMonths)} মাস` : `${funding.durationMonths} Months`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {isBn ? 'সমিতির মোট প্রাপ্ত লাভ' : 'Total Profit Earned by Somiti'}
                    </span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatCurrency(funding.totalSomitiProfitEarned, isBn && useBengaliDigits)}
                    </span>
                  </div>
                </div>

                {/* Month-wise Profit Records for this business */}
                {myProfitRecords.filter(r => r.businessFundingId === funding.id).length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'সমিতিতে ব্যবসায়িক লভ্যাংশ প্রদান ও বণ্টন বিবরণী:' : 'Somiti Profit Distribution Ledger:'}</span>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">{isBn ? 'মাস' : 'Month'}</th>
                            <th className="py-2 px-3 text-right">{isBn ? 'মোট ব্যবসা লাভ' : 'Total Profit'}</th>
                            <th className="py-2 px-3 text-right text-emerald-700">
                              {isBn
                                ? `সমিতির লভ্যাংশ (${toBengaliNumber(funding.somitiProfitSharePercent)}%)`
                                : `Somiti Share (${funding.somitiProfitSharePercent}%)`}
                            </th>
                            <th className="py-2 px-3 text-center">{isBn ? 'বণ্টন অবস্থা' : 'Distribution Status'}</th>
                            <th className="py-2 px-3 text-right">{isBn ? 'তারিখ' : 'Date'}</th>
                            {isUserAdmin && <th className="py-2 px-3 text-center">{isBn ? 'পদক্ষেপ' : 'Action'}</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {myProfitRecords
                            .filter(r => r.businessFundingId === funding.id)
                            .map((rec) => (
                              <tr key={rec.id} className="hover:bg-slate-50/50">
                                <td className="py-2 px-3 font-semibold text-slate-700">{rec.month}</td>
                                <td className="py-2 px-3 text-right font-bold text-slate-800">
                                  {formatCurrency(rec.totalBusinessProfit, isBn && useBengaliDigits)}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-700">
                                  +{formatCurrency(rec.somitiProfitAmount, isBn && useBengaliDigits)}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                    <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                    <span>{isBn ? 'সদস্যদের প্রোফাইলে বণ্টিত' : 'Distributed to Members'}</span>
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                                  {formatBengaliDate(rec.date, false, isBn)}
                                </td>
                                {isUserAdmin && (
                                  <td className="py-2 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => setProfitToEdit(rec)}
                                        className="p-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                        title={isBn ? 'সম্পাদন করুন' : 'Edit'}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setProfitToDelete(rec)}
                                        className="p-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                        title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Somiti Profit Received Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200">
          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>
              {isBn
                ? 'সমিতির লাভ বণ্টন হতে অর্জিত লভ্যাংশ (Daily Weighted Balance ভিত্তিতে)'
                : 'Somiti Profit Distributions Received (Daily Weighted Balance Basis)'}
            </span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'প্রতি মাসে সমিতির ব্যবসা ফান্ডিং হতে প্রাপ্ত লাভের অংশ যা সদস্যের দৈনিক জমার অনুপাতে প্রাপ্ত হয়েছে'
              : 'Monthly profits shared from Somiti business pool credited to member savings based on daily weighted balance'}
          </p>
        </div>

        {myDistributions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            {isBn
              ? 'এখনও পর্যন্ত কোনো মাসিক লভ্যাংশ বণ্টন কার্যকর হয়নি বা অর্জিত হয়নি।'
              : 'No monthly profit pool distribution has been executed yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-bold">{isBn ? 'বণ্টন নং / মাস' : 'Distribution # / Month'}</th>
                  <th className="py-2.5 px-4 font-bold text-right">{isBn ? 'সদস্যের ওয়েটেড ডিপোজিট' : 'Weighted Deposit'}</th>
                  <th className="py-2.5 px-4 font-bold text-right">{isBn ? 'সমিতিতে অংশ হার (%)' : 'Weight %'}</th>
                  <th className="py-2.5 px-4 font-bold text-right text-indigo-800">{isBn ? 'প্রাপ্ত লভ্যাংশ' : 'Allocated Profit'}</th>
                  <th className="py-2.5 px-4 font-bold text-center">{isBn ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {myDistributions.map(({ dist, myShare }) => (
                  <tr key={dist.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-800">{dist.monthName || `${dist.year}-${dist.month}`}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{dist.distributionNo}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                      {isBn ? toBengaliNumber(Math.round(myShare?.dailyWeightedDeposit || 0)) : Math.round(myShare?.dailyWeightedDeposit || 0).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {isBn ? `${toBengaliNumber(myShare?.weightPercentage || 0)}%` : `${myShare?.weightPercentage || 0}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-indigo-700 text-sm">
                      {formatCurrency(myShare?.allocatedProfit, isBn && useBengaliDigits)}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isBn ? 'সঞ্চয়ে জমা' : 'Credited to Savings'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disbursement Modal for Admin */}
      {disburseFunding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {isBn ? 'বিনিয়োগ অর্থ বিতরণ নিশ্চিতকরণ' : 'Confirm Funding Disbursement'}
              </h3>
              <button
                onClick={() => setDisburseFunding(null)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="font-bold text-slate-800 text-sm">{disburseFunding.businessName}</div>
                <div className="text-slate-600 mt-1">
                  {isBn ? 'সদস্য: ' : 'Member: '} <strong>{disburseFunding.memberName}</strong> ({disburseFunding.memberNo})
                </div>
                <div className="text-slate-600 mt-1">
                  {isBn ? 'বিতরণযোগ্য অর্থ: ' : 'Disbursement Amount: '}
                  <strong className="text-blue-800 text-sm">
                    {formatCurrency(disburseFunding.approvedAmount || disburseFunding.amountRequested, isBn && useBengaliDigits)}
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
                  placeholder={isBn ? 'চেক নম্বর বা ট্রানজেকশন আইডি...' : 'Cheque number or reference...'}
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDisburseFunding(null)}
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

      {/* Modals */}
      <BusinessApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        presetMemberId={member.id}
      />

      <BusinessProfitRecordModal
        isOpen={showProfitModal}
        onClose={() => {
          setShowProfitModal(false);
          setSelectedFundingForProfit(undefined);
        }}
        presetFundingId={selectedFundingForProfit}
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
                  {isBn ? 'আবেদন নং: ' : 'App No: '}#{fundingToDelete.applicationNo} • {fundingToDelete.memberName}
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
    </div>
  );
};
