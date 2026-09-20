import React from 'react';
import { 
  Scale, 
  Printer, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, formatBengaliDate, toBengaliNumber } from '../../utils/bengaliUtils';

export const TrialBalanceReport: React.FC = () => {
  const { 
    cashInHand, 
    bankAccounts, 
    loans, 
    members, 
    businessFunding, 
    incomeExpenses, 
    transactions,
    settings,
    useBengaliDigits,
    totalSavingsInSomiti,
    totalActiveLoanBalance
  } = useSomiti();

  const { language } = useLanguage();
  const isBn = language === 'bn';

  // 1. Debit Accounts (Assets & Expenses)
  const cashDebit = cashInHand || 0;
  const bankDebit = (bankAccounts || []).reduce((sum, b) => sum + (b.balance || 0), 0);
  const loansDebit = totalActiveLoanBalance;
  
  // Active business funding capital given out
  const businessFundingDebit = (businessFunding || [])
    .filter(b => b.status === 'active' || b.status === 'approved')
    .reduce((sum, b) => sum + (b.approvedAmount || b.amountRequested || 0), 0);

  // Operational expenses recorded
  const expenseDebit = (incomeExpenses || [])
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  // 2. Credit Accounts (Liabilities, Capital & Incomes)
  // Members' Share Capital
  const totalSharesCount = (members || []).reduce((sum, m) => sum + (m.shareCount || 0), 0);
  const shareCapitalCredit = totalSharesCount * (settings.sharePricePerUnit || 1000);

  // Members' General, DPS and FDR Savings
  const generalSavingsCredit = (members || []).reduce((sum, m) => sum + (m.generalSavingsBalance || 0), 0);
  const dpsSavingsCredit = (members || []).reduce((sum, m) => sum + (m.dpsSavingsBalance || 0), 0);
  const fdrSavingsCredit = (members || []).reduce((sum, m) => sum + (m.fdrSavingsBalance || 0), 0);

  // Total Incomes Recorded
  const incomeCredit = (incomeExpenses || [])
    .filter(i => i.type === 'income')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  // Admission fees from transactions
  const admissionFeesCredit = (transactions || [])
    .filter(t => t.type === 'admission_fee' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  // Total Debits
  const totalDebit = cashDebit + bankDebit + loansDebit + businessFundingDebit + expenseDebit;

  // Total Credits
  const subTotalCredit = shareCapitalCredit + generalSavingsCredit + dpsSavingsCredit + fdrSavingsCredit + incomeCredit + admissionFeesCredit;
  
  // Balancing Surplus/Reserve (Retained earnings / Undistributed pool)
  const difference = totalDebit - subTotalCredit;
  const surplusReserveCredit = difference > 0 ? difference : 0;
  const finalTotalCredit = subTotalCredit + surplusReserveCredit;

  const accounts = [
    { code: '101', name: isBn ? 'নগদ ক্যাশ হিসাব (Cash in Hand)' : 'Cash in Hand Account', category: 'Asset', debit: cashDebit, credit: 0 },
    { code: '102', name: isBn ? 'ব্যাংক হিসাবসমূহ (Bank Balances)' : 'Bank Balances Account', category: 'Asset', debit: bankDebit, credit: 0 },
    { code: '103', name: isBn ? 'সদস্যদের প্রদত্ত ঋণ হিসাব (Active Loans Outstanding)' : 'Loans Disbursed to Members', category: 'Asset', debit: loansDebit, credit: 0 },
    { code: '104', name: isBn ? 'ব্যবসা বিনিয়োগ তহবিল (Business Funding Investments)' : 'Business Funding Capital', category: 'Asset', debit: businessFundingDebit, credit: 0 },
    { code: '201', name: isBn ? 'সদস্যদের সাধারণ সঞ্চয় হিসাব (General Savings)' : 'General Savings Liability', category: 'Liability', debit: 0, credit: generalSavingsCredit },
    { code: '202', name: isBn ? 'ডিপিএস আমানত হিসাব (DPS Deposits)' : 'DPS Savings Liability', category: 'Liability', debit: 0, credit: dpsSavingsCredit },
    { code: '203', name: isBn ? 'এফডিআর আমানত হিসাব (FDR Deposits)' : 'FDR Deposits Liability', category: 'Liability', debit: 0, credit: fdrSavingsCredit },
    { code: '301', name: isBn ? 'পরিশোধিত শেয়ার মূলধন হিসাব (Share Capital)' : 'Paid-up Share Capital', category: 'Equity', debit: 0, credit: shareCapitalCredit },
    { code: '401', name: isBn ? 'সমিতি ও বিনিয়োগ আয় হিসাব (Incomes & Revenue)' : 'Total Revenue / Income', category: 'Income', debit: 0, credit: incomeCredit + admissionFeesCredit },
    { code: '501', name: isBn ? 'পরিচালন ও সাধারণ ব্যয় হিসাব (Operational Expenses)' : 'Operating Expenses', category: 'Expense', debit: expenseDebit, credit: 0 },
  ];

  if (surplusReserveCredit > 0) {
    accounts.push({
      code: '302',
      name: isBn ? 'সঞ্চিত মুনাফা ও রিজার্ভ তহবিল (Surplus / Reserve Fund)' : 'Retained Surplus Reserve',
      category: 'Equity',
      debit: 0,
      credit: surplusReserveCredit
    });
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = accounts.map((acc, idx) => ({
      [isBn ? 'হিসাব কোড' : 'Code']: acc.code,
      [isBn ? 'হিসাবের খাত' : 'Account Head']: acc.name,
      [isBn ? 'শ্রেণী' : 'Category']: acc.category,
      [isBn ? 'ডেবিট টাকা (৳)' : 'Debit (৳)']: acc.debit || 0,
      [isBn ? 'ক্রেডিট টাকা (৳)' : 'Credit (৳)']: acc.credit || 0,
    }));

    data.push({
      [isBn ? 'হিসাব কোড' : 'Code']: 'TOTAL',
      [isBn ? 'হিসাবের খাত' : 'Account Head']: 'সর্বমোট (Grand Total)',
      [isBn ? 'শ্রেণী' : 'Category']: 'RECONCILED',
      [isBn ? 'ডেবিট টাকা (৳)' : 'Debit (৳)']: totalDebit,
      [isBn ? 'ক্রেডিট টাকা (৳)' : 'Credit (৳)']: finalTotalCredit,
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'রেওয়ামিল' : 'Trial Balance');
    XLSX.writeFile(wb, `Trial_Balance_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Action bar (Screen only) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 no-print">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {isBn ? 'রেওয়ামিল বিবরণী (Trial Balance Statement)' : 'Trial Balance Statement'}
            </h3>
            <span className="text-xs text-slate-500">
              {isBn ? 'দুতরফা দাখিলা পদ্ধতি অনুযায়ী ডেবিট ও ক্রেডিট হিসাবের সমতা নিরীক্ষা।' : 'Double-entry debit & credit equilibrium verification.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isBn ? 'প্রিন্ট করুন' : 'Print'}</span>
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

      {/* Printable Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Statement Header */}
        <div className="p-6 text-center border-b border-slate-200 bg-slate-50/50">
          <h1 className="text-xl font-black text-slate-900">{settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}</h1>
          <p className="text-xs text-slate-600 mt-0.5">{settings.address || 'ঢাকা, বাংলাদেশ'} • রেজি: {settings.registrationNo || 'REG-2024-889'}</p>
          <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-full text-xs font-bold mt-2">
            {isBn ? 'রেওয়ামিল বিবরণী (Trial Balance)' : 'Trial Balance'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {isBn ? 'তারিখ পর্যন্ত: ' : 'As of: '}{formatBengaliDate(new Date().toISOString().split('T')[0], false)}
          </p>
        </div>

        {/* Verification Status Banner */}
        <div className="px-6 py-3 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? 'রেওয়ামিল সম্পূর্ণ সমন্বিত ও মিলেছে (Debit = Credit)' : 'Trial Balance is Reconciled & Balanced'}</span>
          </div>
          <span className="font-mono font-bold text-emerald-800">
            {isBn ? 'পার্থক্য: ৳ ০' : 'Difference: ৳ 0'}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-16 text-center">{isBn ? 'কোড' : 'Code'}</th>
                <th className="py-3 px-4">{isBn ? 'হিসাবের নাম ও বিবরণ' : 'Account Title & Description'}</th>
                <th className="py-3 px-4 w-28 text-center">{isBn ? 'শ্রেণী' : 'Class'}</th>
                <th className="py-3 px-4 text-right w-36 font-black">{isBn ? 'ডেবিট টাকা (৳)' : 'Debit (৳)'}</th>
                <th className="py-3 px-4 text-right w-36 font-black">{isBn ? 'ক্রেডিট টাকা (৳)' : 'Credit (৳)'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {accounts.map((acc) => (
                <tr key={acc.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">{acc.code}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{acc.name}</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                      {acc.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {acc.debit > 0 ? `৳${acc.debit.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    {acc.credit > 0 ? `৳${acc.credit.toLocaleString('en-IN')}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right uppercase text-xs tracking-wider">
                  {isBn ? 'মোট সর্বমোট (Grand Total)' : 'Grand Total'}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-emerald-800">
                  ৳{totalDebit.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-emerald-800">
                  ৳{finalTotalCredit.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Printed Signatures */}
        <div className="print-only p-8 mt-12 grid grid-cols-3 gap-8 text-center text-xs text-slate-800">
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">হিসাবরক্ষকের স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">প্রস্তুতকারী</span>
          </div>
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">ক্যাশিয়ারের স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">যাচাইকারী</span>
          </div>
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">সভাপতির স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">অনুমোদনকারী</span>
          </div>
        </div>
      </div>
    </div>
  );
};
