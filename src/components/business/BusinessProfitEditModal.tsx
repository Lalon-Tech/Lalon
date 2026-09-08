import React, { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Building, Calendar, Users, ChevronDown, ChevronUp, PieChart, ShieldCheck } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { BusinessProfitRecord, BusinessFunding } from '../../types';
import { calculateProportionalProfit, MemberDepositSnapshotItem } from '../../utils/profitCalculation';

interface BusinessProfitEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BusinessProfitRecord | null;
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

export const BusinessProfitEditModal: React.FC<BusinessProfitEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSuccess,
}) => {
  const {
    members,
    businessFundings,
    businessProfitRecords,
    updateBusinessProfitRecord,
    getMemberSavingsBalance,
    useBengaliDigits,
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [totalProfit, setTotalProfit] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [showMemberBreakdown, setShowMemberBreakdown] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const month = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const fullDateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const handleDateChange = (dateVal: string) => {
    if (!dateVal) return;
    const parts = dateVal.split('-').map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      setSelectedYear(parts[0]);
      setSelectedMonth(parts[1]);
      setSelectedDay(parts[2]);
    }
  };

  useEffect(() => {
    if (record) {
      if (record.date) {
        const parts = record.date.split('-').map(Number);
        if (parts.length === 3) {
          setSelectedYear(parts[0]);
          setSelectedMonth(parts[1]);
          setSelectedDay(parts[2]);
        }
      } else if (record.month) {
        const parts = record.month.split('-').map(Number);
        if (parts.length === 2) {
          setSelectedYear(parts[0]);
          setSelectedMonth(parts[1]);
          setSelectedDay(1);
        }
      }
      setTotalProfit(record.somitiProfitAmount || record.totalBusinessProfit || 0);
      setNotes(record.notes || '');
      setErrorMsg('');
    }
  }, [record, isOpen]);

  const targetFunding: BusinessFunding | undefined = useMemo(() => {
    if (!record) return undefined;
    return businessFundings.find(f => f.id === record.businessFundingId || f.applicationNo === record.applicationNo);
  }, [businessFundings, record]);

  const somitiShareAmount = Number(totalProfit) || 0;
  const numTotalProfit = somitiShareAmount;

  // Compute snapshots: if record already has historical deposit snapshots, preserve or recompute
  const memberSnapshots: MemberDepositSnapshotItem[] = useMemo(() => {
    if (record?.memberDistributions && record.memberDistributions.length > 0) {
      return record.memberDistributions.map(d => ({
        memberId: d.memberId,
        memberNo: d.memberNo,
        memberName: d.memberName,
        depositAmount: d.depositSnapshot,
      }));
    }
    return members.map(m => ({
      memberId: m.id,
      memberNo: m.memberNo,
      memberName: m.name,
      depositAmount: getMemberSavingsBalance(m),
    }));
  }, [record, members, getMemberSavingsBalance]);

  // Calculate profit distribution based on members' total savings using the proportional engine
  const distributionResult = useMemo(() => {
    return calculateProportionalProfit(somitiShareAmount, memberSnapshots);
  }, [somitiShareAmount, memberSnapshots]);

  const previewItems = useMemo(() => {
    if (!somitiShareAmount || somitiShareAmount <= 0) return [];
    return distributionResult.memberShares.filter(item => item.depositSnapshot > 0 && item.allocatedProfit > 0);
  }, [distributionResult, somitiShareAmount]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');

    if (!numTotalProfit || numTotalProfit <= 0) {
      setErrorMsg(isBn ? 'লাভের সঠিক পরিমাণ লিখুন' : 'Please enter valid total profit amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBusinessProfitRecord(record.id, {
        month,
        date: fullDateStr,
        somitiProfitAmount: somitiShareAmount,
        totalBusinessProfit: somitiShareAmount,
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
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{isBn ? 'সমিতির লভ্যাংশ অংশ' : 'Somiti Profit Share'}</span>
              <span className="font-bold text-emerald-700">
                {isBn ? '১০০% অংশ (সম্পূর্ণ)' : '100% Share'}
              </span>
            </div>
          </div>

          {/* Date, Month, Year Selection & Total Profit Input */}
          <div className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  {isBn ? 'তারিখ, মাস ও সাল নির্বাচন' : 'Date, Month & Year Selection'} <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300">
                  {isBn 
                    ? `${toBengaliNumber(selectedDay)} ${BENGALI_MONTHS[selectedMonth - 1]} ${toBengaliNumber(selectedYear)}` 
                    : `${selectedDay} ${ENGLISH_MONTHS[selectedMonth - 1]} ${selectedYear}`}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* Day */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {isBn ? 'কত তারিখ (দিন)' : 'Day / Date'}
                  </label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {isBn ? `${toBengaliNumber(d)} তারিখ` : `${d}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Month */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {isBn ? 'কোন মাস' : 'Month'}
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {BENGALI_MONTHS.map((mName, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {isBn ? mName : ENGLISH_MONTHS[idx]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {isBn ? 'কোন সাল' : 'Year'}
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                      <option key={yr} value={yr}>
                        {isBn ? `${toBengaliNumber(yr)} সাল` : `${yr}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Integrated Calendar input */}
              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                <span>{isBn ? 'অথবা ক্যালেন্ডার হতে বেছে নিন:' : 'Or pick from calendar:'}</span>
                <input
                  type="date"
                  value={fullDateStr}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-2 py-1 rounded-md border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'সমিতির অর্জিত নিট লাভ (৳) *' : "Somiti's Net Profit (৳) *"}
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
              <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                {isBn ? '✓ সম্পূর্ণ টাকাই কোনো কর্তন ছাড়া সমিতির লাভ হিসেবে পুনর্বণ্টন হবে' : 'Exact amount without deduction'}
              </span>
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
                {isBn ? 'সমিতির অংশ: ' : 'Somiti Share: '}
                <span className="text-emerald-800 font-bold">১০০% (সম্পূর্ণ)</span>
              </span>
            </div>

            <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    {isBn ? 'সমিতিতে অর্জিত মোট লভ্যাংশ' : "Somiti's Profit"}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {isBn
                      ? `সম্পূর্ণ ৳${numTotalProfit} টাকা সদস্যদের মাঝে জমার অনুপাতে পুনর্বণ্টন হবে`
                      : `Full ৳${numTotalProfit} will be redistributed proportionally`}
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
                          <th className="pb-1.5 text-right">{isBn ? 'মোট জমা (৳)' : 'Total Savings'}</th>
                          <th className="pb-1.5 text-right">{isBn ? 'জমার অংশ' : 'Share'}</th>
                          <th className="pb-1.5 text-right text-emerald-700">{isBn ? 'প্রাপ্য লাভ (৳)' : 'Allocated Profit'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {previewItems.map(item => (
                          <tr key={item.memberId} className="hover:bg-slate-50">
                            <td className="py-1.5 font-bold text-slate-800">
                              {item.memberName}
                              <span className="text-[10px] text-slate-400 ml-1 font-normal">({item.memberNo})</span>
                            </td>
                            <td className="py-1.5 text-right text-slate-600 font-mono">
                              ৳{formatCurrency(item.depositSnapshot, isBn && useBengaliDigits)}
                            </td>
                            <td className="py-1.5 text-right text-indigo-600 text-[11px] font-semibold font-mono">
                              {item.weightPercentage.toFixed(2)}%
                            </td>
                            <td className="py-1.5 text-right font-bold text-emerald-700 font-mono">
                              +৳{item.allocatedProfit.toFixed(2)}
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
