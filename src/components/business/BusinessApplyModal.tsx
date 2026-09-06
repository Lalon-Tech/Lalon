import React, { useState } from 'react';
import { X, Briefcase, Calculator, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { Member } from '../../types';

interface BusinessApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetMemberId?: string;
  onSuccess?: () => void;
}

export const BusinessApplyModal: React.FC<BusinessApplyModalProps> = ({
  isOpen,
  onClose,
  presetMemberId,
  onSuccess,
}) => {
  const { members, currentUser, isUserAdmin, addBusinessFunding, useBengaliDigits } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [selectedMemberId, setSelectedMemberId] = useState<string>(presetMemberId || (members[0]?.id || ''));
  const [amountRequested, setAmountRequested] = useState<number | ''>(100000);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [businessName, setBusinessName] = useState<string>('');
  const [businessType, setBusinessType] = useState<string>('মুদি ও পাইকারি ব্যবসা');
  const [businessPurpose, setBusinessPurpose] = useState<string>('');
  const [memberProfitSharePercent, setMemberProfitSharePercent] = useState<number>(50);
  const [somitiProfitSharePercent, setSomitiProfitSharePercent] = useState<number>(50);
  const [notes, setNotes] = useState<string>('');
  const [testProfitAmount, setTestProfitAmount] = useState<number>(30000);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Selected member information
  const targetMember = members.find(m => m.id === (presetMemberId || selectedMemberId));

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

  // Live calculation for the test profit preview (e.g. ৳30,000 example)
  const calcMemberProfit = Math.round((testProfitAmount || 0) * (memberProfitSharePercent / 100));
  const calcSomitiProfit = (testProfitAmount || 0) - calcMemberProfit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetMember) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে সদস্য নির্বাচন করুন' : 'Please select a member');
      return;
    }

    const numAmount = Number(amountRequested);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg(isBn ? 'বিনিয়োগের পরিমাণ সঠিক নয়' : 'Invalid funding amount');
      return;
    }

    if (!businessName.trim()) {
      setErrorMsg(isBn ? 'ব্যবসার নাম লিখুন' : 'Please enter business name');
      return;
    }

    if (!businessPurpose.trim()) {
      setErrorMsg(isBn ? 'ব্যবসার উদ্দেশ্য বা বিনিয়োগের ব্যবহারের বিবরণ দিন' : 'Please describe the business purpose');
      return;
    }

    if (memberProfitSharePercent + somitiProfitSharePercent !== 100) {
      setErrorMsg(isBn ? 'সদস্য ও সমিতির লাভের শতকরা অনুপাত যোগফল ১০০% হতে হবে' : 'Member and Somiti profit share sum must be 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      await addBusinessFunding({
        memberId: targetMember.id,
        memberNo: targetMember.memberNo,
        memberName: targetMember.name,
        memberPhone: targetMember.phone,
        amountRequested: numAmount,
        approvedAmount: numAmount,
        durationMonths,
        businessName: businessName.trim(),
        businessType: businessType.trim(),
        businessPurpose: businessPurpose.trim(),
        memberProfitSharePercent,
        somitiProfitSharePercent,
        applicationDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: notes.trim(),
      });

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isBn ? 'আবেদন জমা দিতে ত্রুটি হয়েছে' : 'Failed to submit application'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <Briefcase className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isBn ? 'ব্যবসা ফান্ডিং আবেদনপত্র' : 'Business Funding Application'}
              </h3>
              <p className="text-xs text-blue-200">
                {presetMemberId && targetMember
                  ? isBn
                    ? `${targetMember.name} (${targetMember.memberNo}) এর ব্যবসার জন্য আবেদন`
                    : `Application for ${targetMember.name} (${targetMember.memberNo})`
                  : isBn
                    ? 'সমিতি হতে ব্যবসায়িক বিনিয়োগ বা পার্টনারশিপ সুবিধা'
                    : 'Business funding / partnership facility from Somiti'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Selection (only selectable if Admin and no presetMemberId) */}
          {!presetMemberId && isUserAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'আবেদনকারী সদস্য নির্বাচন করুন' : 'Select Applicant Member'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.memberNo} ({m.phone})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            targetMember && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                    {targetMember.name.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{targetMember.name}</h4>
                    <p className="text-xs text-slate-500">
                      {isBn ? 'সদস্য নং: ' : 'Member No: '}
                      <span className="font-semibold text-blue-700">{targetMember.memberNo}</span>
                      {' • '}
                      {isBn ? 'মোবাইল: ' : 'Phone: '}
                      {targetMember.phone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {isBn ? 'বর্তমান মোট সঞ্চয়' : 'Total Current Savings'}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {formatCurrency(targetMember.totalSavings, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>
            )
          )}

          {/* 1. কত টাকা নেবে & 2. কতদিনের জন্য নেবে */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? '১. কত টাকা নেবেন (বিনিয়োগের পরিমাণ ৳)' : '1. Amount Requested (Funding Amount ৳)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                <input
                  type="number"
                  min="5000"
                  step="1000"
                  required
                  placeholder={isBn ? '১০০০০০' : '100000'}
                  value={amountRequested}
                  onChange={(e) => setAmountRequested(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {isBn ? 'উদাহরণ: ৳ ১,০০,০০০' : 'Example: ৳ 100,000'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? '২. কতদিনের জন্য নেবেন (মেয়াদ)' : '2. Duration (Months)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value={3}>{isBn ? '৩ মাস (স্বল্পমেয়াদী)' : '3 Months (Short-term)'}</option>
                <option value={6}>{isBn ? '৬ মাস' : '6 Months'}</option>
                <option value={12}>{isBn ? '১২ মাস (১ বছর)' : '12 Months (1 Year)'}</option>
                <option value={18}>{isBn ? '১৮ মাস (দেড় বছর)' : '18 Months (1.5 Years)'}</option>
                <option value={24}>{isBn ? '২৪ মাস (২ বছর)' : '24 Months (2 Years)'}</option>
                <option value={36}>{isBn ? '৩৬ মাস (৩ বছর)' : '36 Months (3 Years)'}</option>
              </select>
            </div>
          </div>

          {/* 3. কোন Business/Purpose-এর জন্য নেবে */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? '৩. ব্যবসার নাম / ট্রেড নাম' : '3. Business Name / Trade Name'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder={isBn ? 'যেমন: ভাই ভাই ট্রেডার্স / মেগা এন্টারপ্রাইজ' : 'e.g. Bhai Bhai Traders / Mega Store'}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'ব্যবসার ধরণ' : 'Business Category / Type'}
              </label>
              <input
                type="text"
                placeholder={isBn ? 'যেমন: মুদি পাইকারি, ডেইরি ফার্ম, কৃষি পণ্য' : 'e.g. Grocery Wholesale, Dairy, Agro'}
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {isBn ? 'কোন উদ্দেশ্যে টাকা ব্যবহার হবে (Purpose / প্ল্যান)' : 'Purpose / Business Plan'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              placeholder={isBn ? 'যেমন: নতুন পণ্য ও মালামাল স্টক ক্রয়, পাইকারি সরবরাহ বৃদ্ধি ও দোকানের পরিধি বিস্তার।' : 'e.g. Purchasing inventory goods, wholesale supply expansion, store upgrade.'}
              value={businessPurpose}
              onChange={(e) => setBusinessPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* 4 & 5. Profit Sharing Percentages & Live Simulation */}
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>{isBn ? 'লাভের শতকরা বণ্টন (Profit Share Agreement)' : 'Profit Sharing Ratio Agreement'}</span>
              </h4>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                {isBn ? 'মোট = ১০০%' : 'Total = 100%'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Member % */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? '৪. ব্যবসায় লাভ থেকে সদস্য পাবে (%)' : '4. Member Profit Share (%)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={memberProfitSharePercent}
                    onChange={(e) => handleMemberPercentChange(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="w-16 shrink-0 flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-800 py-1 rounded-lg border border-blue-200">
                    {isBn && useBengaliDigits ? toBengaliNumber(memberProfitSharePercent) : memberProfitSharePercent}%
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {isBn ? 'সদস্যের অংশ' : 'Member Share'}
                </span>
              </div>

              {/* Somiti % */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBn ? '৫. ব্যবসায় লাভ থেকে সমিতি পাবে (%)' : '5. Somiti Profit Share (%)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="99"
                    value={somitiProfitSharePercent}
                    onChange={(e) => handleSomitiPercentChange(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="w-16 shrink-0 flex items-center justify-center font-bold text-sm bg-emerald-50 text-emerald-800 py-1 rounded-lg border border-emerald-200">
                    {isBn && useBengaliDigits ? toBengaliNumber(somitiProfitSharePercent) : somitiProfitSharePercent}%
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {isBn ? 'সমিতির অংশ (যা সদস্যরা পাবে)' : 'Somiti Share (Distributed to all members)'}
                </span>
              </div>
            </div>

            {/* Interactive Example Simulation Box */}
            <div className="bg-white p-3.5 rounded-xl border border-blue-200 text-xs space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-700">
                  {isBn ? 'উদাহরণ প্রাক্কলন (যদি ব্যবসার লাভ হয়):' : 'Estimated Profit Split Simulation (e.g. if profit is):'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    step="1000"
                    value={testProfitAmount}
                    onChange={(e) => setTestProfitAmount(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-0.5 border border-slate-300 rounded-md text-xs font-bold text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-blue-50/70 rounded-lg text-center">
                  <span className="text-[11px] text-blue-600 block">
                    {isBn ? `সদস্য পাবে (${toBengaliNumber(memberProfitSharePercent)}%)` : `Member Receives (${memberProfitSharePercent}%)`}
                  </span>
                  <span className="text-sm font-bold text-blue-900">
                    {formatCurrency(calcMemberProfit, isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/70 rounded-lg text-center">
                  <span className="text-[11px] text-emerald-600 block">
                    {isBn ? `সমিতি পাবে (${toBengaliNumber(somitiProfitSharePercent)}%)` : `Somiti Receives (${somitiProfitSharePercent}%)`}
                  </span>
                  <span className="text-sm font-bold text-emerald-900">
                    {formatCurrency(calcSomitiProfit, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 text-center italic">
                {isBn
                  ? '* সমিতির অংশটি মাস শেষে সকল সদস্যের দৈনিক জমার ভিত্তিতে বণ্টন করা হবে।'
                  : '* The Somiti portion is distributed at month-end to all members proportionally based on daily balance deposits.'}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isBn ? 'বিশেষ কোনো শর্ত বা অতিরিক্ত নোট (ঐচ্ছিক)' : 'Special Terms or Notes (Optional)'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'জামানত বা গ্যারান্টার সংক্রান্ত তথ্য...' : 'Security deposit, guarantor or other notes...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isBn ? 'জমা হচ্ছে...' : 'Submitting...'
                  : isBn ? 'আবেদন জমা দিন' : 'Submit Application'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
