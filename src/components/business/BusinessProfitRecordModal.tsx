import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Building,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { BusinessFunding } from '../../types';
import { calculateProportionalProfit, MemberDepositSnapshotItem } from '../../utils/profitCalculation';

interface BusinessProfitRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  presetFundingId?: string;
  presetMemberId?: string;
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

export const BusinessProfitRecordModal: React.FC<BusinessProfitRecordModalProps> = ({
  isOpen,
  onClose,
  presetFundingId,
  presetMemberId,
  onSuccess,
}) => {
  const { 
    members,
    businessFundings, 
    businessProfitRecords,
    recordBusinessProfit, 
    getMemberSavingsBalance,
    useBengaliDigits 
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Active or approved fundings
  const activeFundings = businessFundings.filter(f => f.status === 'active' || f.status === 'approved');

  // Provider mode: member or business_funding
  const [providerMode, setProviderMode] = useState<'member' | 'funding'>(
    presetFundingId ? 'funding' : 'member'
  );
  
  // Selected Member Provider
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    presetMemberId || (members[0]?.id || '')
  );

  // Selected Funding Provider
  const [selectedFundingId, setSelectedFundingId] = useState<string>(
    presetFundingId || (activeFundings[0]?.id || '')
  );

  // Pool Selection: 'all_members' or 'test_trio' (Lalon, Milon, Kamrul)
  const [distributionPoolType, setDistributionPoolType] = useState<'all_members' | 'test_trio'>('all_members');

  // Date selection state (Day, Month, Year)
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [profitInput, setProfitInput] = useState<number | ''>(1000);
  const [distributeSomitiProfitNow, setDistributeSomitiProfitNow] = useState<boolean>(true);
  const [showMemberBreakdown, setShowMemberBreakdown] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const submittingRef = useRef<boolean>(false);

  useEffect(() => {
    if (presetFundingId) {
      setProviderMode('funding');
      setSelectedFundingId(presetFundingId);
    } else if (presetMemberId) {
      setProviderMode('member');
      setSelectedMemberId(presetMemberId);
    }
  }, [presetFundingId, presetMemberId, isOpen]);

  // Synchronized month key (YYYY-MM) and full ISO date (YYYY-MM-DD)
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

  const somitiShareAmount = Number(profitInput) || 0;

  // Selected Provider Details
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const targetFunding: BusinessFunding | undefined = activeFundings.find(
    f => f.id === selectedFundingId
  );

  // Eligible Member Snapshots for distribution
  const targetMembersList = useMemo(() => {
    if (distributionPoolType === 'test_trio') {
      // Prioritize members named Lalon, Milon, Kamrul if present, or provide fixed trio representation
      const trio = members.filter(m => 
        ['kamrul', 'কামরুল', 'lalon', 'লালন', 'milon', 'মিলন'].some(name => 
          m.name.toLowerCase().includes(name) || m.id.toLowerCase().includes(name)
        )
      );
      if (trio.length >= 3) return trio;
    }
    return members;
  }, [members, distributionPoolType]);

  const memberSnapshots: MemberDepositSnapshotItem[] = useMemo(() => {
    return targetMembersList.map(m => ({
      memberId: m.id,
      memberNo: m.memberNo,
      memberName: m.name,
      depositAmount: getMemberSavingsBalance(m),
    }));
  }, [targetMembersList, getMemberSavingsBalance]);

  // Pure Proportional Distribution Result from mathematical engine
  const distributionResult = useMemo(() => {
    return calculateProportionalProfit(somitiShareAmount, memberSnapshots);
  }, [somitiShareAmount, memberSnapshots]);

  // Rapid identical submission check (same provider, same date, same amount)
  const rapidDuplicateCheck = useMemo(() => {
    const providerIdToCheck = providerMode === 'funding' && targetFunding 
      ? targetFunding.id 
      : selectedMemberId;

    return businessProfitRecords.find(r => 
      (r.businessFundingId === providerIdToCheck || r.memberId === providerIdToCheck) &&
      r.date === fullDateStr &&
      Number(r.somitiProfitAmount) === somitiShareAmount
    );
  }, [businessProfitRecords, providerMode, targetFunding, selectedMemberId, fullDateStr, somitiShareAmount]);

  // Existing records from other members in this same month (allowed & supported)
  const otherMembersRecordsInMonth = useMemo(() => {
    const currentProvId = providerMode === 'funding' && targetFunding 
      ? targetFunding.id 
      : selectedMemberId;

    return businessProfitRecords.filter(r => 
      r.month === month && 
      r.memberId !== currentProvId && 
      r.businessFundingId !== currentProvId
    );
  }, [businessProfitRecords, providerMode, targetFunding, selectedMemberId, month]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submittingRef.current) return;
    setErrorMsg('');

    if (somitiShareAmount <= 0) {
      setErrorMsg(isBn ? 'লাভের পরিমাণ ০ এর বেশি হতে হবে' : 'Profit amount must be greater than 0');
      return;
    }

    if (providerMode === 'funding' && !targetFunding) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে ব্যবসা ফান্ডিং নির্বাচন করুন' : 'Please select business funding');
      return;
    }

    if (providerMode === 'member' && !selectedMember) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে লাভ প্রদানকারী সদস্য নির্বাচন করুন' : 'Please select profit contributing member');
      return;
    }

    if (distributionResult.totalDeposit <= 0) {
      setErrorMsg(isBn ? 'সদস্যদের কোনো সক্রিয় সঞ্চয়/জমা পাওয়া যায়নি।' : 'No active member deposits found to distribute profit.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (providerMode === 'funding' && targetFunding) {
        await recordBusinessProfit({
          businessFundingId: targetFunding.id,
          memberId: targetFunding.memberId,
          memberName: targetFunding.memberName,
          applicationNo: targetFunding.applicationNo,
          month,
          date: fullDateStr,
          somitiProfitAmount: somitiShareAmount,
          totalBusinessProfit: somitiShareAmount,
          notes: notes.trim(),
          distributeSomitiProfitNow,
        });
      } else if (selectedMember) {
        await recordBusinessProfit({
          memberId: selectedMember.id,
          memberName: selectedMember.name,
          applicationNo: selectedMember.memberNo,
          month,
          date: fullDateStr,
          somitiProfitAmount: somitiShareAmount,
          totalBusinessProfit: somitiShareAmount,
          notes: notes.trim(),
          distributeSomitiProfitNow,
        });
      }

      setIsSubmitting(false);
      submittingRef.current = false;
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isBn ? 'লাভ এন্ট্রি করতে ত্রুটি হয়েছে' : 'Failed to record profit'));
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const monthLabel = isBn && selectedMonth >= 1 && selectedMonth <= 12
    ? `${BENGALI_MONTHS[selectedMonth - 1]} ${toBengaliNumber(selectedYear)}`
    : `${ENGLISH_MONTHS[selectedMonth - 1]} ${selectedYear}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/15">
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isBn ? 'ব্যবসায়িক লভ্যাংশ এন্ট্রি ও আনুপাতিক বণ্টন' : 'Business Profit Entry & Proportional Distribution'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isBn
                  ? 'সদস্যের অর্জিত লাভ সকল সদস্যের মোট জমার আনুপাতিক হারে ১০০% নিখুঁত বণ্টন'
                  : 'Proportionally distribute profit among all members based on deposit balances'}
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

          {/* Provider Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                {isBn ? '১. লাভ প্রদানকারী / উদ্যোক্তা নির্বাচন' : '1. Select Profit Contributor / Entrepreneur'} <span className="text-rose-500">*</span>
              </label>

              {activeFundings.length > 0 && !presetFundingId && (
                <div className="flex items-center gap-1 text-[11px] bg-slate-100 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setProviderMode('member')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      providerMode === 'member' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    {isBn ? 'সদস্য তালিকা' : 'Member List'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProviderMode('funding')}
                    className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                      providerMode === 'funding' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
                    }`}
                  >
                    {isBn ? 'ব্যবসা ফান্ডিং' : 'Business Funding'}
                  </button>
                </div>
              )}
            </div>

            {providerMode === 'member' ? (
              <div>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {members.map((m) => {
                    const balance = getMemberSavingsBalance(m);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberNo}) — {isBn ? 'বর্তমান মোট জমা: ' : 'Current Deposit: '}
                        ৳{formatCurrency(balance, isBn && useBengaliDigits)}
                      </option>
                    );
                  })}
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {isBn
                    ? '✓ এই সদস্য সমিতি থেকে বা ব্যবসার মাধ্যমে লাভ অর্জন করে জমা দিচ্ছেন'
                    : 'This member contributed/generated the profit amount'}
                </span>
              </div>
            ) : (
              <div>
                <select
                  value={selectedFundingId}
                  onChange={(e) => setSelectedFundingId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {activeFundings.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.businessName} ({f.memberName} - {f.memberNo}) | {isBn ? 'বিনিয়োগ: ' : 'Funding: '}
                      ৳{formatCurrency(f.approvedAmount, isBn && useBengaliDigits)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date, Month, Year Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? '২. তারিখ, মাস ও সাল নির্বাচন' : '2. Date, Month & Year Selection'}</span> <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                {monthLabel}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Day */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  {isBn ? 'তারিখ (দিন)' : 'Day'}
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

            {/* Quick Calendar Picker */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-600">
              <span>{isBn ? 'অথবা ক্যালেন্ডার থেকে সরাসরি পছন্দ করুন:' : 'Or pick date directly:'}</span>
              <input
                type="date"
                value={fullDateStr}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-2.5 py-1 rounded-md border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              />
            </div>
          </div>

          {/* Profit Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isBn ? '৩. সমিতির অর্জিত মোট লাভ (৳)' : '3. Total Profit Amount (৳)'} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                placeholder={isBn ? '১০০০' : '1000'}
                value={profitInput}
                onChange={(e) => setProfitInput(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
              {isBn 
                ? '✓ ইনপুটকৃত সম্পূর্ণ লাভ সমিতির সদস্যদের জমার আনুপাতিক হারে (Profit Ratio) বণ্টন হবে' 
                : 'Full amount will be proportionally distributed based on member deposit balances'}
            </span>
          </div>

          {/* Formula & Live Distribution Math Preview */}
          <div className="p-4 bg-emerald-50/90 rounded-xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isBn ? 'আনুপাতিক লভ্যাংশ বণ্টন সূত্র ও হিসাব:' : 'Distribution Math & Formula:'}</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                {isBn ? '১০০% নিখুঁত বণ্টন' : 'Exact Sum Guarantee'}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-mono text-emerald-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span>
                  <strong>Profit Ratio</strong> = Profit Amount ÷ Total Deposit
                </span>
                <span className="font-bold text-emerald-700">
                  {formatCurrency(somitiShareAmount, false)} ÷ {formatCurrency(distributionResult.totalDeposit, false)} = {distributionResult.profitRatio.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700 text-[11px]">
                <span>Member Profit = Profit Ratio × Member Deposit</span>
                <span className="font-bold text-slate-900">
                  Total Distributed = ৳{distributionResult.totalDistributed.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Members Real-Time Preview Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isBn ? 'সদস্যদের লভ্যাংশ বণ্টন বিবরণী' : 'Member Distribution Preview'} ({distributionResult.memberShares.length} জন)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowMemberBreakdown(!showMemberBreakdown)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{showMemberBreakdown ? (isBn ? 'সংক্ষেপ করুন' : 'Collapse') : (isBn ? 'বিস্তারিত দেখুন' : 'Expand')}</span>
                  {showMemberBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showMemberBreakdown && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-200 bg-white shadow-2xs text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-3 font-bold">{isBn ? 'সদস্য' : 'Member'}</th>
                        <th className="py-2 px-3 font-bold text-right">{isBn ? 'বর্তমান জমা' : 'Deposit'}</th>
                        <th className="py-2 px-3 font-bold text-right">{isBn ? 'অনুপাত (%)' : 'Ratio %'}</th>
                        <th className="py-2 px-3 font-bold text-right text-emerald-700">{isBn ? 'বণ্টনকৃত লাভ' : 'Allocated Profit'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {distributionResult.memberShares.map((share) => (
                        <tr key={share.memberId} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3">
                            <span className="font-bold text-slate-800 block">{share.memberName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{share.memberNo}</span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700">
                            ৳{formatCurrency(share.depositSnapshot, isBn && useBengaliDigits)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500 font-mono text-[11px]">
                            {share.weightPercentage.toFixed(2)}%
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700 font-mono">
                            +৳{share.allocatedProfit.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-emerald-50/80 font-bold border-t border-emerald-200">
                      <tr>
                        <td className="py-2 px-3 text-emerald-950">{isBn ? 'সর্বমোট' : 'Total'}</td>
                        <td className="py-2 px-3 text-right text-slate-900">
                          ৳{formatCurrency(distributionResult.totalDeposit, isBn && useBengaliDigits)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700">100.00%</td>
                        <td className="py-2 px-3 text-right text-emerald-800 text-sm font-black">
                          ৳{distributionResult.totalDistributed.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Rapid Duplicate Warning */}
          {rapidDuplicateCheck && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 text-xs text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isBn 
                  ? `সতর্কতা: ${fullDateStr} তারিখে এই সদস্যের জন্য হুবহু ৳${formatCurrency(somitiShareAmount, isBn && useBengaliDigits)} লাভ ইতোমধ্যে রেকর্ড করা আছে। দ্বিতীয়বার ক্লিক করবেন না।`
                  : 'Warning: An identical profit record already exists for this member on this date.'}
              </span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isBn ? 'মন্তব্য বা নোট (ঐচ্ছিক)' : 'Notes / Remarks (Optional)'}
            </label>
            <input
              type="text"
              placeholder={isBn ? 'যেমন: কামরুল কর্তৃক অর্জিত ব্যবসা লভ্যাংশ বণ্টন' : 'e.g. Profit generated and distributed proportionally'}
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
              disabled={isSubmitting || somitiShareAmount <= 0 || distributionResult.totalDeposit <= 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
