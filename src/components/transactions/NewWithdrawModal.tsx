import React, { useState } from 'react';
import { X, ArrowUpRight, AlertCircle, Phone, ShieldCheck, User } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/bengaliUtils';

interface NewWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMemberId?: string;
  lockMember?: boolean;
  isEmbedded?: boolean;
}

export const NewWithdrawModal: React.FC<NewWithdrawModalProps> = ({ 
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
    addWithdrawal, 
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

  const [selectedId, setSelectedId] = useState(effectiveTargetId);
  const memberId = isMemberLocked ? effectiveTargetId : (selectedId || effectiveTargetId);
  const setMemberId = setSelectedId;
  const [amount, setAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmOverdraw, setConfirmOverdraw] = useState(false);

  // Automatically sync with the active member whenever the modal opens or active member changes
  React.useEffect(() => {
    const targetId = initialMemberId || selectedMemberId;
    if (targetId && members.some(m => m.id === targetId)) {
      setSelectedId(targetId);
    }
  }, [isOpen, initialMemberId, selectedMemberId, members]);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setConfirmOverdraw(false);
      const targetId = initialMemberId || selectedMemberId;
      if (targetId && members.some(m => m.id === targetId)) {
        setSelectedId(targetId);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedMember = members.find(m => m.id === memberId);
  const availableBalance = selectedMember ? (selectedMember.generalSavingsBalance || 0) : 0;
  const isOverdraw = amount > availableBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!memberId || amount <= 0) {
      setErrorMsg(isBn ? 'সদস্য ও সঠিক টাকার পরিমাণ নির্বাচন করুন।' : 'Please select a member and valid amount.');
      return;
    }

    if (isOverdraw && !confirmOverdraw) {
      setErrorMsg(
        isBn 
          ? `সদস্যের সাধারণ সঞ্চয় স্থিতি (${formatCurrency(availableBalance, useBengaliDigits)}) উত্তোলনের চেয়ে কম। অনুগ্রহ করে নিচে সম্মতি টিক দিন।`
          : `Member's savings balance (${formatCurrency(availableBalance, false)}) is less than withdrawal amount. Please check the confirmation box below.`
      );
      return;
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

  const modalContent = (
    <div className={`bg-white rounded-2xl ${isEmbedded ? 'border border-slate-200 shadow-2xs w-full max-w-2xl mx-auto' : 'shadow-2xl border border-slate-200 w-full max-w-lg'} overflow-hidden animate-in fade-in-50 zoom-in-95 my-4`}>
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
                {selectedMember
                  ? (isBn ? `${selectedMember.name}-এর সঞ্চয় একাউন্ট থেকে টাকা প্রদান` : `Disburse funds from ${selectedMember.name}'s savings`)
                  : (isBn ? 'সদস্যের সঞ্চয় তহবিল থেকে টাকা প্রদান' : 'Disburse funds from member savings account')}
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
          {/* Member Selection or Dedicated Member Account */}
          {isMemberLocked && selectedMember ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {isBn ? 'সদস্যের নিজস্ব সঞ্চয় একাউন্ট' : 'Member Savings Account'}
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  {isBn ? 'নির্দিষ্ট একাউন্ট' : 'Locked Account'}
                </span>
              </div>

              {/* Dedicated Member Identity Card - Strictly only this member, no other members shown */}
              <div className="p-3.5 bg-gradient-to-r from-rose-50/80 via-slate-50 to-white rounded-xl border border-rose-200 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-rose-200">
                      {selectedMember.photoUrl ? (
                        <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedMember.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {selectedMember.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                          #{selectedMember.memberNo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {selectedMember.phone || (isBn ? 'মোবাইল নেই' : 'No phone')}
                        </span>
                        <span className="text-rose-700 font-semibold">
                          {isBn ? 'শুধুমাত্র নিজস্ব সঞ্চয়' : 'Personal Savings'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {isBn ? 'উত্তোলনযোগ্য সঞ্চয়' : 'Available Balance'}
                    </span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {formatCurrency(availableBalance, isBn && useBengaliDigits)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isBn ? 'সদস্য নির্বাচন করুন' : 'Select Member'} <span className="text-rose-500">*</span>
                </label>
                {selectedMember && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    {isBn ? 'সক্রিয় সদস্য:' : 'Active:'} #{selectedMember.memberNo}
                  </span>
                )}
              </div>
              <select
                required
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  setErrorMsg(null);
                  setConfirmOverdraw(false);
                }}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer font-medium"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.memberNo} - {m.name} ({isBn ? 'সাধারণ সঞ্চয়:' : 'General Savings:'} {formatCurrency(m.generalSavingsBalance, isBn && useBengaliDigits)})
                  </option>
                ))}
              </select>

              {/* Balance info pill for dropdown mode */}
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{isBn ? 'উত্তোলনযোগ্য সাধারণ সঞ্চয়:' : 'Available Savings Balance:'}</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(availableBalance, isBn && useBengaliDigits)}
                </span>
              </div>
            </div>
          )}

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

          {isOverdraw && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <div className="text-xs font-bold text-amber-800">
                {isBn ? '⚠️ অতিরিক্ত উত্তোলন সতর্কতা' : '⚠️ Overdraft Warning'}
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {isBn
                  ? `সদস্যের সাধারণ সঞ্চয় স্থিতি (${formatCurrency(availableBalance, useBengaliDigits)}) এর চেয়ে উত্তোলনের পরিমাণ বেশি।`
                  : `Withdrawal amount exceeds member general savings balance (${formatCurrency(availableBalance, false)}).`}
              </p>
              <label className="flex items-center gap-2 pt-1 text-xs font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmOverdraw}
                  onChange={(e) => setConfirmOverdraw(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span>{isBn ? 'হ্যাঁ, আমি অতিরিক্ত উত্তোলন অনুমোদন করছি' : 'Yes, I authorize this overdraw'}</span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

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
  );

  if (isEmbedded) {
    return modalContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      {modalContent}
    </div>
  );
};
