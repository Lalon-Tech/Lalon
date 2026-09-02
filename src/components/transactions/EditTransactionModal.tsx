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
  ArrowRightLeft,
  Calendar
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { Transaction, PaymentMethod } from '../../types';
import { formatCurrency, formatBengaliNumber, toBengaliNumber } from '../../utils/bengaliUtils';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const BENGALI_MONTHS = [
  { value: '01', nameBn: 'জানুয়ারি', nameEn: 'January' },
  { value: '02', nameBn: 'ফেব্রুয়ারি', nameEn: 'February' },
  { value: '03', nameBn: 'মার্চ', nameEn: 'March' },
  { value: '04', nameBn: 'এপ্রিল', nameEn: 'April' },
  { value: '05', nameBn: 'মে', nameEn: 'May' },
  { value: '06', nameBn: 'জুন', nameEn: 'June' },
  { value: '07', nameBn: 'জুলাই', nameEn: 'July' },
  { value: '08', nameBn: 'আগস্ট', nameEn: 'August' },
  { value: '09', nameBn: 'সেপ্টেম্বর', nameEn: 'September' },
  { value: '10', nameBn: 'অক্টোবর', nameEn: 'October' },
  { value: '11', nameBn: 'নভেম্বর', nameEn: 'November' },
  { value: '12', nameBn: 'ডিসেম্বর', nameEn: 'December' },
];

