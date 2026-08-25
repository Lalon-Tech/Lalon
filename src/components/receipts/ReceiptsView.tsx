import React, { useState } from 'react';
import { 
  Receipt, 
  Printer, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  Coins, 
  CreditCard,
  Eye,
  CheckCircle2,
  Share2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  getTransactionTypeName, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';
import { TransactionType } from '../../types';

export const ReceiptsView: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    transactions, 
    useBengaliDigits, 
    openReceiptForTx,
    setSelectedMemberId,
    setActiveTab 
  } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit' | TransactionType>('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredTransactions = transactions.filter((t) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (t.voucherNo ?? '').toLowerCase().includes(q) ||
      (t.memberName ?? '').toLowerCase().includes(q) ||
      (t.memberNo ?? '').toLowerCase().includes(q) ||
      (t.collectedBy ?? '').toLowerCase().includes(q) ||
      (t.notes ?? '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (dateFilter && t.date !== dateFilter) return false;

    const typeInfo = getTransactionTypeName(t.type);
    if (typeFilter === 'credit') return typeInfo.isCredit;
    if (typeFilter === 'debit') return !typeInfo.isCredit;
    if (typeFilter !== 'all') return t.type === typeFilter;

    return true;
  });

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  const totalReceiptsCount = transactions.length;
  const creditReceipts = transactions.filter(t => getTransactionTypeName(t.type).isCredit);
  const debitReceipts = transactions.filter(t => !getTransactionTypeName(t.type).isCredit);

  const totalCreditAmount = creditReceipts.reduce((s, t) => s + t.amount, 0);
  const totalDebitAmount = debitReceipts.reduce((s, t) => s + t.amount, 0);

  const exportToExcel = () => {
    const dataToExport = filteredTransactions.map(t => {
      const typeInfo = getTransactionTypeName(t.type, isBn);
      return {
        [isBn ? 'ভাউচার নং' : 'Voucher No']: t.voucherNo,
        [isBn ? 'তারিখ' : 'Date']: t.date,
        [isBn ? 'সময়' : 'Time']: t.time,
        [isBn ? 'সদস্যের নাম' : 'Member Name']: t.memberName,
        [isBn ? 'সদস্য নং' : 'Member No']: t.memberNo,
        [isBn ? 'রসিদের ধরন' : 'Receipt Type']: typeInfo.label,
        [isBn ? 'লেনদেনের দিক' : 'Flow']: typeInfo.isCredit ? 'জমা (Inflow)' : 'প্রদান (Outflow)',
        [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: t.amount,
        [isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method']: t.paymentMethod,
        [isBn ? 'আদায়কারী' : 'Collector']: t.collectedBy,
        [isBn ? 'মন্তব্য' : 'Notes']: t.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'রসিদ খাতা' : 'Receipts Ledger');
    XLSX.writeFile(wb, `bondhu_receipts_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'মোট ইস্যুকৃত রসিদ/ভাউচার' : 'Total Issued Receipts'}</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {displayCount(totalReceiptsCount)} {isBn ? 'টি' : 'Receipts'}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'সর্বমোট সংরক্ষিত মানি রসিদ' : 'All time generated receipts'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'জমা রসিদ (Cash In)' : 'Deposit Receipts'}</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalCreditAmount, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-emerald-600 font-medium">
            {displayCount(creditReceipts.length)} {isBn ? 'টি জমা ভাউচার' : 'Credit Vouchers'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'প্রদান ভাউচার (Cash Out)' : 'Payment Vouchers'}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {formatCurrency(totalDebitAmount, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-rose-600 font-medium">
            {displayCount(debitReceipts.length)} {isBn ? 'টি প্রদান ভাউচার' : 'Debit Vouchers'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'প্রিন্ট ও ডকুমেন্টেশন' : 'Official Printing'}</span>
            <Printer className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            ১০০%
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'স্মার্ট অফিসিয়াল প্রিন্ট ফরম্যাট' : 'Smart Printable Layout'}
          </span>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? "রসিদ খুঁজুন (ভাউচার নং, সদস্য নাম, সদস্য নং, আদায়কারী)..." : "Search receipt (Voucher #, Name, A/C #)..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-slate-700 focus:outline-hidden text-xs cursor-pointer"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-slate-400 hover:text-slate-600 font-bold ml-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'এক্সেল' : 'Excel'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'all' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'সকল রসিদ' : 'All Receipts'}
          </button>
          <button
            onClick={() => setTypeFilter('credit')}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'credit' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'জমা রসিদ (Cash In)' : 'Deposit Receipts'}
          </button>
          <button
            onClick={() => setTypeFilter('debit')}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'debit' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'প্রদান ভাউচার (Cash Out)' : 'Payment Vouchers'}
          </button>
          <button
            onClick={() => setTypeFilter('loan_installment')}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'loan_installment' ? 'bg-teal-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'কিস্তি আদায়' : 'Installment'}
          </button>
          <button
            onClick={() => setTypeFilter('dps_deposit')}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'dps_deposit' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'ডিপিএস কিস্তি' : 'DPS'}
          </button>
          <button
            onClick={() => setTypeFilter('share_purchase')}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === 'share_purchase' ? 'bg-amber-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {isBn ? 'শেয়ার ক্রয়' : 'Shares'}
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'ভাউচার ও তারিখ' : 'Voucher & Date'}</th>
                <th className="py-3 px-4">{isBn ? 'সদস্যের তথ্য' : 'Member Info'}</th>
                <th className="py-3 px-4">{isBn ? 'রসিদের ধরন' : 'Receipt Type'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</th>
                <th className="py-3 px-4">{isBn ? 'আদায়কারী / মাধ্যম' : 'Collector / Method'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'প্রিন্ট রসিদ' : 'Print Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p>{isBn ? 'কোনো মানি রসিদ খুঁজে পাওয়া যায়নি।' : 'No receipts found.'}</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const typeInfo = getTransactionTypeName(tx.type, isBn);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Voucher & Date */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          {tx.voucherNo}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatBengaliDate(tx.date, isBn)} • {tx.time}
                        </div>
                      </td>

                      {/* Member Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {tx.memberName}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {tx.memberNo}
                        </div>
                      </td>

                      {/* Receipt Type */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          typeInfo.isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {typeInfo.isCredit ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                          <span>{typeInfo.label}</span>
                        </span>
                        {tx.notes && (
                          <span className="block text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {tx.notes}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <div className={`font-bold text-sm ${
                          typeInfo.isCredit ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {typeInfo.isCredit ? '+' : '-'}{formatCurrency(tx.amount, isBn && useBengaliDigits)}
                        </div>
                      </td>

                      {/* Collector & Method */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-700 font-medium">
                          {tx.collectedBy}
                        </div>
                        <span className="text-[11px] text-slate-400 uppercase">
                          {tx.paymentMethod === 'cash' ? (isBn ? 'নগদ ক্যাশ' : 'Cash') : (isBn ? 'ব্যাংক ট্রান্সফার' : 'Bank')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openReceiptForTx(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer group"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isBn ? 'মানি রসিদ' : 'Print'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
