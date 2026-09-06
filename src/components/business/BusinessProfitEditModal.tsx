import React, { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Building, Calendar, Users, ChevronDown, ChevronUp, PieChart, ShieldCheck } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { BusinessProfitRecord, BusinessFunding } from '../../types';

interface BusinessProfitEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BusinessProfitRecord | null;
  onSuccess?: () => void;
}

export const BusinessProfitEditModal: React.FC<BusinessProfitEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
}) => {
  const {
    businessFundings,
    updateBusinessProfitRecord,
    calculateDailyWeightedDeposits,
    useBengaliDigits,
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [month, setMonth] = useState<string>('');
  const [totalProfit, setTotalProfit] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [showMemberBreakdown, setShowMemberBreakdown] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (record) {
      setMonth(record.month || new Date().toISOString().slice(0, 7));
      setTotalProfit(record.totalBusinessProfit || 0);
      setNotes(record.notes || '');
      setErrorMsg('');
    }
  }, [record, isOpen]);

  const targetFunding: BusinessFunding | undefined = useMemo(() => {
    if (!record) return undefined;
    return businessFundings.find(f => f.id === record.businessFundingId || f.applicationNo === record.applicationNo);
  }, [businessFundings, record]);

  const memberPct = targetFunding?.memberProfitSharePercent !== undefined ? targetFunding.memberProfitSharePercent : (record?.memberProfitPercent ?? 50);
  const somitiPct = targetFunding?.somitiProfitSharePercent !== undefined ? targetFunding.somitiProfitSharePercent : (record?.somitiProfitPercent ?? 50);

  const numTotalProfit = Number(totalProfit) || 0;
  const memberShareAmount = Math.round(numTotalProfit * (memberPct / 100));
  const somitiShareAmount = numTotalProfit - memberShareAmount;

  // Calculate weighted deposit distribution preview for selected month
  const { items, totalWeightedDeposit } = useMemo(() => {
    if (!month) return { items: [], totalWeightedDeposit: 0 };
    const [yStr, mStr] = month.split('-');
    const y = parseInt(yStr, 10) || new Date().getFullYear();
    const m = parseInt(mStr, 10) || (new Date().getMonth() + 1);
    return calculateDailyWeightedDeposits(y, m);
  }, [month, calculateDailyWeightedDeposits]);

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

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!numTotalProfit || numTotalProfit <= 0) {
      setErrorMsg(isBn ? 'লাভের সঠিক পরিমাণ লিখুন' : 'Please enter valid total profit amount');
      return;
    }

    if (!month) {
      setErrorMsg(isBn ? 'লাভের মাস নির্বাচন করুন' : 'Please select a month');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBusinessProfitRecord(record.id, {
        month,
        totalBusinessProfit: numTotalProfit,
        notes: notes.trim(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isBn ? 'লাভ হালনাগাদ করতে ব্যর্থ হয়েছে' : 'Failed to update profit record'));
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
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>{isBn ? 'ব্যবসায়িক লভ্যাংশ তথ্য সম্পাদন (Edit)' : 'Edit Business Profit Record'}</span>
                <span className="text-xs font-mono font-normal bg-white/20 px-2 py-0.5 rounded-md">
                  #{record.applicationNo}
                </span>
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                {record.memberName} • {targetFunding?.businessName || (isBn ? 'ব্যবসা' : 'Business')}
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

          {/* Business Info Overview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{isBn ? 'সদস্য ও ব্যবসা' : 'Member & Business'}</span>
              <span className="font-bold text-slate-800">{record.memberName}</span>
              <span className="text-slate-500 ml-1.5">({targetFunding?.businessName || 'Business'})</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{isBn ? 'সমিতির লভ্যাংশ চুক্তি' : 'Somiti Profit Share'}</span>
              <span className="font-bold text-emerald-700">
                {isBn ? `${toBengaliNumber(somitiPct)}% অংশ` : `${somitiPct}% Share`}
              </span>
            </div>
          </div>

          {/* Month & Total Profit Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'লাভের মাস (Month) *' : 'Profit Month *'}
              </label>
              <input
                type="month"
                value={month}
                onChange={e => setMonth(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'এই মাসে ব্যবসার অর্জিত মোট লাভ (৳) *' : 'Total Business Profit in Month (৳) *'}
              </label>
              <input
                type="number"
                value={totalProfit}
                onChange={e => setTotalProfit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1000"
                min="1"
                step="100"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Automatic Distribution Breakdown Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-700" />
                {isBn ? 'সমিতির লভ্যাংশ হিসাব ও পুনর্বণ্টন' : 'Somiti Profit Calculation & Redistribution'}
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                {isBn ? 'মোট লাভ: ' : 'Total: '}
                <span className="text-slate-900 font-bold">{formatCurrency(numTotalProfit, isBn && useBengaliDigits)}</span>
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    {isBn ? `সমিতির অর্জিত লভ্যাংশ (${toBengaliNumber(somitiPct)}%)` : `Somiti Profit Share (${somitiPct}%)`}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isBn
                      ? `মোট লাভ (৳${numTotalProfit}) এর ${toBengaliNumber(somitiPct)}% সমিতিতে জমা হবে`
                      : `${somitiPct}% of total profit (৳${numTotalProfit}) credited to Somiti`}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl font-black text-emerald-700">
                    +{formatCurrency(somitiShareAmount, isBn && useBengaliDigits)}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    {isBn ? 'সদস্যদের প্রোফাইলে সঞ্চয়ে সমন্বয় হবে' : 'Adjusted in members savings profile'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Member Preview Breakdown Accordion */}
          {somitiShareAmount > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setShowMemberBreakdown(!showMemberBreakdown)}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-slate-800">
                    {isBn ? 'সদস্যদের প্রোফাইলে পুনর্বণ্টন প্রিভিউ' : 'Member Redistribution Preview'}
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {isBn ? `${toBengaliNumber(previewItems.length)} জন সদস্য` : `${previewItems.length} Members`}
                  </span>
                </div>
                {showMemberBreakdown ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {showMemberBreakdown && (
                <div className="p-3 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {previewItems.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      {isBn ? 'এই মাসে কোনো সদস্যের জমার হিসেব পাওয়া যায়নি।' : 'No eligible member deposits found for this month.'}
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[10px] font-bold uppercase text-slate-400">
                          <th className="pb-1.5">{isBn ? 'সদস্য' : 'Member'}</th>
                          <th className="pb-1.5 text-right">{isBn ? 'জমার গড়/স্থিতি' : 'Deposit Weight'}</th>
                          <th className="pb-1.5 text-right text-emerald-700">{isBn ? 'প্রাপ্য লাভ (৳)' : 'Dividend'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {previewItems.map(item => (
                          <tr key={item.member.id} className="hover:bg-slate-50">
                            <td className="py-1.5 font-bold text-slate-800">
                              {item.member.name}
                              <span className="text-[10px] text-slate-400 ml-1 font-normal">({item.member.memberNo})</span>
                            </td>
                            <td className="py-1.5 text-right text-slate-600">
                              {formatCurrency(item.dailyWeightedDeposit > 0 ? item.dailyWeightedDeposit : (item.member.totalSavings || 0), isBn && useBengaliDigits)}
                            </td>
                            <td className="py-1.5 text-right font-bold text-emerald-700">
                              +{formatCurrency(item.allocated, isBn && useBengaliDigits)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'নোট / মন্তব্য' : 'Notes / Remarks'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder={isBn ? 'লভ্যাংশ বা ব্যবসা বিষয়ক কোনো নোট...' : 'Notes regarding this profit record...'}
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
                  <span>{isBn ? 'সংরক্ষণ করুন (Update Profit)' : 'Update Profit'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
