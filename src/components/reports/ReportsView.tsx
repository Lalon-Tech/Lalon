import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  ArrowDownRight, 
  ArrowUpRight, 
  CreditCard, 
  Coins, 
  TrendingUp, 
  FileText, 
  Filter, 
  PieChart, 
  Calculator, 
  CheckCircle2, 
  Users,
  Archive
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShareClosuresList } from '../members/ShareClosuresList';
import { 
  formatCurrency, 
  formatBengaliDate, 
  getTransactionTypeName, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const ReportsView: React.FC = () => {
  const { language, t } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    loans, 
    savingsSchemes, 
    transactions, 
    shareClosures,
    incomeExpenses, 
    cashInHand, 
    bankAccounts, 
    settings, 
    useBengaliDigits, 
    distributeProfitToSavings, 
    activeTab 
  } = useSomiti();

  const [activeReport, setActiveReport] = useState<'daily' | 'monthly' | 'member' | 'income_expense' | 'dividend' | 'yearly' | 'closed_shares'>(() => {
    if (activeTab === 'reports_monthly' || activeTab === 'report_monthly') return 'monthly';
    if (activeTab === 'reports_member' || activeTab === 'report_members') return 'member';
    if (activeTab === 'reports_income_expense' || activeTab === 'report_income_expense') return 'income_expense';
    if (activeTab === 'reports_yearly' || activeTab === 'report_yearly') return 'yearly';
    if (activeTab === 'reports_shares' || activeTab === 'report_shares') return 'closed_shares';
    return 'daily';
  });

  useEffect(() => {
    if (activeTab === 'reports_monthly' || activeTab === 'report_monthly') setActiveReport('monthly');
    else if (activeTab === 'reports_member' || activeTab === 'report_members') setActiveReport('member');
    else if (activeTab === 'reports_income_expense' || activeTab === 'report_income_expense') setActiveReport('income_expense');
    else if (activeTab === 'reports_yearly' || activeTab === 'report_yearly') setActiveReport('yearly');
    else if (activeTab === 'reports_shares' || activeTab === 'report_shares') setActiveReport('closed_shares');
    else if (activeTab === 'reports_daily' || activeTab === 'report_daily') setActiveReport('daily');
  }, [activeTab]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  
  // Custom Profit Distribution State
  const [profitToDistribute, setProfitToDistribute] = useState<number>(4000);
  const [distributionCriteria, setDistributionCriteria] = useState<'total_deposit' | 'general_savings' | 'share_capital'>('total_deposit');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [creditSuccessInfo, setCreditSuccessInfo] = useState<{ count: number; total: number } | null>(null);

  // Safe fallbacks
  const safeTransactions = transactions || [];
  const safeIncomeExpenses = incomeExpenses || [];
  const safeMembers = members || [];
  const safeLoans = loans || [];
  const safeBankAccounts = bankAccounts || [];

  // Daily Calculations
  const dailyTransactions = safeTransactions.filter(t => t.date === selectedDate);
  const dailyDeposit = dailyTransactions
    .filter(t => ['deposit', 'dps_deposit', 'fdr_deposit', 'admission_fee'].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);
  const dailyLoanDisbursed = dailyTransactions
    .filter(t => t.type === 'loan_disbursed')
    .reduce((s, t) => s + t.amount, 0);
  const dailyKistiCollected = dailyTransactions
    .filter(t => t.type === 'loan_installment')
    .reduce((s, t) => s + t.amount, 0);
  const dailyWithdrawal = dailyTransactions
    .filter(t => t.type === 'withdraw')
    .reduce((s, t) => s + t.amount, 0);

  // Monthly Calculations
  const monthlyTransactions = safeTransactions.filter(t => t.date.startsWith(selectedMonth));
  const monthlyIncomeList = safeIncomeExpenses.filter(i => i.date.startsWith(selectedMonth) && i.type === 'income');
  const monthlyExpenseList = safeIncomeExpenses.filter(i => i.date.startsWith(selectedMonth) && i.type === 'expense');
  const totalMonthlyIncome = monthlyIncomeList.reduce((s, i) => s + i.amount, 0);
  const totalMonthlyExpense = monthlyExpenseList.reduce((s, i) => s + i.amount, 0);

  // Yearly Totals
  const totalSavingsFund = safeMembers.reduce((s, m) => s + (m.totalSavings || 0), 0);
  const totalShareFund = safeMembers.reduce((s, m) => s + (m.shareValue || 0), 0);
  const totalActiveLoans = safeLoans.reduce((s, l) => s + (l.status === 'active' ? l.remainingAmount : 0), 0);
  const totalBankBalances = safeBankAccounts.reduce((s, b) => s + (b.balance || 0), 0);
  const totalLiquidAssets = (cashInHand || 0) + totalBankBalances;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let exportData: any[] = [];
    let fileName = 'somiti_report.xlsx';

    if (activeReport === 'daily') {
      exportData = dailyTransactions.map(t => ({
        [isBn ? 'ভাউচার' : 'Voucher']: t.voucherNo,
        [isBn ? 'সদস্য নাম' : 'Member Name']: t.memberName || '-',
        [isBn ? 'ধরন' : 'Type']: t.type,
        [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: t.amount,
        [isBn ? 'মাধ্যম' : 'Method']: t.paymentMethod,
        [isBn ? 'সময়' : 'Time']: t.time,
      }));
      fileName = `daily_report_${selectedDate}.xlsx`;
    } else if (activeReport === 'member') {
      exportData = members.map(m => ({
        [isBn ? 'সদস্য নং' : 'Member No']: m.memberNo,
        [isBn ? 'নাম' : 'Name']: m.name,
        [isBn ? 'মোবাইল' : 'Phone']: m.phone,
        [isBn ? 'শেয়ার মূল্য (৳)' : 'Share Value (৳)']: m.shareValue,
        [isBn ? 'মোট সঞ্চয় (৳)' : 'Total Savings (৳)']: m.totalSavings,
        [isBn ? 'চলতি ঋণ (৳)' : 'Active Loans (৳)']: m.activeLoanBalance,
        [isBn ? 'অবস্থা' : 'Status']: m.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive'),
      }));
      fileName = `member_wise_report.xlsx`;
    } else if (activeReport === 'dividend') {
      const totalDepositBase = members.reduce((sum, m) => sum + (m.savingsBalance || 0), 0);
      exportData = members.map(m => {
        const memberBalance = m.savingsBalance || 0;
        const shareRatio = totalDepositBase > 0 ? (memberBalance / totalDepositBase) : 0;
        const profitShare = profitToDistribute * shareRatio;
        return {
          [isBn ? 'সদস্য নং' : 'Member No']: m.memberNo,
          [isBn ? 'নাম' : 'Name']: m.name,
          [isBn ? 'মোবাইল' : 'Phone']: m.phone,
          [isBn ? 'সদস্যের মোট জমা (৳)' : 'Member Deposit (৳)']: memberBalance,
          [isBn ? 'জমার অনুপাত (%)' : 'Ratio (%)']: (shareRatio * 100).toFixed(2) + '%',
          [isBn ? 'বণ্টনকৃত লাভ (৳)' : 'Distributed Profit (৳)']: Math.round(profitShare),
        };
      });
      fileName = `dividend_distribution_${profitToDistribute}taka.xlsx`;
    } else {
      exportData = transactions.map(t => ({
        [isBn ? 'তারিখ' : 'Date']: t.date,
        [isBn ? 'ভাউচার' : 'Voucher']: t.voucherNo,
        [isBn ? 'সদস্য' : 'Member']: t.memberName || '-',
        [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: t.amount,
        [isBn ? 'ধরন' : 'Type']: t.type,
      }));
      fileName = `transactions_ledger.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'রিপোর্ট' : 'Report');
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Report Tab Selectors & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <button
            onClick={() => setActiveReport('daily')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeReport === 'daily' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'দৈনিক রিপোর্ট' : 'Daily Report'}
          </button>
          <button
            onClick={() => setActiveReport('monthly')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeReport === 'monthly' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'মাসিক রিপোর্ট' : 'Monthly Report'}
          </button>
          <button
            onClick={() => setActiveReport('member')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeReport === 'member' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'সদস্য রিপোর্ট' : 'Member Report'}
          </button>
          <button
            onClick={() => setActiveReport('income_expense')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeReport === 'income_expense' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'আয়-ব্যয় রিপোর্ট' : 'Income-Expense'}
          </button>
          <button
            onClick={() => setActiveReport('dividend')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeReport === 'dividend' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? '💰 লভ্যাংশ বণ্টন ক্যালকুলেটর' : '💰 Profit Distribution'}
          </button>
          <button
            onClick={() => setActiveReport('yearly')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all cursor-pointer ${
              activeReport === 'yearly' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isBn ? 'বার্ষিক আর্থিক প্রতিবেদন' : 'Annual Balance Sheet'}
          </button>
          <button
            onClick={() => setActiveReport('closed_shares')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              activeReport === 'closed_shares' ? 'bg-white text-amber-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isBn ? 'শেয়ার সমর্পণ/ক্লোজার রেজিস্টার' : 'Share Closure Register'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeReport === 'daily' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            />
          )}

          {activeReport === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            />
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'এক্সেল' : 'Excel'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isBn ? 'রিপোর্ট প্রিন্ট' : 'Print Report'}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 space-y-6">
        {/* Printable Report Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 uppercase">
            {settings.somitiName || (isBn ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bandhu Somobay Samity Ltd.')}
          </h1>
          <p className="text-xs text-slate-600">
            {isBn ? 'রেজিস্ট্রেশন নং:' : 'Reg No:'} {settings.registrationNo} • {settings.address}
          </p>
          <div className="mt-2 inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-bold text-slate-800">
            {activeReport === 'daily' && (isBn ? `দৈনিক সার্বিক কালেকশন ও হিসাব রিপোর্ট (${formatBengaliDate(selectedDate, false, isBn)})` : `Daily Collection & Accounts Report (${formatBengaliDate(selectedDate, false, isBn)})`)}
            {activeReport === 'monthly' && (isBn ? `মাসিক কার্যবিবরণী ও আর্থিক সারাংশ (${selectedMonth})` : `Monthly Financial Summary (${selectedMonth})`)}
            {activeReport === 'member' && (isBn ? 'সকল সদস্যের সঞ্চয় ও ঋণ স্থিতি তালিকা' : 'All Members Savings & Loan Balances')}
            {activeReport === 'income_expense' && (isBn ? 'প্রাতিষ্ঠানিক আয় ও ব্যয় বিবরণী' : 'Institutional Income & Expense Statement')}
            {activeReport === 'dividend' && (isBn ? `সদস্যদের সঞ্চয় আনুপাতিক মুনাফা/লভ্যাংশ বণ্টন বিবরণী (মোট বণ্টন: ${formatCurrency(profitToDistribute, isBn && useBengaliDigits)})` : `Proportional Profit Distribution Summary (Total: ${formatCurrency(profitToDistribute, isBn && useBengaliDigits)})`)}
            {activeReport === 'yearly' && (isBn ? 'বার্ষিক অডিট ও স্থিতিপত্র (Balance Sheet & Summary)' : 'Annual Balance Sheet & Audit Summary')}
            {activeReport === 'closed_shares' && (isBn ? 'সমিতির সকল সদস্যের শেয়ার ক্লোজার ও সমর্পণ রেজিস্টার (স্থায়ী অডিট রেকর্ড)' : 'Share Surrender & Closure Register (Permanent Audit Log)')}
          </div>
        </div>

        {/* 1. Daily Report Content */}
        {activeReport === 'daily' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-800 font-semibold block">{isBn ? 'আজকের সঞ্চয় জমা' : "Today's Savings"}</span>
                <span className="text-xl font-bold text-emerald-900">{formatCurrency(dailyDeposit, isBn && useBengaliDigits)}</span>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <span className="text-xs text-teal-800 font-semibold block">{isBn ? 'আজকের কিস্তি আদায়' : "Today's Loan Collection"}</span>
                <span className="text-xl font-bold text-teal-900">{formatCurrency(dailyKistiCollected, isBn && useBengaliDigits)}</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-xs text-indigo-800 font-semibold block">{isBn ? 'আজকের ঋণ বিতরণ' : "Today's Loan Disbursed"}</span>
                <span className="text-xl font-bold text-indigo-900">{formatCurrency(dailyLoanDisbursed, isBn && useBengaliDigits)}</span>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-800 font-semibold block">{isBn ? 'আজকের সঞ্চয় উত্তোলন' : "Today's Withdrawal"}</span>
                <span className="text-xl font-bold text-rose-900">{formatCurrency(dailyWithdrawal, isBn && useBengaliDigits)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                {isBn ? `আজকের লেনদেনের তালিকা (${toBengaliNumber(dailyTransactions.length)} টি)` : `Today's Transactions List (${dailyTransactions.length})`}
              </div>
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">{isBn ? 'ভাউচার' : 'Voucher'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'সদস্য' : 'Member'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'ধরন' : 'Type'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'মাধ্যম' : 'Method'}</th>
                    <th className="py-2.5 px-3 text-right">{isBn ? 'আদায় (৳)' : 'Credit (৳)'}</th>
                    <th className="py-2.5 px-3 text-right">{isBn ? 'প্রদান (৳)' : 'Debit (৳)'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'কালেক্টর' : 'Collector'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        {isBn ? 'এই তারিখে কোনো লেনদেন সম্পন্ন হয়নি।' : 'No transactions recorded on this date.'}
                      </td>
                    </tr>
                  ) : (
                    dailyTransactions.map((tx) => {
                      const typeInfo = getTransactionTypeName(tx.type, isBn);
                      return (
                        <tr key={tx.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{tx.voucherNo}</td>
                          <td className="py-2.5 px-3 font-semibold">{tx.memberName || (isBn ? 'সমিতি' : 'Samity')}</td>
                          <td className="py-2.5 px-3">{typeInfo.label}</td>
                          <td className="py-2.5 px-3 uppercase">{tx.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                            {!typeInfo.isCredit ? formatCurrency(tx.amount, isBn && useBengaliDigits) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{tx.collectedBy}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. Monthly Report Content */}
        {activeReport === 'monthly' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 border-b pb-1">{isBn ? 'মাসিক আদায় ও আমানত' : 'Monthly Collections & Deposits'}</h4>
                <div className="flex justify-between">
                  <span>{isBn ? 'মাসিক মোট সঞ্চয় জমা:' : 'Monthly Total Savings:'}</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(monthlyTransactions.filter(t => ['deposit', 'dps_deposit', 'fdr_deposit'].includes(t.type)).reduce((s, t) => s + t.amount, 0), isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isBn ? 'মাসিক কিস্তি আদায়:' : 'Monthly Loan Collections:'}</span>
                  <span className="font-bold text-teal-700">
                    {formatCurrency(monthlyTransactions.filter(t => t.type === 'loan_installment').reduce((s, t) => s + t.amount, 0), isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isBn ? 'মাসিক প্রাতিষ্ঠানিক আয়:' : 'Monthly Institutional Income:'}</span>
                  <span className="font-bold text-blue-700">{formatCurrency(totalMonthlyIncome, isBn && useBengaliDigits)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 border-b pb-1">{isBn ? 'মাসিক বিতরণ ও পরিচালন ব্যয়' : 'Monthly Disbursements & Expenses'}</h4>
                <div className="flex justify-between">
                  <span>{isBn ? 'মাসিক নতুন ঋণ বিতরণ:' : 'Monthly New Loans Disbursed:'}</span>
                  <span className="font-bold text-indigo-700">
                    {formatCurrency(monthlyTransactions.filter(t => t.type === 'loan_disbursed').reduce((s, t) => s + t.amount, 0), isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isBn ? 'মাসিক সঞ্চয় উত্তোলন:' : 'Monthly Savings Withdrawn:'}</span>
                  <span className="font-bold text-rose-600">
                    {formatCurrency(monthlyTransactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0), isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{isBn ? 'মাসিক অফিস খরচ (ব্যয়):' : 'Monthly Office Expenses:'}</span>
                  <span className="font-bold text-rose-700">{formatCurrency(totalMonthlyExpense, isBn && useBengaliDigits)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Member Wise Report */}
        {activeReport === 'member' && (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{isBn ? 'সদস্য নং' : 'Member No'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'নাম' : 'Name'}</th>
                  <th className="py-2.5 px-3">{isBn ? 'মোবাইল' : 'Phone'}</th>
                  <th className="py-2.5 px-3 text-center">{isBn ? 'শেয়ার' : 'Shares'}</th>
                  <th className="py-2.5 px-3 text-right">{isBn ? 'সাধারণ সঞ্চয়' : 'General Savings'}</th>
                  <th className="py-2.5 px-3 text-right">{isBn ? 'ডিপিএস সঞ্চয়' : 'DPS Savings'}</th>
                  <th className="py-2.5 px-3 text-right">{isBn ? 'মোট সঞ্চয়' : 'Total Savings'}</th>
                  <th className="py-2.5 px-3 text-right">{isBn ? 'চলতি ঋণ' : 'Active Loan'}</th>
                  <th className="py-2.5 px-3 text-center">{isBn ? 'অবস্থা' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{m.memberNo}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{m.name}</td>
                    <td className="py-2.5 px-3">{m.phone}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{isBn || useBengaliDigits ? toBengaliNumber(m.shareCount) : m.shareCount} {isBn ? 'টি' : ''}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(m.generalSavingsBalance, isBn && useBengaliDigits)}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(m.dpsSavingsBalance, isBn && useBengaliDigits)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(m.totalSavings, isBn && useBengaliDigits)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {m.activeLoanBalance > 0 ? formatCurrency(m.activeLoanBalance, isBn && useBengaliDigits) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.status === 'active' ? (isBn ? 'সক্রিয়' : 'Active') : (isBn ? 'নিষ্ক্রিয়' : 'Inactive')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Income / Expense Report */}
        {activeReport === 'income_expense' && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">{isBn ? 'তারিখ' : 'Date'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'ভাউচার' : 'Voucher'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'ধরন' : 'Type'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'খাত' : 'Category'}</th>
                    <th className="py-2.5 px-3">{isBn ? 'বিবরণ' : 'Description'}</th>
                    <th className="py-2.5 px-3 text-right">{isBn ? 'আদায় / আয় (৳)' : 'Income (৳)'}</th>
                    <th className="py-2.5 px-3 text-right">{isBn ? 'ব্যয় / খরচ (৳)' : 'Expense (৳)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeExpenses.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">{formatBengaliDate(item.date, false, isBn)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.voucherNo}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.type === 'income' ? (isBn ? 'আয়' : 'Income') : (isBn ? 'খরচ' : 'Expense')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{item.category}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.description || item.title}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {item.type === 'income' ? formatCurrency(item.amount, isBn && useBengaliDigits) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        {item.type === 'expense' ? formatCurrency(item.amount, isBn && useBengaliDigits) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Dividend / Profit Distribution by Savings Balance */}
        {activeReport === 'dividend' && (() => {
          // Calculate total eligible deposit base
          const totalDepositBase = members.reduce((sum, m) => {
            if (distributionCriteria === 'general_savings') return sum + (m.savingsBalance || 0);
            if (distributionCriteria === 'share_capital') return sum + ((m.totalShares || 0) * (settings.shareValue || 100));
            // 'total_deposit' = general savings + scheme deposits
            return sum + (m.savingsBalance || 0);
          }, 0);

          const membersWithProfit = members.map((m) => {
            const memberBalance = distributionCriteria === 'share_capital' 
              ? (m.totalShares || 0) * (settings.shareValue || 100)
              : (m.savingsBalance || 0);
            
            const shareRatio = totalDepositBase > 0 ? (memberBalance / totalDepositBase) : 0;
            const profitShare = profitToDistribute * shareRatio;
            const percentage = (shareRatio * 100).toFixed(2);

            return {
              ...m,
              memberBalance,
              shareRatio,
              percentage,
              profitShare
            };
          });

          const totalDistributed = membersWithProfit.reduce((s, m) => s + m.profitShare, 0);

          return (
            <div className="space-y-6">
              {/* Interactive Profit Setting Bar (No Print) */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-2xs space-y-4 no-print">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span>{isBn ? 'মুনাফা / লভ্যাংশ বণ্টন ক্যালকুলেটর' : 'Profit / Dividend Distribution Calculator'}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isBn ? 'এই মাসের মোট লাভ দিন। সফটওয়্যার স্বয়ংক্রিয়ভাবে যার যত জমা সেই অনুপাতে লাভ বের করে দেবে।' : 'Enter total distributable profit. The system automatically calculates share per member.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">{isBn ? 'বণ্টনযোগ্য মোট লাভ:' : 'Distributable Profit:'}</span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-bold text-blue-700">৳</span>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={profitToDistribute}
                          onChange={(e) => setProfitToDistribute(Math.max(0, Number(e.target.value) || 0))}
                          className="pl-6 pr-2 py-1 w-32 border border-slate-300 rounded-lg text-sm font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                          placeholder="4000"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setShowConfirmModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isBn ? 'সদস্যদের ব্যালেন্সে জমা করুন' : 'Credit to Member Accounts'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-blue-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">{isBn ? 'বণ্টনের অনুপাত ভিত্তি:' : 'Distribution Basis:'}</span>
                    <select
                      value={distributionCriteria}
                      onChange={(e) => setDistributionCriteria(e.target.value as any)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="total_deposit">{isBn ? 'সদস্যের মোট সঞ্চয় আমানত অনুপাত' : 'Total Savings Deposit Ratio'}</option>
                      <option value="share_capital">{isBn ? 'শেয়ার মূলধন অনুপাত' : 'Share Capital Ratio'}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <span>{isBn ? 'মোট সদস্য:' : 'Total Members:'} <strong className="text-slate-800">{isBn || useBengaliDigits ? toBengaliNumber(members.length) : members.length} {isBn ? 'জন' : ''}</strong></span>
                    <span>•</span>
                    <span>{isBn ? 'মোট যোগ্য সঞ্চয় তহবিল:' : 'Eligible Savings Fund:'} <strong className="text-emerald-700">{formatCurrency(totalDepositBase, isBn && useBengaliDigits)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Success Notification Alert */}
              {creditSuccessInfo && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn no-print">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="font-bold text-sm block">{isBn ? 'সাফল্যের সাথে ব্যালেন্সে যোগ সম্পন্ন হয়েছে!' : 'Successfully credited to balances!'}</strong>
                      <span>{isBn ? `মোট ${toBengaliNumber(creditSuccessInfo.count)} জন সদস্যের মূল সঞ্চয় হিসাবে মোট ${formatCurrency(creditSuccessInfo.total, isBn && useBengaliDigits)} টাকা লভ্যাংশ জমা করা হয়েছে।` : `Total ${creditSuccessInfo.count} members received profit dividend totaling ${formatCurrency(creditSuccessInfo.total, isBn && useBengaliDigits)}.`}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCreditSuccessInfo(null)}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
                  >
                    {isBn ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </div>
              )}

              {/* 3 Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold block">{isBn ? 'বণ্টনযোগ্য মোট মুনাফা' : 'Total Distributable Profit'}</span>
                  <span className="text-2xl font-black text-emerald-900">
                    {formatCurrency(profitToDistribute, isBn && useBengaliDigits)}
                  </span>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">{isBn ? 'সব সদস্যের মোট প্রাপ্তি' : 'Total received across all members'}</span>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-xs text-blue-800 font-semibold block">{isBn ? 'মোট সঞ্চয় মূলধন স্থিতি' : 'Total Savings Capital Base'}</span>
                  <span className="text-2xl font-black text-blue-900">
                    {formatCurrency(totalDepositBase, isBn && useBengaliDigits)}
                  </span>
                  <span className="text-[11px] text-blue-700 block mt-0.5">{isBn ? 'সদস্যদের সর্বমোট জমা' : 'Grand total deposited'}</span>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-xs text-purple-800 font-semibold block">{isBn ? 'মুনাফার কার্যকর হার (ROI)' : 'Effective Return Rate (ROI)'}</span>
                  <span className="text-2xl font-black text-purple-900">
                    {totalDepositBase > 0 ? ((profitToDistribute / totalDepositBase) * 100).toFixed(2) : '0.00'}%
                  </span>
                  <span className="text-[11px] text-purple-700 block mt-0.5">{isBn ? 'প্রতি ১০০ টাকার বিপরীতে আয়' : 'Return per 100 Taka'}</span>
                </div>
              </div>

              {/* Proportional Profit Calculation Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{isBn ? 'সদস্যভিত্তিক লভ্যাংশ বণ্টন তালিকা (যথাযথ আনুপাতিক হার)' : 'Member-wise Dividend Distribution List (Proportional)'}</span>
                  <span className="text-emerald-700 font-bold">{isBn ? 'মোট বণ্টন চেক:' : 'Total Distribution:'} {formatCurrency(totalDistributed, isBn && useBengaliDigits)}</span>
                </div>
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">{isBn ? 'সদস্য নং' : 'Member No'}</th>
                      <th className="py-2.5 px-3">{isBn ? 'সদস্যের নাম ও মোবাইল' : 'Member Name & Phone'}</th>
                      <th className="py-2.5 px-3 text-right">{isBn ? 'সদস্যের মোট জমা (টাকা)' : 'Total Deposit (৳)'}</th>
                      <th className="py-2.5 px-3 text-center">{isBn ? 'জমার অংশীদারি (%)' : 'Share Ratio (%)'}</th>
                      <th className="py-2.5 px-3 text-right">{isBn ? 'বণ্টনকৃত লাভ (৳)' : 'Distributed Profit (৳)'}</th>
                      <th className="py-2.5 px-3 text-center">{isBn ? 'স্বাক্ষর / প্রাপ্তি স্বীকার' : 'Signature / Acknowledgment'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membersWithProfit.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">{isBn ? 'কোনো সদস্য পাওয়া যায়নি' : 'No members found'}</td>
                      </tr>
                    ) : (
                      membersWithProfit.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{m.memberNo}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-800">{m.name}</div>
                            <div className="text-[10px] text-slate-400">{m.phone}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-900">
                            {formatCurrency(m.memberBalance, isBn && useBengaliDigits)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold rounded-md text-[11px]">
                              {isBn || useBengaliDigits ? toBengaliNumber(m.percentage) : m.percentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">
                            {formatCurrency(Math.round(m.profitShare), isBn && useBengaliDigits)}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-300">
                            ................................
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-extrabold text-xs text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={2} className="py-3 px-3">{isBn ? 'সর্বমোট (Total):' : 'Grand Total:'}</td>
                      <td className="py-3 px-3 text-right text-blue-900">
                        {formatCurrency(totalDepositBase, isBn && useBengaliDigits)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700">
                        {isBn || useBengaliDigits ? '১০০.০০%' : '100.00%'}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                        {formatCurrency(Math.round(totalDistributed), isBn && useBengaliDigits)}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-semibold">
                        {isBn ? '✓ পূর্ণ বণ্টন সম্পন্ন' : '✓ Full Distributed'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })()}

        {/* 6. Yearly Financial Summary */}
        {activeReport === 'yearly' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets / সম্পদ */}
              <div className="border border-slate-300 rounded-xl p-5 bg-slate-50/50 space-y-3 text-xs">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-300 pb-2">
                  {isBn ? 'সমিতির পরিসম্পদ (Assets)' : 'Samity Assets'}
                </h4>
                <div className="flex justify-between py-1">
                  <span>{isBn ? 'মাঠে বিনিয়োগকৃত ঋণ স্থিতি:' : 'Active Loan Portfolio:'}</span>
                  <span className="font-bold text-indigo-900">{formatCurrency(totalActiveLoans, isBn && useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{isBn ? 'ব্যাংক হিসাবসমূহে ব্যালেন্স:' : 'Bank Accounts Balances:'}</span>
                  <span className="font-bold text-blue-900">{formatCurrency(totalBankBalances, isBn && useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{isBn ? 'অফিস ক্যাশ ইন হ্যান্ড:' : 'Cash in Hand:'}</span>
                  <span className="font-bold text-emerald-900">{formatCurrency(cashInHand, isBn && useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-sm text-slate-900">
                  <span>{isBn ? 'মোট পরিসম্পদ (Total Assets):' : 'Total Assets:'}</span>
                  <span>{formatCurrency(totalActiveLoans + totalLiquidAssets, isBn && useBengaliDigits)}</span>
                </div>
              </div>

              {/* Liabilities / দায় ও মূলধন */}
              <div className="border border-slate-300 rounded-xl p-5 bg-slate-50/50 space-y-3 text-xs">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-300 pb-2">
                  {isBn ? 'দায় ও শেয়ার মূলধন (Liabilities & Equity)' : 'Liabilities & Equity'}
                </h4>
                <div className="flex justify-between py-1">
                  <span>{isBn ? 'সদস্যদের সঞ্চয় আমানত:' : 'Members Savings Deposits:'}</span>
                  <span className="font-bold text-emerald-900">{formatCurrency(totalSavingsFund, isBn && useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{isBn ? 'পরিশোধিত শেয়ার মূলধন:' : 'Paid-up Share Capital:'}</span>
                  <span className="font-bold text-amber-900">{formatCurrency(totalShareFund, isBn && useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>{isBn ? 'সংরক্ষিত তহবিল ও উদ্বৃত্ত:' : 'Retained Reserves & Surplus:'}</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(Math.max(0, (totalActiveLoans + totalLiquidAssets) - (totalSavingsFund + totalShareFund)), isBn && useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-sm text-slate-900">
                  <span>{isBn ? 'মোট দায় ও মূলধন:' : 'Total Liabilities & Equity:'}</span>
                  <span>{formatCurrency(totalActiveLoans + totalLiquidAssets, isBn && useBengaliDigits)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Closed Shares Register */}
        {activeReport === 'closed_shares' && (
          <div className="space-y-6">
            <ShareClosuresList />
          </div>
        )}

        {/* Report Footer Signatures */}
        <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs border-t border-slate-300">
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              {isBn ? 'হিসাবরক্ষক' : 'Accountant'}
            </div>
            <span className="text-[11px] text-slate-500">{isBn ? 'প্রস্তুতকারকের স্বাক্ষর' : 'Prepared By'}</span>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              {settings.secretaryName || (isBn ? 'সাধারণ সম্পাদক' : 'Secretary')}
            </div>
            <span className="text-[11px] text-slate-500">{isBn ? 'সাধারণ সম্পাদকের স্বাক্ষর' : 'Secretary Signature'}</span>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              {settings.presidentName || (isBn ? 'সভাপতি' : 'President')}
            </div>
            <span className="text-[11px] text-slate-500">{isBn ? 'সভাপতির স্বাক্ষর ও সিল' : 'President Signature & Seal'}</span>
          </div>
        </div>
      </div>

      {/* Profit Distribution Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                ৳
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">{isBn ? 'লভ্যাংশ বণ্টনের নিশ্চিতকরণ' : 'Confirm Dividend Distribution'}</h3>
                <p className="text-xs text-slate-500">{isBn ? 'সদস্যদের সঞ্চয় একাউন্টে লাভ ক্রেডিট হবে' : 'Profit will be credited to member savings accounts'}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>{isBn ? 'মোট বণ্টনযোগ্য লভ্যাংশ:' : 'Total Distributable Profit:'}</span>
                <strong className="text-emerald-700 font-bold text-sm">{formatCurrency(profitToDistribute, isBn && useBengaliDigits)}</strong>
              </div>
              <div className="flex justify-between">
                <span>{isBn ? 'লাভপ্রাপ্ত মোট সদস্য:' : 'Total Eligible Members:'}</span>
                <strong className="text-slate-800">{isBn || useBengaliDigits ? toBengaliNumber(members.length) : members.length} {isBn ? 'জন' : ''}</strong>
              </div>
              <div className="flex justify-between">
                <span>{isBn ? 'বণ্টনের ভিত্তি:' : 'Distribution Basis:'}</span>
                <strong className="text-slate-800">{distributionCriteria === 'share_capital' ? (isBn ? 'শেয়ার মূলধন' : 'Share Capital') : (isBn ? 'মোট সঞ্চয় আমানত' : 'Total Savings Deposit')}</strong>
              </div>
              <p className="text-[11px] text-amber-700 pt-2 border-t border-slate-200">
                {isBn ? '⚠️ নিশ্চিত করলে প্রতি সদস্যের জমার অংশীদারি (%) অনুপাতে তাদের মূল সাধারণ সঞ্চয় একাউন্টে এই টাকা যোগ হয়ে যাবে এবং পাসবুকে নতুন লেনদেন হিসেবে সংরক্ষিত হবে।' : '⚠️ Confirming will credit the profit to each member\'s General Savings account proportionally and record it in the passbook.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল করুন' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = distributeProfitToSavings({
                    profitAmount: profitToDistribute,
                    criteria: distributionCriteria,
                    notes: isBn ? `মাসিক সঞ্চয় লভ্যাংশ বণ্টন (মোট ৳${profitToDistribute} হতে প্রাপ্তি)` : `Monthly profit dividend distribution (from total ৳${profitToDistribute})`
                  });
                  setShowConfirmModal(false);
                  if (res.success) {
                    setCreditSuccessInfo({ count: res.count, total: res.totalDistributed });
                  }
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isBn ? 'হ্যাঁ, অ্যাকাউন্টে যোগ করুন' : 'Yes, Credit to Accounts'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
