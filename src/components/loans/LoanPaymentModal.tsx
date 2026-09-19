import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Banknote, 
  FileText,
  User,
  Info,
  Sparkles
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { Loan, PaymentMethod } from '../../types';

interface LoanPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLoan?: Loan | null;
}

export const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({
  isOpen,
  onClose,
  initialLoan,
}) => {
  const { 
    loans, 
    members, 
    bankAccounts, 
    currentUser, 
    submitLoanPaymentRequest 
  } = useSomiti();
  const { isBn, toBengaliDigits, useBengaliDigits } = useLanguage();

  const isMember = currentUser?.role === 'member';

  // State
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const num = (val: number | string) => {
    if (val === undefined || val === null || val === '') return '০';
    return isBn || useBengaliDigits ? toBengaliNumber(val) : val.toString();
  };

  const toBengaliNumber = (num: number | string): string => {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
  };

  // Active loans for the selectable context
  const activeLoans = useMemo(() => {
    return loans.filter(l => l.status === 'active' && (Number(l.remainingAmount) > 0 || (Number(l.totalAmount) - Number(l.paidAmount)) > 0));
  }, [loans]);

  // Determine current member
  const currentMember = useMemo(() => {
    if (isMember && currentUser?.memberId) {
      return members.find(m => m.id === currentUser.memberId);
    }
    if (selectedMemberId) {
      return members.find(m => m.id === selectedMemberId);
    }
    return null;
  }, [isMember, currentUser, selectedMemberId, members]);

  // Loans belonging to the selected/current member
  const memberActiveLoans = useMemo(() => {
    if (!currentMember) return [];
    return activeLoans.filter(l => l.memberId === currentMember.id);
  }, [activeLoans, currentMember]);

  // Selected loan object
  const selectedLoan = useMemo(() => {
    if (!selectedLoanId) return null;
    return loans.find(l => l.id === selectedLoanId) || null;
  }, [loans, selectedLoanId]);

  // Outstanding loan balance calculation
  const outstandingBalance = useMemo(() => {
    if (!selectedLoan) return 0;
    const remaining = Number(selectedLoan.remainingAmount);
    if (!isNaN(remaining) && remaining >= 0) return remaining;
    return Math.max(0, (Number(selectedLoan.totalAmount) || 0) - (Number(selectedLoan.paidAmount) || 0));
  }, [selectedLoan]);

  // Next installment amount (if applicable)
  const nextInstallmentAmount = useMemo(() => {
    if (!selectedLoan) return 0;
    if (Array.isArray(selectedLoan.schedule)) {
      const nextUnpaid = selectedLoan.schedule.find(s => s.status !== 'paid');
      if (nextUnpaid && nextUnpaid.amount) {
        return Math.min(Number(nextUnpaid.amount) || 0, outstandingBalance);
      }
    }
    if (selectedLoan.installmentAmount) {
      return Math.min(Number(selectedLoan.installmentAmount) || 0, outstandingBalance);
    }
    return 0;
  }, [selectedLoan, outstandingBalance]);

  // Initialization when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setAmount('');
      setNotes('');
      setPaymentMethod('cash');
      setBankAccountId(bankAccounts[0]?.id || '');

      if (initialLoan) {
        setSelectedMemberId(initialLoan.memberId);
        setSelectedLoanId(initialLoan.id);
        if (initialLoan.installmentAmount) {
          const initDue = Math.min(Number(initialLoan.installmentAmount), Number(initialLoan.remainingAmount) || 0);
          if (initDue > 0) setAmount(initDue.toString());
        }
      } else if (isMember && currentUser?.memberId) {
        setSelectedMemberId(currentUser.memberId);
        const myActive = activeLoans.filter(l => l.memberId === currentUser.memberId);
        if (myActive.length > 0) {
          setSelectedLoanId(myActive[0].id);
          const initDue = Math.min(Number(myActive[0].installmentAmount) || 0, Number(myActive[0].remainingAmount) || 0);
          if (initDue > 0) setAmount(initDue.toString());
        } else {
          setSelectedLoanId('');
        }
      } else {
        if (activeLoans.length > 0) {
          setSelectedMemberId(activeLoans[0].memberId);
          setSelectedLoanId(activeLoans[0].id);
        } else {
          setSelectedMemberId('');
          setSelectedLoanId('');
        }
      }
    }
  }, [isOpen, initialLoan, isMember, currentUser, activeLoans, bankAccounts]);

  // When member changes, update selected loan if needed
  useEffect(() => {
    if (selectedMemberId && !initialLoan) {
      const available = activeLoans.filter(l => l.memberId === selectedMemberId);
      if (available.length > 0 && !available.some(l => l.id === selectedLoanId)) {
        setSelectedLoanId(available[0].id);
      } else if (available.length === 0) {
        setSelectedLoanId('');
      }
    }
  }, [selectedMemberId, activeLoans, initialLoan, selectedLoanId]);

  // Validation
  const numericAmount = Number(amount) || 0;
  const isExceeding = numericAmount > outstandingBalance;
  const isFullPayment = numericAmount > 0 && Math.abs(numericAmount - outstandingBalance) < 0.01;
  const remainingAfterPayment = Math.max(0, outstandingBalance - numericAmount);

  const handleFullPayment = () => {
    if (outstandingBalance > 0) {
      setAmount(outstandingBalance.toString());
      setErrorMsg('');
    }
  };

  const handlePresetAmount = (val: number) => {
    const safeVal = Math.min(val, outstandingBalance);
    setAmount(safeVal.toString());
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedLoanId || !selectedLoan) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে পরিশোধের জন্য একটি ঋণ হিসাব নির্বাচন করুন।' : 'Please select a loan account.');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(isBn ? 'পরিশোধের পরিমাণ অবশ্যই ০ টাকার বেশি হতে হবে।' : 'Payment amount must be greater than 0.');
      return;
    }

    if (isExceeding) {
      setErrorMsg(
        isBn 
          ? `পেমেন্টের পরিমাণ অবশিষ্ট বকেয়া (৳${num(outstandingBalance)})-এর চেয়ে বেশি হতে পারে না।` 
          : `Payment cannot exceed the outstanding balance of ৳${outstandingBalance}.`
      );
      return;
    }

    if (paymentMethod === 'bank' && !bankAccountId) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।' : 'Please select a bank account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitLoanPaymentRequest({
        loanId: selectedLoan.id,
        amount: numericAmount,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
        notes: notes.trim(),
        isFullPayment,
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || (isBn ? 'পেমেন্ট জমা দিতে সমস্যা হয়েছে।' : 'Failed to submit payment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isBn ? 'ঋণ পরিশোধ (Loan Payment)' : 'Loan Payment Form'}
              </h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                {isBn ? 'সদস্যের ঋণ পরিশোধ আবেদন (অ্যাডমিন অনুমোদনের পর কার্যকর হবে)' : 'Submit loan payment request (applied upon Admin approval)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* If no active loans for this member */}
          {!selectedLoan && memberActiveLoans.length === 0 && (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {isBn ? 'কোনো চলমান ঋণ হিসাব পাওয়া যায়নি' : 'No Active Loan Accounts Found'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {isBn 
                    ? 'আপনার বা নির্বাচিত সদস্যের কোনো বকেয়া বা সক্রিয় ঋণ নেই।' 
                    : 'You or the selected member do not have any active or outstanding loans.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          )}

          {/* Main Form */}
          {(selectedLoan || memberActiveLoans.length > 0) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Selector (only for Admin/Staff if member not fixed) */}
              {!isMember && !initialLoan && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? 'সদস্য নির্বাচন করুন *' : 'Select Member *'}
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">{isBn ? '-- সদস্য নির্বাচন করুন --' : '-- Select Member --'}</option>
                    {members
                      .filter(m => activeLoans.some(l => l.memberId === m.id))
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.memberNo}) - {m.phone}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Loan Selector if member has multiple active loans */}
              {memberActiveLoans.length > 1 && !initialLoan && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? 'পরিশোধের ঋণ হিসাব নির্বাচন করুন *' : 'Select Loan Account *'}
                  </label>
                  <select
                    value={selectedLoanId}
                    onChange={(e) => {
                      setSelectedLoanId(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    {memberActiveLoans.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.loanNo} - {l.purpose} (বকেয়া: ৳{num(l.remainingAmount)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selected Loan Overview Card */}
              {selectedLoan && (
                <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-blue-50/50 border border-indigo-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block font-medium leading-none">
                          {isBn ? 'ঋণ নম্বর ও উদ্দেশ্য' : 'Loan No & Purpose'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                          {selectedLoan.loanNo} • {selectedLoan.purpose || (isBn ? 'সাধারণ ঋণ' : 'General Loan')}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10.5px] font-bold">
                      {isBn ? 'চলমান ঋণ' : 'Active Loan'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-2 bg-white/80 rounded-xl border border-slate-200/70">
                      <span className="text-[10.5px] text-slate-500 block font-medium">
                        {isBn ? 'মোট ঋণ (লাভসহ)' : 'Total Loan (with profit)'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                        ৳{num(selectedLoan.totalAmount)}
                      </span>
                    </div>

                    <div className="p-2 bg-white/80 rounded-xl border border-slate-200/70">
                      <span className="text-[10.5px] text-slate-500 block font-medium">
                        {isBn ? 'ইতোমধ্যে পরিশোধিত' : 'Principal/Total Repaid'}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
                        ৳{num(selectedLoan.paidAmount)}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-2 bg-rose-50/90 rounded-xl border border-rose-200">
                      <span className="text-[10.5px] text-rose-700 block font-bold">
                        {isBn ? 'বর্তমান বকেয়া (Outstanding)' : 'Outstanding Balance'}
                      </span>
                      <span className="text-sm font-extrabold text-rose-700 mt-0.5 block">
                        ৳{num(outstandingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Amount Field with Full Payment Button */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{isBn ? 'পরিশোধের পরিমাণ (৳) *' : 'Payment Amount (৳) *'}</span>
                    {isFullPayment && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200 animate-pulse">
                        {isBn ? 'সম্পূর্ণ পরিশোধ' : 'Full Payment'}
                      </span>
                    )}
                  </label>

                  {/* Full Payment Button */}
                  <button
                    type="button"
                    onClick={handleFullPayment}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isBn ? 'সম্পূর্ণ পরিশোধ (Full Payment)' : 'Full Payment'}</span>
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ৳
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={outstandingBalance}
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder={isBn ? `বকেয়া: ৳${num(outstandingBalance)} পর্যন্ত পরিশোধ করতে পারবেন` : `Up to ৳${outstandingBalance}`}
                    className={`w-full bg-slate-50 border rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 ${
                      isExceeding
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500 text-rose-900'
                        : 'border-slate-200 focus:ring-indigo-500 focus:bg-white'
                    }`}
                    required
                  />
                </div>

                {/* Real-time Exceeding Alert */}
                {isExceeding && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isBn 
                        ? `পেমেন্টের পরিমাণ অবশিষ্ট বকেয়া (৳${num(outstandingBalance)})-এর চেয়ে বেশি হতে পারে না।` 
                        : `Payment cannot exceed the outstanding balance of ৳${outstandingBalance}.`}
                    </span>
                  </p>
                )}

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-slate-400 font-medium mr-1">
                    {isBn ? 'কুইক অ্যামাউন্ট:' : 'Quick:'}
                  </span>
                  {nextInstallmentAmount > 0 && nextInstallmentAmount < outstandingBalance && (
                    <button
                      type="button"
                      onClick={() => handlePresetAmount(nextInstallmentAmount)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-md text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      {isBn ? `কিস্তি (৳${num(nextInstallmentAmount)})` : `Kisti (৳${nextInstallmentAmount})`}
                    </button>
                  )}
                  {[1000, 2000, 5000].filter(p => p < outstandingBalance).map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetAmount(preset)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-md text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
                    >
                      ৳{num(preset)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleFullPayment}
                    className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                  >
                    {isBn ? `সম্পূর্ণ (৳${num(outstandingBalance)})` : `Full (৳${outstandingBalance})`}
                  </button>
                </div>

                {/* Calculation After Payment Preview */}
                {numericAmount > 0 && !isExceeding && (
                  <div className="p-2.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 font-medium">
                      {isBn ? 'পরিশোধের পর অবশিষ্ট বকেয়া থাকবে:' : 'Remaining Balance After Payment:'}
                    </span>
                    <span className={`font-bold ${isFullPayment ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {isFullPayment 
                        ? (isBn ? '৳০ (সম্পূর্ণ পরিশোধিত হবে ✓)' : '৳0 (Fully Cleared ✓)')
                        : `৳${num(remainingAfterPayment)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {isBn ? 'পরিশোধের মাধ্যম *' : 'Payment Method *'}
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['cash', 'bank', 'bkash', 'nagad'] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold text-center capitalize border transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {method === 'cash' ? (isBn ? 'ক্যাশ' : 'Cash') : method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Account Selection if Method === 'bank' */}
                {paymentMethod === 'bank' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isBn ? 'সমিতির ব্যাংক হিসাব *' : 'Somiti Bank Account *'}
                    </label>
                    <select
                      value={bankAccountId}
                      onChange={(e) => setBankAccountId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isBn ? 'ট্রানজেকশন / বিবরণী (ঐচ্ছিক)' : 'Transaction ID / Notes (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={isBn ? 'উদা: ট্রানজেকশন আইডি বা মন্তব্য' : 'e.g. Trx ID or note'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Informative Mandatory Approval Notice */}
              <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">
                    {isBn ? 'অ্যাডমিন অনুমোদন বাধ্যতামূলক (Pending Approval)' : 'Admin Approval Mandatory'}
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {isBn 
                      ? 'এই পেমেন্টটি সাবমিট করার সাথে সাথে একটি পেন্ডিং রিকোয়েস্ট তৈরি হবে। অ্যাডমিন কর্তৃক অনুমোদিত না হওয়া পর্যন্ত মূল ঋণ হিসাব, মাঠের মোট বকেয়া বা পাসবুকে কোনো প্রভাব পড়বে না।' 
                      : 'After submission, a Pending Loan Payment Request will be created. Until Admin approves, it will not affect Principal Repaid, Outstanding Balance, Active Loans Out, or Passbook.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || numericAmount <= 0 || isExceeding || !selectedLoan}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isBn ? 'জমা হচ্ছে...' : 'Submitting...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isBn 
                          ? `৳${num(numericAmount || 0)} পরিশোধের আবেদন জমা দিন` 
                          : `Submit Payment Request for ৳${numericAmount || 0}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
