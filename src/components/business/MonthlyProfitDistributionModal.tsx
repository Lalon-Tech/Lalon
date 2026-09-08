import React, { useState, useMemo } from 'react';
import { X, PieChart, Users, ArrowRight, CheckCircle2, AlertCircle, Sparkles, HelpCircle, CheckSquare, AlertTriangle } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';

interface MonthlyProfitDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyProfitDistributionModal: React.FC<MonthlyProfitDistributionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    members,
    businessProfitRecords,
    profitDistributions,
    calculateMemberProfitShares,
    executeMonthlyProfitDistribution,
    useBengaliDigits,
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const monthName = isBn
    ? `${BENGALI_MONTHS[selectedMonth - 1]} ${toBengaliNumber(selectedYear)}`
    : `${ENGLISH_MONTHS[selectedMonth - 1]} ${selectedYear}`;

  // Automatically sum Somiti's earned profits recorded in this month from business funding
  const autoSomitiProfit = useMemo(() => {
    return businessProfitRecords
      .filter(r => r.month === monthStr)
      .reduce((sum, r) => sum + (r.somitiProfitAmount || 0), 0);
  }, [businessProfitRecords, monthStr]);

  const [distributableProfit, setDistributableProfit] = useState<number>(autoSomitiProfit || 1000);
  const [creditToSavings, setCreditToSavings] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Check if a distribution for this year & month already exists
  const existingDistributionForMonth = useMemo(() => {
    return profitDistributions.find(
      d => d.year === selectedYear && d.month === selectedMonth
    );
  }, [profitDistributions, selectedYear, selectedMonth]);

  // Update distributable profit when month changes if autoSomitiProfit has changed
  React.useEffect(() => {
    if (autoSomitiProfit > 0) {
      setDistributableProfit(autoSomitiProfit);
    }
  }, [autoSomitiProfit]);

  // Compute profit shares based on members' total savings
  // Sum = profit / total savings
  // Member Profit = Sum * member.totalSavings
  const { items, totalSavings, profitRatio } = useMemo(() => {
    return calculateMemberProfitShares(distributableProfit, selectedYear, selectedMonth);
  }, [calculateMemberProfitShares, distributableProfit, selectedYear, selectedMonth]);

  if (!isOpen) return null;

  const validMembers = items.filter(i => i.savings > 0);

  const handleExecute = async () => {
    setErrorMsg('');

    if (distributableProfit <= 0) {
      setErrorMsg(isBn ? 'বণ্টনযোগ্য লভ্যাংশের পরিমাণ ০ এর বেশি হতে হবে' : 'Distributable profit pool must be greater than 0');
      return;
    }

    if (totalSavings <= 0) {
      setErrorMsg(isBn ? 'কোনো সদস্যের সঞ্চয় বা জমা ব্যালেন্স নেই' : 'No active member savings found');
      return;
    }

    if (existingDistributionForMonth) {
      setErrorMsg(isBn ? 'এই মাসের লভ্যাংশ ইতোমধ্যে একবার বণ্টন করা হয়েছে।' : 'Profit for this month has already been distributed.');
      return;
    }

    setIsSubmitting(true);
    try {
      await executeMonthlyProfitDistribution({
        year: selectedYear,
        month: selectedMonth,
        monthName,
        totalSomitiProfitPool: distributableProfit,
        creditToSavings,
        notes: notes.trim(),
      });

      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isBn ? 'বণ্টন সম্পন্ন করতে ব্যর্থ হয়েছে' : 'Failed to execute profit distribution'));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <PieChart className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isBn ? 'মাসিক সমিতির ব্যবসায়িক লভ্যাংশ বণ্টন' : 'Monthly Somiti Business Profit Distribution'}
              </h3>
              <p className="text-xs text-indigo-200">
                {isBn
                  ? 'সদস্যদের মোট জমার ভিত্তিতে আনুপাতিক লভ্যাংশ বণ্টন (Sum = Profit ÷ Total Joma)'
                  : 'Proportional member distribution based on Total Savings (Sum = Profit ÷ Total Joma)'}
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

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Duplicate Month Distribution Warning */}
          {existingDistributionForMonth && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-950">
                  {isBn
                    ? `সতর্কতা: ${monthName} মাসের লভ্যাংশ ইতোমধ্যে বণ্টন করা হয়েছে!`
                    : `Warning: Profit for ${monthName} has already been distributed!`}
                </strong>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  {isBn
                    ? `ডুপ্লিকেট বণ্টন এবং সদস্যদের একাধিকবার লাভ জমা হওয়া প্রতিরোধ করতে একই মাসে একাধিক বণ্টন বন্ধ রাখা হয়েছে। (বণ্টন নম্বর: ${existingDistributionForMonth.distributionNo})`
                    : `To prevent duplicate entries and multiple profit crediting, duplicate distributions for the same month are prohibited. (Distribution ID: ${existingDistributionForMonth.distributionNo})`}
                </p>
              </div>
            </div>
          )}

          {/* Month & Pool Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'বণ্টনের বছর ও মাস' : 'Distribution Year & Month'}
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-2/3 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {(isBn ? BENGALI_MONTHS : ENGLISH_MONTHS).map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-1/3 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>
                      {isBn && useBengaliDigits ? toBengaliNumber(yr) : yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'বণ্টনযোগ্য মোট লাভ (Distributable Profit Pool ৳)' : 'Distributable Profit Pool (৳)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={distributableProfit}
                  onChange={(e) => setDistributableProfit(Number(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              {autoSomitiProfit > 0 && (
                <button
                  type="button"
                  onClick={() => setDistributableProfit(autoSomitiProfit)}
                  className="text-[10px] text-blue-600 hover:underline mt-1 block"
                >
                  * {isBn
                    ? `এই মাসে অর্জিত সমিতির ব্যবসা লাভ: ${formatCurrency(autoSomitiProfit, useBengaliDigits)} ব্যবহার করুন`
                    : `Use recorded Somiti profit this month: ${formatCurrency(autoSomitiProfit, false)}`}
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'বণ্টন অপশন' : 'Distribution Mode'}
              </label>
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 font-medium cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={creditToSavings}
                  onChange={(e) => setCreditToSavings(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>{isBn ? 'সরাসরি সদস্যের সঞ্চয় ব্যালেন্সে যোগ করুন' : 'Directly credit to member savings'}</span>
              </label>
            </div>
          </div>

          {/* Mathematical Formula Explanation Badge */}
          <div className="p-4 bg-blue-50/90 rounded-xl border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-blue-950">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{isBn ? 'লভ্যাংশ বণ্টন নীতি ও গাণিতিক সূত্র (Formula):' : 'Profit Distribution Policy & Formula:'}</span>
              </span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                {isBn ? 'মোট জমার ভিত্তিতে' : 'Based on Total Savings'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200 text-blue-900 font-mono text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
                <span>
                  <strong>Sum</strong> = {isBn ? 'মোট লভ্যাংশ' : 'Profit'} ÷ {isBn ? 'মোট জমা' : 'Total Savings'}
                </span>
                <span className="text-blue-700 font-bold">
                  = {formatCurrency(distributableProfit, false)} ÷ {formatCurrency(totalSavings, false)}
                  {totalSavings > 0 ? ` = ${(profitRatio).toFixed(6)}` : ''}
                </span>
              </div>
              <div className="text-slate-700">
                {isBn ? 'প্রত্যেক সদস্যের লাভ' : 'Member Profit'} = <strong>Sum</strong> × {isBn ? 'সদস্যের মোট জমা' : "Member's Total Savings"}
              </div>
            </div>
            <p className="text-[11px] text-blue-800">
              {isBn
                ? `* উদাহরণ: ১,০০০ টাকা লভে মোট ১৫,০০০ টাকা জমার ক্ষেত্রে Sum = ০.০৬৬৬৬৭; সদস্যের ৮,০০০ টাকা জমার বিপরীতে লাভ = ৫৩৩.৩৩ টাকা।`
                : `* Example: For 1,000 profit and 15,000 total savings, Sum = 0.066667; Member with 8,000 savings receives 533.33 Taka.`}
            </p>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">
                {isBn ? 'মোট সদস্য জমা' : 'Total Member Savings'}
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {formatCurrency(totalSavings, isBn && useBengaliDigits)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">
                {isBn ? 'সুবিধাপ্রাপ্ত সদস্য' : 'Eligible Members'}
              </span>
              <span className="text-sm font-bold text-blue-700">
                {isBn && useBengaliDigits ? `${toBengaliNumber(validMembers.length)} জন` : `${validMembers.length} Members`}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">
                {isBn ? 'লভ্যাংশের হার (Sum)' : 'Profit Ratio (Sum)'}
              </span>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                {profitRatio > 0 ? profitRatio.toFixed(6) : '0.000000'}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-[11px] text-indigo-700 block font-semibold">
                {isBn ? 'বণ্টনযোগ্য লাভ' : 'Distributable Profit'}
              </span>
              <span className="text-sm font-bold text-indigo-900">
                {formatCurrency(distributableProfit, isBn && useBengaliDigits)}
              </span>
            </div>
          </div>

          {/* Distribution Calculation Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-600" />
                <span>
                  {isBn
                    ? `সদস্যদের হিসাব বিবরণী ও প্রাপ্ত লভ্যাংশ (${monthName})`
                    : `Member Profit Breakdown (${monthName})`}
                </span>
              </h4>
              <span className="text-[11px] text-slate-500">
                {isBn
                  ? `মোট সদস্য: ${toBengaliNumber(items.length)}`
                  : `Total Members: ${items.length}`}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 font-bold">{isBn ? 'সদস্য' : 'Member'}</th>
                    <th className="py-2.5 px-3 font-bold text-right">{isBn ? 'মোট জমা (টাকা)' : 'Total Savings (৳)'}</th>
                    <th className="py-2.5 px-3 font-bold text-right">{isBn ? 'জমার অংশ (%)' : 'Share (%)'}</th>
                    <th className="py-2.5 px-3 font-bold text-right">{isBn ? 'গণিত হিসাব (Sum × জমা)' : 'Calculation'}</th>
                    <th className="py-2.5 px-3 font-bold text-right text-indigo-800 bg-indigo-50/50">
                      {isBn ? 'প্রাপ্ত লাভ (৳)' : 'Profit Allocated (৳)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item) => {
                    return (
                      <tr key={item.member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{item.member.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.member.memberNo}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                          {formatCurrency(item.savings, isBn && useBengaliDigits)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {isBn && useBengaliDigits
                              ? `${toBengaliNumber(item.weightPercentage.toFixed(2))}%`
                              : `${item.weightPercentage.toFixed(2)}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 text-[11px]">
                          {profitRatio > 0 && item.savings > 0 
                            ? `${profitRatio.toFixed(4)} × ${item.savings} = ${item.rawAllocated.toFixed(2)}` 
                            : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-indigo-700 bg-indigo-50/30 text-xs">
                          +{formatCurrency(item.allocatedProfit, isBn && useBengaliDigits)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isBn ? 'বণ্টন সংক্রান্ত মন্তব্য বা রেজোলিউশন নম্বর (ঐচ্ছিক)' : 'Resolution / Notes (Optional)'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: কার্যকরী কমিটির মিটিং রেজোলিউশন অনুযায়ী লভ্যাংশ বণ্টন সম্পন্ন' : 'e.g. Monthly business profit distribution'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            {isBn ? 'মোট বণ্টন করা হবে: ' : 'Total Distribution: '}
            <strong className="text-indigo-800 font-bold">
              {formatCurrency(distributableProfit, isBn && useBengaliDigits)}
            </strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              disabled={isSubmitting || totalSavings <= 0 || !!existingDistributionForMonth}
              onClick={handleExecute}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? isBn ? 'বণ্টন প্রক্রিয়াধীন...' : 'Processing...'
                  : isBn ? 'লাভ বণ্টন নিশ্চিত করুন' : 'Confirm Distribution'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
