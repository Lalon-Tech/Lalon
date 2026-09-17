import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownRight, 
  CheckCircle2, 
  Calendar, 
  Phone,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

interface NewDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId?: string;
  lockMember?: boolean;
  isEmbedded?: boolean;
}

const BENGALI_MONTHS = [
  { value: '01', nameBn: 'জানুয়ারি', nameEn: 'January' },
  { value: '02', nameBn: 'ফেব্রুয়ারি', nameEn: 'February' },
  { value: '03', nameBn: 'মার্চ', nameEn: 'March' },
  { value: '04', nameBn: 'এপ্রিল', nameEn: 'April' },
  { value: '05', nameBn: 'মে', nameEn: 'May' },
  { value: '06', nameBn: 'জুন', nameEn: 'June' },
  { value: '07', nameBn: 'জুলাই', nameEn: 'July' },
  { value: '08', nameBn: 'আগস্ট', nameEn: 'August' },
  { value: '09', nameBn: 'সেপ্টেম্বর', nameEn: 'September' },
  { value: '10', nameBn: 'অক্টোবর', nameEn: 'October' },
  { value: '11', nameBn: 'নভেম্বর', nameEn: 'November' },
  { value: '12', nameBn: 'ডিসেম্বর', nameEn: 'December' },
];

const GENERATED_YEARS = Array.from({ length: 51 }, (_, i) => 2000 + i); // 2000 to 2050

