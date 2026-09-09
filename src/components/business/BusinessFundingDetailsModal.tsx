import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  Percent, 
  FileText, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Wallet,
  Phone
} from 'lucide-react';
import { BusinessFunding, Member } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';

interface BusinessFundingDetailsModalProps {
  funding: BusinessFunding | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onNavigateToFunding?: (fundingId: string) => void;
}

export const BusinessFundingDetailsModal: React.FC<BusinessFundingDetailsModalProps> = ({
  funding,
  isOpen,
  onClose,
  onSuccess,
  onNavigateToFunding
}) => {
  const { 
    members, 
    loans,
    currentUser, 
    isUserAdmin, 
    approveBusinessFunding, 
    rejectBusinessFunding,
    getMemberSavingsBalance,
    useBengaliDigits,
    setActiveTab,
    setSelectedMemberId
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [approvedAmount, setApprovedAmount] = useState<number>(funding ? (funding.approvedAmount || funding.amountRequested) : 0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  
  // Rejection sub-state
  const [showRejectView, setShowRejectView] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Reset local state when funding changes or modal opens
  React.useEffect(() => {
    if (funding) {
      setApprovedAmount(funding.approvedAmount || funding.amountRequested);
      setAdminNotes(funding.notes || '');
      setShowRejectView(false);
      setRejectReason('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [funding, isOpen]);

  if (!isOpen || !funding) return null;

  const num = (val: number | string) => isBn || useBengaliDigits ? toBengaliNumber(val) : val.toString();
  const fmt = (val: number) => formatCurrency(val, isBn || useBengaliDigits);

  const member = members.find(m => m.id === funding.memberId);
  const savingsBalance = member ? getMemberSavingsBalance(member.id) : 0;
  const memberActiveLoans = loans.filter(l => l.memberId === funding.memberId && l.status === 'active');
  const totalLoanDue = memberActiveLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

  const isPending = funding.status === 'pending';

  const handleApprove = async () => {
    setErrorMessage('');
    const finalAmount = Number(approvedAmount);
    if (!finalAmount || finalAmount <= 0) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে অনুমোদিত সঠিক টাকার পরিমাণ লিখুন।' : 'Please enter valid approved amount.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await approveBusinessFunding({
        fundingId: funding.id,
        approvedAmount: finalAmount,
        notes: adminNotes.trim(),
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isBn ? 'অনুমোদন করতে ব্যর্থ হয়েছে' : 'Failed to approve'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setErrorMessage('');
    if (!rejectReason.trim()) {
      setErrorMessage(isBn ? 'বাতিল করার কারণ/মন্তব্য অবশ্যই উল্লেখ করতে হবে।' : 'Rejection reason is mandatory.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await rejectBusinessFunding({
        fundingId: funding.id,
        reason: rejectReason.trim(),
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || (isBn ? 'বাতিল করতে ব্যর্থ হয়েছে' : 'Failed to reject'));
    } finally {
      setIsProcessing(false);
    }
  };

  const rejectionPresets = [
    isBn ? 'পর্যাপ্ত জামানত/কাগজপত্র জমা দেওয়া হয়নি' : 'Insufficient collateral/documents',
    isBn ? 'ব্যবসার ঝুঁকি মাত্রাতিরিক্ত বা প্রস্তাবনা অসম্পূর্ণ' : 'High business risk or incomplete plan',
    isBn ? 'সমিতির চলতি বিনিয়োগ ফান্ডে সীমাবদ্ধতা' : 'Somiti fund limitations',
    isBn ? 'সদস্যের পূর্ববর্তী ঋণ/কিস্তি বকেয়া রয়েছে' : 'Member has outstanding loan dues',
    isBn ? 'সদস্যের ব্যক্তিগত অনুরোধে আবেদন প্রত্যাহার' : 'Withdrawn at applicant request',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Top Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <Briefcase className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-md">
                  {funding.applicationNo}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  funding.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : funding.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : funding.status === 'active'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : funding.status === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                }`}>
                  {funding.status === 'pending' && (isBn ? 'অনুমোদন অপেক্ষমাণ' : 'Pending Approval')}
                  {funding.status === 'approved' && (isBn ? 'অনুমোদিত' : 'Approved')}
                  {funding.status === 'active' && (isBn ? 'সক্রিয় বিনিয়োগ' : 'Active')}
                  {funding.status === 'rejected' && (isBn ? 'প্রত্যাখ্যাত / বাতিল' : 'Rejected')}
                  {funding.status === 'completed' && (isBn ? 'সম্পূর্ণ' : 'Completed')}
                </span>
              </div>
              <h3 className="font-bold text-base tracking-tight text-white mt-0.5">
                {isBn ? 'ব্যবসা ফান্ডিং আবেদনপত্র ও সিদ্ধান্ত' : 'Business Funding Review & Decision'}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold animate-in fade-in-50">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800 max-h-[75vh] overflow-y-auto">
          
          {/* Member Card & Financial Overview */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {member?.photoUrl ? (
                <img 
                  src={member.photoUrl} 
                  alt={funding.memberName} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base border-2 border-white shadow-xs">
                  {funding.memberName.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{funding.memberName}</h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                    {funding.memberNo || member?.memberNo}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  {funding.memberPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {funding.memberPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {isBn ? 'আবেদনের তারিখ:' : 'Applied:'} {funding.applicationDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Member Financial Snapshot */}
            <div className="flex sm:flex-col items-end gap-1.5 text-right w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBn ? 'সঞ্চয় স্থিতি:' : 'Savings:'}</span>
                <span className="font-bold text-emerald-700">{fmt(savingsBalance)}</span>
              </div>
              {memberActiveLoans.length > 0 && (
                <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {isBn ? `সক্রিয় ঋণ (${num(memberActiveLoans.length)}টি): বকেয়া ` : `Active Loans: `}
                  <span className="font-bold">{fmt(totalLoanDue)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Business & Funding Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* 1. Business Info */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBn ? 'ব্যবসার বিবরণ' : 'Business Information'}</span>
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-slate-500">{isBn ? 'প্রতিষ্ঠানের নাম:' : 'Business Name:'}</span>{' '}
                  <span className="font-bold text-slate-800 text-sm">{funding.businessName}</span>
                </div>
                {funding.businessType && (
                  <div>
                    <span className="text-slate-500">{isBn ? 'ব্যবসার ধরন:' : 'Type:'}</span>{' '}
                    <span className="font-medium text-slate-700">{funding.businessType}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block mb-0.5">{isBn ? 'বিনিয়োগের উদ্দেশ্য / বিবরণ:' : 'Purpose:'}</span>
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-700 text-xs leading-relaxed border border-slate-100">
                    {funding.businessPurpose || (isBn ? 'কোনো বিবরণ দেওয়া হয়নি' : 'No description')}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Funding Financial Details */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isBn ? 'আর্থিক ও চুক্তি শর্তাবলি' : 'Funding & Contract Terms'}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-slate-500">{isBn ? 'অনুরোধকৃত অর্থ:' : 'Requested Amount:'}</span>
                  <span className="font-extrabold text-base text-blue-700">{fmt(funding.amountRequested)}</span>
                </div>

                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="text-slate-500">{isBn ? 'চুক্তির মেয়াদ:' : 'Duration:'}</span>
                  <span className="font-bold text-slate-800">{num(funding.durationMonths)} {isBn ? 'মাস' : 'Months'}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{isBn ? 'লাভের অনুপাত (লাভ বণ্টন):' : 'Profit Sharing Ratio:'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-[11px] text-blue-700 block">{isBn ? 'সদস্যের অংশ' : 'Member Share'}</span>
                      <span className="text-sm font-bold text-blue-900">{num(funding.memberProfitSharePercent)}%</span>
                    </div>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <span className="text-[11px] text-emerald-700 block">{isBn ? 'সমিতির অংশ' : 'Somiti Share'}</span>
                      <span className="text-sm font-bold text-emerald-900">{num(funding.somitiProfitSharePercent)}%</span>
                    </div>
                  </div>
                </div>

                {funding.notes && (
                  <div className="pt-1">
                    <span className="text-slate-500 block text-[11px]">{isBn ? 'আবেদনকারীর নোট:' : 'Applicant Note:'}</span>
                    <p className="text-slate-700 italic text-[11px]">{funding.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Already Approved Status Box */}
          {funding.status === 'approved' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'আবেদনটি অনুমোদিত হয়েছে' : 'Application Approved'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-500 block">{isBn ? 'অনুমোদিত অর্থ:' : 'Approved Amount:'}</span>
                  <span className="font-bold text-emerald-700 text-sm">{fmt(funding.approvedAmount || funding.amountRequested)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isBn ? 'অনুমোদনকারী:' : 'Approved By:'}</span>
                  <span className="font-semibold">{funding.approvedBy || 'অ্যাডমিন'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">{isBn ? 'অনুমোদনের তারিখ:' : 'Approved Date:'}</span>
                  <span className="font-semibold">{funding.approvedAt ? funding.approvedAt.split('T')[0] : '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Already Rejected Status Box */}
          {funding.status === 'rejected' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{isBn ? 'আবেদনটি প্রত্যাখ্যান / বাতিল করা হয়েছে' : 'Application Rejected'}</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <div>
                  <span className="text-slate-500 font-medium">{isBn ? 'বাতিলের সুনির্দিষ্ট কারণ / মন্তব্য:' : 'Rejection Reason / Remarks:'}</span>
                  <p className="mt-1 p-2 bg-white rounded border border-rose-200 font-semibold text-rose-800">
                    {funding.rejectionReason || funding.adminComment || funding.notes || (isBn ? 'কোনো কারণ উল্লেখ করা হয়নি' : 'No reason provided')}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>{isBn ? 'বাতিলকারী:' : 'Rejected By:'} {funding.rejectedBy || 'অ্যাডমিন'}</span>
                  {funding.rejectedAt && (
                    <span>{isBn ? 'তারিখ:' : 'Date:'} {funding.rejectedAt.split('T')[0]}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN DECISION PANEL (Only when status is 'pending') */}
          {isPending && isUserAdmin && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border-2 border-blue-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-700" />
                  <h4 className="font-bold text-sm text-slate-900">
                    {isBn ? 'প্রশাসনিক পর্যালোচনা ও সিদ্ধান্ত (Admin Review)' : 'Admin Review & Decision'}
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {isBn ? 'চূড়ান্ত সিদ্ধান্ত গ্রহণ' : 'Action Required'}
                </span>
              </div>

              {!showRejectView ? (
                /* Main Approval Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isBn ? 'অনুমোদিত টাকার পরিমাণ (৳) *' : 'Approved Amount (৳) *'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                        <input
                          type="number"
                          value={approvedAmount}
                          onChange={(e) => setApprovedAmount(Number(e.target.value))}
                          className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          placeholder={funding.amountRequested.toString()}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {isBn ? `সদস্য চেয়েছেন: ${fmt(funding.amountRequested)}` : `Requested: ${fmt(funding.amountRequested)}`}
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isBn ? 'অনুমোদন সংক্রান্ত মন্তব্য / নোট (ঐচ্ছিক)' : 'Admin Approval Notes (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder={isBn ? 'উদা: ব্যবসা সরেজমিনে যাচাই করা হয়েছে' : 'e.g. verified on site'}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Approve & Reject Trigger Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowRejectView(true)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>{isBn ? 'আবেদনটি বাতিল / Reject করুন' : 'Reject Application'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleApprove}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>{isProcessing ? (isBn ? 'অনুমোদন হচ্ছে...' : 'Approving...') : (isBn ? 'আবেদন অনুমোদন নিশ্চিত করুন' : 'Confirm Approval')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Rejection Reason Form (Mandatory Comment/Reason) */
                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3 animate-in fade-in-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>{isBn ? 'বাতিলের সুনির্দিষ্ট কারণ লিখুন (বাধ্যতামূলক)' : 'Provide Mandatory Rejection Reason'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRejectView(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      {isBn ? 'অনুমোদন প্যানেলে ফিরে যান' : 'Back to Approval'}
                    </button>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={isBn ? 'উদা: সমিতির চলতি তহবিলের ঘাটতি / ব্যবসায়িক ঝুঁকি বেশি / সদস্যের পূর্বে ঋণ অপরিশোধিত...' : 'State clear reason for rejecting this funding...'}
                      className="w-full p-2.5 bg-white border border-rose-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Preset quick reasons */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">
                      {isBn ? 'দ্রুত কারণ নির্বাচন করুন:' : 'Quick Presets:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rejectionPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setRejectReason(preset)}
                          className="px-2 py-1 bg-white hover:bg-rose-100/60 border border-slate-200 hover:border-rose-300 rounded text-[11px] text-slate-700 transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectView(false)}
                      className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      {isBn ? 'বাতিল স্থগিত' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || !rejectReason.trim()}
                      onClick={handleReject}
                      className="px-5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isProcessing ? (isBn ? 'বাতিল হচ্ছে...' : 'Rejecting...') : (isBn ? 'আবেদন বাতিল নিশ্চিত করুন' : 'Confirm Rejection')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (onNavigateToFunding) {
                onNavigateToFunding(funding.id);
              } else {
                setActiveTab('business_funding');
              }
              onClose();
            }}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{isBn ? 'ব্যবসা ফান্ডিং মডিউলে দেখুন' : 'View in Business Module'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
