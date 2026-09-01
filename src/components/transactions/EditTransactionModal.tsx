import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckSquare, 
  Square,
  Clock,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { Transaction, PaymentMethod } from '../../types';
import { formatCurrency, formatBengaliNumber, toBengaliNumber } from '../../utils/bengaliUtils';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { 
    members, 
    bankAccounts, 
    updateTransaction, 
    deleteTransaction,
    useBengaliDigits,
    currentUser 
  } = useSomiti();

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [selectedShares, setSelectedShares] = useState<number[]>([]);
  const [shareRate, setShareRate] = useState<number>(1000);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setDate(transaction.date || '');
      setAmount(transaction.amount || 0);
      setPaymentMethod(transaction.paymentMethod || 'cash');
      setBankAccountId(transaction.bankAccountId || bankAccounts[0]?.id || '');
      setNotes(transaction.notes || '');
      setCollectedBy(transaction.collectedBy || currentUser.name);
      setSelectedShares(transaction.selectedShares || []);
      setShareRate(transaction.shareRate || 1000);
      setShowDeleteConfirm(false);
    }
  }, [transaction, currentUser.name, bankAccounts]);

  if (!isOpen || !transaction) return null;

  const member = members.find(m => m.id === transaction.memberId);
  const totalShares = transaction.totalMemberShares || member?.shareCount || 0;
  const allSharesList = Array.from({ length: totalShares }, (_, i) => i + 1);

  const handleToggleShare = (shareNo: number) => {
    let next: number[];
    if (selectedShares.includes(shareNo)) {
      next = selectedShares.filter(s => s !== shareNo);
    } else {
      next = [...selectedShares, shareNo].sort((a, b) => a - b);
    }
    setSelectedShares(next);
    const newAmount = next.length * shareRate;
    setAmount(newAmount);
  };

  const handleShareRateChange = (newRate: number) => {
    setShareRate(newRate);
    if (selectedShares.length > 0) {
      setAmount(selectedShares.length * newRate);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('সঠিক টাকার পরিমাণ দিন।');
      return;
    }

    const unpaid = allSharesList.filter(s => !selectedShares.includes(s));

    updateTransaction(transaction.id, {
      date,
      amount: Number(amount),
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      notes: notes.trim(),
      collectedBy: collectedBy.trim(),
      selectedShares: selectedShares.length > 0 ? selectedShares : undefined,
      shareRate: selectedShares.length > 0 ? shareRate : undefined,
      unpaidShares: selectedShares.length > 0 ? unpaid : undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-blue-700 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-lg shadow-inner">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">ভুল লেনদেন সংশোধন ও এডিট</h3>
              <p className="text-xs text-blue-100">ভাউচার নং: {transaction.voucherNo}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-lg text-blue-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Transaction Metadata */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">সদস্য / গ্রাহক:</span>
              <strong className="text-slate-800 text-sm">{transaction.memberName || 'সমিতি ফান্ড'}</strong>
              {transaction.memberNo && (
                <span className="text-[11px] text-slate-500 font-mono block">সদস্য নং: {transaction.memberNo}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">লেনদেনের ধরন:</span>
              <span className="font-bold text-blue-700 uppercase">{transaction.type}</span>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                তারিখ (Date)
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কালেক্টর / আদায়কারী
              </label>
              <input
                type="text"
                value={collectedBy}
                onChange={(e) => setCollectedBy(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Share selection if it had shares or member has shares */}
          {totalShares > 0 && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>শেয়ার নির্বাচন ও কিস্তি সংশোধন</span>
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-[11px] text-blue-800 font-semibold">দর (৳):</label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={shareRate}
                    onChange={(e) => handleShareRateChange(Number(e.target.value))}
                    className="w-20 px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-bold text-blue-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {allSharesList.map((shareNo) => {
                  const isSelected = selectedShares.includes(shareNo);
                  return (
                    <div
                      key={shareNo}
                      onClick={() => handleToggleShare(shareNo)}
                      className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isSelected 
                          ? 'bg-blue-100/80 border-blue-400 font-bold text-blue-900 shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-600 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span>শেয়ার #{formatBengaliNumber(shareNo)}</span>
                      </div>
                      <span className="text-[11px] font-mono">৳{formatBengaliNumber(shareRate)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount and Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                পেমেন্ট মাধ্যম
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              >
                <option value="cash">নগদ ক্যাশ (Cash)</option>
                <option value="bank">ব্যাংক ট্রান্সফার (Bank)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
              </select>
            </div>
          </div>

          {paymentMethod === 'bank' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ব্যাংক অ্যাকাউন্ট
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} - {b.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              মন্তব্য / বিবরণ
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="লেনদেনের বিবরণ লিখুন"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Delete Danger Zone */}
          {showDeleteConfirm ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>আপনি কি নিশ্চিতভাবে এই লেনদেনটি মুছে ফেলতে চান?</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                এটি মুছে ফেললে সদস্যের ব্যালেন্স এবং সমিতির ক্যাশ স্বয়ংক্রিয়ভাবে পূর্বের অবস্থায় সমন্বয় করা হবে।
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer"
                >
                  না, বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>হ্যাঁ, স্থায়ীভাবে মুছুন</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ভুল এন্ট্রি মুছুন / বাতিল করুন</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>পরিবর্তন সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
