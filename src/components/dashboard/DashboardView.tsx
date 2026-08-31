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
  Sparkles
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

export const DashboardView: React.FC = () => {
  const { language, t } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    loans, 
    savingsSchemes, 
    transactions, 
    users, 
    totalAvailableBalance, 
    totalCapital, 
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
  const activeMembers = members.filter(m => m.status === 'active');
  const recentTransactions = transactions.slice(0, 8);

  const num = (n: number | string) => (isBengaliNum ? toBengaliNumber(n) : n.toString());

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

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Balances & Active Members (5 cols on xl, 12 on lg) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6 min-w-0">
          {/* Balances side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Available Balance (Dark Blue Card) */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white p-5 rounded-xl shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-xs font-medium text-blue-200 block mb-1">
                  {isBn ? 'উপলব্ধ ব্যালেন্স (ক্যাশ + ব্যাংক)' : 'Available Balance (Cash + Bank)'}
                </span>
                <div className="text-2xl font-extrabold tracking-tight">
                  {formatCurrency(totalAvailableBalance, isBengaliNum)}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-blue-200 pt-2 border-t border-blue-600/60">
                  <span>{isBn ? 'ভল্ট ও ব্যাংক ফান্ড' : 'Vault & Bank Funds'}</span>
                  <span className="font-semibold text-emerald-300">
                    {isBn ? 'সক্রিয় স্থিতি' : 'Active Status'}
                  </span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            </div>

            {/* Total Capital (Clean Light Card) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block mb-1">
                {isBn ? 'সমিতির ব্যবসার মোট মূলধন' : 'Total Business Capital'}
              </span>
              <div className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(totalCapital, isBengaliNum)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>{isBn ? 'সঞ্চয় + চলতি ঋণ' : 'Savings + Active Loans'}</span>
                <span className="font-semibold text-blue-600">
                  {isBn ? 'নিরাপদ হিসাব' : 'Secured Ledger'}
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
                {isBn ? `মোট গ্রাহক: ${num(members.length)}` : `Total Clients: ${members.length}`}
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
                        className="w-13 h-13 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs"
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
            {users.map((u) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const collected = transactions
                .filter(t => t.collectedBy?.includes(u.name) && t.date === todayStr && t.status === 'completed')
                .reduce((s, t) => s + t.amount, 0);

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
                          u.role === 'cashier' ? 'Cashier' : 'Field Officer'
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
            })}
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
            <div className="flex justify-between py-1">
              <span className="text-slate-600">{isBn ? '💰 ক্যাশিয়ার' : '💰 Cashiers'}</span>
              <span className="font-bold text-slate-800">
                : {num(users.filter(u => u.role === 'cashier').length)} {isBn ? 'জন' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

