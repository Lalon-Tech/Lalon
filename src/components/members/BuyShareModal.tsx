import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, TrendingUp, Info, Landmark, Banknote } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, formatBengaliNumber, getTodayDateStr } from '../../utils/bengaliUtils';

interface BuyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
}

export const BuyShareModal: React.FC<BuyShareModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberId,
}) => {
  const {
    members,
    settings,
    bankAccounts,
    buyMemberShares,
    useBengaliDigits,
  } = useSomiti();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMemberId || members[0]?.id || '');
  const [sharesToBuy, setSharesToBuy] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(settings.sharePricePerUnit || 100);
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

  useEffect(() => {
    setUnitPrice(settings.sharePricePerUnit || 100);
  }, [settings.sharePricePerUnit]);

  if (!isOpen) return null;

  const currentMember = members.find(m => m.id === selectedMemberId);
  const totalAmount = sharesToBuy * unitPrice;
  const currentShares = currentMember?.shareCount || 0;
  const newShareCount = currentShares + sharesToBuy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentMember) {
      setErrorMsg('অনুগ্রহ করে একজন সদস্য নির্বাচন করুন।');
      return;
    }

    if (sharesToBuy <= 0) {
      setErrorMsg('কমপক্ষে ১টি শেয়ার সংখ্যা উল্লেখ করুন।');
      return;
    }

    if (paymentMethod === 'bank' && !bankAccountId) {
      setErrorMsg('অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await buyMemberShares({
        memberId: currentMember.id,
        sharesToBuy,
        unitPrice,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
        date,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'শেয়ার ক্রয় সম্পন্ন করতে সমস্যা হয়েছে।');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'শেয়ার ক্রয় সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-xl">
              <TrendingUp className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h3 className="text-base font-bold">নতুন শেয়ার ক্রয় / জমা ভাউচার</h3>
              <p className="text-xs text-blue-100">সদস্যের মূলধন শেয়ার সংখ্যা বৃদ্ধি ও তহবিল জমা</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              সদস্য নির্বাচন করুন <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {m.name} (বর্তমান শেয়ার: {m.shareCount || 0} টি)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                শেয়ারের সংখ্যা <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={sharesToBuy}
                onChange={(e) => setSharesToBuy(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রতি শেয়ার মূল্য (৳)
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Math.max(1, Number(e.target.value) || 100))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>মোট শেয়ার ক্রয়মূল্য:</span>
              <span className="font-bold text-slate-800 text-sm text-blue-700">
                {formatCurrency(totalAmount, useBengaliDigits)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-blue-200/60">
              <span>ক্রয়ের পর মোট সক্রিয় শেয়ার হবে:</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatBengaliNumber(newShareCount, useBengaliDigits)} টি
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জমার মাধ্যম <span className="text-rose-500">*</span>
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
                  <span>ক্যাশ</span>
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
                  <span>ব্যাংক</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জমার তারিখ
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
                ব্যাংক অ্যাকাউন্ট নির্বাচন করুন <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {bankAccounts.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber} (ব্যালেন্স: ৳{b.balance})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মন্তব্য
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="নতুন শেয়ার ক্রয় বাবদ জমা"
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
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>জমা হচ্ছে...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>শেয়ার জমা নিশ্চিত করুন</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