export const NewDepositModal: React.FC<NewDepositModalProps> = ({ 
  isOpen, 
  onClose,
  initialMemberId,
  lockMember,
  isEmbedded = false
}) => {
  useModalScrollLock(!isEmbedded && isOpen);
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    bankAccounts, 
    addDeposit, 
    savingsSchemes, 
    useBengaliDigits,
    selectedMemberId,
    currentUser
  } = useSomiti();

  const isMember = currentUser?.role === 'member';

  const isMemberLocked = isMember ? true : (lockMember !== undefined 
    ? lockMember 
    : Boolean(initialMemberId || (selectedMemberId && !isEmbedded)));

  const effectiveTargetId = (isMember && currentUser?.memberId)
    ? currentUser.memberId
    : (initialMemberId && members.some(m => m.id === initialMemberId))
      ? initialMemberId
      : (selectedMemberId && members.some(m => m.id === selectedMemberId))
        ? selectedMemberId
        : (members[0]?.id || '');

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentMonthStr = () => String(new Date().getMonth() + 1).padStart(2, '0');
  const getCurrentYearNum = () => new Date().getFullYear();

  const [selectedId, setSelectedId] = useState(effectiveTargetId);
  const memberId = (isMember && currentUser?.memberId)
    ? currentUser.memberId
    : (isMemberLocked ? effectiveTargetId : (selectedId || effectiveTargetId));
  const setMemberId = setSelectedId;

  const [schemeType, setSchemeType] = useState<'general' | 'dps' | 'fdr'>('general');
  const [schemeId, setSchemeId] = useState('');

  // Date, Month & Year Selection
  const [depositDate, setDepositDate] = useState<string>(getTodayDate());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYearNum());

  // Deposit Amount and Payment Method - only deposit amount is entered
  const [amount, setAmount] = useState<number | ''>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const availableMembers = isMember && currentUser?.memberId
    ? members.filter(m => m.id === currentUser.memberId)
    : members;

  const currentMember = (isMember && currentUser?.memberId)
    ? (members.find(m => m.id === currentUser.memberId) || members[0])
    : (members.find(m => m.id === memberId) || members[0]);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  // Get Month Name
  const getMonthName = (monthVal: string) => {
    const m = BENGALI_MONTHS.find(b => b.value === monthVal);
    if (!m) return monthVal;
    return isBn ? m.nameBn : m.nameEn;
  };

  const getBillingPeriodStr = () => {
    const mName = getMonthName(selectedMonth);
    const yStr = displayCount(selectedYear);
    return `${mName} ${yStr}`;
  };

  // Sync Month/Year when Date changes
  const handleDateChange = (newDate: string) => {
    setDepositDate(newDate);
    if (newDate) {
      const parts = newDate.split('-');
      if (parts.length === 3) {
        setSelectedYear(Number(parts[0]));
        setSelectedMonth(parts[1]);
      }
    }
  };

  const handleSetToday = () => {
    const today = getTodayDate();
    handleDateChange(today);
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yest = d.toISOString().split('T')[0];
    handleDateChange(yest);
  };

  // Initialize or update state when member or modal opens
  useEffect(() => {
    if (isMember && currentUser?.memberId) {
      setSelectedId(currentUser.memberId);
      return;
    }
    const targetId = initialMemberId || selectedMemberId;
    if (targetId && members.some(m => m.id === targetId)) {
      setSelectedId(targetId);
    }
  }, [isOpen, initialMemberId, selectedMemberId, members, isMember, currentUser?.memberId]);

  if (!isOpen) return null;

  const memberSchemes = savingsSchemes.filter(s => s.memberId === memberId && s.status === 'running');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      alert(isBn ? 'অনুগ্রহ করে সদস্য নির্বাচন করুন।' : 'Please select a member.');
      return;
    }

    const depositAmount = Number(amount);
    if (!depositAmount || depositAmount <= 0) {
      alert(isBn 
        ? 'অনুগ্রহ করে সঠিক জমার পরিমাণ উল্লেখ করুন।' 
        : 'Please enter a valid deposit amount.');
      return;
    }

    addDeposit({
      memberId,
      schemeType,
      schemeId: schemeId || undefined,
      amount: depositAmount,
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      notes: notes.trim(),
      date: depositDate,
      depositMonth: selectedMonth,
      depositYear: selectedYear,
      billingPeriod: getBillingPeriodStr(),
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    onClose();
  };

  const modalContent = (
    <div className={`bg-white rounded-2xl ${isEmbedded ? 'border border-slate-200 shadow-2xs w-full max-w-2xl mx-auto' : 'shadow-2xl border border-slate-200 w-full max-w-xl my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))]'} overflow-hidden animate-in fade-in-50 zoom-in-95`}>
      {/* Header */}
      <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-600 rounded-lg shadow-inner">
            <ArrowDownRight className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold">
              {isMemberLocked && currentMember
                ? (isBn ? `${currentMember.name}-এর সঞ্চয় জমা` : `Deposit to ${currentMember.name}'s Account`)
                : (isBn ? 'টাকা জমা (সঞ্চয় ডিপোজিট)' : 'Deposit Money (Savings)')}
            </h3>
            <p className="text-xs text-emerald-100">
              {isMemberLocked && currentMember
                ? (isBn ? `সদস্য নং: #${currentMember.memberNo} • সঞ্চয় একাউন্টে জমা ভাউচার` : `Member #${currentMember.memberNo} • Savings Deposit Voucher`)
                : (isBn ? 'সদস্যের সঞ্চয় হিসাবে টাকা জমার ভাউচার' : 'Member Savings Deposit Voucher')}
            </p>
          </div>
        </div>
        <button 
          type="button" 
          onClick={onClose} 
          className="p-1 rounded-lg text-emerald-200 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className={`p-5 space-y-4 ${isEmbedded ? '' : 'overflow-y-auto flex-1 min-h-0'}`}>
        {/* Member Selection or Dedicated Member Account */}
        {isMemberLocked && currentMember ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {isBn ? 'সদস্যের নিজস্ব সঞ্চয় একাউন্ট' : 'Member Savings Account'}
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {isBn ? 'নির্দিষ্ট একাউন্ট' : 'Locked Account'}
              </span>
            </div>

            {/* Dedicated Member Identity Card */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200">
                    {currentMember.photoUrl ? (
                      <img src={currentMember.photoUrl} alt={currentMember.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{currentMember.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 truncate">
                        {currentMember.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                        #{currentMember.memberNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {currentMember.phone || (isBn ? 'মোবাইল নেই' : 'No phone')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">
                    {isBn ? 'মোট সঞ্চয় স্থিতি' : 'Total Savings'}
                  </span>
                  <span className="text-sm font-black text-emerald-700 font-mono">
                    {formatCurrency(currentMember.totalSavings || 0, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'সদস্য নির্বাচন করুন' : 'Select Member'} <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
            >
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {m.name} • {m.phone}
                </option>
              ))}
            </select>

            {/* Preview of selected member */}
            {currentMember && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                    {currentMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">{currentMember.name}</span>
                    <span className="text-slate-500 ml-1.5">(#{currentMember.memberNo})</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 mr-1.5">{isBn ? 'সঞ্চয় স্থিতি:' : 'Savings:'}</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {formatCurrency(currentMember.totalSavings || 0, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date, Month & Year Selection Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'জমার তারিখ ও কিস্তির মাস/বছর' : 'Deposit Date & Installment Period'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2 py-0.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                {isBn ? 'আজ' : 'Today'}
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="px-2 py-0.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded text-[11px] font-bold cursor-pointer transition-colors"
              >
                {isBn ? 'গতকাল' : 'Yesterday'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Actual Deposit Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isBn ? 'জমার প্রকৃত তারিখ' : 'Deposit Date'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={depositDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                {isBn ? 'কিস্তির মাস (Month)' : 'Installment Month'}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer"
              >
                {BENGALI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {isBn ? m.nameBn : m.nameEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  {isBn ? 'কিস্তির বছর (Year)' : 'Installment Year'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const cy = new Date().getFullYear();
                    setSelectedYear(cy);
                  }}
                  className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  {isBn ? 'চলতি বছর' : 'Current'}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1990}
                  max={2100}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white text-center"
                  placeholder="YYYY"
                />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="flex-1 min-w-0 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer truncate"
                >
                  {GENERATED_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {displayCount(y)} {y === new Date().getFullYear() ? `(${isBn ? 'চলতি' : 'Current'})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Scheme & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'জমার খাত / স্কিম' : 'Deposit Head / Scheme'}
            </label>
            <select
              value={schemeType}
              onChange={(e) => setSchemeType(e.target.value as 'general' | 'dps' | 'fdr')}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer font-medium"
            >
              <option value="general">{isBn ? 'সাধারণ সঞ্চয় (General Savings)' : 'General Savings'}</option>
              <option value="dps">{isBn ? 'মাসিক ডিপিএস (DPS)' : 'Monthly DPS'}</option>
              <option value="fdr">{isBn ? 'স্থায়ী আমানত (FDR)' : 'Fixed Deposit (FDR)'}</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                {isBn ? 'জমার পরিমাণ (৳)' : 'Deposit Amount (৳)'} <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                required
                min={1}
                step="any"
                placeholder={isBn ? "টাকার পরিমাণ লিখুন" : "Enter deposit amount"}
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-lg text-emerald-800 bg-emerald-50/40"
              />
            </div>
            {/* Quick Amount Presets */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-bold">{isBn ? 'কুইক অ্যামাউন্ট:' : 'Quick:'}</span>
              {[500, 1000, 2000, 3000, 5000].map((presetAmt) => (
                <button
                  key={presetAmt}
                  type="button"
                  onClick={() => setAmount(presetAmt)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    amount === presetAmt
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  ৳ {presetAmt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {schemeType !== 'general' && memberSchemes.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'নির্দিষ্ট স্কিম অ্যাকাউন্ট' : 'Specific Scheme Account'}
            </label>
            <select
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
            >
              <option value="">{isBn ? 'স্বয়ংক্রিয় স্কিম নির্বাচন' : 'Auto Scheme Selection'}</option>
              {memberSchemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.accountNo} - {s.schemeName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Method */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'লেনদেনের মাধ্যম' : 'Payment Method'}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
            >
              <option value="cash">{isBn ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
              <option value="bank">{isBn ? 'ব্যাংক ট্রান্সফার (Bank)' : 'Bank Transfer'}</option>
              <option value="bkash">{isBn ? 'বিকাশ (bKash)' : 'bKash'}</option>
              <option value="nagad">{isBn ? 'নগদ (Nagad)' : 'Nagad'}</option>
            </select>
          </div>

          {paymentMethod === 'bank' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'সমিতির ব্যাংক হিসাব' : 'Society Bank Account'}
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isBn ? 'মন্তব্য / রসিদ বিবরণ (ঐচ্ছিক)' : 'Notes / Receipt Narration (Optional)'}
          </label>
          <input
            type="text"
            placeholder={isBn ? "যেমন: নিয়মিত মাসিক সঞ্চয় জমা" : "e.g., Regular monthly savings deposit"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isBn ? 'জমা নিশ্চিত করুন ও রসিদ তৈরি করুন ✓' : 'Confirm Deposit & Generate Receipt ✓'}</span>
          </button>
        </div>
      </form>
    </div>
  );

  if (isEmbedded) {
    return modalContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-start sm:items-center justify-center animate-fadeIn py-6 sm:py-10">
      {modalContent}
    </div>
  );
};
