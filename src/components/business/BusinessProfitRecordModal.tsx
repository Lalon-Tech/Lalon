import React, { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Building, Calendar, Users, ChevronDown, ChevronUp, PieChart, ShieldCheck } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { BusinessFunding } from '../../types';

interface BusinessProfitRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetFundingId?: string;
  onSuccess?: () => void;
}

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const BusinessProfitRecordModal: React.FC<BusinessProfitRecordModalProps> = ({
  isOpen,
  onClose,
  presetFundingId,
  onSuccess,
}) => {
  const { 
    businessFundings, 
    recordBusinessProfit, 
    calculateDailyWeightedDeposits, 
    useBengaliDigits 
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Active or approved fundings only
  const activeFundings = businessFundings.filter(f => f.status === 'active' || f.status === 'approved');

  const [selectedFundingId, setSelectedFundingId] = useState<string>(
    presetFundingId || (activeFundings[0]?.id || '')
  );

  useEffect(() => {
    if (presetFundingId) {
      setSelectedFundingId(presetFundingId);
    } else if (activeFundings.length > 0 && !selectedFundingId) {
      setSelectedFundingId(activeFundings[0].id);
    }
  }, [presetFundingId, activeFundings, isOpen]);

  // Default to current YYYY-MM
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState<string>(currentMonthStr);
  const [totalProfit, setTotalProfit] = useState<number | ''>(1000);
  const [distributeSomitiProfitNow, setDistributeSomitiProfitNow] = useState<boolean>(true);
  const [showMemberBreakdown, setShowMemberBreakdown] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const targetFunding: BusinessFunding | undefined = businessFundings.find(
    f => f.id === (presetFundingId || selectedFundingId)
  );

  const memberPct = targetFunding?.memberProfitSharePercent !== undefined ? targetFunding.memberProfitSharePercent : 50;
  const somitiPct = targetFunding?.somitiProfitSharePercent !== undefined ? targetFunding.somitiProfitSharePercent : 50;

  const numProfit = Number(totalProfit) || 0;
  const memberShareAmount = Math.round(numProfit * (memberPct / 100));
  const somitiShareAmount = numProfit - memberShareAmount;

  // Selected year and month
  const [selectedYear, selectedMonth] = useMemo(() => {
    const parts = month.split('-');
    const y = parseInt(parts[0], 10) || new Date().getFullYear();
    const m = parseInt(parts[1], 10) || (new Date().getMonth() + 1);
    return [y, m];
  }, [month]);

  // Calculate daily weighted deposits of all members for the selected month
  const { items, totalWeightedDeposit } = useMemo(() => {
    return calculateDailyWeightedDeposits(selectedYear, selectedMonth);
  }, [calculateDailyWeightedDeposits, selectedYear, selectedMonth]);

  // Breakdown of how the somitiShareAmount will be distributed among members based on deposits
  const previewItems = useMemo(() => {
    if (!somitiShareAmount || somitiShareAmount <= 0) return [];
    const eligible = items.filter(item => (item.dailyWeightedDeposit > 0 || (item.member.totalSavings || 0) > 0));
    const effectiveTotalWeight = totalWeightedDeposit > 0
      ? totalWeightedDeposit
      : eligible.reduce((sum, item) => sum + (item.dailyWeightedDeposit || (item.member.totalSavings || 0)), 0);

    if (effectiveTotalWeight <= 0) return [];

    return eligible.map(item => {
      const weight = item.dailyWeightedDeposit > 0 ? item.dailyWeightedDeposit : (item.member.totalSavings || 0);
      const allocated = Math.round((weight / effectiveTotalWeight) * somitiShareAmount);
      return {
        ...item,
        allocated,
      };
    }).filter(item => item.allocated > 0);
  }, [items, totalWeightedDeposit, somitiShareAmount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!targetFunding) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে ব্যবসা ফান্ডিং নির্বাচন করুন' : 'Please select business funding');
      return;
    }

    if (!numProfit || numProfit <= 0) {
      setErrorMsg(isBn ? 'লাভের পরিমাণ ০ এর বেশি হতে হবে' : 'Profit amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordBusinessProfit({
        businessFundingId: targetFunding.id,
        month,
        totalBusinessProfit: numProfit,
        notes: notes.trim(),
        distributeSomitiProfitNow,
      });

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isBn ? 'লাভ এন্ট্রি করতে ত্রুটি হয়েছে' : 'Failed to record profit'));
      setIsSubmitting(false);
    }
  };

  const monthLabel = isBn && selectedMonth >= 1 && selectedMonth <= 12
    ? `${BENGALI_MONTHS[selectedMonth - 1]} ${toBengaliNumber(selectedYear)}`
    : month;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isBn ? 'ব্যবসায়িক লাভ এন্ট্রি ও সমিতি বণ্টন' : 'Business Profit Entry & Somiti Distribution'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isBn
                  ? 'সমিতির প্রাপ্ত লাভ গণনা ও সদস্য জমার অনুপাতে বণ্টন'
                  : 'Calculate Somiti profit share & distribute among members by deposit'}
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

          {/* Funding selection */}
          {!presetFundingId ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'ব্যবসা ও উদ্যোক্তা সদস্য নির্বাচন করুন' : 'Select Business & Entrepreneur'} <span className="text-rose-500">*</span>
              </label>
              {activeFundings.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  {isBn
                    ? 'বর্তমানে কোনো সক্রিয় ব্যবসা ফান্ডিং নেই। প্রথমে একটি ফান্ডিং আবেদন অনুমোদন ও বিতরণ করুন।'
                    : 'No active business fundings found. Please approve and disburse a funding application first.'}
                </div>
              ) : (
                <select
                  value={selectedFundingId}
                  onChange={(e) => setSelectedFundingId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {activeFundings.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.businessName} ({f.memberName} - {f.memberNo}) | {isBn ? 'বিনিয়োগ: ' : 'Funding: '}
                      {formatCurrency(f.approvedAmount, isBn && useBengaliDigits)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            targetFunding && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    {targetFunding.businessName}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isBn ? 'উদ্যোক্তা: ' : 'Entrepreneur: '}
                    <span className="font-semibold text-slate-700">{targetFunding.memberName}</span> ({targetFunding.memberNo})
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {isBn ? 'বিতরণকৃত বিনিয়োগ' : 'Disbursed Funding'}
                  </span>
                  <span className="text-xs font-bold text-blue-700">
                    {formatCurrency(targetFunding.approvedAmount, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>
            )
          )}

          {/* Month & Profit Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'লাভের মাস নির্বাচন' : 'Select Profit Month'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="month"
                  required
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {isBn ? `নির্বাচিত মাস: ${monthLabel}` : `Selected: ${monthLabel}`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'এই মাসে মোট ব্যবসা লাভ (৳)' : 'Total Business Profit This Month (৳)'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder={isBn ? '১০০০' : '1000'}
                  value={totalProfit}
                  onChange={(e) => setTotalProfit(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Somiti Profit Calculation */}
          <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'সমিতির অর্জিত লভ্যাংশ হিসাব' : "Somiti Profit Calculation"}</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                {isBn
                  ? `সমিতির লভ্যাংশ চুক্তি: ${toBengaliNumber(somitiPct)}%`
                  : `Somiti Share: ${somitiPct}%`}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs text-emerald-900 font-bold block">
                    {isBn ? 'সমিতিতে জমা হওয়া মোট লভ্যাংশ' : "Somiti's Profit Amount"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {isBn
                      ? `মোট ব্যবসা লাভ (৳${numProfit}) এর ${toBengaliNumber(somitiPct)}% সমিতিতে জমা হবে`
                      : `${somitiPct}% of total business profit (৳${numProfit}) credited to Somiti`}
                  </span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-2xl font-black text-emerald-700 tracking-tight">
                    +{formatCurrency(somitiShareAmount, isBn && useBengaliDigits)}
                  </span>
                  <span className="text-[10px] text-teal-600 block font-semibold mt-0.5">
                    {isBn ? '✓ সদস্যদের সঞ্চয় প্রোফাইলে বণ্টনযোগ্য' : 'Eligible for member profit distribution'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Somiti Profit Distribution to Members based on Deposits */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={distributeSomitiProfitNow}
                onChange={(e) => setDistributeSomitiProfitNow(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <div className="flex-1">
                <span className="text-xs font-bold text-indigo-950 block">
                  {isBn 
                    ? `উক্ত মাসের (${monthLabel}) সদস্য জমার অনুপাতে সমিতির লভ্যাংশ (${formatCurrency(somitiShareAmount, isBn && useBengaliDigits)}) সকল সদস্যের মাঝে বণ্টন করুন` 
                    : `Distribute Somiti's share (${formatCurrency(somitiShareAmount, isBn && useBengaliDigits)}) to members based on deposits in ${monthLabel}`}
                </span>
                <p className="text-[11px] text-indigo-800 mt-1 leading-relaxed">
                  {isBn
                    ? `কার কত টাকা জমা আছে সেই অনুপাত (Daily Weighted Deposit) অনুযায়ী সমিতির ৳${toBengaliNumber(somitiShareAmount)} টাকা ভাগ হবে এবং প্রত্যেকের প্রোফাইলে লভ্যাংশ (Profit) হিসেবে স্বয়ংক্রিয়ভাবে যুক্ত হবে।`
                    : `The ৳${somitiShareAmount} Somiti profit will be divided proportionally among members based on their deposits in this month, and credited to their profiles.`}
                </p>
              </div>
            </label>

            {distributeSomitiProfitNow && (
              <div className="pt-2 border-t border-indigo-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-indigo-900 font-medium">
                  <span>
                    {isBn ? 'সুবিধাপ্রাপ্ত সদস্য সংখ্যা: ' : 'Eligible Members: '}
                    <strong className="text-indigo-950 font-bold">{isBn ? toBengaliNumber(previewItems.length) : previewItems.length} জন</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMemberBreakdown(!showMemberBreakdown)}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-950 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showMemberBreakdown ? (isBn ? 'তালিকা লুকান' : 'Hide Breakdown') : (isBn ? 'সদস্য বণ্টন প্রিভিউ দেখুন' : 'View Member Breakdown')}</span>
                    {showMemberBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Member Breakdown Preview List */}
                {showMemberBreakdown && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-indigo-200 bg-white shadow-2xs divide-y divide-slate-100 text-xs">
                    {previewItems.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        {isBn ? 'এই মাসে কোনো সদস্যের সক্রিয় সঞ্চয় পাওয়া যায়নি।' : 'No active member deposits found for this month.'}
                      </div>
                    ) : (
                      previewItems.map((item) => (
                        <div key={item.member.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              {item.member.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {item.member.memberNo} • {isBn ? 'জমার স্থিতি: ' : 'Savings: '}
                              {formatCurrency(item.member.totalSavings || 0, isBn && useBengaliDigits)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-indigo-600 font-bold block">
                              {isBn ? `${toBengaliNumber(item.weightPercentage.toFixed(1))}% অংশ` : `${item.weightPercentage.toFixed(1)}%`}
                            </span>
                            <span className="text-xs font-bold text-emerald-700">
                              +{formatCurrency(item.allocated, isBn && useBengaliDigits)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isBn ? 'মন্তব্য বা নোট (ঐচ্ছিক)' : 'Notes / Comments (Optional)'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: মাসিক অর্জিত ব্যবসার লভ্যাংশ বণ্টন' : 'e.g. Monthly business profit distribution'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
              disabled={isSubmitting || !targetFunding}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isBn ? 'সংরক্ষণ ও বণ্টন হচ্ছে...' : 'Saving & Distributing...'
                  : isBn ? 'লাভ সংরক্ষণ ও বণ্টন কার্যকর করুন' : 'Confirm Profit & Distribute'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
