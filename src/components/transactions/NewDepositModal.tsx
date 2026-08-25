import React, { useState } from 'react';
import { X, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { PaymentMethod } from '../../types';

export const NewDepositModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    members, 
    bankAccounts, 
    addDeposit, 
    savingsSchemes 
  } = useSomiti();

  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [schemeType, setSchemeType] = useState<'general' | 'dps' | 'fdr'>('general');
  const [schemeId, setSchemeId] = useState('');
  const [amount, setAmount] = useState<number>(2000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const memberSchemes = savingsSchemes.filter(s => s.memberId === memberId && s.status === 'running');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || amount <= 0) {
      alert('সদস্য ও সঠিক টাকার পরিমাণ নির্বাচন করুন।');
      return;
    }

    addDeposit({
      memberId,
      schemeType,
      schemeId: schemeId || undefined,
      amount: Number(amount),
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      notes: notes.trim(),
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">টাকা জমা (সঞ্চয় / ডিপিএস)</h3>
              <p className="text-xs text-emerald-100">টাকা জমার ভাউচার ও রসিদ তৈরি</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              সদস্য নির্বাচন করুন <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {m.name} ({m.phone})
                </option>
              ))}
            </select>
          </div>

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
                <option value="general">সাধারণ সঞ্চয়</option>
                <option value="dps">মাসিক ডিপিএস (DPS)</option>
                <option value="fdr">স্থায়ী আমানত (FDR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জমার পরিমাণ (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-emerald-800 text-lg"
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মন্তব্য / বিবরণ
            </label>
            <input
              type="text"
              placeholder="যেমন: ফেব্রুয়ারি মাসের সঞ্চয় জমা"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              জমা নিশ্চিত করুন ও রসিদ তৈরি করুন ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
