import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, TrendingUp, Landmark, Banknote, ShieldCheck, Phone, Layers, Sparkles } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, getTodayDateStr, toBengaliNumber } from '../../utils/bengaliUtils';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

interface BuyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
  lockMember?: boolean;
}

export const BuyShareModal: React.FC<BuyShareModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberId,
  lockMember,
}) => {
  useModalScrollLock(isOpen);
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const {
    members,
    settings,
    bankAccounts,
    buyMemberShares,
    useBengaliDigits,
  } = useSomiti();

  const isMemberLocked = lockMember !== undefined ? lockMember : Boolean(preselectedMemberId);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMemberId || members[0]?.id || '');
  
  // String state allowing user to completely clear and re-enter
  const [sharesToBuyInput, setSharesToBuyInput] = useState<string>('1');
  const [unitPriceInput, setUnitPriceInput] = useState<string>(String(settings.sharePricePerUnit || 100));
  
  // Share-wise initial deposit amounts: { [shareNo: number]: string }
  const [shareAmounts, setShareAmounts] = useState<{ [shareNo: number]: string }>({});
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (preselectedMemberId) {
      setSelectedMemberId(preselectedMemberId);
    } else if (!selectedMemberId && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [preselectedMemberId, members, selectedMemberId]);

  // Synchronize unit price setting on initial load
  useEffect(() => {
    if (settings.sharePricePerUnit) {
      setUnitPriceInput(String(settings.sharePricePerUnit));
    }
  }, [settings.sharePricePerUnit]);

  const currentMember = members.find(m => m.id === selectedMemberId);
  const currentShares = currentMember?.shareCount || 0;
  
  // Derived numbers
  const parsedSharesToBuy = Math.max(0, parseInt(sharesToBuyInput) || 0);
  const parsedUnitPrice = unitPriceInput === '' ? 0 : Math.max(0, Number(unitPriceInput) || 0);
  
  // Generate the sequential share numbers for new shares
  // E.g., Existing = 1 share, Buy = 2 -> New shares = [2, 3] -> Total = 3 shares
  const newShareNumbers: number[] = React.useMemo(() => {
    if (parsedSharesToBuy <= 0) return [];
    return Array.from({ length: parsedSharesToBuy }, (_, i) => currentShares + i + 1);
  }, [currentShares, parsedSharesToBuy]);

  // Ensure every new share number has an initial deposit mapped
  useEffect(() => {
    if (newShareNumbers.length === 0) return;
    setShareAmounts(prev => {
      const updated = { ...prev };
      let changed = false;
      newShareNumbers.forEach(sNo => {
        if (updated[sNo] === undefined) {
          updated[sNo] = unitPriceInput || String(settings.sharePricePerUnit || 100);
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [newShareNumbers, unitPriceInput, settings.sharePricePerUnit]);

  if (!isOpen) return null;

  // Calculate total purchase/deposit amount from the individual share deposit inputs
  const totalAmount = newShareNumbers.reduce((sum, sNo) => {
    const rawVal = shareAmounts[sNo];
    const val = rawVal === '' || rawVal === undefined ? 0 : (Number(rawVal) || 0);
    return sum + val;
  }, 0);

  const newTotalShares = currentShares + parsedSharesToBuy;

  // Helper to apply current unit price to all new shares
  const handleApplyUnitPriceToAll = () => {
    const val = unitPriceInput || '0';
    const updated: { [shareNo: number]: string } = {};
    newShareNumbers.forEach(sNo => {
      updated[sNo] = val;
    });
    setShareAmounts(updated);
  };

  const handleShareAmountChange = (shareNo: number, valStr: string) => {
    setShareAmounts(prev => ({
      ...prev,
      [shareNo]: valStr,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentMember) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে একজন সদস্য নির্বাচন করুন।' : 'Please select a member.');
      return;
    }

    if (parsedSharesToBuy <= 0) {
      setErrorMsg(isBn ? 'কমপক্ষে ১টি শেয়ার সংখ্যা উল্লেখ করুন।' : 'Please enter at least 1 share to buy.');
      return;
    }

    // Validate that each new share has a valid amount entered
    for (const sNo of newShareNumbers) {
      const val = shareAmounts[sNo];
      if (val === '' || isNaN(Number(val)) || Number(val) < 0) {
        setErrorMsg(
          isBn
            ? `শেয়ার #${toBengaliNumber(sNo)}-এর জন্য সঠিক প্রাথমিক জমার পরিমাণ লিখুন (০ বা তার বেশি)।`
            : `Please enter a valid initial deposit for Share #${sNo} (0 or more).`
        );
        return;
      }
    }

    if (paymentMethod === 'bank' && !bankAccountId) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।' : 'Please select a bank account.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanShareAmounts: { [shareNo: number]: number } = {};
      newShareNumbers.forEach(sNo => {
        cleanShareAmounts[sNo] = Number(shareAmounts[sNo]) || 0;
      });

      const res = await buyMemberShares({
        memberId: currentMember.id,
        sharesToBuy: parsedSharesToBuy,
        unitPrice: parsedUnitPrice,
        shareAmounts: cleanShareAmounts,
        selectedShares: newShareNumbers,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
        date,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || (isBn ? 'শেয়ার ক্রয় সম্পন্ন করতে সমস্যা হয়েছে।' : 'Failed to purchase shares.'));
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isBn ? 'শেয়ার ক্রয় সম্পন্ন করতে সমস্যা হয়েছে।' : 'Failed to purchase shares.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isMemberLocked && currentMember
                  ? (isBn ? `${currentMember.name}-এর নতুন শেয়ার ক্রয়` : `Buy Shares for ${currentMember.name}`)
                  : (isBn ? 'নতুন শেয়ার ক্রয় ও মূলধন জমা ভাউচার' : 'Buy New Shares & Capital Deposit')}
              </h3>
              <p className="text-xs text-blue-100">
                {isMemberLocked && currentMember
                  ? (isBn ? `সদস্য নং: #${currentMember.memberNo} • শেয়ারভিত্তিক প্রাথমিক জমা ও মূলধন বৃদ্ধি` : `Member #${currentMember.memberNo} • Individual Share Initial Deposits`)
                  : (isBn ? 'সদস্যের নতুন শেয়ার ও শেয়ারভিত্তিক পৃথক প্রাথমিক জমা এন্ট্রি' : 'Purchase new shares with separate initial deposits')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member Selection or Dedicated Member Account */}
          {isMemberLocked && currentMember ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isBn ? 'সদস্যের নিজস্ব শেয়ার একাউন্ট' : 'Member Share Account'}
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  {isBn ? 'নির্দিষ্ট একাউন্ট' : 'Locked Account'}
                </span>
              </div>

              {/* Dedicated Member Identity Card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-white rounded-xl border border-blue-200 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-blue-200">
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
                        <span className="text-blue-700 font-semibold">
                          {isBn ? 'নিজস্ব শেয়ার ক্রয়' : 'Share Purchase'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {isBn ? 'বর্তমান সক্রিয় শেয়ার' : 'Existing Shares'}
                    </span>
                    <span className="text-sm font-black text-blue-700 font-mono">
                      {isBn || useBengaliDigits ? toBengaliNumber(currentShares) : currentShares} {isBn ? 'টি' : 'Shares'}
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
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.memberNo} - {m.name} ({isBn ? 'বর্তমান শেয়ার:' : 'Current shares:'} {isBn || useBengaliDigits ? toBengaliNumber(m.shareCount || 0) : (m.shareCount || 0)} {isBn ? 'টি' : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row 1: Shares Count & Share Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'নতুন শেয়ারের সংখ্যা' : 'Number of New Shares'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={sharesToBuyInput}
                onChange={(e) => setSharesToBuyInput(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isBn 
                  ? `বিদ্যমান ${toBengaliNumber(currentShares)} টি + নতুন ${toBengaliNumber(parsedSharesToBuy)} টি = মোট ${toBengaliNumber(newTotalShares)} টি শেয়ার` 
                  : `Existing ${currentShares} + New ${parsedSharesToBuy} = Total ${newTotalShares} shares`}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isBn ? 'প্রতি শেয়ার ইউনিট মূল্য (৳)' : 'Share Unit Price (৳)'}
                </label>
                {newShareNumbers.length > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyUnitPriceToAll}
                    title={isBn ? 'সকল নতুন শেয়ারে এই মূল্য সেট করুন' : 'Apply unit price to all new shares'}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isBn ? 'সবে প্রয়োগ' : 'Apply to all'}</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                value={unitPriceInput}
                onChange={(e) => setUnitPriceInput(e.target.value)}
                placeholder={isBn ? 'মূল্য লিখুন...' : 'Enter unit price...'}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {isBn ? 'যেকোনো মান মুছে পুনরায় লিখতে পারেন' : 'Can be cleared and re-entered freely'}
              </p>
            </div>
          </div>

          {/* Individual Initial Deposit for each new share */}
          {newShareNumbers.length > 0 && (
            <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    {isBn ? 'প্রতিটি নতুন শেয়ারের পৃথক প্রাথমিক জমা' : 'Separate Initial Deposit for Each New Share'}
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {isBn ? `${toBengaliNumber(newShareNumbers.length)}টি শেয়ার কনফিগারেশন` : `${newShareNumbers.length} shares`}
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {newShareNumbers.map((shareNo, idx) => (
                  <div
                    key={shareNo}
                    className="p-3 bg-white border border-slate-200/90 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 text-xs font-black flex items-center justify-center font-mono shrink-0">
                        {isBn || useBengaliDigits ? toBengaliNumber(shareNo) : shareNo}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {isBn ? `শেয়ার #${toBengaliNumber(shareNo)} প্রাথমিক জমা` : `Share #${shareNo} Initial Deposit`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {isBn ? `নতুন শেয়ার ক্রমিক ${toBengaliNumber(idx + 1)}` : `New Share item ${idx + 1}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        value={shareAmounts[shareNo] !== undefined ? shareAmounts[shareNo] : ''}
                        onChange={(e) => handleShareAmountChange(shareNo, e.target.value)}
                        placeholder="0"
                        className="w-28 sm:w-32 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 text-right bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-blue-700 bg-blue-100/60 p-2 rounded-lg leading-relaxed">
                <span className="font-bold">{isBn ? 'উদাহরণ:' : 'Example:'}</span>{' '}
                {isBn
                  ? 'বিদ্যমান ১টি শেয়ার থাকলে ২য় শেয়ারের প্রাথমিক জমা ৳২০,০০০ এবং ৩য় শেয়ারের প্রাথমিক জমা ৳১০,০০০ পৃথকভাবে এন্ট্রি করে সংরক্ষণ করা হবে।'
                  : 'If existing is 1 share, Share 2 initial deposit ৳20,000 and Share 3 initial deposit ৳10,000 will be saved individually.'}
              </p>
            </div>
          )}

          {/* Total & Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl p-4 space-y-2.5 shadow-md">
            <div className="flex justify-between items-center text-slate-300 text-xs">
              <span>{isBn ? 'মোট শেয়ার ক্রয় ও মূলধন জমা:' : 'Total Capital Deposit:'}</span>
              <span className="font-black text-emerald-400 text-base font-mono">
                {formatCurrency(totalAmount, isBn && useBengaliDigits)}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300 text-xs pt-2 border-t border-slate-700/80">
              <span>{isBn ? 'ক্রয়ের পর মোট সক্রিয় শেয়ার সংখ্যা:' : 'Total shares after purchase:'}</span>
              <span className="font-bold text-blue-200 font-mono">
                {isBn || useBengaliDigits ? toBengaliNumber(newTotalShares) : newTotalShares} {isBn ? 'টি' : 'Shares'}
              </span>
            </div>

            {newShareNumbers.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 block mb-1">
                  {isBn ? 'শেয়ারভিত্তিক পৃথক জমার সারাংশ:' : 'Share-wise deposit summary:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {newShareNumbers.map(sNo => (
                    <span
                      key={sNo}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-mono border border-white/15"
                    >
                      <span>{isBn ? `শেয়ার #${toBengaliNumber(sNo)}:` : `Share #${sNo}:`}</span>
                      <span className="font-bold text-emerald-300">
                        {formatCurrency(Number(shareAmounts[sNo]) || 0, isBn && useBengaliDigits)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'জমার মাধ্যম' : 'Payment Method'} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ক্যাশ' : 'Cash'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    paymentMethod === 'bank'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Landmark className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ব্যাংক' : 'Bank'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'জমার তারিখ' : 'Deposit Date'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {paymentMethod === 'bank' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'ব্যাংক অ্যাকাউন্ট নির্বাচন করুন' : 'Select Bank Account'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} ({isBn ? 'ব্যালেন্স:' : 'Balance:'} ৳{b.balance})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'মন্তব্য (ঐচ্ছিক)' : 'Notes (Optional)'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isBn ? 'নতুন শেয়ার ক্রয় বাবদ জমা' : 'Share purchase deposit notes'}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedSharesToBuy <= 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>{isBn ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'শেয়ার জমা নিশ্চিত করুন' : 'Confirm Share Deposit'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
