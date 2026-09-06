import React, { useState, useMemo } from 'react';
import { X, PieChart, Users, ArrowRight, CheckCircle2, AlertCircle, Sparkles, HelpCircle, CheckSquare } from 'lucide-react';
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
    calculateDailyWeightedDeposits,
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

  const [distributableProfit, setDistributableProfit] = useState<number>(autoSomitiProfit || 15000);
  const [creditToSavings, setCreditToSavings] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Update distributable profit when month changes if autoSomitiProfit has changed
  React.useEffect(() => {
    if (autoSomitiProfit > 0) {
      setDistributableProfit(autoSomitiProfit);
    }
  }, [autoSomitiProfit]);

  // Compute daily weighted deposits
  const { items, totalWeightedDeposit, daysInMonth } = useMemo(() => {
    return calculateDailyWeightedDeposits(selectedYear, selectedMonth);
  }, [calculateDailyWeightedDeposits, selectedYear, selectedMonth]);

  if (!isOpen) return null;

  const validMembers = items.filter(i => i.dailyWeightedDeposit > 0);

  const handleExecute = async () => {
    setErrorMsg('');

    if (distributableProfit <= 0) {
      setErrorMsg(isBn ? 'বণ্টনযোগ্য লভ্যাংশের পরিমাণ ০ এর বেশি হতে হবে' : 'Distributable profit pool must be greater than 0');
      return;
    }

    if (totalWeightedDeposit <= 0) {
      setErrorMsg(isBn ? 'এই মাসে কোনো সদস্যের সক্রিয় সঞ্চয় বা ব্যালেন্স নেই' : 'No active deposits or balances found for members in this month');
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
                {isBn ? 'মাসিক সমিতির ব্যবসায়িক লাভ বণ্টন' : 'Monthly Somiti Business Profit Distribution'}
              </h3>
              <p className="text-xs text-indigo-200">
                {isBn
                  ? 'দৈনিক ওয়েটেড ব্যালেন্স (Daily Weighted Deposit) ফর্মুলা অনুযায়ী সদস্য বণ্টন'
                  : 'Proportional member distribution based on Daily Weighted Deposit formula'}
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
          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-950">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'বণ্টন নীতি ও সূত্র (Daily Balance ভিত্তিতে):' : 'Distribution Policy & Formula (Daily Balance):'}</span>
            </div>
            <p className="text-blue-900 font-mono text-[11px] bg-white px-3 py-1.5 rounded-lg border border-blue-200 inline-block">
              {isBn
                ? 'Member Profit = (সদস্যের Monthly Weighted Deposit ÷ মোট Weighted Deposit) × মোট বণ্টনযোগ্য লাভ'
                : 'Member Profit = (Member Monthly Weighted Deposit ÷ Total Weighted Deposit) × Total Distributable Pool'}
            </p>
            <p className="text-[11px] text-blue-800">
              {isBn
                ? `* মাসের ${toBengaliNumber(daysInMonth)} দিনের প্রতি দিনের ব্যালেন্সের যোগফলই হলো সেই সদস্যের Monthly Weighted Deposit।`
                : `* The sum of every day's savings balance across the ${daysInMonth} days in this month is that member's Monthly Weighted Deposit.`}
            </p>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">
                {isBn ? 'মাসের মোট দিন' : 'Days in Month'}
              </span>
              <span className="text-sm font-bold text-slate-800">
                {isBn && useBengaliDigits ? `${toBengaliNumber(daysInMonth)} দিন` : `${daysInMonth} Days`}
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
                {isBn ? 'মোট ওয়েটেড ব্যালেন্স' : 'Total Weighted Deposit'}
              </span>
              <span className="text-sm font-bold text-slate-800 font-mono">
                {isBn && useBengaliDigits
                  ? toBengaliNumber(Math.round(totalWeightedDeposit))
                  : Math.round(totalWeightedDeposit).toLocaleString()}
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
                    <th className="py-2.5 px-3 font-bold text-right">{isBn ? 'বর্তমান সঞ্চয়' : 'Total Savings'}</th>
                    <th className="py-2.5 px-3 font-bold text-right">{isBn ? 'দৈনিক গড় ব্যালেন্স' : 'Daily Avg Balance'}</th>
                    <th className="py-2.5 px-3 font-bold text-right">{isBn ? 'ওয়েটেড ডিপোজিট' : 'Weighted Deposit'}</th>
                    <th className="py-2.5 px-3 font-bold text-right">{isBn ? 'অংশ হার (%)' : 'Share (%)'}</th>
                    <th className="py-2.5 px-3 font-bold text-right text-indigo-800 bg-indigo-50/50">
                      {isBn ? 'প্রাপ্ত লাভ (৳)' : 'Profit Received (৳)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((item) => {
                    const allocatedProfit = totalWeightedDeposit > 0 && item.dailyWeightedDeposit > 0
                      ? Math.round((item.dailyWeightedDeposit / totalWeightedDeposit) * distributableProfit)
                      : 0;

                    return (
                      <tr key={item.member.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{item.member.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.member.memberNo}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {formatCurrency(item.member.totalSavings, isBn && useBengaliDigits)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700">
                          {formatCurrency(Math.round(item.dailyAverage), isBn && useBengaliDigits)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {isBn && useBengaliDigits
                            ? toBengaliNumber(Math.round(item.dailyWeightedDeposit))
                            : Math.round(item.dailyWeightedDeposit).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                            {isBn && useBengaliDigits
                              ? `${toBengaliNumber(item.weightPercentage.toFixed(2))}%`
                              : `${item.weightPercentage.toFixed(2)}%`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-indigo-700 bg-indigo-50/30 text-xs">
                          {formatCurrency(allocatedProfit, isBn && useBengaliDigits)}
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
              placeholder={isBn ? 'যেমন: কার্যকরী কমিটির মিটিং রেজোলিউশন # ১২ অনুযায়ী বণ্টন সম্পন্ন' : 'e.g. As per Executive Committee Resolution #12'}
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
              disabled={isSubmitting || totalWeightedDeposit <= 0}
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
