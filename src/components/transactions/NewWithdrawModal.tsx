import React, { useState } from 'react';
import { X, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/bengaliUtils';

export const NewWithdrawModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    bankAccounts, 
    addWithdrawal, 
    useBengaliDigits 
  } = useSomiti();

  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedMember = members.find(m => m.id === memberId);
  const availableBalance = selectedMember ? selectedMember.generalSavingsBalance : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || amount <= 0) {
      alert(isBn ? 'সদস্য ও সঠিক টাকার পরিমাণ নির্বাচন করুন।' : 'Please select a member and valid amount.');
      return;
    }

    if (amount > availableBalance) {
      const confirmMsg = isBn 
        ? `সদস্যের সাধারণ সঞ্চয় স্থিতি (${formatCurrency(availableBalance, useBengaliDigits)}) উত্তোলনের চেয়ে কম। আপনি কি তবুও উত্তোলন করতে চান?`
        : `Member's savings balance (${formatCurrency(availableBalance, false)}) is less than withdrawal amount. Do you still want to proceed?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    addWithdrawal({
      memberId,
      amount: Number(amount),
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      notes: notes.trim() || (isBn ? 'সাধারণ সঞ্চয় তহবিল থেকে উত্তোলন' : 'General Savings Withdrawal'),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-rose-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isBn ? 'টাকা উত্তোলন ভাউচার' : 'Withdrawal Voucher'}
              </h3>
              <p className="text-xs text-rose-100">
                {isBn ? 'সদস্যের সঞ্চয় তহবিল থেকে টাকা প্রদান' : 'Disburse funds from member savings account'}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-lg text-rose-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'সদস্য নির্বাচন করুন' : 'Select Member'} <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {m.name} ({isBn ? 'সাধারণ সঞ্চয়:' : 'General Savings:'} {formatCurrency(m.generalSavingsBalance, isBn && useBengaliDigits)})
                </option>
              ))}
            </select>
          </div>

          {/* Balance info pill */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{isBn ? 'উত্তোলনযোগ্য সাধারণ সঞ্চয়:' : 'Available Savings Balance:'}</span>
            <span className="font-bold text-emerald-700 text-sm">
              {formatCurrency(availableBalance, isBn && useBengaliDigits)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'উত্তোলনের পরিমাণ (৳)' : 'Withdrawal Amount (৳)'} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={10}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-bold text-rose-800 text-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'প্রদানের মাধ্যম' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
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
                  {isBn ? 'সমিতির প্রদানকারী ব্যাংক' : 'Society Bank Account'}
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'উত্তোলনের কারণ / মন্তব্য' : 'Reason / Narration'}
            </label>
            <input
              type="text"
              placeholder={isBn ? "যেমন: বিশেষ পারিবারিক প্রয়োজনে উত্তোলন" : "e.g., Personal / family withdrawal"}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

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
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isBn ? 'উত্তোলন ভাউচার সম্পন্ন করুন ✓' : 'Confirm Withdrawal Voucher ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
