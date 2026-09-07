import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { BusinessFunding, BusinessFundingStatus } from '../../types';

interface BusinessFundingEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  funding: BusinessFunding | null;
  onSuccess?: () => void;
}

export const BusinessFundingEditModal: React.FC<BusinessFundingEditModalProps> = ({
  isOpen,
  onClose,
  funding,
  onSuccess,
}) => {
  const { updateBusinessFunding, useBengaliDigits } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [businessName, setBusinessName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('মুদি ও পাইকারি ব্যবসা');
  const [businessPurpose, setBusinessPurpose] = useState<string>('');
  const [amountRequested, setAmountRequested] = useState<number | ''>('');
  const [approvedAmount, setApprovedAmount] = useState<number | ''>('');
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [memberProfitSharePercent, setMemberProfitSharePercent] = useState<number>(50);
  const [somitiProfitSharePercent, setSomitiProfitSharePercent] = useState<number>(50);
  const [status, setStatus] = useState<BusinessFundingStatus>('pending');
  const [notes, setNotes] = useState<string>('');
  const [testProfitAmount, setTestProfitAmount] = useState<number>(30000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (funding) {
      setBusinessName(funding.businessName || '');
      setBusinessType(funding.businessType || 'মুদি ও পাইকারি ব্যবসা');
      setBusinessPurpose(funding.businessPurpose || '');
      setAmountRequested(funding.amountRequested || 0);
      setApprovedAmount(funding.approvedAmount !== undefined ? funding.approvedAmount : funding.amountRequested);
      setDurationMonths(funding.durationMonths || 12);
      setMemberProfitSharePercent(funding.memberProfitSharePercent !== undefined ? funding.memberProfitSharePercent : 50);
      setSomitiProfitSharePercent(funding.somitiProfitSharePercent !== undefined ? funding.somitiProfitSharePercent : 50);
      setStatus(funding.status || 'pending');
      setNotes(funding.notes || '');
      setErrorMsg('');
    }
  }, [funding, isOpen]);

  if (!isOpen || !funding) return null;

  const handleMemberPercentChange = (val: number) => {
    const clamped = Math.max(1, Math.min(99, val));
    setMemberProfitSharePercent(clamped);
    setSomitiProfitSharePercent(100 - clamped);
  };

  const handleSomitiPercentChange = (val: number) => {
    const clamped = Math.max(1, Math.min(99, val));
    setSomitiProfitSharePercent(clamped);
    setMemberProfitSharePercent(100 - clamped);
  };

  const calcMemberProfit = Math.round((testProfitAmount || 0) * (memberProfitSharePercent / 100));
  const calcSomitiProfit = (testProfitAmount || 0) - calcMemberProfit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numAmountReq = Number(amountRequested);
    if (!numAmountReq || numAmountReq <= 0) {
      setErrorMsg(isBn ? 'আবেদনের পরিমাণ সঠিক নয়' : 'Invalid requested funding amount');
      return;
    }

    const numApproved = Number(approvedAmount);
    if (numApproved < 0) {
      setErrorMsg(isBn ? 'অনুমোদিত পরিমাণ সঠিক নয়' : 'Invalid approved amount');
      return;
    }

    if (!businessName.trim()) {
      setErrorMsg(isBn ? 'ব্যবসার নাম প্রদান করুন' : 'Please enter business name');
      return;
    }

    if (memberProfitSharePercent + somitiProfitSharePercent !== 100) {
      setErrorMsg(isBn ? 'উদ্যোক্তা ও সমিতির শতকরা অনুপাত যোগফল ১০০% হতে হবে' : 'Profit share sum must be 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBusinessFunding(funding.id, {
        businessName: businessName.trim(),
        businessType: businessType.trim(),
        businessPurpose: businessPurpose.trim(),
        amountRequested: numAmountReq,
        approvedAmount: numApproved,
        durationMonths,
        memberProfitSharePercent,
        somitiProfitSharePercent,
        status,
        notes: notes.trim(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isBn ? 'তথ্য হালনাগাদ করতে ব্যর্থ হয়েছে' : 'Failed to update funding'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>{isBn ? 'ব্যবসা ফান্ডিং তথ্য সম্পাদন (Edit)' : 'Edit Business Funding'}</span>
                <span className="text-xs font-mono font-normal bg-white/20 px-2 py-0.5 rounded-md">
                  #{funding.applicationNo}
                </span>
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                {funding.memberName} ({funding.memberNo})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Business Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'ব্যবসার নাম *' : 'Business Name *'}
              </label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'ব্যবসার ধরন' : 'Business Type'}
              </label>
              <input
                type="text"
                value={businessType}
                onChange={e => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'ব্যবসার উদ্দেশ্য / বিনিয়োগের বিবরণ' : 'Business Purpose / Funding Plan'}
            </label>
            <textarea
              value={businessPurpose}
              onChange={e => setBusinessPurpose(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Amounts & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'আবেদনের পরিমাণ (৳) *' : 'Requested Amount (৳) *'}
              </label>
              <input
                type="number"
                value={amountRequested}
                onChange={e => setAmountRequested(e.target.value === '' ? '' : Number(e.target.value))}
                min="1000"
                step="1000"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'অনুমোদিত পরিমাণ (৳) *' : 'Approved Amount (৳) *'}
              </label>
              <input
                type="number"
                value={approvedAmount}
                onChange={e => setApprovedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                step="1000"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'মেয়াদ (মাস)' : 'Duration (Months)'}
              </label>
              <select
                value={durationMonths}
                onChange={e => setDurationMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              >
                <option value={3}>{isBn ? '৩ মাস' : '3 Months'}</option>
                <option value={6}>{isBn ? '৬ মাস' : '6 Months'}</option>
                <option value={12}>{isBn ? '১২ মাস (১ বছর)' : '12 Months (1 Year)'}</option>
                <option value={24}>{isBn ? '২৪ মাস (২ বছর)' : '24 Months (2 Years)'}</option>
                <option value={36}>{isBn ? '৩৬ মাস (৩ বছর)' : '36 Months (3 Years)'}</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'ফান্ডিং স্ট্যাটাস (Status)' : 'Funding Status'}
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as BusinessFundingStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
            >
              <option value="pending">{isBn ? 'পর্যালোচনাধীন (Pending Review)' : 'Pending Review'}</option>
              <option value="approved">{isBn ? 'অনুমোদিত (Approved)' : 'Approved'}</option>
              <option value="active">{isBn ? 'চলতি ব্যবসা (Active)' : 'Active'}</option>
              <option value="completed">{isBn ? 'সম্পন্ন (Completed)' : 'Completed'}</option>
              <option value="rejected">{isBn ? 'বাতিল (Rejected)' : 'Rejected'}</option>
            </select>
          </div>

          {/* Profit Share Split */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                {isBn ? 'লভ্যাংশ বণ্টনের চুক্তিভিত্তিক অনুপাত (%)' : 'Agreed Profit Sharing Ratio (%)'}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                {isBn ? `সমিতির লভ্যাংশ: ${toBengaliNumber(somitiProfitSharePercent)}%` : `Somiti Share: ${somitiProfitSharePercent}%`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {isBn ? 'উদ্যোক্তা সদস্যের লাভ %' : 'Entrepreneur Member %'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={memberProfitSharePercent}
                    onChange={e => handleMemberPercentChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  {isBn ? 'সমিতির লভ্যাংশ %' : 'Somiti Profit %'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={somitiProfitSharePercent}
                    onChange={e => handleSomitiPercentChange(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>
              </div>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="1"
              max="99"
              value={memberProfitSharePercent}
              onChange={e => handleMemberPercentChange(Number(e.target.value))}
              className="w-full h-1.5 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            {/* Test Profit Simulation */}
            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-600">
                {isBn ? `উদাহরণ: মাসে ৳${toBengaliNumber(testProfitAmount)} লাভ হলে` : `Example: If ৳${testProfitAmount} profit/mo:`}
              </span>
              <div className="flex items-center gap-3 font-semibold">
                <span className="text-slate-700">
                  {isBn ? 'উদ্যোক্তা: ' : 'Member: '}
                  <span className="text-emerald-800 font-bold">{formatCurrency(calcMemberProfit, isBn && useBengaliDigits)}</span>
                </span>
                <span className="text-slate-400">|</span>
                <span className="text-teal-800">
                  {isBn ? 'সমিতি: ' : 'Somiti: '}
                  <span className="text-teal-800 font-bold">+{formatCurrency(calcSomitiProfit, isBn && useBengaliDigits)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'নোট / বিশেষ শর্তাবলী' : 'Notes / Special Terms'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder={isBn ? 'কোনো অতিরিক্ত শর্ত থাকলে লিখুন...' : 'Any remarks or agreement notes...'}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>{isBn ? 'হালনাগাদ হচ্ছে...' : 'Saving...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সংরক্ষণ করুন (Save Changes)' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
