import React, { useState } from 'react';
import { X, Coins, CheckCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';

export const QuickKistiModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    loans, 
    payLoanInstallment, 
    useBengaliDigits,
    settings 
  } = useSomiti();

  const activeLoans = loans.filter(l => l.status === 'active');
  const [selectedLoanId, setSelectedLoanId] = useState(activeLoans[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [fine, setFine] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentLoan = loans.find(l => l.id === selectedLoanId);
  const nextUnpaidInstallment = currentLoan?.schedule.find(s => s.status === 'unpaid');
  const installmentAmount = nextUnpaidInstallment ? nextUnpaidInstallment.amount : (currentLoan?.installmentAmount || 0);
  const installmentNo = nextUnpaidInstallment ? nextUnpaidInstallment.installmentNo : (currentLoan ? currentLoan.paidInstallmentsCount + 1 : 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan || !selectedLoanId) {
      alert('সক্রিয় ঋণ নির্বাচন করুন।');
      return;
    }

    payLoanInstallment({
      loanId: selectedLoanId,
      installmentNo,
      amount: installmentAmount,
      fine: Number(fine) || 0,
      discount: Number(discount) || 0,
      paymentMethod,
      notes: notes.trim(),
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="bg-teal-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">ঋণের কিস্তি আদায় (Kisti POS)</h3>
              <p className="text-xs text-teal-100">মাঠকর্মী ও কাউন্টার কিস্তি সংগ্রহ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-teal-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeLoans.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            বর্তমানে কোনো সক্রিয় ঋণ হিসাব নেই।
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ঋণগ্রহীতা ও ঋণ নির্বাচন করুন <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-semibold"
              >
                {activeLoans.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.loanNo} - {l.memberName} (বকেয়া: {formatCurrency(l.remainingAmount, useBengaliDigits)})
                  </option>
                ))}
              </select>
            </div>

            {/* Loan KPI card */}
            {currentLoan && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-teal-900 font-bold">
                    পরবর্তী কিস্তি নং: #{toBengaliNumber(installmentNo)} / {toBengaliNumber(currentLoan.totalInstallments)}
                  </span>
                  <span className="font-semibold text-teal-700">
                    পরিশোধিত: {toBengaliNumber(currentLoan.paidInstallmentsCount)} টি
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1 border-t border-teal-200/60">
                  <div>
                    <span className="text-slate-500 block">মোট ঋণ:</span>
                    <span className="font-bold">{formatCurrency(currentLoan.totalAmount, useBengaliDigits)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">বাকি পাওনা:</span>
                    <span className="font-bold text-rose-600">{formatCurrency(currentLoan.remainingAmount, useBengaliDigits)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  কিস্তির পরিমাণ (৳)
                </label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-base font-bold text-teal-800">
                  {formatCurrency(installmentAmount, useBengaliDigits)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিলম্ব ফি / জরিমানা (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={fine}
                  onChange={(e) => setFine(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছাড় / ডিসকাউন্ট (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পরিশোধের মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="cash">নগদ ক্যাশ (Cash)</option>
                  <option value="bkash">বিকাশ (bKash)</option>
                  <option value="nagad">নগদ (Nagad)</option>
                  <option value="bank">ব্যাংক (Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোট আদায়কৃত টাকা (৳)
                </label>
                <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-base font-extrabold text-emerald-800">
                  {formatCurrency(installmentAmount + (fine || 0) - (discount || 0), useBengaliDigits)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মন্তব্য
              </label>
              <input
                type="text"
                placeholder="যেমন: সময়মত কিস্তি পরিশোধ"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                কিস্তি আদায় সম্পন্ন করুন ও রসিদ দিন ✓
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
