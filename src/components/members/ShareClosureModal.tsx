import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, DollarSign, Calculator, AlertCircle, Info, Landmark, Banknote } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, formatBengaliNumber, getTodayDateStr } from '../../utils/bengaliUtils';

interface ShareClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
}

export const ShareClosureModal: React.FC<ShareClosureModalProps> = ({
  isOpen,
  onClose,
  preselectedMemberId,
}) => {
  const {
    members,
    settings,
    bankAccounts,
    closeMemberShares,
    openReceiptForTx,
    transactions,
    useBengaliDigits,
  } = useSomiti();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(preselectedMemberId || members[0]?.id || '');
  const [sharesToClose, setSharesToClose] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(settings.sharePricePerUnit || 100);
  const [profitAmount, setProfitAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [date, setDate] = useState<string>(getTodayDateStr());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    refundTotal: number;
    closedCount: number;
    remainingCount: number;
    voucherNo: string;
  } | null>(null);

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
  const totalActiveShares = Number(currentMember?.shareCount) || 0;
  const currentShareVal = Number(currentMember?.shareValue) || (totalActiveShares * unitPrice);

  const principalRefund = Math.max(0, sharesToClose * unitPrice);
  const totalRefundAmount = principalRefund + (Number(profitAmount) || 0);
  const remainingShares = Math.max(0, totalActiveShares - sharesToClose);
  const remainingValue = remainingShares * unitPrice;

  const handleSharesChange = (val: number) => {
    const sanitized = Math.max(1, Math.min(totalActiveShares || 1, val));
    setSharesToClose(sanitized);
    setErrorMsg('');
  };

  const handleQuickSelect = (count: number) => {
    handleSharesChange(count);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentMember) {
      setErrorMsg('অনুগ্রহ করে একজন সদস্য নির্বাচন করুন।');
      return;
    }

    if (totalActiveShares <= 0) {
      setErrorMsg('এই সদস্যের কোনো সক্রিয় শেয়ার নেই।');
      return;
    }

    if (sharesToClose <= 0 || sharesToClose > totalActiveShares) {
      setErrorMsg(`ক্লোজ করার শেয়ার সংখ্যা ১ থেকে ${totalActiveShares} এর মধ্যে হতে হবে।`);
      return;
    }

    if (paymentMethod === 'bank' && !bankAccountId) {
      setErrorMsg('অনুগ্রহ করে ব্যাংক অ্যাকাউন্ট নির্বাচন করুন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await closeMemberShares({
        memberId: currentMember.id,
        sharesToClose,
        unitPrice,
        profitAmount: Number(profitAmount) || 0,
        paymentMethod,
        bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
        date,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.closure) {
        setSuccessModal({
          show: true,
          refundTotal: res.closure.totalRefundAmount,
          closedCount: res.closure.closedSharesCount,
          remainingCount: res.closure.remainingActiveShares,
          voucherNo: res.closure.voucherNo,
        });
      } else {
        setErrorMsg(res.error || 'শেয়ার ক্লোজ সম্পন্ন করতে সমস্যা হয়েছে।');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'শেয়ার ক্লোজ সম্পন্ন করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishAndPrint = () => {
    if (successModal?.voucherNo) {
      const tx = transactions.find(t => t.voucherNo === successModal.voucherNo);
      if (tx) {
        openReceiptForTx(tx);
      }
    }
    setSuccessModal(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6 animate-in fade-in-50 zoom-in-95">
        
        {/* Success Dialog View */}
        {successModal?.show ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-800">শেয়ার ক্লোজ ও সমর্পণ সফল হয়েছে!</h3>
              <p className="text-xs text-slate-500">
                ভাউচার নং: <span className="font-mono font-bold text-slate-700">{successModal.voucherNo}</span>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">সদস্যের নাম:</span>
                <span className="font-bold text-slate-800">{currentMember?.name} ({currentMember?.memberNo})</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">বন্ধকৃত শেয়ার সংখ্যা:</span>
                <span className="font-bold text-rose-600">{formatBengaliNumber(successModal.closedCount, useBengaliDigits)} টি</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">সদস্যকে মোট ফেরত প্রদান:</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(successModal.refundTotal, useBengaliDigits)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">অবশিষ্ট সক্রিয় শেয়ার:</span>
                <span className="font-bold text-blue-700">
                  {formatBengaliNumber(successModal.remainingCount, useBengaliDigits)} টি
                </span>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 text-left flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                বন্ধকৃত শেয়ারের এই তথ্যটি স্থায়ীভাবে <strong>শেয়ার ক্লোজার রেজিস্টার ও আর্কাইভে</strong> সংরক্ষিত হয়েছে। এটি ভবিষ্যতের যে কোনো অডিটের জন্য দেখা যাবে।
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessModal(null);
                  onClose();
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                onClick={handleFinishAndPrint}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                রসিদ প্রিন্ট করুন
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-700 via-rose-700 to-rose-800 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold">শেয়ার সমর্পণ ও নিষ্পত্তি (Share Closure)</h3>
                  <p className="text-xs text-rose-100">সদস্যের আংশিক বা সম্পূর্ণ শেয়ার ক্লোজ ও লভ্যাংশসহ ফেরত</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Member Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সদস্য নির্বাচন করুন <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    setSharesToClose(1);
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden cursor-pointer"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {m.name} (বর্তমান শেয়ার: {m.shareCount || 0} টি, মোট সঞ্চয়: ৳{m.totalSavings})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Member's Current Active Share Status Card */}
              {currentMember && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">সদস্যের বর্তমান সক্রিয় শেয়ার:</span>
                    <span className="font-bold text-slate-800 font-mono text-sm">
                      {formatBengaliNumber(totalActiveShares, useBengaliDigits)} টি
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">প্রতি শেয়ারের বর্তমান মূল্যমান:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(unitPrice, useBengaliDigits)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">শেয়ার মূলধন স্থিতি:</span>
                    <span className="font-bold text-blue-700">
                      {formatCurrency(currentShareVal, useBengaliDigits)}
                    </span>
                  </div>
                </div>
              )}

              {totalActiveShares === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-center font-medium">
                  এই সদস্যের কোনো সক্রিয় শেয়ার নেই। ক্লোজ করার জন্য কোনো শেয়ার উপলব্ধ নয়।
                </div>
              ) : (
                <>
                  {/* 3. Number of Shares to Close */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">
                        কতটি শেয়ার ক্লোজ/সমর্পণ করতে চান? <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">
                        (সর্বোচ্চ: {formatBengaliNumber(totalActiveShares, useBengaliDigits)} টি)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={totalActiveShares}
                        required
                        value={sharesToClose}
                        onChange={(e) => handleSharesChange(parseInt(e.target.value) || 1)}
                        className="flex-1 px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-rose-700 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                      <span className="text-xs font-bold text-slate-600">টি শেয়ার</span>
                    </div>

                    {/* Quick Selection Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">দ্রুত নির্বাচন:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(1)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          sharesToClose === 1
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ১ টি
                      </button>
                      {totalActiveShares >= 2 && (
                        <button
                          type="button"
                          onClick={() => handleQuickSelect(2)}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            sharesToClose === 2
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ২ টি
                        </button>
                      )}
                      {totalActiveShares > 2 && (
                        <button
                          type="button"
                          onClick={() => handleQuickSelect(Math.floor(totalActiveShares / 2))}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-white text-slate-700 border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          অর্ধেক ({Math.floor(totalActiveShares / 2)} টি)
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQuickSelect(totalActiveShares)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          sharesToClose === totalActiveShares
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        সবগুলো ({totalActiveShares} টি)
                      </button>
                    </div>
                  </div>

                  {/* 4. Profit / Dividend Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        শেয়ার প্রতি মূলধন (৳)
                      </label>
                      <input
                        type="number"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(Number(e.target.value) || 100)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>অর্জিত লভ্যাংশ / মুনাফা (৳)</span>
                        <span className="text-[10px] text-emerald-600 font-normal">বোনাস/লাভ</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={profitAmount}
                        onChange={(e) => setProfitAmount(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="০"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* 5. Real-time Calculation Summary Card */}
                  <div className="bg-gradient-to-br from-rose-50 via-amber-50/40 to-emerald-50 border border-rose-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 pb-1 border-b border-rose-200/60">
                      <Calculator className="w-4 h-4 text-rose-600" />
                      <span>ফেরত ও নিষ্পত্তির হিসাব বিবরণী</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>শেয়ার মূলধন ফেরত ({sharesToClose} × ৳{unitPrice}):</span>
                        <span className="font-bold text-slate-800">{formatCurrency(principalRefund, useBengaliDigits)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span>অতিরিক্ত লভ্যাংশ / লাভ:</span>
                        <span className="font-bold text-emerald-600">+ {formatCurrency(profitAmount, useBengaliDigits)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-rose-300/60 text-slate-900">
                        <span className="font-bold text-sm">সদস্যকে মোট প্রদেয় অর্থ:</span>
                        <span className="font-black text-rose-700 text-base">
                          {formatCurrency(totalRefundAmount, useBengaliDigits)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-dashed border-rose-200 flex justify-between items-center text-[11px] text-blue-800 bg-blue-50/60 -mx-4 -mb-4 px-4 py-2.5 rounded-b-2xl">
                      <span>ক্লোজের পর অবশিষ্ট সক্রিয় শেয়ার:</span>
                      <span className="font-bold text-blue-900 font-mono">
                        {formatBengaliNumber(remainingShares, useBengaliDigits)} টি (মূল্যমান {formatCurrency(remainingValue, useBengaliDigits)})
                      </span>
                    </div>
                  </div>

                  {/* 6. Payment Method & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পরিশোধের মাধ্যম <span className="text-rose-500">*</span>
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
                        নিষ্পত্তির তারিখ
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
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

                  {/* 7. Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      মন্তব্য / নিষ্পত্তির কারণ
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="যেমন: সদস্যের ব্যক্তিগত প্রয়োজনে ২ টি শেয়ার সমর্পণ ও নিষ্পত্তি"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  {/* 8. Notice on Isolated Data Preservation */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>স্থায়ী ডেটা সংরক্ষণ গ্যারান্টি:</strong> এই বন্ধকৃত শেয়ারের রেকর্ড পৃথক <em>Share Closure Archive</em>-এ সংরক্ষিত থাকবে। ভবিষ্যতে যেকোনো সময় বিস্তারিত জানা যাবে, কিন্তু এটি বর্তমান সক্রিয় ব্যালেন্স বা হিসেবে কোনো বিভ্রান্তি তৈরি করবে না।
                    </span>
                  </div>

                  {/* 9. Action Buttons */}
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
                      disabled={isSubmitting || totalActiveShares <= 0}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>প্রক্রিয়াকরণ হচ্ছে...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>শেয়ার ক্লোজ ও টাকা পরিশোধ নিশ্চিত করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
};
