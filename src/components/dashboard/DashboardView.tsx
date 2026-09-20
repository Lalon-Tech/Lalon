import React from 'react';
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  FileText, 
  MessageSquare, 
  ChevronRight, 
  ArrowDownRight, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Building,
  Clock
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatInteger, 
  formatBengaliDate, 
  getTransactionTypeName,
  toBengaliNumber 
} from '../../utils/bengaliUtils';
import { ApprovalNotificationCenter } from './ApprovalNotificationCenter';

export const DashboardView: React.FC = () => {
  const { language, t } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    loans, 
    savingsSchemes, 
    transactions, 
    users, 
    currentUser,
    totalAvailableBalance, 
    totalCapital, 
    totalSavingsInSomiti,
    totalActiveLoanBalance,
    totalApprovedProfit,
    todayStats, 
    useBengaliDigits,
    setActiveTab,
    setSelectedMemberId,
    openReceiptForTx,
    setShowNewMemberModal,
    setShowQuickDepositModal,
    setShowQuickWithdrawModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal
  } = useSomiti();

  const isBengaliNum = isBn && useBengaliDigits;
  const nonDeletedMembers = members.filter(m => !m.isDeleted);
  const activeMembers = nonDeletedMembers.filter(m => m.status === 'active');
  const recentTransactions = transactions.filter(t => t.status === 'completed').slice(0, 8);

  const num = (n: number | string) => (isBengaliNum ? toBengaliNumber(n) : n.toString());

  // Rule 7: Dedicated personalized Member Dashboard
  if (currentUser?.role === 'member') {
    const myMember = members.find(m => m.id === currentUser.memberId);
    const myTransactions = transactions.filter(t => t.memberId === currentUser.memberId && t.status === 'completed');
    const myLoans = loans.filter(l => l.memberId === currentUser.memberId);
    const myActiveLoans = myLoans.filter(l => l.status === 'active');
    const mySavings = savingsSchemes.filter(s => s.memberId === currentUser.memberId);

    const mySharesCount = Number(myMember?.shareCount ?? (myMember as any)?.sharesCount ?? 0);
    const myShareAmount = mySharesCount === 0 ? 0 : Number(myMember?.shareValue ?? (mySharesCount * 1000));
    const mySavingsTotal = mySharesCount === 0 
      ? ((Number(myMember?.generalSavingsBalance) || 0) + (Number(myMember?.dpsSavingsBalance) || 0) + (Number(myMember?.fdrSavingsBalance) || 0))
      : Number(myMember?.totalSavings ?? myMember?.generalSavingsBalance ?? 0);
    const myActiveLoanBalance = Number(myMember?.activeLoanBalance ?? 0);
    const myApprovedProfit = myTransactions
      .filter(t => t.type === 'profit_share' && t.status === 'completed')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return (
      <div className="space-y-6 pb-12">
        {/* Welcome Member Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {myMember?.photoUrl ? (
              <img 
                src={myMember.photoUrl} 
                alt={myMember.name} 
                className="w-16 h-16 rounded-full object-cover ring-4 ring-white/20 shadow-md bg-slate-800"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-600/30 ring-4 ring-white/20 flex items-center justify-center text-xl font-bold">
                {myMember?.name?.slice(0, 1) || 'স'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {myMember?.name || (isBn ? 'সম্মানিত সদস্য' : 'Valued Member')}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {isBn ? 'সদস্য পোর্টাল' : 'Member Portal'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-3 flex-wrap">
                <span>{isBn ? 'সদস্য নং:' : 'Member No:'} <strong className="text-amber-300">{myMember?.memberNo || '---'}</strong></span>
                <span>•</span>
                <span>{isBn ? 'ইউজার আইডি:' : 'User UID:'} <strong className="text-cyan-300">{currentUser.userUid || '---'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentUser.memberId) setSelectedMemberId(currentUser.memberId);
                setActiveTab('member_profile');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>{isBn ? 'আমার পূর্ণাঙ্গ পাসবুক' : 'My Full Passbook'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Financial Metric Cards for Member */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Total Savings */}
          <div className="bg-white p-4.5 rounded-xl border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700">
                {isBn ? 'আমার মোট সঞ্চয়' : 'My Total Savings'}
              </span>
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tight">
              {formatCurrency(mySavingsTotal, isBengaliNum)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              {isBn ? 'সাধারণ সঞ্চয় ও ডিপিএস ব্যালেন্স' : 'General & DPS Balance'}
            </div>
          </div>

          {/* Card 2: Active Loan Balance */}
          <div className="bg-white p-4.5 rounded-xl border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-700">
                {isBn ? 'চলমান ঋণ বকেয়া' : 'Active Loan Balance'}
              </span>
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tight">
              {formatCurrency(myActiveLoanBalance, isBengaliNum)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              {myActiveLoans.length > 0 
                ? (isBn ? `${num(myActiveLoans.length)} টি সক্রিয় ঋণ` : `${myActiveLoans.length} active loans`) 
                : (isBn ? 'কোনো বকেয়া ঋণ নেই' : 'No outstanding loan')}
            </div>
          </div>

          {/* Card 3: My Approved Profit */}
          <div className="bg-white p-4.5 rounded-xl border border-teal-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-700">
                {isBn ? 'আমার অর্জিত লভ্যাংশ' : 'My Total Profit'}
              </span>
              <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tight">
              {formatCurrency(myApprovedProfit, isBengaliNum)}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              {isBn ? 'অনুমোদিত লভ্যাংশ জমা' : 'Approved profit credits'}
            </div>
          </div>

          {/* Card 4: Active Savings Schemes */}
          <div className="bg-white p-4.5 rounded-xl border border-blue-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700">
                {isBn ? 'সক্রিয় স্কিম (DPS/FDR)' : 'Active Schemes'}
              </span>
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tight">
              {num(mySavings.length)} <span className="text-xs font-medium text-slate-500">{isBn ? 'টি' : 'schemes'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              {isBn ? 'মেয়াদি সঞ্চয় স্কিম তালিকা' : 'Term savings schemes'}
            </div>
          </div>

          {/* Card 5: My Shares & Capital */}
          <div className="bg-white p-4.5 rounded-xl border border-indigo-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-700">
                {isBn ? 'আমার শেয়ার ও মূলধন' : 'My Shares & Capital'}
              </span>
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tight font-mono">
              {num(mySharesCount)} <span className="text-sm font-bold text-slate-500">{isBn ? 'টি' : 'Shares'}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              {isBn ? 'মোট সক্রিয় শেয়ার সংখ্যা' : 'Total Active Shares Count'}
            </div>
          </div>
        </div>

        {/* Member Recent Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              {isBn ? 'আমার সাম্প্রতিক লেনদেন বিবরণী' : 'My Recent Transactions'}
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>{isBn ? 'সকল লেনদেন দেখুন' : 'View All Transactions'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {myTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              {isBn ? 'এখনও কোনো লেনদেনের রেকর্ড পাওয়া যায়নি।' : 'No transactions recorded yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">{isBn ? 'তারিখ' : 'Date'}</th>
                    <th className="pb-3">{isBn ? 'ভাউচার নং' : 'Voucher'}</th>
                    <th className="pb-3">{isBn ? 'ধরণ' : 'Type'}</th>
                    <th className="pb-3">{isBn ? 'পেমেন্ট মাধ্যম' : 'Method'}</th>
                    <th className="pb-3 text-right">{isBn ? 'পরিমাণ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {myTransactions.slice(0, 5).map(tx => {
                    const typeInfo = getTransactionTypeName(tx.type, isBn);
                    const isCredit = typeInfo.isCredit;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 text-slate-500">{tx.date}</td>
                        <td className="py-3 font-mono font-bold text-slate-600">{tx.voucherNo}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{tx.paymentMethod || 'Cash'}</td>
                        <td className={`py-3 text-right font-black ${
                          isCredit ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isCredit ? '+' : '-'}{formatCurrency(tx.amount, isBengaliNum)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Overview Header & Quick Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>{isBn ? 'ওভারভিউ' : 'Overview'}</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {isBn ? 'লাইভ ড্যাশবোর্ড' : 'Live Dashboard'}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {isBn ? 'আজকের তারিখ:' : "Today's Date:"} {formatBengaliDate(new Date(), false, isBn)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 text-white rounded-lg text-xs font-medium shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>✉️ {num(417)} {isBn ? 'SMS ক্রেডিট' : 'SMS Credits'}</span>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isBn ? 'রিপোর্টস' : 'Reports'}</span>
          </button>
        </div>
      </div>

      {/* Central Approval Notification Center */}
      <ApprovalNotificationCenter />

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Balances & Active Members (5 cols on xl, 12 on lg) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6 min-w-0">
          {/* Balances: 5 Key Financial Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Available Balance (Featured Card across 2 columns) */}
            <div className="sm:col-span-2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-4.5 rounded-xl shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-200 block">
                    {isBn ? 'উপলব্ধ ব্যালেন্স (ক্যাশ + ব্যাংক)' : 'Available Balance (Cash + Bank)'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">
                    {isBn ? 'মোট তারল্য' : 'Total Liquidity'}
                  </span>
                </div>
                <div className="text-2xl font-extrabold tracking-tight">
                  {formatCurrency(totalAvailableBalance, isBengaliNum)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs text-blue-200 pt-2 border-t border-blue-600/60">
                  <span className="truncate">{isBn ? 'প্রাপ্ত অর্থ − ব্যয়/বিনিয়োগ' : 'Total Inflows − Outflows'}</span>
                  <span className="font-semibold text-emerald-300 shrink-0 ml-1">
                    {isBn ? 'তারল্য' : 'Liquidity'}
                  </span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            </div>

            {/* 2. Total Member Savings (Emerald Card) */}
            <div className="bg-white p-4.5 rounded-xl border border-emerald-200/80 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-700 block">
                  {isBn ? 'মোট সদস্য সঞ্চয়' : 'Total Member Savings'}
                </span>
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(totalSavingsInSomiti, isBengaliNum)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="truncate">{isBn ? 'জমা আমানত + লভ্যাংশ' : 'Total Deposits + Profit'}</span>
                <span className="font-semibold text-emerald-600 shrink-0 ml-1">
                  {isBn ? 'প্রকৃত সঞ্চয়' : 'Net Savings'}
                </span>
              </div>
            </div>

            {/* 3. Total Active Loans (Amber Card) */}
            <div className="bg-white p-4.5 rounded-xl border border-amber-200/80 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-700 block">
                  {isBn ? 'মোট চলতি ঋণ' : 'Active Loans Out'}
                </span>
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(totalActiveLoanBalance, isBengaliNum)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="truncate">{isBn ? 'বকেয়া মূলধন' : 'Principal − Repaid'}</span>
                <span className="font-semibold text-amber-600 shrink-0 ml-1">
                  {isBn ? 'মূলধন স্থিতি' : 'Principal'}
                </span>
              </div>
            </div>

            {/* 4. Total Profit (Teal Card) */}
            <div 
              id="dashboard-total-profit-card"
              onClick={() => setActiveTab('business_funding')}
              className="bg-white p-4.5 rounded-xl border border-teal-200/80 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-teal-700 block">
                  {isBn ? 'মোট অর্জিত/অনুমোদিত লভ্যাংশ' : 'Total Profit'}
                </span>
                <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 transition-colors">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(totalApprovedProfit, isBengaliNum)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="truncate">{isBn ? 'অনুমোদিত লেনদেন হতে হিসাবকৃত' : 'From approved records'}</span>
                <span className="font-semibold text-teal-600 shrink-0 ml-1">
                  {isBn ? 'মোট লাভ' : 'Total Profit'}
                </span>
              </div>
            </div>

            {/* 5. Total Capital (Clean Light Card) */}
            <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-500 block">
                  {isBn ? 'সমিতির ব্যবসার মোট মূলধন' : 'Total Business Capital'}
                </span>
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Building className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(totalCapital, isBengaliNum)}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="truncate">{isBn ? 'বিনিয়োগ − ফেরত মূলধন' : 'Funding − Returned'}</span>
                <span className="font-semibold text-blue-600 shrink-0 ml-1">
                  {isBn ? 'মূলধন' : 'Capital'}
                </span>
              </div>
            </div>
          </div>

          {/* Active Members Card with Avatars */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{isBn ? 'সক্রিয় গ্রাহক / সদস্য' : 'Active Clients / Members'}</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                {isBn ? `মোট গ্রাহক: ${num(nonDeletedMembers.length)}` : `Total Clients: ${nonDeletedMembers.length}`}
              </span>
            </div>

            {/* Horizontal Member Avatars Scroll */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {activeMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 w-full">
                  {isBn ? 'কোনো সক্রিয় সদস্য পাওয়া যায়নি' : 'No active members found'}
                </div>
              ) : (
                activeMembers.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="flex-shrink-0 w-28 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-center flex flex-col items-center hover:border-blue-300 hover:shadow-xs transition-all"
                  >
                    <div className="relative mb-2">
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-13 h-13 rounded-full object-cover object-top ring-2 ring-blue-500/20 shadow-xs"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 truncate w-full" title={m.name}>
                      {m.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate w-full mb-2">
                      {isBengaliNum ? toBengaliNumber(m.phone) : m.phone}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedMemberId(m.id);
                        setActiveTab('member_profile');
                      }}
                      className="w-full py-1 bg-blue-700 hover:bg-blue-800 text-white text-[11px] font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      {isBn ? 'প্রোফাইল' : 'Profile'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Staff Reports */}
        <div className="lg:col-span-6 xl:col-span-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'কর্মচারীদের রিপোর্টস' : 'Staff Reports'}</span>
            </h3>
            <span className="text-xs text-slate-400">
              {isBn ? 'আজকের আদায়' : "Today's Collection"}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
            {(() => {
              const staffRoles = ['admin', 'manager', 'cashier', 'field_officer', 'president', 'secretary'];
              const allStaffUsers = users.filter(u => u.role && staffRoles.includes(u.role) && u.status === 'active');
              const staffList = (currentUser && staffRoles.includes(currentUser.role) && !allStaffUsers.some(u => u.id === currentUser.id))
                ? [currentUser, ...allStaffUsers]
                : allStaffUsers;

              if (staffList.length === 0) {
                return (
                  <div className="py-6 text-center text-xs text-slate-400">
                    {isBn ? 'কোনো সক্রিয় কর্মচারী একাউন্ট নেই' : 'No active staff accounts'}
                  </div>
                );
              }

              const d = new Date();
              const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

              return staffList.map((u) => {
                const collected = transactions
                  .filter(t => {
                    if (t.status !== 'completed' || t.date !== todayStr) return false;
                    const col = (t.collectedBy || '').toLowerCase();
                    const un = (u.name || '').toLowerCase();
                    return col.includes(un) || un.includes(col);
                  })
                  .reduce((s, t) => s + (Number(t.amount) || 0), 0);

                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <h5 className="text-xs font-bold text-slate-800 leading-tight truncate">{u.name}</h5>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {isBn ? u.roleTitle : (
                            u.role === 'admin' ? 'Admin & CEO' :
                            u.role === 'manager' ? 'Branch Manager' :
                            u.role === 'cashier' ? 'Cashier' :
                            u.role === 'field_officer' ? 'Field Officer' :
                            u.role === 'president' ? 'President' :
                            u.role === 'secretary' ? 'Secretary' : 'Staff'
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-700">
                        : {formatCurrency(collected, isBengaliNum)}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-medium">
                        {isBn ? 'আদায়' : 'Collected'}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('users')}
              className="w-full py-1.5 text-xs text-center font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            >
              {isBn ? 'সকল কর্মচারী ও ফিল্ড টার্গেট দেখুন →' : 'View All Staff & Field Targets →'}
            </button>
          </div>
        </div>

        {/* Right Section: Recent Transactions */}
        <div className="lg:col-span-6 xl:col-span-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>{isBn ? 'সর্বশেষ লেনদেন' : 'Recent Transactions'}</span>
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
            >
              {isBn ? 'সবগুলো দেখুন' : 'View All'}
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1 scrollbar-thin">
            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {isBn ? 'কোনো লেনদেন রেকর্ড নেই' : 'No transaction records found'}
              </div>
            ) : (
              recentTransactions.map((tx) => {
                const typeInfo = getTransactionTypeName(tx.type, isBn);
                return (
                  <div
                    key={tx.id}
                    onClick={() => openReceiptForTx(tx)}
                    className="p-2 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 cursor-pointer transition-all flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`p-1.5 rounded-lg shrink-0 ${typeInfo.isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {typeInfo.isCredit ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="text-xs font-bold text-slate-800 truncate">{tx.memberName || tx.notes}</h5>
                        <span className="text-[10px] text-slate-400 block">{formatBengaliDate(tx.date, false, isBn)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold flex items-center justify-end gap-1">
                        <span className={`text-[11px] font-semibold ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatCurrency(tx.amount, isBengaliNum)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {isBn ? 'সত্যায়নে: ' : 'Verified by: '}
                        <span className="font-medium text-slate-600">{tx.collectedBy?.split(' ')[0] || (isBn ? 'এডমিন' : 'Admin')}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Today's Report (6 metric KPI boxes) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{isBn ? 'আজকের রিপোর্ট' : "Today's Report"}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {isBn ? 'রিয়েল-টাইম দৈনিক হিসাব বিবরণী' : 'Real-time Daily Financial Summary'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Collection / Deposit */}
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-emerald-700">
              {formatCurrency(todayStats.collection, isBengaliNum)}
            </div>
            <span className="text-xs font-bold text-emerald-600">
              {isBn ? 'গ্রহণ / আদায়' : 'Collections / Deposits'}
            </span>
          </div>

          {/* Disbursement */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-700">
              {formatCurrency(todayStats.disbursement, isBengaliNum)}
            </div>
            <span className="text-xs font-bold text-amber-600">
              {isBn ? 'বিতরণ (ঋণ+উত্তোলন)' : 'Disbursements (Loan+Withdraw)'}
            </span>
          </div>

          {/* Expense */}
          <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-rose-700">
              {formatCurrency(todayStats.expense, isBengaliNum)}
            </div>
            <span className="text-xs font-bold text-rose-600">
              {isBn ? 'অফিস খরচ' : 'Office Expenses'}
            </span>
          </div>

          {/* Profit */}
          <div className="border border-teal-200 bg-teal-50/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-teal-700">
              {formatCurrency(todayStats.profit, isBengaliNum)}
            </div>
            <span className="text-xs font-bold text-teal-600">
              {isBn ? 'আজকের লাভ' : "Today's Profit"}
            </span>
          </div>

          {/* Fine */}
          <div className="border border-fuchsia-200 bg-fuchsia-50/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-fuchsia-700">
              {formatCurrency(todayStats.fine, isBengaliNum)}
            </div>
            <span className="text-xs font-bold text-fuchsia-600">
              {isBn ? 'জরিমানা আদায়' : 'Late Fee / Fine'}
            </span>
          </div>

          {/* Net Cash */}
          <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-sky-700">
              {formatCurrency(todayStats.netCash, isBengaliNum)}
            </div>
            <span className="text-xs font-bold text-sky-600">
              {isBn ? 'আজকের নিট ক্যাশ' : "Today's Net Cash"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: 2 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Report */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'গ্রাহক ও শেয়ার রিপোর্ট' : 'Client & Share Metrics'}</span>
            </h4>
            <span className="text-xs text-slate-400">
              {isBn ? 'সামগ্রিক পরিসংখ্যান' : 'Overall Metrics'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '👥 মোট গ্রাহক' : '👥 Total Clients'}</span>
              <span className="font-bold text-slate-800">: {num(members.length)} {isBn ? 'জন' : ''}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '💵 মোট সঞ্চয় আমানত' : '💵 Total Savings Deposit'}</span>
              <span className="font-bold text-emerald-700">: {formatCurrency(totalSavingsInSomiti, isBengaliNum)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '✨ মোট অনুমোদিত লভ্যাংশ' : '✨ Total Approved Profit'}</span>
              <span className="font-bold text-teal-700">: {formatCurrency(totalApprovedProfit, isBengaliNum)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '📊 মোট সক্রিয় শেয়ার' : '📊 Total Active Shares'}</span>
              <span className="font-bold text-amber-700">
                : {num(members.reduce((s, m) => s + (m.shareCount || 0), 0))} {isBn ? 'টি' : 'Units'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '🏛️ স্থায়ী আমানত (FDR)' : '🏛️ Fixed Deposits (FDR)'}</span>
              <span className="font-bold text-slate-800">
                : {num(savingsSchemes.filter(s => s.type === 'fdr').length)} {isBn ? 'টি' : 'Accounts'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '💰 ঋণ বিতরণ চলমান' : '💰 Active Loans'}</span>
              <span className="font-bold text-slate-800">
                : {num(loans.filter(l => l.status === 'active').length)} {isBn ? 'টি' : 'Loans'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '💳 ডিপিএস হিসাব' : '💳 DPS Accounts'}</span>
              <span className="font-bold text-slate-800">
                : {num(savingsSchemes.filter(s => s.type === 'dps').length)} {isBn ? 'টি' : 'Accounts'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">{isBn ? '🛡️ বীমা / নমিনি নথিভুক্ত' : '🛡️ Nominees Registered'}</span>
              <span className="font-bold text-slate-800">
                : {num(members.filter(m => (m.nominees || []).length > 0).length)} {isBn ? 'জন' : 'Members'}
              </span>
            </div>
          </div>
        </div>

        {/* Users Report */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'ইউজার্স রিপোর্ট' : 'Staff & Roles'}</span>
            </h4>
            <span className="text-xs text-slate-400">
              {isBn ? 'রোল ভিত্তিক তালিকা' : 'Role Distribution'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '👨‍💼 মোট ইউজার' : '👨‍💼 Total Users'}</span>
              <span className="font-bold text-slate-800">: {num(users.length)} {isBn ? 'জন' : ''}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '💼 অ্যাডমিন ও পরিচালনা পর্ষদ' : '💼 Admin & Board'}</span>
              <span className="font-bold text-slate-800">
                : {num(users.filter(u => ['admin', 'president', 'secretary'].includes(u.role)).length)} {isBn ? 'জন' : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '🏢 শাখা ম্যানেজার' : '🏢 Branch Managers'}</span>
              <span className="font-bold text-slate-800">
                : {num(users.filter(u => u.role === 'manager').length)} {isBn ? 'জন' : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '🛵 মাঠকর্মী ও কালেক্টর' : '🛵 Field Officers'}</span>
              <span className="font-bold text-slate-800">
                : {num(users.filter(u => u.role === 'field_officer').length)} {isBn ? 'জন' : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600">{isBn ? '💰 ক্যাশিয়ার' : '💰 Cashiers'}</span>
              <span className="font-bold text-slate-800">
                : {num(users.filter(u => u.role === 'cashier').length)} {isBn ? 'জন' : ''}
              </span>
            </div>
            <div className="flex justify-between py-1 bg-emerald-50/50 px-1 rounded-md">
              <span className="text-emerald-800 font-medium">{isBn ? '👥 সাধারণ সদস্য অ্যাকাউন্ট' : '👥 Member Accounts'}</span>
              <span className="font-bold text-emerald-800">
                : {num(users.filter(u => u.role === 'member').length)} {isBn ? 'জন' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

