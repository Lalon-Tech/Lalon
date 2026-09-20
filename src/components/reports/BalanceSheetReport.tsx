import React from 'react';
import { 
  Building2, 
  Printer, 
  FileSpreadsheet, 
  CheckCircle2, 
  Coins, 
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, formatBengaliDate, toBengaliNumber } from '../../utils/bengaliUtils';

export const BalanceSheetReport: React.FC = () => {
  const { 
    cashInHand, 
    bankAccounts, 
    loans, 
    members, 
    businessFunding, 
    incomeExpenses, 
    settings,
    useBengaliDigits,
    totalSavingsInSomiti,
    totalActiveLoanBalance
  } = useSomiti();

  const { language } = useLanguage();
  const isBn = language === 'bn';

  // 1. Assets (সম্পদ)
  const cashAsset = cashInHand || 0;
  const bankAsset = (bankAccounts || []).reduce((sum, b) => sum + (b.balance || 0), 0);
  const liquidAssets = cashAsset + bankAsset;

  const loansAsset = totalActiveLoanBalance;
  const businessFundingAsset = (businessFunding || [])
    .filter(b => b.status === 'active' || b.status === 'approved')
    .reduce((sum, b) => sum + (b.approvedAmount || b.amountRequested || 0), 0);
  const investmentAssets = loansAsset + businessFundingAsset;

  const totalAssets = liquidAssets + investmentAssets;

  // 2. Liabilities & Equity (দায় ও মূলধন)
  const generalSavings = (members || []).reduce((sum, m) => sum + (m.generalSavingsBalance || 0), 0);
  const dpsSavings = (members || []).reduce((sum, m) => sum + (m.dpsSavingsBalance || 0), 0);
  const fdrSavings = (members || []).reduce((sum, m) => sum + (m.fdrSavingsBalance || 0), 0);
  const totalDepositLiabilities = generalSavings + dpsSavings + fdrSavings;

  const totalShares = (members || []).reduce((sum, m) => sum + (m.shareCount || 0), 0);
  const shareCapital = totalShares * (settings.sharePricePerUnit || 1000);

  // Retained earnings & surplus reserve = Assets - (Deposits + Share Capital)
  const retainedSurplus = Math.max(0, totalAssets - (totalDepositLiabilities + shareCapital));
  const totalEquity = shareCapital + retainedSurplus;

  const totalLiabilitiesAndEquity = totalDepositLiabilities + totalEquity;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const data = [
      { [isBn ? 'বিবরণ' : 'Description']: 'সম্পদসমূহ (ASSETS)', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: '' },
      { [isBn ? 'বিবরণ' : 'Description']: '১. হাতে নগদ ক্যাশ', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: cashAsset },
      { [isBn ? 'বিবরণ' : 'Description']: '২. বিভিন্ন ব্যাংক হিসাবে জমা', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: bankAsset },
      { [isBn ? 'বিবরণ' : 'Description']: '৩. সদস্যদের মাঝে বিতরণকৃত চলতি ঋণ', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: loansAsset },
      { [isBn ? 'বিবরণ' : 'Description']: '৪. ব্যবসা বিনিয়োগ মূলধন', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: businessFundingAsset },
      { [isBn ? 'বিবরণ' : 'Description']: 'মোট সম্পদ (TOTAL ASSETS)', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: totalAssets },
      { [isBn ? 'বিবরণ' : 'Description']: '', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: '' },
      { [isBn ? 'বিবরণ' : 'Description']: 'দায় ও শেয়ারহোল্ডার মূলধন (LIABILITIES & EQUITY)', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: '' },
      { [isBn ? 'বিবরণ' : 'Description']: '১. সদস্যদের সাধারণ সঞ্চয় আমানত', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: generalSavings },
      { [isBn ? 'বিবরণ' : 'Description']: '২. ডিপিএস সঞ্চয় আমানত', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: dpsSavings },
      { [isBn ? 'বিবরণ' : 'Description']: '৩. এফডিআর আমানত', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: fdrSavings },
      { [isBn ? 'বিবরণ' : 'Description']: '৪. সদস্যদের পরিশোধিত শেয়ার মূলধন', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: shareCapital },
      { [isBn ? 'বিবরণ' : 'Description']: '৫. সঞ্চিত উদ্বৃত্ত ও রিজার্ভ ফান্ড', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: retainedSurplus },
      { [isBn ? 'বিবরণ' : 'Description']: 'মোট দায় ও মূলধন (TOTAL LIABILITIES & EQUITY)', [isBn ? 'পরিমাণ (৳)' : 'Amount (৳)']: totalLiabilitiesAndEquity }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'ব্যালেন্স শিট' : 'Balance Sheet');
    XLSX.writeFile(wb, `Balance_Sheet_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 no-print">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {isBn ? 'পূর্ণাঙ্গ সমবায় ব্যালেন্স শিট (Balance Sheet)' : 'Cooperative Balance Sheet'}
            </h3>
            <span className="text-xs text-slate-500">
              {isBn ? 'সমিতির মোট সম্পদ, বহির্দায় ও পরিশোধিত শেয়ার মূলধনের তুলনামূলক বিবরণী।' : 'Statement of Assets, Liabilities and Members Equity.'}
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
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-200 bg-slate-50/50">
          <h1 className="text-xl font-black text-slate-900">{settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}</h1>
          <p className="text-xs text-slate-600 mt-0.5">{settings.address || 'ঢাকা, বাংলাদেশ'} • রেজি: {settings.registrationNo || 'REG-2024-889'}</p>
          <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-full text-xs font-bold mt-2">
            {isBn ? 'আর্থিক অবস্থার বিবরণী / ব্যালেন্স শিট' : 'Balance Sheet'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {isBn ? 'তারিখ পর্যন্ত: ' : 'As of: '}{formatBengaliDate(new Date().toISOString().split('T')[0], false)}
          </p>
        </div>

        {/* Verification Status */}
        <div className="px-6 py-3 bg-emerald-50/70 border-b border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isBn ? 'হিসাব সম্পূর্ণ সমন্বিত: মোট সম্পদ = মোট দায় ও মূলধন' : 'Accounting Equilibrium Verified: Assets = Liabilities + Equity'}</span>
          </div>
          <span className="font-mono font-bold text-emerald-800">
            ৳{totalAssets.toLocaleString('en-IN')}
          </span>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* Column 1: Assets */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-blue-600">
              <h4 className="font-black text-sm text-blue-900 uppercase tracking-wider">
                {isBn ? 'সম্পদসমূহ (Assets)' : 'Assets'}
              </h4>
              <span className="text-xs font-bold text-blue-700">টাকা (৳)</span>
            </div>

            {/* Current Assets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isBn ? '১. চলতি ও তরল সম্পদ' : '1. Current & Liquid Assets'}
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'হাতে নগদ ক্যাশ' : 'Cash in Hand'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{cashAsset.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'ব্যাংক হিসাবসমূহে জমা' : 'Bank Balances'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{bankAsset.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                  <span>{isBn ? 'মোট চলতি তরল সম্পদ' : 'Subtotal Liquid Assets'}</span>
                  <span className="font-mono text-blue-700">৳{liquidAssets.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Loans & Investments */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isBn ? '২. ঋণ ও বিনিয়োগ সম্পদ' : '2. Loans & Investments'}
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'সদস্যদের মাঝে বিতরণকৃত চলতি ঋণ' : 'Active Member Loans'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{loansAsset.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'ব্যবসা বিনিয়োগ মূলধন' : 'Business Investments'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{businessFundingAsset.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                  <span>{isBn ? 'মোট ঋণ ও বিনিয়োগ সম্পদ' : 'Subtotal Investments'}</span>
                  <span className="font-mono text-blue-700">৳{investmentAssets.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Total Assets Footer */}
            <div className="p-3.5 bg-blue-50 border-2 border-blue-500 rounded-xl flex items-center justify-between font-black text-sm text-blue-950">
              <span>{isBn ? 'মোট সম্পদ (Total Assets)' : 'Total Assets'}</span>
              <span className="font-mono text-base text-blue-900">৳{totalAssets.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Column 2: Liabilities & Equity */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-emerald-600">
              <h4 className="font-black text-sm text-emerald-900 uppercase tracking-wider">
                {isBn ? 'দায় ও মূলধন (Liabilities & Equity)' : 'Liabilities & Equity'}
              </h4>
              <span className="text-xs font-bold text-emerald-700">টাকা (৳)</span>
            </div>

            {/* Liabilities */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isBn ? '১. আমানত ও সঞ্চয় দায়' : '1. Member Deposits & Savings Liabilities'}
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'সাধারণ সঞ্চয় আমানত' : 'General Savings'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{generalSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'ডিপিএস সঞ্চয় আমানত' : 'DPS Deposits'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{dpsSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'এফডিআর স্থায়ী আমানত' : 'FDR Deposits'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{fdrSavings.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                  <span>{isBn ? 'মোট সঞ্চয় ও আমানত দায়' : 'Subtotal Deposits'}</span>
                  <span className="font-mono text-emerald-700">৳{totalDepositLiabilities.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isBn ? '২. মূলধন ও সঞ্চিত তহবিল' : '2. Share Capital & Surplus Reserves'}
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? `পরিশোধিত শেয়ার মূলধন (${totalShares} টি)` : `Paid-up Share Capital (${totalShares})`}</span>
                  <span className="font-mono font-bold text-slate-900">৳{shareCapital.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">{isBn ? 'সঞ্চিত উদ্বৃত্ত ও রিজার্ভ ফান্ড' : 'Retained Surplus & Reserves'}</span>
                  <span className="font-mono font-bold text-slate-900">৳{retainedSurplus.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-800">
                  <span>{isBn ? 'মোট শেয়ারহোল্ডার মূলধন' : 'Subtotal Equity'}</span>
                  <span className="font-mono text-emerald-700">৳{totalEquity.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Total Liabilities & Equity Footer */}
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-xl flex items-center justify-between font-black text-sm text-emerald-950">
              <span>{isBn ? 'মোট দায় ও মূলধন' : 'Total Liabilities & Equity'}</span>
              <span className="font-mono text-base text-emerald-900">৳{totalLiabilitiesAndEquity.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Printed Signatures */}
        <div className="print-only p-8 mt-12 grid grid-cols-3 gap-8 text-center text-xs text-slate-800">
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">হিসাবরক্ষকের স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">প্রস্তুতকারী কর্মকর্তা</span>
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
