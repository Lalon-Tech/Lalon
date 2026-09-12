import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownRight, 
  CheckCircle2, 
  Layers, 
  CheckSquare, 
  Square, 
  Clock, 
  Info, 
  Coins, 
  Sparkles,
  Calculator,
  UserCheck,
  Calendar,
  Settings2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, formatBengaliNumber, toBengaliNumber } from '../../utils/bengaliUtils';

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
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    bankAccounts, 
    addDeposit, 
    updateMember,
    savingsSchemes,
    settings, 
    useBengaliDigits,
    selectedMemberId
  } = useSomiti();

  const isMemberLocked = lockMember !== undefined 
    ? lockMember 
    : Boolean(initialMemberId || (selectedMemberId && !isEmbedded));

  const effectiveTargetId = (initialMemberId && members.some(m => m.id === initialMemberId))
    ? initialMemberId
    : (selectedMemberId && members.some(m => m.id === selectedMemberId))
      ? selectedMemberId
      : (members[0]?.id || '');

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getCurrentMonthStr = () => String(new Date().getMonth() + 1).padStart(2, '0');
  const getCurrentYearNum = () => new Date().getFullYear();

  const [selectedId, setSelectedId] = useState(effectiveTargetId);
  const memberId = isMemberLocked ? effectiveTargetId : (selectedId || effectiveTargetId);
  const setMemberId = setSelectedId;
  const [schemeType, setSchemeType] = useState<'general' | 'dps' | 'fdr'>('general');
  const [schemeId, setSchemeId] = useState('');
  const [depositMode, setDepositMode] = useState<'share_wise' | 'custom'>('share_wise');

  // Date, Month & Year Selection
  const [depositDate, setDepositDate] = useState<string>(getTodayDate());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYearNum());

  // Share Rate and Per-Share amounts
  const [bulkRate, setBulkRate] = useState<number>(1000);
  const [shareAmounts, setShareAmounts] = useState<{ [shareNo: number]: number }>({});
  const [selectedShares, setSelectedShares] = useState<number[]>([]);
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Quick share count adjuster state for members with 0 or custom shares
  const [showShareEditor, setShowShareEditor] = useState(false);
  const [customShareCountInput, setCustomShareCountInput] = useState<number>(4);

  const currentMember = members.find(m => m.id === memberId);
  const memberTotalShares = currentMember?.shareCount || 0;

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
    return isBn ? `${mName} ${yStr}` : `${mName} ${yStr}`;
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
    const targetId = initialMemberId || selectedMemberId;
    if (targetId && members.some(m => m.id === targetId)) {
      setSelectedId(targetId);
    }
  }, [isOpen, initialMemberId, selectedMemberId, members]);

  // When member changes, initialize share amounts and selections
  useEffect(() => {
    if (currentMember) {
      const sharesCount = currentMember.shareCount || 0;
      setCustomShareCountInput(sharesCount > 0 ? sharesCount : 4);

      if (sharesCount > 0) {
        setDepositMode('share_wise');
        // Initialize share amounts map
        const initialAmountsMap: { [shareNo: number]: number } = {};
        for (let i = 1; i <= sharesCount; i++) {
          initialAmountsMap[i] = bulkRate;
        }
        setShareAmounts(initialAmountsMap);

        // By default select all shares
        const defaultSelected = Array.from({ length: sharesCount }, (_, i) => i + 1);
        setSelectedShares(defaultSelected);

        const totalCalculated = defaultSelected.reduce((sum, s) => sum + (initialAmountsMap[s] || bulkRate), 0);
        setAmount(totalCalculated);

        generateAutoNotes(defaultSelected, initialAmountsMap, sharesCount, selectedMonth, selectedYear);
      } else {
        setDepositMode('custom');
        setSelectedShares([]);
        setShareAmounts({});
        setAmount(1000);
      }
    }
  }, [memberId, currentMember?.shareCount, isBn]);

  // Generate automated descriptive notes
  const generateAutoNotes = (
    selected: number[],
    amountsMap: { [shareNo: number]: number },
    totalShares: number,
    month: string,
    year: number
  ) => {
    const period = isBn 
      ? `${getMonthName(month)} ${toBengaliNumber(year)}` 
      : `${getMonthName(month)} ${year}`;

    if (selected.length === 0) {
      setNotes(isBn ? `${period}: কোনো শেয়ার নির্বাচিত নেই` : `${period}: No shares selected`);
      return;
    }

    const allShares = Array.from({ length: totalShares }, (_, i) => i + 1);
    const unpaid = allShares.filter(s => !selected.includes(s));
    
    const selectedBreakdown = selected.map(s => {
      const sAmt = amountsMap[s] || bulkRate;
      return isBn 
        ? `শেয়ার #${toBengaliNumber(s)} (৳${toBengaliNumber(sAmt)})` 
        : `Share #${s} (৳${sAmt})`;
    }).join(' + ');

    const totalAmt = selected.reduce((sum, s) => sum + (amountsMap[s] || bulkRate), 0);

    if (unpaid.length > 0) {
      const unpaidStr = unpaid.map(s => isBn ? `#${toBengaliNumber(s)}` : `#${s}`).join(', ');
      if (isBn) {
        setNotes(`${period} কিস্তি: ${selectedBreakdown} = মোট ৳${toBengaliNumber(totalAmt)}। পরবর্তীতে প্রদেয়: শেয়ার ${unpaidStr}।`);
      } else {
        setNotes(`${period} Installment: ${selectedBreakdown} = Total ৳${totalAmt}. Due later: Shares ${unpaidStr}.`);
      }
    } else {
      if (isBn) {
        setNotes(`${period} কিস্তি: সকল শেয়ারের (${toBengaliNumber(totalShares)}টি) সম্পূর্ণ জমা [${selectedBreakdown}] = ৳${toBengaliNumber(totalAmt)}`);
      } else {
        setNotes(`${period} Installment: All ${totalShares} shares full deposit [${selectedBreakdown}] = ৳${totalAmt}`);
      }
    }
  };

  // Toggle individual share
  const handleToggleShare = (shareIndex: number) => {
    let nextSelected: number[];
    if (selectedShares.includes(shareIndex)) {
      nextSelected = selectedShares.filter(s => s !== shareIndex);
    } else {
      nextSelected = [...selectedShares, shareIndex].sort((a, b) => a - b);
    }
    setSelectedShares(nextSelected);

    const calculatedAmount = nextSelected.reduce((sum, s) => sum + (shareAmounts[s] || bulkRate), 0);
    setAmount(calculatedAmount);

    generateAutoNotes(nextSelected, shareAmounts, memberTotalShares, selectedMonth, selectedYear);
  };

  // Change amount for a SPECIFIC individual share
  const handleIndividualShareAmountChange = (shareIndex: number, newAmt: number) => {
    const validAmt = Math.max(0, newAmt);
    const nextAmounts = {
      ...shareAmounts,
      [shareIndex]: validAmt
    };
    setShareAmounts(nextAmounts);

    const calculatedAmount = selectedShares.reduce((sum, s) => sum + (nextAmounts[s] || 0), 0);
    setAmount(calculatedAmount);

    generateAutoNotes(selectedShares, nextAmounts, memberTotalShares, selectedMonth, selectedYear);
  };

  // Bulk rate apply across all shares
  const handleApplyBulkRate = (newRate: number) => {
    const validRate = Math.max(1, newRate);
    setBulkRate(validRate);
    
    const updatedAmounts: { [shareNo: number]: number } = {};
    for (let i = 1; i <= memberTotalShares; i++) {
      updatedAmounts[i] = validRate;
    }
    setShareAmounts(updatedAmounts);

    const calculatedAmount = selectedShares.length * validRate;
    setAmount(calculatedAmount);

    generateAutoNotes(selectedShares, updatedAmounts, memberTotalShares, selectedMonth, selectedYear);
  };

  const handleSelectAllShares = () => {
    const all = Array.from({ length: memberTotalShares }, (_, i) => i + 1);
    setSelectedShares(all);
    const calculatedAmount = all.reduce((sum, s) => sum + (shareAmounts[s] || bulkRate), 0);
    setAmount(calculatedAmount);
    generateAutoNotes(all, shareAmounts, memberTotalShares, selectedMonth, selectedYear);
  };

  const handleSelectFirstN = (count: number) => {
    const subset = Array.from({ length: Math.min(count, memberTotalShares) }, (_, i) => i + 1);
    setSelectedShares(subset);
    const calculatedAmount = subset.reduce((sum, s) => sum + (shareAmounts[s] || bulkRate), 0);
    setAmount(calculatedAmount);
    generateAutoNotes(subset, shareAmounts, memberTotalShares, selectedMonth, selectedYear);
  };

  const handleClearSelection = () => {
    setSelectedShares([]);
    setAmount(0);
    setNotes(isBn ? 'কোনো শেয়ার নির্বাচিত নেই' : 'No shares selected');
  };

  // Quick Share Count update for members with 0 or missing shares (e.g. Lalon)
  const handleQuickSetShareCount = (newCount: number) => {
    if (!currentMember || newCount <= 0) return;
    const shareVal = newCount * (settings.sharePricePerUnit || 1000);
    updateMember(currentMember.id, {
      shareCount: newCount,
      shareValue: shareVal,
      totalSavings: (currentMember.generalSavingsBalance || 0) + 
                    (currentMember.dpsSavingsBalance || 0) + 
                    (currentMember.fdrSavingsBalance || 0)
    });

    const newAmountsMap: { [shareNo: number]: number } = {};
    for (let i = 1; i <= newCount; i++) {
      newAmountsMap[i] = bulkRate;
    }
    setShareAmounts(newAmountsMap);
    const all = Array.from({ length: newCount }, (_, i) => i + 1);
    setSelectedShares(all);
    setAmount(all.length * bulkRate);
    setDepositMode('share_wise');
    setShowShareEditor(false);
    generateAutoNotes(all, newAmountsMap, newCount, selectedMonth, selectedYear);
  };

  if (!isOpen) return null;

  const memberSchemes = savingsSchemes.filter(s => s.memberId === memberId && s.status === 'running');
  const allSharesList = Array.from({ length: memberTotalShares }, (_, i) => i + 1);
  const unpaidSharesList = allSharesList.filter(s => !selectedShares.includes(s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      alert(isBn ? 'অনুগ্রহ করে সদস্য নির্বাচন করুন।' : 'Please select a member.');
      return;
    }

    if (Number(amount) < 1000) {
      alert(isBn 
        ? 'সর্বনিম্ন জমার পরিমাণ ১,০০০ টাকা। ১,০০০ টাকার নিচে কোনো জমা দেওয়া যাবে না।' 
        : 'Minimum deposit amount is ৳ 1,000. Deposits below ৳ 1,000 are not allowed.');
      return;
    }

    if (depositMode === 'share_wise' && memberTotalShares > 0) {
      if (selectedShares.length === 0) {
        alert(isBn 
          ? 'অনুগ্রহ করে কমপক্ষে ১টি শেয়ার নির্বাচন করুন অথবা সরাসরি এন্ট্রি মোডে যান।' 
          : 'Please select at least 1 share or switch to direct entry mode.');
        return;
      }

      const invalidShare = selectedShares.find(s => {
        const amt = shareAmounts[s] !== undefined ? shareAmounts[s] : bulkRate;
        return amt < 1000;
      });

      if (invalidShare !== undefined) {
        alert(isBn 
          ? `শেয়ার #${displayCount(invalidShare)} এর জন্য সর্বনিম্ন ১,০০০ টাকা জমা আবশ্যক। ১,০০০ টাকার নিচে জমা দেওয়া যাবে না।` 
          : `Share #${invalidShare} must have a minimum deposit of ৳ 1,000.`);
        return;
      }
    }

    addDeposit({
      memberId,
      schemeType,
      schemeId: schemeId || undefined,
      amount: Number(amount),
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      selectedShares: depositMode === 'share_wise' && memberTotalShares > 0 ? selectedShares : undefined,
      totalMemberShares: depositMode === 'share_wise' && memberTotalShares > 0 ? memberTotalShares : undefined,
      shareRate: bulkRate,
      shareAmounts: depositMode === 'share_wise' && memberTotalShares > 0 ? shareAmounts : undefined,
      unpaidShares: depositMode === 'share_wise' && memberTotalShares > 0 ? unpaidSharesList : undefined,
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
    <div className={`bg-white rounded-2xl ${isEmbedded ? 'border border-slate-200 shadow-2xs w-full max-w-2xl mx-auto' : 'shadow-2xl border border-slate-200 w-full max-w-xl'} overflow-hidden animate-in fade-in-50 zoom-in-95 my-4`}>
        {/* Header */}
        <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-inner">
              <ArrowDownRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isMemberLocked && currentMember
                  ? (isBn ? `${currentMember.name}-এর সঞ্চয় জমা` : `Deposit to ${currentMember.name}'s Account`)
                  : (isBn ? 'টাকা জমা ও শেয়ার ভিত্তিক কালেকশন' : 'Deposit Money & Share Collection')}
              </h3>
              <p className="text-xs text-emerald-100">
                {isMemberLocked && currentMember
                  ? (isBn ? `সদস্য নং: #${currentMember.memberNo} • শেয়ার ও সঞ্চয় একাউন্টে জমা ভাউচার` : `Member #${currentMember.memberNo} • Deposit Voucher`)
                  : (isBn ? 'তারিখ, মাস ও শেয়ার প্রতি নির্ধারিত কিস্তি আদায়' : 'Date, Month & Per-Share Installment Entry')}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
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

              {/* Dedicated Member Identity Card - Strictly only this member, no other members shown */}
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
                        <span className="text-emerald-700 font-semibold">
                          {isBn ? 'সক্রিয় শেয়ার:' : 'Active Shares:'} {displayCount(memberTotalShares)} {isBn ? 'টি' : 'Shares'}
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
                    <button
                      type="button"
                      onClick={() => setShowShareEditor(!showShareEditor)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer mt-0.5 block"
                    >
                      {isBn ? 'শেয়ার পরিবর্তন' : 'Edit Shares'}
                    </button>
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
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.memberNo} - {m.name} ({isBn ? 'শেয়ার:' : 'Shares:'} {displayCount(m.shareCount || 0)} {isBn ? 'টি' : ''}) • {m.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Member Share Overview Header */}
          {currentMember && !isMemberLocked && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={currentMember.photoUrl} 
                    alt={currentMember.name} 
                    className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-sm block">{currentMember.name}</span>
                    <span className="text-slate-600 font-medium text-xs">
                      {isBn ? 'সক্রিয় শেয়ার:' : 'Active Shares:'}{' '}
                      <strong className="text-blue-700 font-bold bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md ml-1">
                        {displayCount(memberTotalShares)} {isBn ? 'টি' : 'Shares'}
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[11px] text-slate-500 block">{isBn ? 'সঞ্চয় ব্যালেন্স' : 'Savings Balance'}</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(currentMember.totalSavings || 0, isBn && useBengaliDigits)}</span>
                  <button
                    type="button"
                    onClick={() => setShowShareEditor(!showShareEditor)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer mt-0.5"
                  >
                    {isBn ? 'শেয়ার সংখ্যা পরিবর্তন' : 'Edit Shares'}
                  </button>
                </div>
              </div>

              {/* Zero Share Warning / Share Count Quick Fixer */}
              {(memberTotalShares === 0 || showShareEditor) && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>
                      {memberTotalShares === 0 
                        ? (isBn ? 'সদস্যের শেয়ার সংখ্যা ০ দেখাচ্ছে। কয়টি শেয়ার নির্ধারণ করতে চান?' : 'Member currently has 0 shares. Set share count:')
                        : (isBn ? 'সদস্যের মোট শেয়ার সংখ্যা পরিবর্তন করুন:' : 'Change member total registered shares:')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[1, 2, 3, 4, 5, 10, 20].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleQuickSetShareCount(count)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                          customShareCountInput === count 
                            ? 'bg-amber-600 text-white shadow-xs' 
                            : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        {displayCount(count)} {isBn ? 'টি' : 'Shares'}
                      </button>
                    ))}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={customShareCountInput}
                        onChange={(e) => setCustomShareCountInput(Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-white border border-amber-300 rounded text-xs font-bold text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickSetShareCount(customShareCountInput)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                      >
                        {isBn ? 'সেট করুন' : 'Set'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Zero Share Fixer when member is locked */}
          {currentMember && isMemberLocked && (memberTotalShares === 0 || showShareEditor) && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>
                  {memberTotalShares === 0 
                    ? (isBn ? 'সদস্যের শেয়ার সংখ্যা ০ দেখাচ্ছে। কয়টি শেয়ার নির্ধারণ করতে চান?' : 'Member currently has 0 shares. Set share count:')
                    : (isBn ? 'সদস্যের মোট শেয়ার সংখ্যা পরিবর্তন করুন:' : 'Change member total registered shares:')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[1, 2, 3, 4, 5, 10, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleQuickSetShareCount(count)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      customShareCountInput === count 
                        ? 'bg-amber-600 text-white shadow-xs' 
                        : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {displayCount(count)} {isBn ? 'টি' : 'Shares'}
                  </button>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    value={customShareCountInput}
                    onChange={(e) => setCustomShareCountInput(Number(e.target.value))}
                    className="w-16 px-2 py-1 bg-white border border-amber-300 rounded text-xs font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuickSetShareCount(customShareCountInput)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                  >
                    {isBn ? 'সেট করুন' : 'Set'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Date, Month & Year Selection Box (তারিখ, মাস ও বছর নির্বাচন) */}
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
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    generateAutoNotes(selectedShares, shareAmounts, memberTotalShares, e.target.value, selectedYear);
                  }}
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
                      generateAutoNotes(selectedShares, shareAmounts, memberTotalShares, selectedMonth, cy);
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
                    onChange={(e) => {
                      const yr = Number(e.target.value);
                      setSelectedYear(yr);
                      generateAutoNotes(selectedShares, shareAmounts, memberTotalShares, selectedMonth, yr);
                    }}
                    className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white text-center"
                    placeholder="YYYY"
                  />
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const yr = Number(e.target.value);
                      setSelectedYear(yr);
                      generateAutoNotes(selectedShares, shareAmounts, memberTotalShares, selectedMonth, yr);
                    }}
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

          {/* Share Selector (চেকবক্স ভিত্তিক শেয়ার সিলেক্টর ও শেয়ার প্রতি টাকার ঘর) */}
          {memberTotalShares > 0 && (
            <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-xl p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-md">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      {isBn ? 'শেয়ার সিলেক্টর ও শেয়ার প্রতি কিস্তি' : 'Share Selector & Per-Share Rate'}
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      {isBn ? 'যে যে শেয়ারের টাকা জমা হচ্ছে সিলেক্ট করুন এবং দর নির্ধারণ করুন' : 'Select shares and set custom amounts per share'}
                    </p>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-emerald-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setDepositMode('share_wise')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      depositMode === 'share_wise' 
                        ? 'bg-emerald-700 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? 'শেয়ার ভিত্তিক' : 'Share Based'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMode('custom')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      depositMode === 'custom' 
                        ? 'bg-emerald-700 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {isBn ? 'সরাসরি এন্ট্রি' : 'Direct Entry'}
                  </button>
                </div>
              </div>

              {depositMode === 'share_wise' ? (
                <div className="space-y-3">
                  {/* Share Rate Configuration & Quick Buttons */}
                  <div className="bg-white/90 p-3 rounded-lg border border-emerald-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-emerald-900 whitespace-nowrap">
                          {isBn ? 'সকল শেয়ারে একসাথে দর বসান (৳):' : 'Bulk Rate for All Shares (৳):'}
                        </label>
                        <input
                          type="number"
                          min={1000}
                          step="any"
                          value={bulkRate}
                          onChange={(e) => handleApplyBulkRate(Number(e.target.value))}
                          className="w-24 px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-md text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold">{isBn ? 'দ্রুত দর:' : 'Presets:'}</span>
                        {[1000, 1500, 2000, 3000, 5000].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handleApplyBulkRate(rate)}
                            className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            {formatCurrency(rate, isBn && useBengaliDigits)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Selection Helpers */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[11px] text-slate-600 font-semibold">{isBn ? 'শেয়ার নির্বাচন:' : 'Quick Select:'}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSelectAllShares}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {isBn ? `সবগুলো (${displayCount(memberTotalShares)}টি)` : `All (${memberTotalShares})`}
                        </button>
                        {memberTotalShares >= 2 && (
                          <button
                            type="button"
                            onClick={() => handleSelectFirstN(2)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            {isBn ? '২টি শেয়ার' : '2 Shares'}
                          </button>
                        )}
                        {memberTotalShares >= 4 && (
                          <button
                            type="button"
                            onClick={() => handleSelectFirstN(4)}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            {isBn ? '৪টি শেয়ার' : '4 Shares'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleClearSelection}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          {isBn ? 'মুছুন' : 'Clear'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Checkbox & Individual Amount Grid for Individual Shares */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {allSharesList.map((shareNo) => {
                      const isSelected = selectedShares.includes(shareNo);
                      const currentShareAmt = shareAmounts[shareNo] !== undefined ? shareAmounts[shareNo] : bulkRate;

                      return (
                        <div
                          key={shareNo}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between gap-2 select-none ${
                            isSelected 
                              ? 'bg-emerald-600/10 border-emerald-500 shadow-xs ring-1 ring-emerald-400' 
                              : 'bg-white/80 border-slate-300 hover:border-slate-400 opacity-80'
                          }`}
                        >
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => handleToggleShare(shareNo)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded-md ${isSelected ? 'text-emerald-700 bg-emerald-100' : 'text-slate-400'}`}>
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-xs text-slate-900 block">
                                  {isBn ? `শেয়ার #${displayCount(shareNo)}` : `Share #${shareNo}`}
                                </span>
                              </div>
                            </div>

                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isSelected ? (isBn ? '✓ জমা হচ্ছে' : '✓ Depositing') : (isBn ? '⏳ পরে প্রদেয়' : '⏳ Pay Later')}
                            </span>
                          </div>

                          {/* Individual Share Amount Field */}
                          <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                            <div className="flex flex-col items-start">
                              <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                                {isBn ? 'এই শেয়ারের কিস্তি:' : 'This Share Rate:'}
                              </label>
                              {currentShareAmt < 1000 && isSelected && (
                                <span className="text-[10px] text-rose-600 font-bold">
                                  {isBn ? 'সর্বনিম্ন ১,০০০ ৳' : 'Min ৳ 1,000'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-slate-500">৳</span>
                              <input
                                type="number"
                                min={1000}
                                step="any"
                                value={currentShareAmt}
                                onChange={(e) => handleIndividualShareAmountChange(shareNo, Number(e.target.value))}
                                className={`w-24 px-2 py-1 bg-white border rounded text-xs font-bold text-right focus:ring-2 focus:outline-hidden ${
                                  currentShareAmt < 1000 && isSelected
                                    ? 'border-rose-400 text-rose-700 bg-rose-50 focus:ring-rose-500'
                                    : 'border-slate-300 text-slate-900 focus:ring-emerald-500'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Share Calculation Breakdown */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>{isBn ? 'নির্বাচিত শেয়ার সংখ্যা:' : 'Selected Shares:'}</span>
                      <strong className="text-emerald-700 font-bold">
                        {displayCount(selectedShares.length)} {isBn ? `টি (মোট ${displayCount(memberTotalShares)} টির মধ্যে)` : `of ${memberTotalShares}`}
                      </strong>
                    </div>

                    {/* Individual Breakdowns */}
                    {selectedShares.length > 0 && (
                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-wrap gap-2">
                        {selectedShares.map((s) => (
                          <span key={s} className="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                            {isBn ? `শেয়ার #${displayCount(s)}: ৳${toBengaliNumber(shareAmounts[s] || bulkRate)}` : `Share #${s}: ৳${shareAmounts[s] || bulkRate}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {unpaidSharesList.length > 0 && (
                      <div className="flex items-center justify-between text-amber-700">
                        <span>{isBn ? 'বকেয়া / পরবর্তীতে প্রদেয় শেয়ার:' : 'Due / Remaining Shares:'}</span>
                        <strong className="font-bold">
                          {unpaidSharesList.map(s => isBn ? `শেয়ার #${displayCount(s)}` : `Share #${s}`).join(', ')} ({displayCount(unpaidSharesList.length)} {isBn ? 'টি' : ''})
                        </strong>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-slate-900">
                      <span className="font-bold">{isBn ? 'হিসাবকৃত মোট জমার পরিমাণ:' : 'Calculated Deposit Total:'}</span>
                      <span className="text-base font-black text-emerald-800">
                        {formatCurrency(amount, isBn && useBengaliDigits)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{isBn ? 'সুবিধা:' : 'Feature:'}</strong> {isBn 
                        ? 'আপনি প্রতিটি শেয়ারের জন্য আলাদা আলাদা টাকার পরিমাণ নির্ধারণ করতে পারেন (যেমন কোনো শেয়ারে ১০০০, কোনোটিতে ৫০০)। নির্বাচিত শেয়ারগুলোর টাকা যোগ হয়ে নিচে মোট জমায় স্বয়ংক্রিয়ভাবে বসে যাবে।'
                        : 'You can set different amounts for each individual share (e.g. ৳1000 for one share, ৳500 for another). The total is automatically summed up.'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-600">
                  {isBn 
                    ? 'সরাসরি এন্ট্রি মোড সক্রিয়। আপনি নিচে সরাসরি কাঙ্ক্ষিত টাকার পরিমাণ লিখে জমা করতে পারবেন।'
                    : 'Direct Entry mode active. You can enter any custom deposit amount directly below.'}
                </div>
              )}
            </div>
          )}

          {/* Scheme & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'জমার খাত / স্কিম' : 'Deposit Head / Scheme'}
              </label>
              <select
                value={schemeType}
                onChange={(e) => setSchemeType(e.target.value as 'general' | 'dps' | 'fdr')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
              >
                <option value="general">{isBn ? 'সাধারণ সঞ্চয় ও শেয়ার কিস্তি (General Savings)' : 'General Savings & Shares'}</option>
                <option value="dps">{isBn ? 'মাসিক ডিপিএস (DPS)' : 'Monthly DPS'}</option>
                <option value="fdr">{isBn ? 'স্থায়ী আমানত (FDR)' : 'Fixed Deposit (FDR)'}</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isBn ? 'মোট জমার পরিমাণ (৳)' : 'Total Deposit Amount (৳)'} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-800">
                  {isBn ? '(সর্বনিম্ন ১,০০০ ৳)' : '(Min ৳1,000)'}
                </span>
              </div>
              <input
                type="number"
                required
                min={1000}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-hidden font-bold text-lg ${
                  amount < 1000 
                    ? 'border-rose-400 text-rose-800 bg-rose-50/60 focus:ring-rose-500' 
                    : 'border-slate-300 text-emerald-800 bg-emerald-50/50 focus:ring-emerald-500'
                }`}
              />
              {/* Amount Quick Presets */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-bold">{isBn ? 'কুইক অ্যামাউন্ট:' : 'Quick:'}</span>
                {[1000, 2000, 3000, 4000, 5000].map((presetAmt) => (
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
              {amount < 1000 && (
                <span className="text-xs font-bold text-rose-600 mt-1 block">
                  ⚠️ {isBn ? 'সর্বনিম্ন জমার পরিমাণ ১,০০০ টাকা। ১,০০০ টাকার নিচে কোনো জমা গ্রহণযোগ্য নয়।' : 'Minimum deposit amount is ৳ 1,000. Deposits below ৳ 1,000 are not allowed.'}
                </span>
              )}
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
              {isBn ? 'মন্তব্য / রসিদ বিবরণ' : 'Notes / Receipt Narration'}
            </label>
            <input
              type="text"
              placeholder={isBn ? "যেমন: মার্চ ২০২৬ কিস্তি জমা" : "e.g., March 2026 installment"}
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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {modalContent}
    </div>
  );
};
