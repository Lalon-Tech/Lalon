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
  Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  getTransactionTypeName,
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const ReportsView: React.FC = () => {
  const { 
    members, 
    loans, 
    savingsSchemes, 
    transactions, 
    incomeExpenses, 
    cashInHand,
    bankAccounts,
    settings, 
    useBengaliDigits,
    distributeProfitToSavings,
    activeTab
  } = useSomiti();

  const [activeReport, setActiveReport] = useState<'daily' | 'monthly' | 'member' | 'income_expense' | 'dividend' | 'yearly'>(() => {
    if (activeTab === 'reports_monthly' || activeTab === 'report_monthly') return 'monthly';
    if (activeTab === 'reports_member' || activeTab === 'report_members') return 'member';
    if (activeTab === 'reports_income_expense' || activeTab === 'report_income_expense') return 'income_expense';
    if (activeTab === 'reports_yearly' || activeTab === 'report_yearly') return 'yearly';
    return 'daily';
  });

  useEffect(() => {
    if (activeTab === 'reports_monthly' || activeTab === 'report_monthly') setActiveReport('monthly');
    else if (activeTab === 'reports_member' || activeTab === 'report_members') setActiveReport('member');
    else if (activeTab === 'reports_income_expense' || activeTab === 'report_income_expense') setActiveReport('income_expense');
    else if (activeTab === 'reports_yearly' || activeTab === 'report_yearly') setActiveReport('yearly');
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
        'ভাউচার': t.voucherNo,
        'সদস্য নাম': t.memberName || '-',
        'ধরন': t.type,
        'পরিমাণ (৳)': t.amount,
        'মাধ্যম': t.paymentMethod,
        'সময়': t.time,
      }));
      fileName = `daily_report_${selectedDate}.xlsx`;
    } else if (activeReport === 'member') {
      exportData = members.map(m => ({
        'সদস্য নং': m.memberNo,
        'নাম': m.name,
        'মোবাইল': m.phone,
        'শেয়ার মূল্য (৳)': m.shareValue,
        'মোট সঞ্চয় (৳)': m.totalSavings,
        'চলতি ঋণ (৳)': m.activeLoanBalance,
        'অবস্থা': m.status,
      }));
      fileName = `member_wise_report.xlsx`;
    } else if (activeReport === 'dividend') {
      const totalDepositBase = members.reduce((sum, m) => sum + (m.savingsBalance || 0), 0);
      exportData = members.map(m => {
        const memberBalance = m.savingsBalance || 0;
        const shareRatio = totalDepositBase > 0 ? (memberBalance / totalDepositBase) : 0;
        const profitShare = profitToDistribute * shareRatio;
        return {
          'সদস্য নং': m.memberNo,
          'নাম': m.name,
          'মোবাইল': m.phone,
          'সদস্যের মোট জমা (৳)': memberBalance,
          'জমার অনুপাত (%)': (shareRatio * 100).toFixed(2) + '%',
          'বণ্টনকৃত লাভ (৳)': Math.round(profitShare),
        };
      });
      fileName = `dividend_distribution_${profitToDistribute}taka.xlsx`;
    } else {
      exportData = transactions.map(t => ({
        'তারিখ': t.date,
        'ভাউচার': t.voucherNo,
        'সদস্য': t.memberName || '-',
        'পরিমাণ (৳)': t.amount,
        'ধরন': t.type,
      }));
      fileName = `transactions_ledger.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'রিপোর্ট');
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Report Tab Selectors & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <button
            onClick={() => setActiveReport('daily')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              activeReport === 'daily' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            দৈনিক রিপোর্ট (Daily)
          </button>
          <button
            onClick={() => setActiveReport('monthly')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              activeReport === 'monthly' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            মাসিক রিপোর্ট (Monthly)
          </button>
          <button
            onClick={() => setActiveReport('member')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              activeReport === 'member' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            সদস্য রিপোর্ট (Member)
          </button>
          <button
            onClick={() => setActiveReport('income_expense')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              activeReport === 'income_expense' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            আয়-ব্যয় রিপোর্ট
          </button>
          <button
            onClick={() => setActiveReport('dividend')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              activeReport === 'dividend' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💰 লভ্যাংশ বণ্টন ক্যালকুলেটর
          </button>
          <button
            onClick={() => setActiveReport('yearly')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              activeReport === 'yearly' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            বার্ষিক আর্থিক প্রতিবেদন
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
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>এক্সেল</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>রিপোর্ট প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 space-y-6">
        {/* Printable Report Header */}
        <div className="text-center border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 uppercase">
            {settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}
          </h1>
          <p className="text-xs text-slate-600">
            রেজিস্ট্রেশন নং: {settings.registrationNo} • {settings.address}
          </p>
          <div className="mt-2 inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded-full text-xs font-bold text-slate-800">
            {activeReport === 'daily' && `দৈনিক সার্বিক কালেকশন ও হিসাব রিপোর্ট (${formatBengaliDate(selectedDate, false)})`}
            {activeReport === 'monthly' && `মাসিক কার্যবিবরণী ও আর্থিক সারাংশ (${selectedMonth})`}
            {activeReport === 'member' && 'সকল সদস্যের সঞ্চয় ও ঋণ স্থিতি তালিকা'}
            {activeReport === 'income_expense' && 'প্রাতিষ্ঠানিক আয় ও ব্যয় বিবরণী'}
            {activeReport === 'dividend' && `সদস্যদের সঞ্চয় আনুপাতিক মুনাফা/লভ্যাংশ বণ্টন বিবরণী (মোট বণ্টন: ${formatCurrency(profitToDistribute, useBengaliDigits)})`}
            {activeReport === 'yearly' && 'বার্ষিক অডিট ও স্থিতিপত্র (Balance Sheet & Summary)'}
          </div>
        </div>

        {/* 1. Daily Report Content */}
        {activeReport === 'daily' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-xs text-emerald-800 font-semibold block">আজকের সঞ্চয় জমা</span>
                <span className="text-xl font-bold text-emerald-900">{formatCurrency(dailyDeposit, useBengaliDigits)}</span>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <span className="text-xs text-teal-800 font-semibold block">আজকের কিস্তি আদায়</span>
                <span className="text-xl font-bold text-teal-900">{formatCurrency(dailyKistiCollected, useBengaliDigits)}</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-xs text-indigo-800 font-semibold block">আজকের ঋণ বিতরণ</span>
                <span className="text-xl font-bold text-indigo-900">{formatCurrency(dailyLoanDisbursed, useBengaliDigits)}</span>
              </div>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-xs text-rose-800 font-semibold block">আজকের সঞ্চয় উত্তোলন</span>
                <span className="text-xl font-bold text-rose-900">{formatCurrency(dailyWithdrawal, useBengaliDigits)}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                আজকের লেনদেনের তালিকা ({toBengaliNumber(dailyTransactions.length)} টি)
              </div>
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">ভাউচার</th>
                    <th className="py-2.5 px-3">সদস্য</th>
                    <th className="py-2.5 px-3">ধরন</th>
                    <th className="py-2.5 px-3">মাধ্যম</th>
                    <th className="py-2.5 px-3 text-right">আদায় (৳)</th>
                    <th className="py-2.5 px-3 text-right">প্রদান (৳)</th>
                    <th className="py-2.5 px-3">কালেক্টর</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        এই তারিখে কোনো লেনদেন সম্পন্ন হয়নি।
                      </td>
                    </tr>
                  ) : (
                    dailyTransactions.map((tx) => {
                      const typeInfo = getTransactionTypeName(tx.type);
                      return (
                        <tr key={tx.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{tx.voucherNo}</td>
                          <td className="py-2.5 px-3 font-semibold">{tx.memberName || 'সমিতি'}</td>
                          <td className="py-2.5 px-3">{typeInfo.label}</td>
                          <td className="py-2.5 px-3 uppercase">{tx.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {typeInfo.isCredit ? formatCurrency(tx.amount, useBengaliDigits) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                            {!typeInfo.isCredit ? formatCurrency(tx.amount, useBengaliDigits) : '-'}
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
                <h4 className="font-bold text-slate-800 border-b pb-1">মাসিক আদায় ও আমানত</h4>
                <div className="flex justify-between">
                  <span>মাসিক মোট সঞ্চয় জমা:</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(monthlyTransactions.filter(t => ['deposit', 'dps_deposit', 'fdr_deposit'].includes(t.type)).reduce((s, t) => s + t.amount, 0), useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>মাসিক কিস্তি আদায়:</span>
                  <span className="font-bold text-teal-700">
                    {formatCurrency(monthlyTransactions.filter(t => t.type === 'loan_installment').reduce((s, t) => s + t.amount, 0), useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>মাসিক প্রাতিষ্ঠানিক আয়:</span>
                  <span className="font-bold text-blue-700">{formatCurrency(totalMonthlyIncome, useBengaliDigits)}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800 border-b pb-1">মাসিক বিতরণ ও পরিচালন ব্যয়</h4>
                <div className="flex justify-between">
                  <span>মাসিক নতুন ঋণ বিতরণ:</span>
                  <span className="font-bold text-indigo-700">
                    {formatCurrency(monthlyTransactions.filter(t => t.type === 'loan_disbursed').reduce((s, t) => s + t.amount, 0), useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>মাসিক সঞ্চয় উত্তোলন:</span>
                  <span className="font-bold text-rose-600">
                    {formatCurrency(monthlyTransactions.filter(t => t.type === 'withdraw').reduce((s, t) => s + t.amount, 0), useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>মাসিক অফিস খরচ (ব্যয়):</span>
                  <span className="font-bold text-rose-700">{formatCurrency(totalMonthlyExpense, useBengaliDigits)}</span>
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
                  <th className="py-2.5 px-3">সদস্য নং</th>
                  <th className="py-2.5 px-3">নাম</th>
                  <th className="py-2.5 px-3">মোবাইল</th>
                  <th className="py-2.5 px-3 text-center">শেয়ার</th>
                  <th className="py-2.5 px-3 text-right">সাধারণ সঞ্চয়</th>
                  <th className="py-2.5 px-3 text-right">ডিপিএস সঞ্চয়</th>
                  <th className="py-2.5 px-3 text-right">মোট সঞ্চয়</th>
                  <th className="py-2.5 px-3 text-right">চলতি ঋণ</th>
                  <th className="py-2.5 px-3 text-center">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{m.memberNo}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{m.name}</td>
                    <td className="py-2.5 px-3">{m.phone}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{toBengaliNumber(m.shareCount)} টি</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(m.generalSavingsBalance, useBengaliDigits)}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(m.dpsSavingsBalance, useBengaliDigits)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(m.totalSavings, useBengaliDigits)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                      {m.activeLoanBalance > 0 ? formatCurrency(m.activeLoanBalance, useBengaliDigits) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
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
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3">ভাউচার</th>
                    <th className="py-2.5 px-3">ধরন</th>
                    <th className="py-2.5 px-3">খাত</th>
                    <th className="py-2.5 px-3">বিবরণ</th>
                    <th className="py-2.5 px-3 text-right">আদায় / আয় (৳)</th>
                    <th className="py-2.5 px-3 text-right">ব্যয় / খরচ (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeExpenses.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">{formatBengaliDate(item.date, false)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.voucherNo}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.type === 'income' ? 'আয়' : 'খরচ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{item.category}</td>
                      <td className="py-2.5 px-3 text-slate-500">{item.description || item.title}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {item.type === 'income' ? formatCurrency(item.amount, useBengaliDigits) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                        {item.type === 'expense' ? formatCurrency(item.amount, useBengaliDigits) : '-'}
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
                      <span>মুনাফা / লভ্যাংশ বণ্টন ক্যালকুলেটর</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      এই মাসের মোট লাভ দিন। সফটওয়্যার স্বয়ংক্রিয়ভাবে যার যত জমা সেই অনুপাতে লাভ বের করে দেবে।
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                      <span className="text-xs font-bold text-slate-700">বণ্টনযোগ্য মোট লাভ:</span>
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
                      <span>সদস্যদের ব্যালেন্সে জমা করুন</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-blue-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">বণ্টনের অনুপাত ভিত্তি:</span>
                    <select
                      value={distributionCriteria}
                      onChange={(e) => setDistributionCriteria(e.target.value as any)}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="total_deposit">সদস্যের মোট সঞ্চয় আমানত অনুপাত</option>
                      <option value="share_capital">শেয়ার মূলধন অনুপাত</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <span>মোট সদস্য: <strong className="text-slate-800">{toBengaliNumber(members.length)} জন</strong></span>
                    <span>•</span>
                    <span>মোট যোগ্য সঞ্চয় তহবিল: <strong className="text-emerald-700">{formatCurrency(totalDepositBase, useBengaliDigits)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Success Notification Alert */}
              {creditSuccessInfo && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 animate-fadeIn no-print">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="font-bold text-sm block">সাফল্যের সাথে ব্যালেন্সে যোগ সম্পন্ন হয়েছে!</strong>
                      <span>মোট <strong>{toBengaliNumber(creditSuccessInfo.count)} জন</strong> সদস্যের মূল সঞ্চয় হিসাবে মোট <strong>{formatCurrency(creditSuccessInfo.total, useBengaliDigits)}</strong> টাকা লভ্যাংশ জমা করা হয়েছে।</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCreditSuccessInfo(null)}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              )}

              {/* 3 Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold block">বণ্টনযোগ্য মোট মুনাফা</span>
                  <span className="text-2xl font-black text-emerald-900">
                    {formatCurrency(profitToDistribute, useBengaliDigits)}
                  </span>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">সব সদস্যের মোট প্রাপ্তি</span>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-xs text-blue-800 font-semibold block">মোট সঞ্চয় মূলধন স্থিতি</span>
                  <span className="text-2xl font-black text-blue-900">
                    {formatCurrency(totalDepositBase, useBengaliDigits)}
                  </span>
                  <span className="text-[11px] text-blue-700 block mt-0.5">সদস্যদের সর্বমোট জমা</span>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-xs text-purple-800 font-semibold block">মুনাফার কার্যকর হার (ROI)</span>
                  <span className="text-2xl font-black text-purple-900">
                    {totalDepositBase > 0 ? ((profitToDistribute / totalDepositBase) * 100).toFixed(2) : '0.00'}%
                  </span>
                  <span className="text-[11px] text-purple-700 block mt-0.5">প্রতি ১০০ টাকার বিপরীতে আয়</span>
                </div>
              </div>

              {/* Proportional Profit Calculation Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>সদস্যভিত্তিক লভ্যাংশ বণ্টন তালিকা (যথাযথ আনুপাতিক হার)</span>
                  <span className="text-emerald-700 font-bold">মোট বণ্টন চেক: {formatCurrency(totalDistributed, useBengaliDigits)}</span>
                </div>
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">সদস্য নং</th>
                      <th className="py-2.5 px-3">সদস্যের নাম ও মোবাইল</th>
                      <th className="py-2.5 px-3 text-right">সদস্যের মোট জমা (টাকা)</th>
                      <th className="py-2.5 px-3 text-center">জমার অংশীদারি (%)</th>
                      <th className="py-2.5 px-3 text-right">বণ্টনকৃত লাভ (৳)</th>
                      <th className="py-2.5 px-3 text-center">স্বাক্ষর / প্রাপ্তি স্বীকার</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membersWithProfit.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">কোনো সদস্য পাওয়া যায়নি</td>
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
                            {formatCurrency(m.memberBalance, useBengaliDigits)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold rounded-md text-[11px]">
                              {toBengaliNumber(m.percentage)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-700 text-sm">
                            {formatCurrency(Math.round(m.profitShare), useBengaliDigits)}
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
                      <td colSpan={2} className="py-3 px-3">সর্বমোট (Total):</td>
                      <td className="py-3 px-3 text-right text-blue-900">
                        {formatCurrency(totalDepositBase, useBengaliDigits)}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700">
                        ১০০.০০%
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                        {formatCurrency(Math.round(totalDistributed), useBengaliDigits)}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-semibold">
                        ✓ পূর্ণ বণ্টন সম্পন্ন
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
                  সমিতির পরিসম্পদ (Assets)
                </h4>
                <div className="flex justify-between py-1">
                  <span>মাঠে বিনিয়োগকৃত ঋণ স্থিতি:</span>
                  <span className="font-bold text-indigo-900">{formatCurrency(totalActiveLoans, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>ব্যাংক হিসাবসমূহে ব্যালেন্স:</span>
                  <span className="font-bold text-blue-900">{formatCurrency(totalBankBalances, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>অফিস ক্যাশ ইন হ্যান্ড:</span>
                  <span className="font-bold text-emerald-900">{formatCurrency(cashInHand, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-sm text-slate-900">
                  <span>মোট পরিসম্পদ (Total Assets):</span>
                  <span>{formatCurrency(totalActiveLoans + totalLiquidAssets, useBengaliDigits)}</span>
                </div>
              </div>

              {/* Liabilities / দায় ও মূলধন */}
              <div className="border border-slate-300 rounded-xl p-5 bg-slate-50/50 space-y-3 text-xs">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-300 pb-2">
                  দায় ও শেয়ার মূলধন (Liabilities & Equity)
                </h4>
                <div className="flex justify-between py-1">
                  <span>সদস্যদের সঞ্চয় আমানত:</span>
                  <span className="font-bold text-emerald-900">{formatCurrency(totalSavingsFund, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>পরিশোধিত শেয়ার মূলধন:</span>
                  <span className="font-bold text-amber-900">{formatCurrency(totalShareFund, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>সংরক্ষিত তহবিল ও উদ্বৃত্ত:</span>
                  <span className="font-bold text-blue-900">
                    {formatCurrency(Math.max(0, (totalActiveLoans + totalLiquidAssets) - (totalSavingsFund + totalShareFund)), useBengaliDigits)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 font-extrabold text-sm text-slate-900">
                  <span>মোট দায় ও মূলধন:</span>
                  <span>{formatCurrency(totalActiveLoans + totalLiquidAssets, useBengaliDigits)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Footer Signatures */}
        <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs border-t border-slate-300">
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              হিসাবরক্ষক
            </div>
            <span className="text-[11px] text-slate-500">প্রস্তুতকারকের স্বাক্ষর</span>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              {settings.secretaryName || 'সাধারণ সম্পাদক'}
            </div>
            <span className="text-[11px] text-slate-500">সাধারণ সম্পাদকের স্বাক্ষর</span>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
              {settings.presidentName || 'সভাপতি'}
            </div>
            <span className="text-[11px] text-slate-500">সভাপতির স্বাক্ষর ও সিল</span>
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
                <h3 className="font-bold text-slate-800 text-base">লভ্যাংশ বণ্টনের নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-500">সদস্যদের সঞ্চয় একাউন্টে লাভ ক্রেডিট হবে</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>মোট বণ্টনযোগ্য লভ্যাংশ:</span>
                <strong className="text-emerald-700 font-bold text-sm">{formatCurrency(profitToDistribute, useBengaliDigits)}</strong>
              </div>
              <div className="flex justify-between">
                <span>লাভপ্রাপ্ত মোট সদস্য:</span>
                <strong className="text-slate-800">{toBengaliNumber(members.length)} জন</strong>
              </div>
              <div className="flex justify-between">
                <span>বণ্টনের ভিত্তি:</span>
                <strong className="text-slate-800">{distributionCriteria === 'share_capital' ? 'শেয়ার মূলধন' : 'মোট সঞ্চয় আমানত'}</strong>
              </div>
              <p className="text-[11px] text-amber-700 pt-2 border-t border-slate-200">
                ⚠️ নিশ্চিত করলে প্রতি সদস্যের জমার অংশীদারি (%) অনুপাতে তাদের <strong>মূল সাধারণ সঞ্চয় একাউন্টে</strong> এই টাকা যোগ হয়ে যাবে এবং পাসবুকে নতুন লেনদেন হিসেবে সংরক্ষিত হবে।
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = distributeProfitToSavings({
                    profitAmount: profitToDistribute,
                    criteria: distributionCriteria,
                    notes: `মাসিক সঞ্চয় লভ্যাংশ বণ্টন (মোট ৳${profitToDistribute} হতে প্রাপ্তি)`
                  });
                  setShowConfirmModal(false);
                  if (res.success) {
                    setCreditSuccessInfo({ count: res.count, total: res.totalDistributed });
                  }
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>হ্যাঁ, অ্যাকাউন্টে যোগ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
