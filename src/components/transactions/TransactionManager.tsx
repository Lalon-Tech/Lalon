import React, { useState } from 'react';
import { 
  BadgePercent, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  ArrowDownRight, 
  ArrowUpRight, 
  CreditCard, 
  Coins, 
  Eye, 
  Receipt,
  Calendar,
  Layers,
  Edit3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { Transaction } from '../../types';
import { EditTransactionModal } from './EditTransactionModal';
import { 
  formatCurrency, 
  formatInteger, 
  formatBengaliDate, 
  getTransactionTypeName,
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const TransactionManager: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    transactions, 
    useBengaliDigits, 
    openReceiptForTx,
    setShowQuickDepositModal,
    setShowQuickWithdrawModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal
  } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  const filteredTransactions = transactions.filter((tx) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      ((tx.memberName ?? '').toLowerCase().includes(q)) ||
      ((tx.voucherNo ?? '').toLowerCase().includes(q)) ||
      ((tx.notes ?? '').toLowerCase().includes(q)) ||
      ((tx.collectedBy ?? '').toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (typeFilter !== 'all') {
      if (typeFilter === 'deposit_all' && !['deposit', 'dps_deposit', 'fdr_deposit'].includes(tx.type)) return false;
      if (typeFilter === 'loan_all' && !['loan_disbursed', 'loan_installment'].includes(tx.type)) return false;
      if (typeFilter !== 'deposit_all' && typeFilter !== 'loan_all' && tx.type !== typeFilter) return false;
    }

    if (dateFilter && tx.date !== dateFilter) return false;

    return true;
  });

  const exportToExcel = () => {
    const dataToExport = filteredTransactions.map(tx => {
      const typeInfo = getTransactionTypeName(tx.type, isBn);
      return {
        [isBn ? 'ভাউচার নং' : 'Voucher No']: tx.voucherNo,
        [isBn ? 'তারিখ' : 'Date']: tx.date,
        [isBn ? 'সময়' : 'Time']: tx.time,
        [isBn ? 'সদস্য নাম' : 'Member Name']: tx.memberName || '-',
        [isBn ? 'লেনদেনের ধরন' : 'Transaction Type']: typeInfo.label,
        [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: tx.amount,
        [isBn ? 'মাধ্যম' : 'Method']: tx.paymentMethod,
        [isBn ? 'কালেক্টর' : 'Collector']: tx.collectedBy,
        [isBn ? 'মন্তব্য' : 'Notes']: tx.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'লেনদেন বিবরণী' : 'Transactions Ledger');
    XLSX.writeFile(wb, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <BadgePercent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {isBn ? 'লেনদেন ব্যবস্থাপনা ও হিস্ট্রি' : 'Transaction Management & Ledger'}
            </h2>
            <p className="text-xs text-slate-500">
              {isBn ? `সর্বমোট লেনদেন রেকর্ড: ${displayCount(transactions.length)} টি` : `Total transaction records: ${displayCount(transactions.length)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowQuickDepositModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{isBn ? 'টাকা জমা' : 'Deposit'}</span>
          </button>
          <button
            onClick={() => setShowQuickWithdrawModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{isBn ? 'উত্তোলন' : 'Withdraw'}</span>
          </button>
          <button
            onClick={() => setShowQuickKistiModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{isBn ? 'কিস্তি আদায়' : 'Collect Kisti'}</span>
          </button>
          <button
            onClick={() => setShowQuickLoanModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{isBn ? 'নতুন ঋণ' : 'New Loan'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? "ভাউচার নং, সদস্য নাম, কালেক্টর..." : "Voucher no, member name, collector..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-rose-500 hover:underline whitespace-nowrap font-medium cursor-pointer"
            >
              {isBn ? 'রিসেট তারিখ' : 'Reset Date'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white"
          >
            <option value="all">{isBn ? 'সকল লেনদেন' : 'All Transactions'}</option>
            <option value="deposit_all">{isBn ? 'সকল সঞ্চয় জমা (সাধারণ+ডিপিএস+এফডিআর)' : 'All Savings Deposits (Gen+DPS+FDR)'}</option>
            <option value="loan_all">{isBn ? 'ঋণ লেনদেন (বিতরণ ও কিস্তি)' : 'Loan Transactions (Disbursement & Kisti)'}</option>
            <option value="deposit">{isBn ? 'সাধারণ সঞ্চয় জমা' : 'General Savings Deposit'}</option>
            <option value="withdraw">{isBn ? 'সঞ্চয় উত্তোলন' : 'Savings Withdrawal'}</option>
            <option value="loan_installment">{isBn ? 'ঋণের কিস্তি আদায়' : 'Loan Installment Collection'}</option>
            <option value="loan_disbursed">{isBn ? 'ঋণ বিতরণ' : 'Loan Disbursement'}</option>
            <option value="dps_deposit">{isBn ? 'ডিপিএস জমা' : 'DPS Deposit'}</option>
            <option value="fdr_deposit">{isBn ? 'স্থায়ী আমানত (FDR)' : 'Fixed Deposit (FDR)'}</option>
            <option value="admission_fee">{isBn ? 'ভর্তি ফি' : 'Admission Fee'}</option>
            <option value="income">{isBn ? 'বিবিধ আয়' : 'Other Income'}</option>
            <option value="expense">{isBn ? 'অফিস খরচ' : 'Office Expense'}</option>
          </select>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'এক্সেল রপ্তানি' : 'Export Excel'}</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                <th className="py-3 px-4">{isBn ? 'ভাউচার নং' : 'Voucher No'}</th>
                <th className="py-3 px-4">{isBn ? 'গ্রাহক / সদস্য' : 'Member / Customer'}</th>
                <th className="py-3 px-4">{isBn ? 'লেনদেনের ধরন' : 'Transaction Type'}</th>
                <th className="py-3 px-4">{isBn ? 'মাধ্যম' : 'Method'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'আদায় / জমা (৳)' : 'Credit / Deposit (৳)'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'প্রদান / বিতরণ (৳)' : 'Debit / Disbursed (৳)'}</th>
                <th className="py-3 px-4">{isBn ? 'কালেক্টর' : 'Collector'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'মানি রসিদ' : 'Receipt'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {isBn ? 'কোনো লেনদেন পাওয়া যায়নি।' : 'No transactions found.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const typeInfo = getTransactionTypeName(tx.type, isBn);
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => openReceiptForTx(tx)}
                    >
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {formatBengaliDate(tx.date, isBn)}
                        <span className="block text-[10px] text-slate-400">{tx.time}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {tx.voucherNo}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {tx.memberName || <span className="text-slate-400 font-normal">{isBn ? 'সমিতি ফান্ড' : 'Somiti Fund'}</span>}
                        {tx.memberNo && (
                          <span className="block text-[10px] text-slate-400 font-mono">{tx.memberNo}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeInfo.badge}`}>
                          {typeInfo.label}
                        </span>
                        {tx.selectedShares && tx.selectedShares.length > 0 && (
                          <span className="inline-block ml-1.5 px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                            শেয়ার: {tx.selectedShares.map(s => `#${toBengaliNumber(s)}`).join(', ')}
                          </span>
                        )}
                        {tx.notes && <span className="block text-[10px] text-slate-400 truncate max-w-xs mt-0.5">{tx.notes}</span>}
                      </td>

                      <td className="py-3 px-4 uppercase font-semibold text-slate-500">
                        {tx.paymentMethod}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                        {typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">
                        {!typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {tx.collectedBy}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTx(tx);
                            }}
                            className="px-2 py-1 text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                            title={isBn ? 'লেনদেন সংশোধন / এডিট' : 'Edit Transaction'}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isBn ? 'সংশোধন' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReceiptForTx(tx);
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          >
                            {isBn ? 'রসিদ' : 'Receipt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
      />
    </div>
  );
};
