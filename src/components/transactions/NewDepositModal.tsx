import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  ArrowDownRight, 
  CheckCircle2, 
  Calendar, 
  Phone,
  ShieldCheck,
  Layers,
  CheckSquare,
  Square,
  Info,
  Sparkles,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { calculateMemberRemainingShares } from '../../utils/shareCalculation';
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
    currentUser,
    transactions,
    shareClosures
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

  // Direct deposit amount fallback (used when member has no shares or for DPS/FDR)
  const [directAmount, setDirectAmount] = useState<number | ''>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const availableMembers = isMember && currentUser?.memberId
    ? members.filter(m => m.id === currentUser.memberId)
    : members;

  const currentMember = useMemo(() => {
    return (isMember && currentUser?.memberId)
      ? (members.find(m => m.id === currentUser.memberId) || members[0])
      : (members.find(m => m.id === memberId) || members[0]);
  }, [isMember, currentUser?.memberId, members, memberId]);

  // Calculate remaining active shares accurately
  const activeShareCount = useMemo(() => {
    if (!currentMember) return 0;
    return calculateMemberRemainingShares(currentMember, transactions, shareClosures);
  }, [currentMember, transactions, shareClosures]);

  // List of active shares: e.g. [1, 2, 3, 4] for a member with 4 shares
  const activeSharesList = useMemo(() => {
    return Array.from({ length: activeShareCount }, (_, i) => i + 1);
  }, [activeShareCount]);

  // Share Selection & Share-wise Amounts State
  const [selectedShares, setSelectedShares] = useState<number[]>([]);
  const [shareAmounts, setShareAmounts] = useState<{ [shareNo: number]: string }>({});
  const [bulkAmountInput, setBulkAmountInput] = useState<string>('500');
  const [depositMode, setDepositMode] = useState<'share_wise' | 'direct'>('share_wise');
  const [errorMsg, setErrorMsg] = useState('');

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  // Sync state when currentMember or activeSharesList changes
  useEffect(() => {
    if (activeSharesList.length > 0) {
      setSelectedShares(activeSharesList);
      setShareAmounts(prev => {
        const next: { [shareNo: number]: string } = {};
        activeSharesList.forEach(sNo => {
          next[sNo] = prev[sNo] !== undefined && prev[sNo] !== '' ? prev[sNo] : '500';
        });
        return next;
      });
      setDepositMode('share_wise');
    } else {
      setSelectedShares([]);
      setShareAmounts({});
      setDepositMode('direct');
    }
  }, [currentMember?.id, activeShareCount]);

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

  // Toggle individual share selection
  const handleToggleShare = (shareNo: number) => {
    setErrorMsg('');
    if (selectedShares.includes(shareNo)) {
      setSelectedShares(prev => prev.filter(s => s !== shareNo));
    } else {
      setSelectedShares(prev => [...prev, shareNo].sort((a, b) => a - b));
      // Ensure it has an amount
      if (!shareAmounts[shareNo] || Number(shareAmounts[shareNo]) <= 0) {
        setShareAmounts(prev => ({
          ...prev,
          [shareNo]: bulkAmountInput || '500'
        }));
      }
    }
  };

  // Select all active shares
  const handleSelectAllShares = () => {
    setErrorMsg('');
    setSelectedShares(activeSharesList);
    setShareAmounts(prev => {
      const next: { [shareNo: number]: string } = {};
      activeSharesList.forEach(sNo => {
        next[sNo] = prev[sNo] && Number(prev[sNo]) > 0 ? prev[sNo] : (bulkAmountInput || '500');
      });
      return next;
    });
  };

  // Deselect all shares
  const handleDeselectAllShares = () => {
    setErrorMsg('');
    setSelectedShares([]);
  };

  // Handle individual share amount input change
  const handleShareAmountChange = (shareNo: number, valStr: string) => {
    setErrorMsg('');
    setShareAmounts(prev => ({
      ...prev,
      [shareNo]: valStr
    }));
  };

  // Apply bulk amount to all selected shares
  const handleApplyBulkToSelected = (customVal?: string) => {
    setErrorMsg('');
    const valToApply = customVal !== undefined ? customVal : (bulkAmountInput || '0');
    if (customVal !== undefined) {
      setBulkAmountInput(customVal);
    }
    setShareAmounts(prev => {
      const next = { ...prev };
      selectedShares.forEach(sNo => {
        next[sNo] = valToApply;
      });
      return next;
    });
  };

  // Calculate total deposit amount strictly from entered amounts
  const computedShareWiseTotal = useMemo(() => {
    return selectedShares.reduce((sum, sNo) => {
      const val = Number(shareAmounts[sNo]);
      return sum + (isNaN(val) || val < 0 ? 0 : val);
    }, 0);
  }, [selectedShares, shareAmounts]);

  const effectiveTotalDeposit = (schemeType === 'general' && depositMode === 'share_wise' && activeShareCount > 0)
    ? computedShareWiseTotal
    : (directAmount === '' ? 0 : Number(directAmount));

  // Initialize or update member target when props change
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
    setErrorMsg('');

    if (!memberId) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে সদস্য নির্বাচন করুন।' : 'Please select a member.');
      return;
    }

    const isShareWise = schemeType === 'general' && depositMode === 'share_wise' && activeShareCount > 0;

    let depositAmount = 0;
    let cleanShareAmounts: { [shareNo: number]: number } | undefined = undefined;
    let unpaidShares: number[] | undefined = undefined;

    if (isShareWise) {
      if (selectedShares.length === 0) {
        setErrorMsg(isBn 
          ? 'অনুগ্রহ করে কমপক্ষে একটি সক্রিয় শেয়ার নির্বাচন করুন।' 
          : 'Please select at least one active share.');
        return;
      }

      cleanShareAmounts = {};
      for (const sNo of selectedShares) {
        const raw = shareAmounts[sNo];
        const val = Number(raw);
        if (raw === '' || isNaN(val) || val <= 0) {
          setErrorMsg(isBn
            ? `শেয়ার #${toBengaliNumber(sNo)}-এর জন্য সঠিক জমার পরিমাণ (০-এর বেশি) লিখুন।`
            : `Please enter a valid deposit amount (> 0) for Share #${sNo}.`);
          return;
        }
        cleanShareAmounts[sNo] = val;
      }

      depositAmount = selectedShares.reduce((sum, sNo) => sum + (cleanShareAmounts![sNo] || 0), 0);
      unpaidShares = activeSharesList.filter(sNo => !selectedShares.includes(sNo));
    } else {
      depositAmount = Number(directAmount);
    }

    if (!depositAmount || depositAmount <= 0) {
      setErrorMsg(isBn 
        ? 'অনুগ্রহ করে সঠিক জমার পরিমাণ উল্লেখ করুন।' 
        : 'Please enter a valid deposit amount.');
      return;
    }

    if (paymentMethod === 'bank' && !bankAccountId) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।' : 'Please select a bank account.');
      return;
    }

    // Prepare note description
    const autoNotes = isShareWise
      ? (notes.trim() || `শেয়ারভিত্তিক সঞ্চয় জমা (পরিশোধিত: ${selectedShares.map(s => `শেয়ার #${toBengaliNumber(s)} [৳${toBengaliNumber(cleanShareAmounts![s])}]`).join(', ')})`)
      : notes.trim();

    addDeposit({
      memberId,
      schemeType,
      schemeId: schemeId || undefined,
      amount: depositAmount,
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      selectedShares: isShareWise ? selectedShares : undefined,
      totalMemberShares: isShareWise ? activeShareCount : undefined,
      shareRate: isShareWise && selectedShares.length > 0 ? Math.round(depositAmount / selectedShares.length) : undefined,
      shareAmounts: cleanShareAmounts,
      unpaidShares: isShareWise && unpaidShares && unpaidShares.length > 0 ? unpaidShares : undefined,
      notes: autoNotes,
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
    <div className={`bg-white rounded-2xl ${isEmbedded ? 'border border-slate-200 shadow-2xs w-full max-w-2xl mx-auto' : 'shadow-2xl border border-slate-200 w-full max-w-2xl my-auto flex flex-col max-h-[min(94vh,calc(100dvh-2rem))]'} overflow-hidden animate-in fade-in-50 zoom-in-95`}>
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
                ? (isBn ? `সদস্য নং: #${currentMember.memberNo} • শেয়ারভিত্তিক সঞ্চয় জমা ভাউচার` : `Member #${currentMember.memberNo} • Share-wise Savings Deposit Voucher`)
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
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
            <X className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Member Selection or Dedicated Member Account */}
        {isMemberLocked && currentMember ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {isBn ? 'সদস্যের সঞ্চয় একাউন্ট' : 'Member Savings Account'}
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
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                        <Layers className="w-3 h-3" />
                        {isBn ? `সক্রিয় শেয়ার: ${displayCount(activeShareCount)}টি` : `Active Shares: ${activeShareCount}`}
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
                  {m.memberNo} - {m.name} • {m.phone} ({isBn ? `শেয়ার: ${displayCount(m.shareCount || 0)}` : `Shares: ${m.shareCount || 0}`})
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
                    <span className="ml-2 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                      {isBn ? `শেয়ার: ${displayCount(activeShareCount)}টি` : `Shares: ${activeShareCount}`}
                    </span>
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

        {/* Scheme Type Selector */}
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

          {/* If Scheme is DPS or FDR, show specific scheme account */}
          {schemeType !== 'general' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'নির্দিষ্ট স্কিম অ্যাকাউন্ট' : 'Specific Scheme Account'}
              </label>
              <select
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
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

          {/* Mode toggle if member has active shares in General Savings */}
          {schemeType === 'general' && activeShareCount > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'জমার বণ্টন পদ্ধতি' : 'Deposit Allocation Method'}
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setDepositMode('share_wise')}
                  className={`py-1.5 px-2 rounded-md font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    depositMode === 'share_wise'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isBn ? 'শেয়ারভিত্তিক জমা' : 'Share-wise Deposit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDepositMode('direct')}
                  className={`py-1.5 px-2 rounded-md font-bold transition-all text-center flex items-center justify-center gap-1 ${
                    depositMode === 'direct'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সরাসরি জমা' : 'Direct Deposit'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SHARE-WISE DEPOSIT INTERFACE: When member has active shares & general scheme */}
        {/* ========================================================================= */}
        {schemeType === 'general' && depositMode === 'share_wise' && activeShareCount > 0 ? (
          <div className="bg-emerald-50/50 border-2 border-emerald-300/80 rounded-2xl p-4 space-y-3.5 shadow-xs">
            {/* Header with Title & Quick Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <Layers className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-bold text-emerald-950">
                    {isBn ? 'শেয়ারভিত্তিক সঞ্চয় কিস্তি জমা' : 'Share-wise Savings Installment Deposit'}
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  {isBn 
                    ? `সদস্য ${currentMember?.name}-এর মোট ${displayCount(activeShareCount)}টি শেয়ার রয়েছে। যে শেয়ারগুলোতে জমা দিচ্ছেন তা নির্বাচন করুন:`
                    : `Member ${currentMember?.name} has ${activeShareCount} shares. Select the shares you are depositing for:`}
                </p>
              </div>

              {/* Selection actions */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleSelectAllShares}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition-colors cursor-pointer border border-emerald-300"
                >
                  {isBn ? 'সকল শেয়ার নির্বাচন' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllShares}
                  className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-300"
                >
                  {isBn ? 'সব বাতিল' : 'Clear'}
                </button>
              </div>
            </div>

            {/* Bulk Amount Setter Bar */}
            <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-2xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isBn ? 'প্রতি শেয়ারে সমপরিমাণ:' : 'Equal per share:'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={bulkAmountInput}
                    onChange={(e) => setBulkAmountInput(e.target.value)}
                    className="w-24 px-2 py-1 border border-emerald-300 rounded-lg font-bold text-emerald-900 bg-emerald-50/40 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    placeholder="500"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyBulkToSelected()}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold transition-all cursor-pointer shadow-xs"
                  >
                    {isBn ? 'নির্বাচিত শেয়ারে প্রয়োগ' : 'Apply to Selected'}
                  </button>
                </div>
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-slate-500 font-semibold">{isBn ? 'কুইক:' : 'Quick:'}</span>
                {['250', '500', '1000', '1500'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyBulkToSelected(preset)}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 cursor-pointer transition-colors"
                  >
                    ৳{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Active Shares Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {activeSharesList.map((shareNo) => {
                const isSelected = selectedShares.includes(shareNo);
                const currentVal = shareAmounts[shareNo] !== undefined ? shareAmounts[shareNo] : '';

                return (
                  <div
                    key={shareNo}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/10'
                        : 'bg-slate-50/80 border-slate-200 text-slate-500 opacity-75'
                    }`}
                  >
                    {/* Share Header / Selection Checkbox */}
                    <div 
                      className="flex items-center justify-between cursor-pointer select-none"
                      onClick={() => handleToggleShare(shareNo)}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center">
                            <CheckSquare className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-slate-300 bg-white flex items-center justify-center">
                            <Square className="w-4 h-4 text-slate-300" />
                          </div>
                        )}
                        <div>
                          <span className={`text-xs font-bold block ${isSelected ? 'text-emerald-950' : 'text-slate-700'}`}>
                            {isBn ? `শেয়ার #${toBengaliNumber(shareNo)}` : `Share #${shareNo}`}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {isBn ? `সক্রিয় শেয়ার নং ${toBengaliNumber(shareNo)}` : `Active Share No. ${shareNo}`}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSelected 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isSelected ? (isBn ? 'জমা হবে' : 'Active') : (isBn ? 'বকেয়া' : 'Due')}
                      </span>
                    </div>

                    {/* Deposit Amount for this Share */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-slate-700">
                        {isBn ? 'জমার পরিমাণ:' : 'Deposit Amount:'}
                      </label>
                      <div className="relative flex-1 max-w-[140px]">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">৳</span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          disabled={!isSelected}
                          value={currentVal}
                          onChange={(e) => handleShareAmountChange(shareNo, e.target.value)}
                          placeholder="0"
                          className={`w-full pl-6 pr-2 py-1 text-right border rounded-lg text-xs font-bold transition-colors ${
                            isSelected
                              ? 'border-emerald-400 bg-emerald-50/50 text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden'
                              : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Accounting Rule Clarification */}
            <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/90 text-amber-900 text-[11px] flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isBn
                  ? 'শেয়ার সংখ্যা নিজে থেকে কোনো টাকা তৈরি করবে না। প্রতিটি নির্বাচিত শেয়ারে আপনার প্রবেশকৃত প্রকৃত জমার টাকার যোগফলই সদস্যের সঞ্চয়, লেজার ও পাসবুকে জমা হবে।'
                  : 'Share count does not generate funds automatically. Only the actual entered deposit amount across selected shares will be credited to member savings, ledger, and passbook.'}
              </p>
            </div>

            {/* Prominent Live Deposit Total Banner */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-md">
              <div>
                <span className="text-[11px] text-emerald-200 uppercase font-bold block tracking-wider">
                  {isBn ? 'মোট প্রকৃত জমার পরিমাণ (Total Deposit):' : 'Total Actual Deposit Amount:'}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded-md font-bold text-emerald-100 border border-emerald-500">
                    {isBn 
                      ? `${displayCount(selectedShares.length)}টি শেয়ার নির্বাচিত` 
                      : `${selectedShares.length} shares selected`}
                  </span>
                  {activeSharesList.length > selectedShares.length && (
                    <span className="text-xs bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-md font-bold border border-amber-400/40">
                      {isBn 
                        ? `${displayCount(activeSharesList.length - selectedShares.length)}টি বকেয়া` 
                        : `${activeSharesList.length - selectedShares.length} due`}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight">
                  ৳ {formatCurrency(computedShareWiseTotal, isBn && useBengaliDigits)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* DIRECT DEPOSIT INTERFACE: When member has no shares, or DPS/FDR is chosen */
          /* ========================================================================= */
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            {activeShareCount === 0 && schemeType === 'general' && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  {isBn 
                    ? 'এই সদস্যের কোনো সক্রিয় শেয়ার নেই। সাধারণ সঞ্চয় হিসাবে সরাসরি এককালীন টাকা জমা হবে।' 
                    : 'This member has no active shares. Funds will be deposited directly to General Savings.'}
                </span>
              </div>
            )}

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
                  value={directAmount}
                  onChange={(e) => setDirectAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-xl text-emerald-800 bg-white"
                />
              </div>

              {/* Quick Amount Presets */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-slate-500 font-bold">{isBn ? 'কুইক অ্যামাউন্ট:' : 'Quick:'}</span>
                {[500, 1000, 2000, 3000, 5000].map((presetAmt) => (
                  <button
                    key={presetAmt}
                    type="button"
                    onClick={() => setDirectAmount(presetAmt)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-colors ${
                      directAmount === presetAmt
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    ৳ {presetAmt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
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
            placeholder={isBn ? "যেমন: নিয়মিত মাসিক সঞ্চয় কিস্তি জমা" : "e.g., Regular monthly savings deposit"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-slate-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-slate-500">{isBn ? 'সর্বমোট জমা:' : 'Total Deposit:'} </span>
            <span className="font-bold text-emerald-800 text-sm font-mono">
              ৳ {formatCurrency(effectiveTotalDeposit, isBn && useBengaliDigits)}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
