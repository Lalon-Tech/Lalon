import React, { useState, useMemo } from 'react';
import { 
  User, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  Coins, 
  CreditCard,
  Award,
  CheckCircle2
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

export const MemberAnnualStatement: React.FC = () => {
  const { members, transactions, loans, settings, useBengaliDigits } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [memberSearch, setMemberSearch] = useState<string>('');

  const member = useMemo(() => {
    return members.find(m => m.id === selectedMemberId) || members[0];
  }, [members, selectedMemberId]);

  // Filtered members for dropdown
  const filteredMemberList = useMemo(() => {
    if (!memberSearch) return members;
    const q = memberSearch.toLowerCase();
    return members.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.memberNo.toLowerCase().includes(q) || 
      (m.phone && m.phone.includes(q))
    );
  }, [members, memberSearch]);

  // Transactions for selected member in selected year
  const memberYearTransactions = useMemo(() => {
    if (!member) return [];
    return transactions.filter(t => {
      const matchMember = t.memberId === member.id || t.memberNo === member.memberNo;
      const matchYear = t.date.startsWith(`${selectedYear}-`);
      return matchMember && matchYear && t.status === 'completed';
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, member, selectedYear]);

  // Financial aggregates for the year
  const totalDeposited = useMemo(() => {
    return memberYearTransactions
      .filter(t => ['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [memberYearTransactions]);

  const totalWithdrawn = useMemo(() => {
    return memberYearTransactions
      .filter(t => ['withdraw', 'dps_withdraw', 'fdr_withdraw', 'share_surrender'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [memberYearTransactions]);

  const totalProfitReceived = useMemo(() => {
    return memberYearTransactions
      .filter(t => ['profit_share', 'dividend_payout'].includes(t.type))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [memberYearTransactions]);

  const totalLoanRepaid = useMemo(() => {
    return memberYearTransactions
      .filter(t => t.type === 'loan_installment')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [memberYearTransactions]);

  const memberLoans = useMemo(() => {
    if (!member) return [];
    return loans.filter(l => l.memberId === member.id);
  }, [loans, member]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!member) return;
    const data = memberYearTransactions.map((tx, idx) => {
      const typeInfo = getTransactionTypeName(tx.type, isBn);
      return {
        [isBn ? 'ক্রমিক' : 'SL']: idx + 1,
        [isBn ? 'ভাউচার নং' : 'Voucher No']: tx.voucherNo,
        [isBn ? 'তারিখ' : 'Date']: tx.date,
        [isBn ? 'খাত' : 'Type']: typeInfo.label,
        [isBn ? 'জমা (৳)' : 'Deposit (৳)']: typeInfo.isCredit ? tx.amount : 0,
        [isBn ? 'উত্তোলন (৳)' : 'Withdrawal (৳)']: !typeInfo.isCredit ? tx.amount : 0,
        [isBn ? 'পেমেন্ট মাধ্যম' : 'Method']: tx.paymentMethod,
        [isBn ? 'মন্তব্য' : 'Notes']: tx.notes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Statement_${member.memberNo}`);
    XLSX.writeFile(wb, `Member_Statement_${member.memberNo}_${selectedYear}.xlsx`);
  };

  if (!member) {
    return (
      <div className="p-8 text-center text-slate-400">
        {isBn ? 'কোনো সদস্য নির্বাচিত নেই।' : 'No member selected.'}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search & Selection Controls (no-print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs no-print">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {isBn ? 'বার্ষিক সদস্য হিসাব বিবরণী (Annual Member Statement)' : 'Annual Member Statement'}
            </h3>
            <span className="text-xs text-slate-500">
              {isBn ? 'সদস্যের বাৎসরিক সঞ্চয়, মুনাফা, ঋণ ও উত্তোলনের পূর্ণাঙ্গ সারসংক্ষেপ।' : 'Yearly ledger breakdown and official membership statement.'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBn ? 'বিবরণী প্রিন্ট' : 'Print Statement'}</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'এক্সেল' : 'Excel'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {/* Member Search / Selector */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'সদস্য নির্বাচন করুন' : 'Select Member'}
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {filteredMemberList.map(m => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {m.name} ({m.phone || 'No phone'}) - সঞ্চয়: ৳{m.totalSavings}
                </option>
              ))}
            </select>
          </div>

          {/* Financial Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'অর্থবছর / সাল' : 'Financial Year'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value={2026}>২০২৬ (2026)</option>
              <option value={2025}>২০২৫ (2025)</option>
              <option value={2024}>২০২৪ (2024)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable Statement Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Certificate Header */}
        <div className="p-6 text-center border-b border-slate-200 bg-slate-50/50">
          <h1 className="text-xl font-black text-slate-900">{settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}</h1>
          <p className="text-xs text-slate-600 mt-0.5">{settings.address || 'ঢাকা, বাংলাদেশ'} • রেজি: {settings.registrationNo || 'REG-2024-889'}</p>
          <div className="inline-block px-4 py-1.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-full text-xs font-bold mt-2">
            {isBn ? `বার্ষিক সদস্য হিসাব বিবরণী - অর্থবছর ${selectedYear}` : `Annual Member Statement - FY ${selectedYear}`}
          </div>
        </div>

        {/* Member Profile Snapshot Bar */}
        <div className="p-6 bg-slate-50/30 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">{isBn ? 'সদস্যের নাম' : 'Member Name'}</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{member.name}</span>
            <span className="text-slate-500 text-[11px]">{member.nameEn || ''}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">{isBn ? 'সদস্য নং ও ফোন' : 'Member ID & Phone'}</span>
            <span className="font-mono font-bold text-blue-700 text-sm mt-0.5 block">{member.memberNo}</span>
            <span className="font-mono text-slate-600 text-[11px]">{member.phone || 'N/A'}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">{isBn ? 'শেয়ার সংখ্যা ও মূল্য' : 'Shares Held'}</span>
            <span className="font-bold text-slate-900 text-sm mt-0.5 block">{member.shareCount || 0} টি শেয়ার</span>
            <span className="text-slate-500 text-[11px]">মূল্য: ৳{(member.shareCount || 0) * (settings.sharePricePerUnit || 1000)}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">{isBn ? 'বর্তমান মোট সঞ্চয় স্থিতি' : 'Total Current Savings'}</span>
            <span className="font-bold text-emerald-700 text-base mt-0.5 block">
              ৳{(member.totalSavings || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-slate-500 text-[10px]">সাধারণ: ৳{member.generalSavingsBalance || 0} | DPS: ৳{member.dpsSavingsBalance || 0}</span>
          </div>
        </div>

        {/* Annual Metrics Grid */}
        <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white border-b border-slate-200">
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-700 block">{isBn ? 'এ বছরে মোট জমা' : 'Deposits This Year'}</span>
            <span className="text-base font-bold text-emerald-900 mt-0.5 block">৳{totalDeposited.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
            <span className="text-[11px] font-semibold text-blue-700 block">{isBn ? 'লভ্যাংশ / অর্জিত মুনাফা' : 'Profits Received'}</span>
            <span className="text-base font-bold text-blue-900 mt-0.5 block">৳{totalProfitReceived.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
            <span className="text-[11px] font-semibold text-rose-700 block">{isBn ? 'মোট উত্তোলন' : 'Withdrawals'}</span>
            <span className="text-base font-bold text-rose-900 mt-0.5 block">৳{totalWithdrawn.toLocaleString('en-IN')}</span>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
            <span className="text-[11px] font-semibold text-amber-700 block">{isBn ? 'ঋণ পরিশোধ কিস্তি' : 'Loan Kisti Paid'}</span>
            <span className="text-base font-bold text-amber-900 mt-0.5 block">৳{totalLoanRepaid.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Transaction History in Year */}
        <div className="p-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {isBn ? `বছরভিত্তিক লেনদেন খতিয়ান (${selectedYear})` : `Year Ledger Entries (${selectedYear})`}
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-12 text-center">{isBn ? 'নং' : 'SL'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'ভাউচার নং ও তারিখ' : 'Voucher & Date'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'খাত / বিবরণ' : 'Description'}</th>
                  <th className="py-2.5 px-3 text-right">{isBn ? 'জমা (৳)' : 'Deposit'}</th>
                  <th className="py-2.5 px-3 text-right">{isBn ? 'উত্তোলন (৳)' : 'Withdrawal'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'আদায়কারী' : 'Collector'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {memberYearTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {isBn ? 'এই অর্থবছরে কোনো লেনদেন তথ্য নেই।' : 'No transactions recorded for this member in this year.'}
                    </td>
                  </tr>
                ) : (
                  memberYearTransactions.map((tx, idx) => {
                    const typeInfo = getTransactionTypeName(tx.type, isBn);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-800 block">{tx.voucherNo}</span>
                          <span className="text-[10px] text-slate-400">{formatBengaliDate(tx.date, isBn)}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800">{typeInfo.label}</span>
                          {tx.notes && <span className="text-[10px] text-slate-400 block">{tx.notes}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {typeInfo.isCredit ? `৳${tx.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">
                          {!typeInfo.isCredit ? `৳${tx.amount.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">{tx.collectedBy || 'Staff'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printed Signatures */}
        <div className="print-only p-8 mt-12 grid grid-cols-2 gap-12 text-center text-xs text-slate-800">
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">সদস্যের স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">হিসাব বিবরণী গ্রহণকারী</span>
          </div>
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">ম্যানেজার / সম্পাদকের স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">অনুমোদনকারী কর্মকর্তা ও সিল</span>
          </div>
        </div>
      </div>
    </div>
  );
};
