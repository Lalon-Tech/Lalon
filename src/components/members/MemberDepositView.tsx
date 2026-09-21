import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, 
  ArrowDownCircle, 
  Coins, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Phone, 
  Calendar, 
  Sparkles, 
  Layers,
  FileText,
  CreditCard,
  Plus,
  Check,
  User,
  ShieldCheck
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, toBengaliNumber, formatBengaliDate } from '../../utils/bengaliUtils';
import { calculateMemberRemainingShares } from '../../utils/shareCalculation';

export const MemberDepositView: React.FC = () => {
  const { 
    currentUser, 
    members, 
    transactions, 
    savingsSchemes, 
    bankAccounts, 
    shareClosures,
    addDeposit, 
    useBengaliDigits,
    openReceiptForTx,
    setShowQuickDepositModal,
    selectedMemberId: contextMemberId,
    setSelectedMemberId: setContextMemberId
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'collector';

  // Identify member if member user is logged in
  const loggedInMember = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.memberId) {
      const found = members.find(m => m.id === currentUser.memberId);
      if (found) return found;
    }
    return members.find(m => 
      (currentUser.memberNo && m.memberNo === currentUser.memberNo) ||
      (currentUser.phone && m.phone === currentUser.phone) ||
      (currentUser.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
    ) || null;
  }, [currentUser, members]);

  // If Admin is browsing, allow selecting any member
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (loggedInMember) return loggedInMember.id;
    if (contextMemberId) return contextMemberId;
    return members[0]?.id || '';
  });

  const currentMember = useMemo(() => {
    return members.find(m => m.id === selectedMemberId) || loggedInMember || members[0] || null;
  }, [selectedMemberId, members, loggedInMember]);

  // Form states
  const [schemeType, setSchemeType] = useState<'general' | 'dps' | 'fdr'>('general');
  const [selectedShareNo, setSelectedShareNo] = useState<number | 'all'>(1);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [trxId, setTrxId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [depositDate, setDepositDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active shares calculation for current member
  const activeShareCount = useMemo(() => {
    if (!currentMember) return 0;
    return calculateMemberRemainingShares(currentMember, transactions, shareClosures);
  }, [currentMember, transactions, shareClosures]);

  // Active savings schemes for this member
  const memberSchemes = useMemo(() => {
    if (!currentMember) return [];
    return savingsSchemes.filter(s => s.memberId === currentMember.id && s.status === 'active');
  }, [savingsSchemes, currentMember]);

  const activeDpsSchemes = memberSchemes.filter(s => s.type === 'dps');
  const activeFdrSchemes = memberSchemes.filter(s => s.type === 'fdr');

  // Member's deposit transactions (both completed and pending)
  const memberDeposits = useMemo(() => {
    if (!currentMember) return [];
    return transactions
      .filter(t => 
        t.memberId === currentMember.id && 
        ['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase'].includes(t.type)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMember]);

  const pendingDepositsCount = memberDeposits.filter(t => t.status === 'pending').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentMember) {
      setFeedback({
        type: 'error',
        message: isBn ? 'সদস্য হিসাব পাওয়া যায়নি।' : 'Member account not found.'
      });
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setFeedback({
        type: 'error',
        message: isBn ? 'অনুগ্রহ করে সঠিক জমার পরিমাণ লিখুন।' : 'Please enter a valid deposit amount.'
      });
      return;
    }

    if (paymentMethod === 'bank' && !bankAccountId) {
      setFeedback({
        type: 'error',
        message: isBn ? 'অনুগ্রহ করে ব্যাংক একাউন্ট নির্বাচন করুন।' : 'Please select a bank account.'
      });
      return;
    }

    if ((schemeType === 'dps' || schemeType === 'fdr') && !selectedSchemeId) {
      if (schemeType === 'dps' && activeDpsSchemes.length > 0) {
        // default to first
      } else if (schemeType === 'fdr' && activeFdrSchemes.length > 0) {
        // default to first
      } else {
        setFeedback({
          type: 'error',
          message: isBn ? `আপনার কোনো সক্রিয় ${schemeType.toUpperCase()} একাউন্ট নেই। সাধারণ সঞ্চয় নির্বাচন করুন।` : `No active ${schemeType.toUpperCase()} account found.`
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Build share-wise attributes
      const isSpecificShare = schemeType === 'general' && typeof selectedShareNo === 'number';
      const selectedShares = isSpecificShare ? [selectedShareNo] : undefined;
      const shareAmounts = isSpecificShare ? { [selectedShareNo]: numAmount } : undefined;
      const shareRate = isSpecificShare 
        ? numAmount 
        : (activeShareCount > 0 ? Number((numAmount / activeShareCount).toFixed(2)) : numAmount);

      const shareTag = isSpecificShare ? `শেয়ার #${selectedShareNo}-এ জমা` : '';
      const fullNotes = [
        shareTag,
        trxId ? `TrxID/Ref: ${trxId.trim()}` : '',
        notes.trim()
      ].filter(Boolean).join(' | ');

      await addDeposit({
        memberId: currentMember.id,
        schemeType,
        schemeId: selectedSchemeId || (schemeType === 'dps' ? activeDpsSchemes[0]?.id : schemeType === 'fdr' ? activeFdrSchemes[0]?.id : undefined),
        amount: numAmount,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
        selectedShares,
        shareAmounts,
        shareRate,
        totalMemberShares: activeShareCount,
        notes: fullNotes,
        date: depositDate,
        depositMonth: String(new Date(depositDate).getMonth() + 1).padStart(2, '0'),
        depositYear: new Date(depositDate).getFullYear(),
      });

      setFeedback({
        type: 'success',
        message: isBn
          ? `৳${formatCurrency(numAmount, isBn && useBengaliDigits)} টাকার জমার আবেদন সফলভাবে জমা হয়েছে! অ্যাডমিন অনুমোদনের পর তা সরাসরি আপনার নির্বাচিত শেয়ার ও পাসবুকে যুক্ত হবে।`
          : `Deposit request of ৳${numAmount} submitted successfully! It will appear in your passbook once approved by Admin.`
      });

      // Reset form fields
      setAmount(1000);
      setTrxId('');
      setNotes('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || (isBn ? 'আবেদন জমা দিতে সমস্যা হয়েছে।' : 'Failed to submit deposit request.')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentMember) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center max-w-lg mx-auto my-8 space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">
          {isBn ? 'কোনো সক্রিয় সদস্য পাওয়া যায়নি' : 'No Active Member Found'}
        </h3>
        <p className="text-xs text-slate-500">
          {isBn ? 'সদস্য হিসাব সংযুক্ত করতে অ্যাডমিন প্যানেলে যোগাযোগ করুন।' : 'Please contact administration to link a member profile.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-xs border border-emerald-400/20">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <span>{isBn ? 'শেয়ারভিত্তিক সঞ্চয় জমা পোর্টাল' : 'Share-Wise Deposit Portal'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {currentMember.name}
            </h1>
            <p className="text-xs text-emerald-200/90">
              {isBn 
                ? `সদস্য নং: #${currentMember.memberNo} • মোবাইল: ${currentMember.phone} • সক্রিয় শেয়ার: ${toBengaliNumber(activeShareCount)}টি` 
                : `Member #${currentMember.memberNo} • Phone: ${currentMember.phone} • Active Shares: ${activeShareCount}`}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Admin Member Switcher */}
            {isAdminOrStaff && members.length > 1 && (
              <div className="relative">
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    setContextMemberId(e.target.value);
                  }}
                  className="px-3 py-2 bg-emerald-950/80 text-white rounded-xl text-xs font-semibold border border-emerald-700/60 focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      #{m.memberNo} - {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowQuickDepositModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/20"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isBn ? 'ক্যালকুলেটর মোডাল' : 'Advanced Modal'}</span>
            </button>
          </div>
        </div>

        {/* Member Financial Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/15 text-white">
          <div className="bg-black/20 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block">{isBn ? 'অনুমোদিত সাধারণ সঞ্চয় স্থিতি' : 'General Savings'}</span>
            <span className="text-base sm:text-lg font-bold">
              ৳{formatCurrency(currentMember.generalSavingsBalance || currentMember.totalDeposit || 0, isBn && useBengaliDigits)}
            </span>
          </div>
          <div className="bg-black/20 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block">{isBn ? 'সক্রিয় শেয়ার সংখ্যা' : 'Active Shares'}</span>
            <span className="text-base sm:text-lg font-bold font-mono">
              {isBn || useBengaliDigits ? toBengaliNumber(activeShareCount) : activeShareCount} {isBn ? 'টি' : 'Shares'}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-black/20 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[11px] text-emerald-200 block">{isBn ? 'অনুমোদন অপেক্ষমাণ জমা' : 'Pending Approval'}</span>
            <span className="text-base sm:text-lg font-bold text-amber-300">
              {isBn || useBengaliDigits ? toBengaliNumber(pendingDepositsCount) : pendingDepositsCount} {isBn ? 'টি আবেদন' : 'requests'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Submission Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isBn ? 'নতুন সঞ্চয় জমার আবেদন' : 'Submit Deposit Request'}
            </h2>
            <p className="text-xs text-slate-500">
              {isBn ? 'শেয়ার বা স্কিম নির্বাচন করে জমার পরিমাণ প্রদান করুন' : 'Select share/scheme and enter deposit amount for admin approval'}
            </p>
          </div>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 mb-5 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Scheme Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isBn ? 'জমার খাত / স্কিম নির্বাচন করুন' : 'Select Deposit Scheme'} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSchemeType('general')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  schemeType === 'general'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span className="text-xs">{isBn ? 'সাধারণ সঞ্চয়' : 'General'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSchemeType('dps')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  schemeType === 'dps'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-xs">
                  {isBn ? 'ডিপিএস (DPS)' : 'DPS Scheme'}
                  {activeDpsSchemes.length > 0 && ` (${activeDpsSchemes.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSchemeType('fdr')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  schemeType === 'fdr'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span className="text-xs">
                  {isBn ? 'এফডিআর (FDR)' : 'FDR Scheme'}
                  {activeFdrSchemes.length > 0 && ` (${activeFdrSchemes.length})`}
                </span>
              </button>
            </div>
          </div>

          {/* SHARE-WISE DEPOSIT: Specific Active Share Selection (Share 1, Share 2, etc.) */}
          {schemeType === 'general' && activeShareCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span>{isBn ? 'শেয়ার নির্বাচন করুন (Share-Wise Deposit)' : 'Select Active Share'}</span>
                </label>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full font-mono">
                  {isBn ? `সক্রিয় শেয়ার: ${toBengaliNumber(activeShareCount)}টি` : `Active Shares: ${activeShareCount}`}
                </span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                {isBn 
                  ? 'যে নির্দিষ্ট সক্রিয় শেয়ারে জমা দিতে চান তা নির্বাচন করুন। প্রতিটি জমা নির্বাচিত শেয়ারের সাথে যুক্ত থাকবে।'
                  : 'Select a specific active share to link this deposit to (Share 1, Share 2, etc.).'}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {Array.from({ length: activeShareCount }, (_, idx) => idx + 1).map((sNo) => {
                  const isSelected = selectedShareNo === sNo;
                  return (
                    <button
                      key={sNo}
                      type="button"
                      onClick={() => setSelectedShareNo(sNo)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-700 text-white shadow-xs scale-102 ring-2 ring-amber-400'
                          : 'bg-white text-slate-800 border border-amber-300 hover:bg-amber-100/70'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      <span>{isBn ? `শেয়ার ${toBengaliNumber(sNo)}` : `Share ${sNo}`}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setSelectedShareNo('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedShareNo === 'all'
                      ? 'bg-amber-700 text-white shadow-xs scale-102 ring-2 ring-amber-400'
                      : 'bg-white text-slate-800 border border-amber-300 hover:bg-amber-100/70'
                  }`}
                >
                  {selectedShareNo === 'all' && <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{isBn ? 'সকল শেয়ারে আনুপাতিক' : 'All Shares Proportional'}</span>
                </button>
              </div>

              <div className="text-[11px] text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {selectedShareNo === 'all' 
                    ? (isBn ? 'এই জমার অর্থ আপনার সকল সক্রিয় শেয়ারে সমানভাবে বণ্টন হবে।' : 'This deposit will be divided equally across all active shares.')
                    : (isBn ? `এই জমার অর্থ সরাসরি আপনার শেয়ার #${toBengaliNumber(selectedShareNo)}-এর সঞ্চয় স্থিতিতে যুক্ত হবে।` : `This deposit will be credited directly to Share #${selectedShareNo}.`)}
                </span>
              </div>
            </div>
          )}

          {/* If DPS/FDR is selected, choose specific scheme account */}
          {schemeType === 'dps' && activeDpsSchemes.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isBn ? 'ডিপিএস একাউন্ট নম্বর নির্বাচন করুন' : 'Select DPS Account'}
              </label>
              <select
                value={selectedSchemeId}
                onChange={(e) => setSelectedSchemeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                {activeDpsSchemes.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.accountNumber || s.id} - ৳{s.monthlyInstallment}/মাস ({s.durationYears} বছর)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {schemeType === 'general' && typeof selectedShareNo === 'number'
                  ? (isBn ? `শেয়ার #${toBengaliNumber(selectedShareNo)}-এর জমার পরিমাণ (টাকা)` : `Deposit Amount for Share #${selectedShareNo} (৳)`)
                  : (isBn ? 'জমার পরিমাণ (টাকা)' : 'Deposit Amount (৳)')} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {isBn ? 'কুইক চিপস ক্লিক করে পরিবর্তন করতে পারেন' : 'Click quick chips to set'}
              </span>
            </div>
            
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                ৳
              </span>
              <input
                type="number"
                min="10"
                step="10"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base font-bold text-slate-900"
                placeholder={isBn ? 'যেমন: ১০০০' : 'e.g. 1000'}
                required
              />
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[500, 1000, 1500, 2000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                >
                  +৳{isBn || useBengaliDigits ? toBengaliNumber(val) : val}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isBn ? 'পরিশোধের মাধ্যম' : 'Payment Method'} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'cash', label: isBn ? 'ক্যাশ (নগদ)' : 'Cash' },
                { id: 'bank', label: isBn ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer' },
                { id: 'bkash', label: isBn ? 'বিকাশ (bKash)' : 'bKash' },
                { id: 'nagad', label: isBn ? 'নগদ (Nagad)' : 'Nagad' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-semibold ${
                    paymentMethod === m.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* If Bank selected, show Society Bank Accounts */}
          {paymentMethod === 'bank' && (
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
              <label className="block text-xs font-bold text-blue-900">
                {isBn ? 'সমিতির ব্যাংক একাউন্ট নির্বাচন করুন' : 'Select Society Bank Account'} <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-blue-300 bg-white text-slate-800 font-medium"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} ({b.branchName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TrxID / Reference (for mobile or bank) */}
          {(paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'bank') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isBn ? 'ট্রানজেকশন আইডি / রেফারেন্স নম্বর' : 'Transaction ID / Reference'}
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder={isBn ? 'যেমন: 9JH2KL89' : 'e.g. 9JH2KL89'}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Date & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isBn ? 'জমার তারিখ' : 'Deposit Date'}
              </label>
              <input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isBn ? 'মন্তব্য / বিবরণ (ঐচ্ছিক)' : 'Notes / Remarks (Optional)'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isBn ? 'যেমন: নিয়মিত কিস্তি' : 'e.g. Regular deposit'}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* Admin Approval Notice Banner */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isBn
                ? 'সদস্য একাউন্ট থেকে জমার আবেদন সাবমিট করা হলে তা অনুমোদনের জন্য অপেক্ষমাণ (Pending) থাকবে। অ্যাডমিন কর্তৃক অনুমোদিত হলেই এটি নির্বাচিত শেয়ার, সঞ্চয় স্থিতি ও পাসবুকে কার্যকর হবে।'
                : 'Deposit requests are marked as Pending. Once approved by an Admin, the deposit will be credited to the selected share and recorded in your official passbook.'}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>{isBn ? 'আবেদন পাঠানো হচ্ছে...' : 'Submitting Request...'}</span>
              </>
            ) : (
              <>
                <ArrowDownCircle className="w-5 h-5" />
                <span>{isBn ? 'জমার আবেদন সাবমিট করুন' : 'Submit Deposit Request'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Member's Deposit Request History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'আমার সাম্প্রতিক জমার আবেদন ও হিস্ট্রি' : 'My Recent Deposit History'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isBn ? `মোট ${toBengaliNumber(memberDeposits.length)}টি` : `${memberDeposits.length} Total`}
          </span>
        </div>

        {memberDeposits.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {isBn ? 'এখনও কোনো জমার রেকর্ড নেই।' : 'No deposit records found.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {memberDeposits.slice(0, 10).map((tx) => {
              const isPending = tx.status === 'pending';
              const shareInfo = tx.selectedShares && tx.selectedShares.length > 0 
                ? (isBn ? `শেয়ার #${toBengaliNumber(tx.selectedShares[0])}` : `Share #${tx.selectedShares[0]}`)
                : '';

              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {tx.type === 'dps_deposit' 
                          ? (isBn ? 'ডিপিএস জমা' : 'DPS Deposit')
                          : tx.type === 'fdr_deposit'
                            ? (isBn ? 'এফডিআর জমা' : 'FDR Deposit')
                            : (isBn ? 'সাধারণ সঞ্চয় জমা' : 'General Savings')}
                      </span>
                      {shareInfo && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {shareInfo}
                        </span>
                      )}
                      {isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3" />
                          {isBn ? 'অনুমোদনের অপেক্ষায়' : 'Pending Approval'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          {isBn ? 'অনুমোদিত' : 'Approved'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {formatBengaliDate(tx.date, isBn)} • {tx.paymentMethod.toUpperCase()}
                      {tx.notes && ` • ${tx.notes}`}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-emerald-700 block">
                      +{formatCurrency(tx.amount, isBn && useBengaliDigits)}
                    </span>
                    {!isPending && (
                      <button
                        type="button"
                        onClick={() => openReceiptForTx(tx)}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer mt-0.5"
                      >
                        {isBn ? 'রসিদ দেখুন' : 'View Receipt'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
