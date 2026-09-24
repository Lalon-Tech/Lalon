import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  HandCoins, 
  Coins,
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Banknote, 
  FileText, 
  User, 
  Info, 
  Sparkles, 
  CheckSquare, 
  ArrowRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod, Loan } from '../../types';
import { formatCurrency, toBengaliNumber, formatBengaliDate } from '../../utils/bengaliUtils';

export const MemberLoanPaymentView: React.FC = () => {
  const { 
    currentUser, 
    members, 
    loans, 
    transactions, 
    bankAccounts, 
    submitLoanPaymentRequest, 
    useBengaliDigits,
    openReceiptForTx,
    setShowQuickLoanModal
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Identify current member
  const currentMember = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.memberId) {
      const found = members.find(m => m.id === currentUser.memberId);
      if (found) return found;
    }
    const authEmail = (currentUser.email || '').toLowerCase().trim();
    return members.find(m => 
      (authEmail && m.email && m.email.toLowerCase() === authEmail) ||
      (currentUser.phone && m.phone && m.phone === currentUser.phone)
    ) || null;
  }, [currentUser, members]);

  // Active loans of this member
  const memberActiveLoans = useMemo(() => {
    if (!currentMember) return [];
    return loans.filter(l => 
      l.memberId === currentMember.id && 
      l.status === 'active' && 
      (Number(l.remainingAmount) > 0 || (Number(l.totalAmount) - Number(l.paidAmount)) > 0)
    );
  }, [loans, currentMember]);

  // Form states
  const [selectedLoanId, setSelectedLoanId] = useState<string>(memberActiveLoans[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<'installment' | 'custom' | 'full'>('installment');
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [trxId, setTrxId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active selected loan
  const selectedLoan = useMemo(() => {
    if (!selectedLoanId) return memberActiveLoans[0] || null;
    return memberActiveLoans.find(l => l.id === selectedLoanId) || memberActiveLoans[0] || null;
  }, [memberActiveLoans, selectedLoanId]);

  // Outstanding loan balance calculation
  const outstandingBalance = useMemo(() => {
    if (!selectedLoan) return 0;
    const remaining = Number(selectedLoan.remainingAmount);
    if (!isNaN(remaining) && remaining >= 0) return remaining;
    return Math.max(0, (Number(selectedLoan.totalAmount) || 0) - (Number(selectedLoan.paidAmount) || 0));
  }, [selectedLoan]);

  // Next installment amount
  const nextInstallmentAmount = useMemo(() => {
    if (!selectedLoan) return 0;
    if (selectedLoan.installmentAmount && selectedLoan.installmentAmount > 0) {
      return Math.min(selectedLoan.installmentAmount, outstandingBalance);
    }
    return Math.min(1000, outstandingBalance);
  }, [selectedLoan, outstandingBalance]);

  // Effective payment amount based on paymentMode
  const effectiveAmount = useMemo(() => {
    if (paymentMode === 'installment') return nextInstallmentAmount;
    if (paymentMode === 'full') return outstandingBalance;
    return Number(customAmount) || 0;
  }, [paymentMode, nextInstallmentAmount, outstandingBalance, customAmount]);

  // All loan payment transactions submitted by this member
  const memberLoanTransactions = useMemo(() => {
    if (!currentMember) return [];
    return transactions
      .filter(t => 
        t.memberId === currentMember.id && 
        ['loan_installment', 'loan_payment'].includes(t.type)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentMember) {
      setFeedback({ type: 'error', message: isBn ? 'সদস্য একাউন্ট লিঙ্ক করা নেই।' : 'Member account not linked.' });
      return;
    }

    if (!selectedLoan) {
      setFeedback({ type: 'error', message: isBn ? 'পরিশোধের জন্য কোনো সক্রিয় ঋণ নির্বাচন করা হয়নি।' : 'No active loan selected.' });
      return;
    }

    if (!effectiveAmount || effectiveAmount <= 0) {
      setFeedback({ type: 'error', message: isBn ? 'সঠিক পরিশোধের পরিমাণ লিখুন।' : 'Please specify a valid payment amount.' });
      return;
    }

    if (effectiveAmount > outstandingBalance) {
      setFeedback({
        type: 'error',
        message: isBn 
          ? `পরিশোধের পরিমাণ অবশিষ্ট বকেয়া (৳${formatCurrency(outstandingBalance, isBn && useBengaliDigits)})-এর চেয়ে বেশি হতে পারে না।`
          : `Payment cannot exceed the outstanding balance of ৳${outstandingBalance}.`
      });
      return;
    }

    if (paymentMethod === 'bank' && !bankAccountId) {
      setFeedback({ type: 'error', message: isBn ? 'ব্যাংক একাউন্ট নির্বাচন করুন।' : 'Please select a bank account.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const fullNotes = [
        trxId ? `TrxID: ${trxId.trim()}` : '',
        paymentMode === 'full' ? '[সম্পূর্ণ ঋণ পরিশোধ আবেদন]' : '',
        notes.trim()
      ].filter(Boolean).join(' | ');

      const res = await submitLoanPaymentRequest({
        loanId: selectedLoan.id,
        amount: effectiveAmount,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
        notes: fullNotes,
        isFullPayment: paymentMode === 'full' || effectiveAmount >= outstandingBalance,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || (isBn
            ? `৳${formatCurrency(effectiveAmount, isBn && useBengaliDigits)} টাকার ঋণ পরিশোধ আবেদন সফলভাবে গৃহীত হয়েছে! অ্যাডমিন অনুমোদনের পর ঋণ হিসাব সমন্বয় হবে।`
            : `Payment request of ৳${effectiveAmount} submitted successfully! Requires Admin approval.`)
        });
        setCustomAmount('');
        setTrxId('');
        setNotes('');
        setPaymentMode('installment');
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || (isBn ? 'পেমেন্ট সাবমিট করতে সমস্যা হয়েছে।' : 'Failed to submit loan payment.')
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
          {isBn ? 'সদস্য তথ্য পাওয়া যায়নি' : 'Member Record Not Found'}
        </h3>
        <p className="text-xs text-slate-500">
          {isBn ? 'আপনার প্রোফাইলের সাথে সদস্য হিসাব সংযুক্ত করা হয়নি।' : 'No linked member profile found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-200 text-xs font-semibold backdrop-blur-xs">
              <CreditCard className="w-4 h-4" />
              <span>{isBn ? 'ঋণ পরিশোধ ও কিস্তি পোর্টাল' : 'Loan Payment Portal'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-2">
              {isBn ? 'ঋণ কিস্তি ও সম্পূর্ণ ঋণ পরিশোধ' : 'Loan Repayment & Installments'}
            </h1>
            <p className="text-xs text-blue-200 max-w-xl leading-relaxed mt-1">
              {isBn
                ? 'সদস্য আইডি ' + currentMember.memberNo + ' • ' + currentMember.name + '। যেকোনো পরিমাণ কিস্তি অথবা সম্পূর্ণ ঋণ একবারে পরিশোধের আবেদন করতে পারেন। অ্যাডমিন অনুমোদনের পর তা সমন্বয় হবে।'
                : `Member #${currentMember.memberNo} • ${currentMember.name}. Submit any custom amount or full loan settlement. Admin approval is required.`}
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setShowQuickLoanModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <HandCoins className="w-4 h-4" />
              <span>{isBn ? 'নতুন ঋণের আবেদন' : 'Apply for New Loan'}</span>
            </button>
          </div>
        </div>

        {/* Loan Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/15">
          <div className="bg-black/20 rounded-xl p-3">
            <span className="text-[11px] text-blue-200 block">{isBn ? 'সক্রিয় ঋণের সংখ্যা' : 'Active Loans'}</span>
            <span className="text-base sm:text-lg font-bold">
              {isBn || useBengaliDigits ? toBengaliNumber(memberActiveLoans.length) : memberActiveLoans.length} {isBn ? 'টি' : ''}
            </span>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <span className="text-[11px] text-blue-200 block">{isBn ? 'মোট অবশিষ্ট বকেয়া' : 'Total Outstanding'}</span>
            <span className="text-base sm:text-lg font-bold text-amber-300">
              {formatCurrency(
                memberActiveLoans.reduce((sum, l) => sum + (Number(l.remainingAmount) || (Number(l.totalAmount) - Number(l.paidAmount))), 0),
                isBn && useBengaliDigits
              )}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-black/20 rounded-xl p-3">
            <span className="text-[11px] text-blue-200 block">{isBn ? 'অনুমোদনের অপেক্ষায় পেমেন্ট' : 'Pending Approvals'}</span>
            <span className="text-base sm:text-lg font-bold text-cyan-300">
              {isBn || useBengaliDigits ? toBengaliNumber(memberLoanTransactions.filter(t => t.status === 'pending').length) : memberLoanTransactions.filter(t => t.status === 'pending').length} {isBn ? 'টি' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* When Member Has No Active Loan */}
      {memberActiveLoans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              {isBn ? 'বর্তমানে আপনার কোনো সক্রিয় বা বকেয়া ঋণ নেই' : 'You have no active or overdue loans'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {isBn
                ? 'আপনার সকল পূর্ববর্তী ঋণের কিস্তি সম্পূর্ণরূপে পরিশোধিত হয়েছে। সমিতি থেকে নতুন ক্ষুদ্রঋণ বা বিনিয়োগের জন্য আবেদন করতে পারেন।'
                : 'All your previous loans have been fully repaid. You can apply for a new loan or business financing.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickLoanModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <HandCoins className="w-4 h-4" />
            <span>{isBn ? 'নতুন ঋণের আবেদনপত্র খুলুন' : 'Apply for a Loan'}</span>
          </button>
        </div>
      ) : (
        /* When Member Has Active Loan(s) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-6">
          {/* Active Loan Details Card */}
          {selectedLoan && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    #
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {isBn ? 'চলতি ঋণের হিসাব বিবরণী' : 'Current Active Loan'}
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ID: {selectedLoan.id}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                    {isBn ? 'অবশিষ্ট বকেয়া ঋণ' : 'Outstanding Balance'}
                  </span>
                  <span className="text-base sm:text-lg font-bold text-rose-600">
                    {formatCurrency(outstandingBalance, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">{isBn ? 'মূল ঋণ' : 'Principal'}</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(selectedLoan.principalAmount || 0, isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">{isBn ? 'মুনাফাসহ প্রদেয়' : 'Total Payable'}</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(selectedLoan.totalAmount || 0, isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">{isBn ? 'মোট পরিশোধিত' : 'Total Paid'}</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(selectedLoan.paidAmount || 0, isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">{isBn ? 'প্রদেয় কিস্তি' : 'Next Installment'}</span>
                  <span className="font-bold text-indigo-700">
                    {formatCurrency(nextInstallmentAmount, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>

              {/* Repayment Progress Bar */}
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>{isBn ? 'ঋণ পরিশোধ অগ্রগতি' : 'Repayment Progress'}</span>
                  <span>
                    {Math.round(((Number(selectedLoan.paidAmount) || 0) / (Number(selectedLoan.totalAmount) || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${Math.min(100, Math.round(((Number(selectedLoan.paidAmount) || 0) / (Number(selectedLoan.totalAmount) || 1)) * 100))}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Feedback message */}
          {feedback && (
            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
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

          {/* Payment Submission Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* If member has multiple loans, dropdown to select */}
            {memberActiveLoans.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isBn ? 'পরিশোধের ঋণ একাউন্ট নির্বাচন করুন' : 'Select Loan Account'}
                </label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {memberActiveLoans.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.id} - বকেয়া ৳{l.remainingAmount || (l.totalAmount - l.paidAmount)} (কিস্তি ৳{l.installmentAmount})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {isBn ? 'পরিশোধের ধরন নির্বাচন করুন' : 'Select Payment Option'} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('installment')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMode === 'installment'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{isBn ? 'এক কিস্তি' : 'Next Installment'}</span>
                    <HandCoins className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-indigo-700 block">
                    {formatCurrency(nextInstallmentAmount, isBn && useBengaliDigits)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {isBn ? 'নিয়মিত কিস্তি পরিশোধ' : 'Regular installment'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('custom')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMode === 'custom'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{isBn ? 'যেকোনো পরিমাণ' : 'Custom Amount'}</span>
                    <Coins className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 block">
                    {isBn ? 'ইচ্ছামত টাকা' : 'Any Amount'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {isBn ? 'বকেয়ার মধ্যে যেকোনো অংক' : 'Up to balance limit'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('full')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMode === 'full'
                      ? 'border-rose-600 bg-rose-50/80 text-rose-900 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{isBn ? 'সম্পূর্ণ ঋণ পরিশোধ' : 'Full Loan Settlement'}</span>
                    <CheckSquare className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-sm font-bold text-rose-700 block">
                    {formatCurrency(outstandingBalance, isBn && useBengaliDigits)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {isBn ? 'সকল বকেয়া একবারে ক্লোজ' : 'Full remaining balance'}
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Amount Input if mode is custom */}
            {paymentMode === 'custom' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isBn ? 'পরিশোধের পরিমাণ লিখুন (টাকা)' : 'Enter Custom Payment Amount (৳)'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={outstandingBalance}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={isBn ? 'যেমন: ৫০০০' : 'e.g. 5000'}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-base font-bold text-slate-900"
                    required
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {isBn ? `সর্বোচ্চ প্রদেয় বকেয়া: ৳${formatCurrency(outstandingBalance, isBn && useBengaliDigits)}` : `Max payable: ৳${outstandingBalance}`}
                </span>
              </div>
            )}

            {/* Selected Effective Payment Highlight */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                {isBn ? 'আবেদনকৃত মোট পেমেন্ট:' : 'Total Payment to Submit:'}
              </span>
              <span className="text-lg font-bold text-indigo-700">
                {formatCurrency(effectiveAmount, isBn && useBengaliDigits)}
              </span>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {isBn ? 'টাকা প্রদানের মাধ্যম' : 'Payment Method'} <span className="text-rose-500">*</span>
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
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-2xs font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank details if Bank selected */}
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

            {/* TrxID (for mobile banking or bank) */}
            {(paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'bank') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isBn ? 'ট্রানজেকশন আইডি / রেফারেন্স নম্বর' : 'Transaction ID / Reference'}
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder={isBn ? 'যেমন: TRX981245' : 'e.g. TRX981245'}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isBn ? 'মন্তব্য / বিবরণ (ঐচ্ছিক)' : 'Notes / Remarks (Optional)'}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isBn ? 'যেমন: মার্চ মাসের কিস্তি পরিশোধ' : 'e.g. Installment for this month'}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            {/* Admin Approval Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isBn
                  ? '⚠️ ঋণ পরিশোধ আবেদনটি সাবমিট করার সাথে সাথে একটি পেন্ডিং রিকোয়েস্ট তৈরি হবে। অ্যাডমিন কর্তৃক অনুমোদিত না হওয়া পর্যন্ত মূল ঋণ হিসাব বা পাসবুকে কোনো টাকা কর্তন হবে না।'
                  : '⚠️ Submitting this loan payment creates a pending request. Once approved by Admin, it will be credited to your loan balance and passbook.'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || effectiveAmount <= 0}
              className="w-full py-3.5 px-4 bg-indigo-700 hover:bg-indigo-800 active:scale-98 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>{isBn ? 'আবেদন পাঠানো হচ্ছে...' : 'Submitting Request...'}</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>
                    {isBn 
                      ? `৳${formatCurrency(effectiveAmount, isBn && useBengaliDigits)} ঋণ পরিশোধ আবেদন সাবমিট করুন` 
                      : `Submit Payment Request for ৳${effectiveAmount}`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Member Loan Payment History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'আমার ঋণ পরিশোধ আবেদন ও হিস্ট্রি' : 'My Loan Payment History'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isBn ? `মোট ${toBengaliNumber(memberLoanTransactions.length)}টি` : `${memberLoanTransactions.length} Total`}
          </span>
        </div>

        {memberLoanTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {isBn ? 'এখনও কোনো ঋণ পরিশোধের রেকর্ড নেই।' : 'No loan payment history found.'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {memberLoanTransactions.slice(0, 10).map((tx) => {
              const isPending = tx.status === 'pending';
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">
                        {isBn ? 'ঋণ কিস্তি পরিশোধ' : 'Loan Payment'}
                      </span>
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
                    <span className="text-sm font-bold text-indigo-700 block">
                      {formatCurrency(tx.amount, isBn && useBengaliDigits)}
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
