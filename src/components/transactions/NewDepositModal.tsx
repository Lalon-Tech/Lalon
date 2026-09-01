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
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, formatBengaliNumber, toBengaliNumber } from '../../utils/bengaliUtils';

interface NewDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId?: string;
}

export const NewDepositModal: React.FC<NewDepositModalProps> = ({ 
  isOpen, 
  onClose,
  initialMemberId 
}) => {
  const { 
    members, 
    bankAccounts, 
    addDeposit, 
    savingsSchemes,
    settings,
    useBengaliDigits 
  } = useSomiti();

  const [memberId, setMemberId] = useState(initialMemberId || members[0]?.id || '');
  const [schemeType, setSchemeType] = useState<'general' | 'dps' | 'fdr'>('general');
  const [schemeId, setSchemeId] = useState('');
  const [depositMode, setDepositMode] = useState<'share_wise' | 'custom'>('share_wise');
  const [shareRate, setShareRate] = useState<number>(1000);
  const [selectedShares, setSelectedShares] = useState<number[]>([]);
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  const currentMember = members.find(m => m.id === memberId);
  const memberTotalShares = currentMember?.shareCount || 0;

  // Initialize or update state when member or modal opens
  useEffect(() => {
    if (initialMemberId) {
      setMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  useEffect(() => {
    if (currentMember) {
      const sharesCount = currentMember.shareCount || 0;
      if (sharesCount > 0) {
        setDepositMode('share_wise');
        // By default select all or first 2 shares if available
        const defaultSelected = sharesCount >= 2 ? [1, 2] : [1];
        setSelectedShares(defaultSelected);
        const calculatedAmount = defaultSelected.length * shareRate;
        setAmount(calculatedAmount);
        
        const unpaid = Array.from({ length: sharesCount }, (_, i) => i + 1).filter(s => !defaultSelected.includes(s));
        const selectedStr = defaultSelected.map(s => `#${toBengaliNumber(s)}`).join(', ');
        const unpaidStr = unpaid.map(s => `#${toBengaliNumber(s)}`).join(', ');
        
        if (unpaid.length > 0) {
          setNotes(`শেয়ার ভিত্তিক জমা: শেয়ার ${selectedStr} (মোট ${toBengaliNumber(defaultSelected.length)}টি বাবদ ৳${calculatedAmount})। পরবর্তীতে প্রদেয়: শেয়ার ${unpaidStr}।`);
        } else {
          setNotes(`সকল শেয়ারের (${toBengaliNumber(sharesCount)}টি) জমা সম্পন্ন`);
        }
      } else {
        setDepositMode('custom');
        setSelectedShares([]);
        setAmount(1000);
      }
    }
  }, [memberId, currentMember?.shareCount]);

  // When selected shares or share rate changes, recalculate amount & notes
  const handleToggleShare = (shareIndex: number) => {
    let nextSelected: number[];
    if (selectedShares.includes(shareIndex)) {
      nextSelected = selectedShares.filter(s => s !== shareIndex);
    } else {
      nextSelected = [...selectedShares, shareIndex].sort((a, b) => a - b);
    }
    setSelectedShares(nextSelected);

    const calculatedAmount = nextSelected.length * shareRate;
    setAmount(calculatedAmount);

    const allShares = Array.from({ length: memberTotalShares }, (_, i) => i + 1);
    const unpaid = allShares.filter(s => !nextSelected.includes(s));
    
    if (nextSelected.length > 0) {
      const selectedStr = nextSelected.map(s => `#${toBengaliNumber(s)}`).join(', ');
      const unpaidStr = unpaid.length > 0 ? unpaid.map(s => `#${toBengaliNumber(s)}`).join(', ') : 'নাই';
      
      if (unpaid.length > 0) {
        setNotes(`শেয়ার ভিত্তিক জমা: শেয়ার ${selectedStr} (মোট ${toBengaliNumber(nextSelected.length)}টি বাবদ ৳${calculatedAmount})। পরবর্তীতে প্রদেয়: শেয়ার ${unpaidStr}।`);
      } else {
        setNotes(`সকল শেয়ারের (${toBengaliNumber(memberTotalShares)}টি) সম্পূর্ণ জমা (৳${calculatedAmount})`);
      }
    } else {
      setNotes('কোনো শেয়ার নির্বাচিত নেই');
    }
  };

  const handleSelectAllShares = () => {
    const all = Array.from({ length: memberTotalShares }, (_, i) => i + 1);
    setSelectedShares(all);
    const calculatedAmount = all.length * shareRate;
    setAmount(calculatedAmount);
    setNotes(`সকল শেয়ারের (${toBengaliNumber(memberTotalShares)}টি) সম্পূর্ণ জমা বাবদ`);
  };

  const handleSelectFirstN = (count: number) => {
    const subset = Array.from({ length: Math.min(count, memberTotalShares) }, (_, i) => i + 1);
    setSelectedShares(subset);
    const calculatedAmount = subset.length * shareRate;
    setAmount(calculatedAmount);

    const allShares = Array.from({ length: memberTotalShares }, (_, i) => i + 1);
    const unpaid = allShares.filter(s => !subset.includes(s));
    const selectedStr = subset.map(s => `#${toBengaliNumber(s)}`).join(', ');
    const unpaidStr = unpaid.map(s => `#${toBengaliNumber(s)}`).join(', ');
    setNotes(`শেয়ার ভিত্তিক জমা: শেয়ার ${selectedStr} (মোট ${toBengaliNumber(subset.length)}টি বাবদ ৳${calculatedAmount})। পরবর্তীতে প্রদেয়: শেয়ার ${unpaidStr}।`);
  };

  const handleClearSelection = () => {
    setSelectedShares([]);
    setAmount(0);
    setNotes('');
  };

  const handleShareRateChange = (newRate: number) => {
    setShareRate(newRate);
    if (depositMode === 'share_wise') {
      const calculatedAmount = selectedShares.length * newRate;
      setAmount(calculatedAmount);
      
      const allShares = Array.from({ length: memberTotalShares }, (_, i) => i + 1);
      const unpaid = allShares.filter(s => !selectedShares.includes(s));
      const selectedStr = selectedShares.map(s => `#${toBengaliNumber(s)}`).join(', ');
      const unpaidStr = unpaid.length > 0 ? unpaid.map(s => `#${toBengaliNumber(s)}`).join(', ') : 'নাই';
      
      if (selectedShares.length > 0) {
        if (unpaid.length > 0) {
          setNotes(`শেয়ার ভিত্তিক জমা: শেয়ার ${selectedStr} (মোট ${toBengaliNumber(selectedShares.length)}টি বাবদ ৳${calculatedAmount})। পরবর্তীতে প্রদেয়: শেয়ার ${unpaidStr}।`);
        } else {
          setNotes(`সকল শেয়ারের (${toBengaliNumber(memberTotalShares)}টি) সম্পূর্ণ জমা বাবদ`);
        }
      }
    }
  };

  if (!isOpen) return null;

  const memberSchemes = savingsSchemes.filter(s => s.memberId === memberId && s.status === 'running');
  const allSharesList = Array.from({ length: memberTotalShares }, (_, i) => i + 1);
  const unpaidSharesList = allSharesList.filter(s => !selectedShares.includes(s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || amount <= 0) {
      alert('অনুগ্রহ করে সদস্য ও সঠিক জমার পরিমাণ নিশ্চিত করুন। (কমপক্ষে ১টি শেয়ার নির্বাচন করুন)');
      return;
    }

    if (depositMode === 'share_wise' && memberTotalShares > 0 && selectedShares.length === 0) {
      alert('অনুগ্রহ করে কমপক্ষে ১টি শেয়ার নির্বাচন করুন অথবা কাস্টম মোডে যান।');
      return;
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
      shareRate: depositMode === 'share_wise' && memberTotalShares > 0 ? shareRate : undefined,
      unpaidShares: depositMode === 'share_wise' && memberTotalShares > 0 ? unpaidSharesList : undefined,
      notes: notes.trim(),
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg shadow-inner">
              <ArrowDownRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">টাকা জমা ও শেয়ার ভিত্তিক কালেকশন</h3>
              <p className="text-xs text-emerald-100">শেয়ার সিলেক্টর ও কিস্তি আদায় ভাউচার</p>
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
          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              সদস্য নির্বাচন করুন <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {m.name} (মোট শেয়ার: {formatBengaliNumber(m.shareCount || 0)} টি) • {m.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Member Share Overview Header */}
          {currentMember && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <img 
                  src={currentMember.photoUrl} 
                  alt={currentMember.name} 
                  className="w-9 h-9 rounded-full object-cover border border-slate-200" 
                />
                <div>
                  <span className="font-bold text-slate-800 text-sm block">{currentMember.name}</span>
                  <span className="text-slate-500">
                    বর্তমান মোট শেয়ার: <strong className="text-blue-700 font-bold">{formatBengaliNumber(memberTotalShares)} টি</strong> (মূলধন: {formatCurrency(currentMember.shareValue || 0, useBengaliDigits)})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">সঞ্চয় ব্যালেন্স</span>
                <span className="font-bold text-emerald-700">{formatCurrency(currentMember.totalSavings || 0, useBengaliDigits)}</span>
              </div>
            </div>
          )}

          {/* Share Selector (चेकबক্স ভিত্তিক শেয়ার সিলেক্টর) */}
          {memberTotalShares > 0 && (
            <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-xl p-4 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-md">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      শেয়ার সিলেক্টর (চেকবক্স)
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      কোন কোন শেয়ারের কিস্তি জমা হচ্ছে তা টিক চিহ্ন দিন
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
                    শেয়ার ভিত্তিক
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
                    সরাসরি এন্ট্রি
                  </button>
                </div>
              </div>

              {depositMode === 'share_wise' ? (
                <div className="space-y-3">
                  {/* Share Rate Configuration & Quick Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-emerald-900 whitespace-nowrap">
                        প্রতি শেয়ারের কিস্তি (৳):
                      </label>
                      <input
                        type="number"
                        min={1}
                        step="any"
                        value={shareRate}
                        onChange={(e) => handleShareRateChange(Number(e.target.value))}
                        className="w-28 px-2.5 py-1 bg-white border border-emerald-300 rounded-md text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Quick Selection Helpers */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSelectAllShares}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        সবগুলো ({formatBengaliNumber(memberTotalShares)}টি)
                      </button>
                      {memberTotalShares >= 2 && (
                        <button
                          type="button"
                          onClick={() => handleSelectFirstN(2)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          ২টি শেয়ার
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        মুছুন
                      </button>
                    </div>
                  </div>

                  {/* Checkbox Grid for Individual Shares */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {allSharesList.map((shareNo) => {
                      const isSelected = selectedShares.includes(shareNo);
                      return (
                        <div
                          key={shareNo}
                          onClick={() => handleToggleShare(shareNo)}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                            isSelected 
                              ? 'bg-emerald-600/10 border-emerald-500 shadow-xs ring-1 ring-emerald-400' 
                              : 'bg-white/80 border-slate-300 hover:border-slate-400 opacity-80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1 rounded-md ${isSelected ? 'text-emerald-700 bg-emerald-100' : 'text-slate-400'}`}>
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900">
                                  শেয়ার #{formatBengaliNumber(shareNo)}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                                  isSelected ? 'bg-emerald-600 text-white' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isSelected ? '✓ জমা হচ্ছে' : '⏳ পরে প্রদেয়'}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                কিস্তি: <strong>৳{formatBengaliNumber(shareRate)}</strong>
                              </span>
                            </div>
                          </div>

                          <span className={`text-xs font-black font-mono ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {formatCurrency(shareRate, useBengaliDigits)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Share Calculation Breakdown */}
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>নির্বাচিত শেয়ার সংখ্যা:</span>
                      <strong className="text-emerald-700 font-bold">
                        {formatBengaliNumber(selectedShares.length)} টি (মোট {formatBengaliNumber(memberTotalShares)} টির মধ্যে)
                      </strong>
                    </div>
                    {unpaidSharesList.length > 0 && (
                      <div className="flex items-center justify-between text-amber-700">
                        <span>বকেয়া / পরবর্তীতে প্রদেয় শেয়ার:</span>
                        <strong className="font-bold">
                          {unpaidSharesList.map(s => `শেয়ার #${formatBengaliNumber(s)}`).join(', ')} ({formatBengaliNumber(unpaidSharesList.length)} টি)
                        </strong>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-slate-900">
                      <span className="font-bold">হিসাবকৃত জমার পরিমাণ:</span>
                      <span className="text-base font-black text-emerald-800">
                        {formatCurrency(selectedShares.length * shareRate, useBengaliDigits)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>সুবিধা:</strong> আপনি এখন যেকোনো সংখ্যক (যেমন ২টি) শেয়ারের টাকা জমা দিতে পারছেন। বাকি ২টি শেয়ার সদস্য পরবর্তীতে সুবিধাজনক সময়ে দিতে পারবেন এবং রসিদে এর পূর্ণ বিবরণ থাকবে।
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white rounded-lg border border-emerald-200 text-xs text-slate-600">
                  সরাসরি এন্ট্রি মোড সক্রিয়। আপনি নিচে সরাসরি কাঙ্ক্ষিত টাকার পরিমাণ লিখে জমা করতে পারবেন।
                </div>
              )}
            </div>
          )}

          {/* Scheme & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জমার খাত / স্কিম
              </label>
              <select
                value={schemeType}
                onChange={(e) => setSchemeType(e.target.value as 'general' | 'dps' | 'fdr')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="general">সাধারণ সঞ্চয় (General Savings)</option>
                <option value="dps">মাসিক ডিপিএস (DPS)</option>
                <option value="fdr">স্থায়ী আমানত (FDR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মোট জমার পরিমাণ (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-emerald-800 text-lg bg-emerald-50/50"
              />
            </div>
          </div>

          {schemeType !== 'general' && memberSchemes.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                নির্দিষ্ট স্কিম অ্যাকাউন্ট
              </label>
              <select
                value={schemeId}
                onChange={(e) => setSchemeId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="">স্বয়ংক্রিয় স্কিম নির্বাচন</option>
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
                লেনদেনের মাধ্যম
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="cash">নগদ ক্যাশ (Cash)</option>
                <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
              </select>
            </div>

            {paymentMethod === 'bank' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সমিতির ব্যাংক হিসাব
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
              মন্তব্য / রসিদ বিবরণ
            </label>
            <input
              type="text"
              placeholder="যেমন: শেয়ার #১, #২ কিস্তি জমা"
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
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>জমা নিশ্চিত করুন ও রসিদ তৈরি করুন ✓</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
