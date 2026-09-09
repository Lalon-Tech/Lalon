import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  Calculator, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Coins, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Loan, LoanInstallmentSchedule, PaymentMethod } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';

interface EditLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onUpdated?: () => void;
}

export const EditLoanModal: React.FC<EditLoanModalProps> = ({
  isOpen,
  onClose,
  loan,
  onUpdated
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { updateLoan, useBengaliDigits, transactions } = useSomiti();

  const [principal, setPrincipal] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>('');
  const [termMonths, setTermMonths] = useState<number | ''>('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [totalInstallments, setTotalInstallments] = useState<number | ''>('');
  const [installmentAmount, setInstallmentAmount] = useState<number | ''>('');
  const [purpose, setPurpose] = useState('');
  const [disbursedDate, setDisbursedDate] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');
  const [status, setStatus] = useState<Loan['status']>('active');
  const [auditReason, setAuditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Initialize fields when loan opens
  useEffect(() => {
    if (loan) {
      setPrincipal(loan.principalAmount || 0);
      setInterestRate(loan.interestRate || 0);
      setTermMonths(loan.termMonths || 12);
      setFrequency(loan.installmentFrequency || 'monthly');
      setTotalInstallments(loan.totalInstallments || 12);
      setInstallmentAmount(loan.installmentAmount || 0);
      setPurpose(loan.purpose || '');
      setDisbursedDate(loan.disbursedDate || '');
      setGuarantorName(loan.guarantorName || '');
      setGuarantorPhone(loan.guarantorPhone || '');
      setGuarantorRelation(loan.guarantorRelation || '');
      setStatus(loan.status || 'active');
      setAuditReason('');
      setAlertMsg(null);
    }
  }, [loan]);

  // Actual paid amounts from existing transactions
  const existingPaidInfo = useMemo(() => {
    if (!loan) return { paidAmount: 0, paidCount: 0 };
    const loanTxs = transactions.filter(
      t => t.loanId === loan.id && t.type === 'loan_installment' && t.status === 'completed'
    );
    if (loanTxs.length > 0) {
      const sum = loanTxs.reduce(
        (acc, t) => acc + (Number(t.amount) - (Number(t.fineAmount) || 0) + (Number(t.discountAmount) || 0)), 
        0
      );
      return { paidAmount: sum, paidCount: loanTxs.length };
    }
    return { 
      paidAmount: loan.paidAmount || 0, 
      paidCount: loan.paidInstallmentsCount || 0 
    };
  }, [loan, transactions]);

  // Real-time calculations
  const numPrincipal = Number(principal) || 0;
  const numRate = Number(interestRate) || 0;
  const numInstallments = Number(totalInstallments) || 1;
  const computedTotalInterest = Math.round(numPrincipal * (numRate / 100));
  const computedTotalPayable = numPrincipal + computedTotalInterest;
  const computedPerInstallment = Math.round(computedTotalPayable / Math.max(1, numInstallments));
  const computedRemaining = Math.max(0, computedTotalPayable - existingPaidInfo.paidAmount);

  // Auto-update installment amount when principal/rate/installments change
  const handleAutoCalcInstallment = () => {
    setInstallmentAmount(computedPerInstallment);
  };

  if (!isOpen || !loan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);

    if (numPrincipal <= 0) {
      setAlertMsg({ type: 'error', message: isBn ? 'মূল ঋণের পরিমাণ ১ টাকার বেশি হতে হবে।' : 'Principal must be greater than 0.' });
      return;
    }
    if (numInstallments < 1) {
      setAlertMsg({ type: 'error', message: isBn ? 'মোট কিস্তি সংখ্যা ন্যূনতম ১ হতে হবে।' : 'Total installments must be at least 1.' });
      return;
    }
    if (!auditReason.trim()) {
      setAlertMsg({ type: 'error', message: isBn ? 'অডিট লগের জন্য ঋণ হিসাব সংশোধনের কারণ উল্লেখ করুন।' : 'Please state a reason for this edit (for audit log).' });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalInstallmentAmt = Number(installmentAmount) > 0 ? Number(installmentAmount) : computedPerInstallment;
      const res = updateLoan(
        loan.id,
        {
          principalAmount: numPrincipal,
          interestRate: numRate,
          interestAmount: computedTotalInterest,
          totalAmount: computedTotalPayable,
          termMonths: Number(termMonths) || 1,
          installmentFrequency: frequency,
          totalInstallments: numInstallments,
          installmentAmount: finalInstallmentAmt,
          purpose: purpose.trim(),
          disbursedDate: disbursedDate || loan.disbursedDate,
          guarantorName: guarantorName.trim(),
          guarantorPhone: guarantorPhone.trim(),
          guarantorRelation: guarantorRelation.trim(),
          status: computedRemaining <= 0 ? 'cleared' : status,
        },
        auditReason.trim()
      );

      if (res.success) {
        setAlertMsg({ type: 'success', message: res.message });
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
          if (onUpdated) onUpdated();
        }, 800);
      } else {
        setIsSubmitting(false);
        setAlertMsg({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setAlertMsg({ type: 'error', message: err?.message || 'Update failed' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-indigo-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-800 rounded-xl">
              <Edit3 className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isBn ? 'ঋণ হিসাব সংশোধন ও রিক্যালকুলেশন' : 'Edit & Recalculate Loan Account'}</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-indigo-900/80 rounded-md border border-indigo-500">
                  {loan.loanNo}
                </span>
              </h3>
              <p className="text-xs text-indigo-100">
                {isBn 
                  ? `${loan.memberName} (${loan.memberNo || ''}) — পরিবর্তন অনুযায়ী সর্বত্র স্বয়ংক্রিয় হিসাব সমন্বয় হবে` 
                  : `${loan.memberName} — all related balances will automatically recalculate`}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {alertMsg && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
              alertMsg.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {alertMsg.type === 'error' ? <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              <span>{alertMsg.message}</span>
            </div>
          )}

          {/* Section 1: Financial Numbers & Terms */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>{isBn ? '১. মূল ঋণের অংক ও পরিশোধ শর্তাবলী' : '1. Loan Amount & Terms'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'মূল ঋণ পরিমাণ (৳) *' : 'Principal Amount (৳) *'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'সুদের হার (%) *' : 'Interest Rate (%) *'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'ঋণের মেয়াদ (মাস)' : 'Term (Months)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'কিস্তির ধরন' : 'Installment Frequency'}
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">{isBn ? 'দৈনিক' : 'Daily'}</option>
                  <option value="weekly">{isBn ? 'সাপ্তাহিক' : 'Weekly'}</option>
                  <option value="monthly">{isBn ? 'মাসিক' : 'Monthly'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'মোট কিস্তি সংখ্যা *' : 'Total Installments *'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isBn ? 'প্রতি কিস্তির টাকা (৳)' : 'Installment Amount (৳)'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalcInstallment}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                  >
                    {isBn ? 'স্বয়ংক্রিয় হিসাব' : 'Auto Calculate'}
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  value={installmentAmount}
                  onChange={(e) => setInstallmentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Real-time Live Calculation Overview Card */}
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-indigo-700" />
              <span>{isBn ? 'সংশোধনের পর স্বয়ংক্রিয় আর্থিক চিত্র (Live Projection)' : 'Live Recalculation Overview'}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-indigo-200/60">
                <span className="text-slate-500 block text-[10px]">{isBn ? 'সুদসহ মোট প্রদেয়:' : 'Total Payable:'}</span>
                <span className="text-sm font-black text-indigo-950">
                  {formatCurrency(computedTotalPayable, isBn && useBengaliDigits)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({isBn ? 'সুদ' : 'Int'}: {formatCurrency(computedTotalInterest, isBn && useBengaliDigits)})
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-indigo-200/60">
                <span className="text-slate-500 block text-[10px]">{isBn ? 'পরিশোধিত অংক:' : 'Paid So Far:'}</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(existingPaidInfo.paidAmount, isBn && useBengaliDigits)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ({existingPaidInfo.paidCount} {isBn ? 'কিস্তি আদায়' : 'installments'})
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-indigo-200/60">
                <span className="text-slate-500 block text-[10px]">{isBn ? 'নতুন অবশিষ্ট বকেয়া:' : 'New Due Balance:'}</span>
                <span className="text-sm font-black text-rose-600">
                  {formatCurrency(computedRemaining, isBn && useBengaliDigits)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {computedRemaining <= 0 ? (isBn ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Paid') : (isBn ? 'সদস্য ব্যালেন্স আপডেট হবে' : 'Will update member')}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-indigo-200/60">
                <span className="text-slate-500 block text-[10px]">{isBn ? 'প্রস্তাবিত প্রতি কিস্তি:' : 'Per Installment:'}</span>
                <span className="text-sm font-black text-slate-800">
                  {formatCurrency(computedPerInstallment, isBn && useBengaliDigits)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {numInstallments} {isBn ? 'কিস্তিতে বণ্টন' : 'slots'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Details & Guarantor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'ঋণের উদ্দেশ্য / খাত' : 'Loan Purpose'}
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={isBn ? 'যেমন: মুদি দোকান সম্প্রসারণ' : 'e.g. Business expansion'}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'বিতরণের তারিখ' : 'Disbursed Date'}
              </label>
              <input
                type="date"
                value={disbursedDate}
                onChange={(e) => setDisbursedDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'জামিনদারের নাম' : 'Guarantor Name'}
              </label>
              <input
                type="text"
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'জামিনদারের ফোন' : 'Guarantor Phone'}
              </label>
              <input
                type="text"
                value={guarantorPhone}
                onChange={(e) => setGuarantorPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 4: Audit Log Reason (Required by User Instructions) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-700" />
              <span>{isBn ? 'ঋণ হিসাব সংশোধনের কারণ (অডিট লগের জন্য বাধ্যতামূলক) *' : 'Reason for Edit (Mandatory for Audit Log) *'}</span>
            </label>
            <input
              type="text"
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              required
              placeholder={isBn ? 'যেমন: কিস্তি সংখ্যা ভুল ছিল, বা সুদের হার সমন্বয়...' : 'e.g. Corrected principal amount per approved deed...'}
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
            />
            <p className="text-[11px] text-amber-800 mt-1">
              {isBn 
                ? 'এই কারণ ও সংশোধিত মানগুলো স্থায়ী অডিট লগ ও রিপোর্ট হিস্ট্রিতে রেকর্ড করা হবে।' 
                : 'This reason and all changes will be preserved in the permanent financial audit trail.'}
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'সংশোধন ও হিসাব রিক্যালকুলেট সম্পন্ন করুন' : 'Save & Recalculate'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