const GENERATED_YEARS = Array.from({ length: 51 }, (_, i) => 2000 + i); // 2000 to 2050

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    bankAccounts, 
    updateTransaction, 
    deleteTransaction,
    useBengaliDigits,
    currentUser,
    settings 
  } = useSomiti();

  const [date, setDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [selectedYear, setSelectedYear] = useState(2026);

  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [notes, setNotes] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  
  // Share details
  const [selectedShares, setSelectedShares] = useState<number[]>([]);
  const [shareRate, setShareRate] = useState<number>(1000);
  const [shareAmounts, setShareAmounts] = useState<{ [shareNo: number]: number }>({});
  
  const [purchasedShareCount, setPurchasedShareCount] = useState<number>(1);
  const [purchasedUnitPrice, setPurchasedUnitPrice] = useState<number>(1000);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  const getMonthName = (monthVal: string) => {
    const m = BENGALI_MONTHS.find(b => b.value === monthVal);
    if (!m) return monthVal;
    return isBn ? m.nameBn : m.nameEn;
  };

  const getBillingPeriodStr = () => {
    const mName = getMonthName(selectedMonth);
    const yStr = displayCount(selectedYear);
    return isBn ? `${mName} ${yStr}` : `${mName} ${yStr}`;
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (newDate) {
      const parts = newDate.split('-');
      if (parts.length === 3) {
        setSelectedYear(Number(parts[0]));
        setSelectedMonth(parts[1]);
      }
    }
  };

  useEffect(() => {
    if (transaction) {
      const defaultRate = transaction.unitPrice || settings.sharePricePerUnit || 100;
      const txDate = transaction.date || new Date().toISOString().split('T')[0];
      setDate(txDate);
      
      if (transaction.depositMonth) {
        setSelectedMonth(transaction.depositMonth);
      } else if (txDate) {
        const parts = txDate.split('-');
        if (parts.length === 3) setSelectedMonth(parts[1]);
      }

      if (transaction.depositYear) {
        setSelectedYear(transaction.depositYear);
      } else if (txDate) {
        const parts = txDate.split('-');
        if (parts.length === 3) setSelectedYear(Number(parts[0]));
      }

      setAmount(transaction.amount || 0);
      setPaymentMethod(transaction.paymentMethod || 'cash');
      setBankAccountId(transaction.bankAccountId || bankAccounts[0]?.id || '');
      setNotes(transaction.notes || '');
      setCollectedBy(transaction.collectedBy || currentUser.name);
      
      const sShares = transaction.selectedShares || [];
      setSelectedShares(sShares);
      setShareRate(transaction.shareRate || 1000);
      
      // Initialize shareAmounts map
      if (transaction.shareAmounts) {
        setShareAmounts(transaction.shareAmounts);
      } else {
        const initialMap: { [shareNo: number]: number } = {};
        sShares.forEach(s => {
          initialMap[s] = transaction.shareRate || 1000;
        });
        setShareAmounts(initialMap);
      }

      const sCount = transaction.shareCount || (transaction.amount > 0 ? Math.max(1, Math.round(transaction.amount / defaultRate)) : 1);
      setPurchasedShareCount(sCount);
      setPurchasedUnitPrice(transaction.unitPrice || defaultRate);

      setShowDeleteConfirm(false);
    }
  }, [transaction, currentUser.name, bankAccounts, settings.sharePricePerUnit]);

  if (!isOpen || !transaction) return null;

  const member = members.find(m => m.id === transaction.memberId);
  const totalShares = transaction.totalMemberShares || member?.shareCount || 0;
  const allSharesList = Array.from({ length: totalShares }, (_, i) => i + 1);

  const isSharePurchase = transaction.type === 'share_purchase';
  const isShareSurrender = transaction.type === 'share_surrender';
  const isDepositType = ['deposit', 'dps_deposit', 'fdr_deposit'].includes(transaction.type);

  const handleToggleShare = (shareNo: number) => {
    let next: number[];
    if (selectedShares.includes(shareNo)) {
      next = selectedShares.filter(s => s !== shareNo);
    } else {
      next = [...selectedShares, shareNo].sort((a, b) => a - b);
    }
    setSelectedShares(next);

    const calculatedAmt = next.reduce((sum, s) => sum + (shareAmounts[s] || shareRate), 0);
    setAmount(calculatedAmt);
  };

  const handleIndividualShareAmountChange = (shareNo: number, newAmt: number) => {
    const validAmt = Math.max(0, newAmt);
    const updated = {
      ...shareAmounts,
      [shareNo]: validAmt
    };
    setShareAmounts(updated);
    const calculatedAmt = selectedShares.reduce((sum, s) => sum + (updated[s] || 0), 0);
    setAmount(calculatedAmt);
  };

  const handleShareRateChange = (newRate: number) => {
    const validRate = Math.max(1, newRate);
    setShareRate(validRate);
    const updated: { [shareNo: number]: number } = {};
    for (let i = 1; i <= totalShares; i++) {
      updated[i] = validRate;
    }
    setShareAmounts(updated);
    if (selectedShares.length > 0) {
      setAmount(selectedShares.length * validRate);
    }
  };

  const handlePurchasedSharesChange = (count: number) => {
    const validCount = Math.max(1, count);
    setPurchasedShareCount(validCount);
    setAmount(validCount * purchasedUnitPrice);
  };

  const handlePurchasedUnitPriceChange = (price: number) => {
    const validPrice = Math.max(1, price);
    setPurchasedUnitPrice(validPrice);
    setAmount(purchasedShareCount * validPrice);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert(isBn ? 'সঠিক টাকার পরিমাণ দিন।' : 'Please enter a valid amount.');
      return;
    }

    const unpaid = allSharesList.filter(s => !selectedShares.includes(s));

    updateTransaction(transaction.id, {
      date,
      depositMonth: selectedMonth,
      depositYear: selectedYear,
      billingPeriod: getBillingPeriodStr(),
      amount: Number(amount),
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      notes: notes.trim(),
      collectedBy: collectedBy.trim(),
      shareCount: isSharePurchase || isShareSurrender ? purchasedShareCount : undefined,
      unitPrice: isSharePurchase || isShareSurrender ? purchasedUnitPrice : undefined,
      selectedShares: isDepositType && selectedShares.length > 0 ? selectedShares : undefined,
      shareRate: isDepositType && selectedShares.length > 0 ? shareRate : undefined,
      shareAmounts: isDepositType && selectedShares.length > 0 ? shareAmounts : undefined,
      unpaidShares: isDepositType && selectedShares.length > 0 ? unpaid : undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const getModalTitle = () => {
    if (isSharePurchase) return isBn ? 'শেয়ার ক্রয় এন্ট্রি সংশোধন' : 'Edit Share Purchase Entry';
    if (isShareSurrender) return isBn ? 'শেয়ার সমর্পণ এন্ট্রি সংশোধন' : 'Edit Share Surrender Entry';
    return isBn ? 'ভুল লেনদেন সংশোধন ও এডিট' : 'Edit Transaction Record';
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
              <h3 className="text-base font-bold">{getModalTitle()}</h3>
              <p className="text-xs text-blue-100">
                {isBn ? 'ভাউচার নং:' : 'Voucher No:'} {transaction.voucherNo}
              </p>
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
              <span className="text-slate-500 block">{isBn ? 'সদস্য / প্রাপক:' : 'Member / Payee:'}</span>
              <strong className="text-slate-800 text-sm">{transaction.memberName || (isBn ? 'সমিতি ফান্ড' : 'Society Fund')}</strong>
              {transaction.memberNo && (
                <span className="text-[11px] text-slate-500 font-mono block">{isBn ? 'সদস্য নং:' : 'Member No:'} {transaction.memberNo}</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">{isBn ? 'লেনদেনের ধরন:' : 'Type:'}</span>
              <span className="font-bold text-blue-700 uppercase">{transaction.type}</span>
            </div>
          </div>

          {/* Share Purchase specific editor */}
          {isSharePurchase && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>{isBn ? 'শেয়ার সংখ্যা ও মূল্য পরিবর্তন' : 'Change Share Count & Unit Price'}</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {isBn 
                  ? 'ভুলবশত বেশি বা কম শেয়ার দিলে এখানে সঠিক শেয়ার সংখ্যা লিখুন। সদস্যের মোট শেয়ার সংখ্যা ও হিসাব সমন্বয় হবে।'
                  : 'Enter correct share count if mistakenly entered. Total member shares and capital balances will automatically adjust.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'শেয়ার সংখ্যা (টি)' : 'Share Count'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={purchasedShareCount}
                    onChange={(e) => handlePurchasedSharesChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'প্রতি শেয়ারের দর (৳)' : 'Unit Price (৳)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    value={purchasedUnitPrice}
                    onChange={(e) => handlePurchasedUnitPriceChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date, Month & Year Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'লেনদেনের তারিখ ও মাস/বছর' : 'Transaction Date & Month/Year'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {isBn ? 'তারিখ' : 'Date'}
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  {isBn ? 'মাস (Month)' : 'Month'}
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  {BENGALI_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {isBn ? m.nameBn : m.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    {isBn ? 'বছর (Year)' : 'Year'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedYear(new Date().getFullYear())}
                    className="text-[10px] text-blue-700 hover:underline font-bold cursor-pointer"
                  >
                    {isBn ? 'চলতি বছর' : 'Current'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1990}
                    max={2100}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-20 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white text-center"
                    placeholder="YYYY"
                  />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="flex-1 min-w-0 px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer truncate"
                  >
                    {GENERATED_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {displayCount(y)} {y === new Date().getFullYear() ? `(${isBn ? 'চলতি' : 'Current'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Share selection for deposits if member has multiple shares */}
          {isDepositType && totalShares > 0 && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>{isBn ? 'শেয়ার নির্বাচন ও কিস্তি সমন্বয়' : 'Share Selection & Installment Adjustment'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-[11px] text-blue-800 font-semibold">{isBn ? 'দর (৳):' : 'Rate (৳):'}</label>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allSharesList.map((shareNo) => {
                  const isSelected = selectedShares.includes(shareNo);
                  const currentShareAmt = shareAmounts[shareNo] !== undefined ? shareAmounts[shareNo] : shareRate;

                  return (
                    <div
                      key={shareNo}
                      className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-1.5 transition-all ${
                        isSelected 
                          ? 'bg-blue-100/80 border-blue-400 font-bold text-blue-900 shadow-2xs' 
                          : 'bg-white border-slate-200 text-slate-600 opacity-70'
                      }`}
                    >
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => handleToggleShare(shareNo)}
                      >
                        <div className="flex items-center gap-1.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                          <span>{isBn ? `শেয়ার #${displayCount(shareNo)}` : `Share #${shareNo}`}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isSelected ? (isBn ? 'জমা' : 'Active') : (isBn ? 'বকেয়া' : 'Due')}
                        </span>
                      </div>

                      {/* Per-share amount input */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-blue-200/60">
                        <span className="text-[10px] font-medium text-slate-600">{isBn ? 'এই শেয়ারের কিস্তি:' : 'Rate:'}</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[11px] font-bold text-slate-500">৳</span>
                          <input
                            type="number"
                            min={0}
                            value={currentShareAmt}
                            onChange={(e) => handleIndividualShareAmountChange(shareNo, Number(e.target.value))}
                            className="w-18 px-1.5 py-0.5 bg-white border border-blue-300 rounded text-xs font-bold text-slate-800 text-right"
                          />
                        </div>
                      </div>
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
                {isBn ? 'সংশোধিত পরিমাণ (৳)' : 'Adjusted Amount (৳)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-900 bg-blue-50/50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="cash">{isBn ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
                <option value="bank">{isBn ? 'ব্যাংক ট্রান্সফার (Bank)' : 'Bank Transfer'}</option>
                <option value="bkash">{isBn ? 'বিকাশ (bKash)' : 'bKash'}</option>
                <option value="nagad">{isBn ? 'নগদ (Nagad)' : 'Nagad'}</option>
              </select>
            </div>
          </div>

          {paymentMethod === 'bank' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'সমিতির ব্যাংক হিসাব' : 'Society Bank Account'}
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
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
              {isBn ? 'মন্তব্য / সংশোধনের কারণ' : 'Notes / Reason for Edit'}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Collector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'আদায়কারী / এন্ট্রি কারক' : 'Collector / Entered By'}
            </label>
            <input
              type="text"
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Delete Warning Prompt */}
          {showDeleteConfirm && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {isBn 
                    ? 'আপনি কি নিশ্চিতভাবে এই সম্পূর্ণ লেনদেনটি মুছে ফেলতে চান? এতে করে ক্যাশ ও সদস্যের স্থিতি আগের অবস্থায় ফিরে যাবে।'
                    : 'Are you sure you want to completely delete this transaction? Member and cash balances will be automatically reverted.'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'না, ফিরুন' : 'No, Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {!showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'লেনদেন মুছুন (Delete)' : 'Delete Record'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isBn ? 'সংরক্ষণ করুন' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
