import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  FileText, 
  Printer, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  Receipt,
  PiggyBank,
  User,
  Users,
  ShieldCheck,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { Transaction } from '../../types';
import { 
  formatCurrency, 
  toBengaliNumber, 
  formatBengaliDate, 
  getTransactionTypeName 
} from '../../utils/bengaliUtils';
import { calculateMemberShareWiseProfits } from '../../utils/shareCalculation';

// Helper to extract Share Number from a transaction
function getTxShareNumber(tx: Transaction, isBn: boolean = true): string {
  if (tx.selectedShares && tx.selectedShares.length > 0) {
    if (tx.selectedShares.length === 1) {
      const sNo = tx.selectedShares[0];
      return isBn ? `শেয়ার #${toBengaliNumber(sNo)}` : `Share #${sNo}`;
    }
    const sharesList = tx.selectedShares.map(s => isBn ? toBengaliNumber(s) : String(s)).join(', ');
    return isBn ? `শেয়ার: ${sharesList}` : `Shares: ${sharesList}`;
  }
  if (tx.shareAmounts && Object.keys(tx.shareAmounts).length > 0) {
    const keys = Object.keys(tx.shareAmounts);
    if (keys.length === 1) {
      const sNo = keys[0];
      return isBn ? `শেয়ার #${toBengaliNumber(sNo)}` : `Share #${sNo}`;
    }
    const sharesList = keys.map(s => isBn ? toBengaliNumber(s) : s).join(', ');
    return isBn ? `শেয়ার: ${sharesList}` : `Shares: ${sharesList}`;
  }
  if (tx.notes) {
    const matchBn = tx.notes.match(/শেয়ার\s*#?([0-9০-৯]+)/i);
    if (matchBn) {
      return isBn ? `শেয়ার #${matchBn[1]}` : `Share #${matchBn[1]}`;
    }
    const matchEn = tx.notes.match(/Share\s*#?([0-9]+)/i);
    if (matchEn) {
      return isBn ? `শেয়ার #${toBengaliNumber(matchEn[1])}` : `Share #${matchEn[1]}`;
    }
  }
  if (tx.type === 'share_purchase') {
    return isBn ? 'শেয়ার ক্রয়' : 'Share Purchase';
  }
  if (tx.type === 'share_surrender') {
    return isBn ? 'সমর্পিত শেয়ার' : 'Closed Share';
  }
  return '—';
}

export const MemberPassbookView: React.FC = () => {
  const { 
    currentUser, 
    members, 
    transactions, 
    shareClosures,
    settings, 
    useBengaliDigits,
    openReceiptForTx,
    selectedMemberId: contextMemberId,
    setSelectedMemberId: setContextMemberId
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const isAdminOrStaff = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'collector';

  // Identify member if member user is logged in
  const loggedInMember = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.memberId) {
      const found = members.find(m => m.id === currentUser.memberId);
      if (found) return found;
    }
    // Fallback match by memberNo, phone or email
    return members.find(m => 
      (currentUser.memberNo && m.memberNo === currentUser.memberNo) ||
      (currentUser.phone && m.phone === currentUser.phone) ||
      (currentUser.email && m.email && m.email.toLowerCase() === currentUser.email.toLowerCase())
    ) || null;
  }, [currentUser, members]);

  // Selected member ID for display
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    if (loggedInMember) return loggedInMember.id;
    if (currentUser?.role === 'member') return '';
    if (contextMemberId) return contextMemberId;
    return members[0]?.id || 'all';
  });

  const activeMember = useMemo(() => {
    if (currentUser?.role === 'member') {
      return loggedInMember;
    }
    if (selectedMemberId === 'all') return null;
    return members.find(m => m.id === selectedMemberId) || loggedInMember || members[0] || null;
  }, [selectedMemberId, members, loggedInMember, currentUser?.role]);

  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // STRICT REQUIREMENT: Only Admin-Approved transactions ('completed')
  const approvedTransactions = useMemo(() => {
    return transactions.filter(t => t.status === 'completed');
  }, [transactions]);

  // Member-specific approved transactions
  const memberApprovedTxs = useMemo(() => {
    if (!activeMember) {
      // If 'all' selected by admin, return all approved transactions
      return [...approvedTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return approvedTransactions
      .filter(t => t.memberId === activeMember.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [approvedTransactions, activeMember]);

  // Calculate Running Balance for the member's approved ledger
  const ledgerRows = useMemo(() => {
    if (!activeMember) {
      return memberApprovedTxs.map((tx, idx) => ({
        ...tx,
        isCredit: ['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase', 'profit_share', 'dividend', 'loan_installment', 'loan_payment'].includes(tx.type),
        isDebit: ['withdraw', 'withdrawal', 'share_closure', 'loan_disbursed'].includes(tx.type),
        runningBalance: 0,
        serialNo: idx + 1,
      }));
    }

    let runningBalance = 0;
    const rows = memberApprovedTxs.map((tx, index) => {
      let isCredit = false;
      let isDebit = false;

      // Credit increases member's savings / passbook balance
      if (['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase', 'profit_share', 'dividend'].includes(tx.type)) {
        runningBalance += Number(tx.amount) || 0;
        isCredit = true;
      } else if (['withdraw', 'withdrawal', 'share_closure'].includes(tx.type)) {
        runningBalance -= Number(tx.amount) || 0;
        isDebit = true;
      } else if (tx.type === 'loan_installment' || tx.type === 'loan_payment') {
        isCredit = true;
      } else if (tx.type === 'loan_disbursed') {
        isDebit = true;
      } else {
        runningBalance += Number(tx.amount) || 0;
        isCredit = true;
      }

      return {
        ...tx,
        isCredit,
        isDebit,
        runningBalance,
        serialNo: index + 1
      };
    });

    // Reversed for standard viewing (newest first)
    return rows.reverse();
  }, [memberApprovedTxs, activeMember]);

  // Pending transactions awaiting admin approval
  const pendingTransactions = useMemo(() => {
    if (!activeMember) {
      return transactions.filter(t => t.status === 'pending');
    }
    return transactions.filter(t => t.memberId === activeMember.id && t.status === 'pending');
  }, [transactions, activeMember]);

  // Share-wise Profit & Deposit tracking for the active member
  const shareWiseSummary = useMemo(() => {
    if (!activeMember) return null;
    return calculateMemberShareWiseProfits(activeMember, transactions, shareClosures);
  }, [activeMember, transactions, shareClosures]);

  const [isShareSummaryExpanded, setIsShareSummaryExpanded] = useState(true);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return ledgerRows.filter(row => {
      if (filterType === 'deposit') {
        if (!['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase'].includes(row.type)) return false;
      } else if (filterType === 'withdraw') {
        if (!['withdraw', 'withdrawal', 'share_closure'].includes(row.type)) return false;
      } else if (filterType === 'loan') {
        if (!['loan_disbursed', 'loan_installment', 'loan_payment'].includes(row.type)) return false;
      } else if (filterType === 'profit') {
        if (!['profit_share', 'dividend'].includes(row.type)) return false;
      }

      if (dateFilter && !row.date.startsWith(dateFilter)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesId = row.id.toLowerCase().includes(q);
        const matchesVoucher = (row.voucherNo || '').toLowerCase().includes(q);
        const matchesNotes = (row.notes || '').toLowerCase().includes(q);
        const matchesMethod = (row.paymentMethod || '').toLowerCase().includes(q);
        const matchesMember = (row.memberName || '').toLowerCase().includes(q) || (row.memberNo || '').toLowerCase().includes(q);
        if (!matchesId && !matchesVoucher && !matchesNotes && !matchesMethod && !matchesMember) return false;
      }

      return true;
    });
  }, [ledgerRows, filterType, dateFilter, searchTerm]);

  // Total summary calculations
  const totalApprovedDeposits = useMemo(() => {
    const list = activeMember 
      ? approvedTransactions.filter(t => t.memberId === activeMember.id)
      : approvedTransactions;
    return list
      .filter(t => ['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase'].includes(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [approvedTransactions, activeMember]);

  const totalApprovedWithdrawals = useMemo(() => {
    const list = activeMember 
      ? approvedTransactions.filter(t => t.memberId === activeMember.id)
      : approvedTransactions;
    return list
      .filter(t => ['withdraw', 'withdrawal', 'share_closure'].includes(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [approvedTransactions, activeMember]);

  const currentNetSavings = Math.max(0, totalApprovedDeposits - totalApprovedWithdrawals);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner & Passbook Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold backdrop-blur-xs border border-blue-400/20">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>{isBn ? 'সদস্য ডিজিটাল পাসবুক ও সাধারণ লেজার' : 'Member Digital Passbook & Ledger'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {activeMember ? activeMember.name : (isBn ? 'সকল সদস্যের অনুমোদিত লেজার' : 'All Approved Transactions Ledger')}
            </h1>
            <p className="text-xs text-slate-300">
              {activeMember ? (
                isBn 
                  ? `সদস্য নম্বর #${activeMember.memberNo} • মোবাইল: ${activeMember.phone} • যোগদানের তারিখ: ${formatBengaliDate(activeMember.joiningDate, isBn)}`
                  : `Member No #${activeMember.memberNo} • Phone: ${activeMember.phone} • Joined: ${activeMember.joiningDate}`
              ) : (
                isBn ? 'সমিতির সকল সদস্যের অনুমোদিত লেনদেন ও অডিট রেজিস্টার' : 'Complete Society Approved Transactions Ledger'
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Admin Member Switcher */}
            {isAdminOrStaff && members.length > 0 && (
              <div className="relative">
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    if (e.target.value !== 'all') {
                      setContextMemberId(e.target.value);
                    }
                  }}
                  className="px-3 py-2 bg-slate-800/90 text-white rounded-xl text-xs font-semibold border border-slate-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">{isBn ? '🌐 সকল সদস্যের লেজার' : '🌐 All Members Ledger'}</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      #{m.memberNo} - {m.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isBn ? 'পাসবুক প্রিন্ট করুন' : 'Print Passbook'}</span>
            </button>
          </div>
        </div>

        {/* 3 Summary Statistics Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-emerald-400 text-xs mb-1 font-semibold">
              <span>{isBn ? 'মোট অনুমোদিত জমা' : 'Total Approved Deposits'}</span>
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white block">
              ৳{formatCurrency(totalApprovedDeposits, isBn && useBengaliDigits)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {isBn ? 'অ্যাডমিন অনুমোদিত মোট সঞ্চয় ও স্কিম জমা' : 'Total approved scheme deposits'}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-rose-400 text-xs mb-1 font-semibold">
              <span>{isBn ? 'মোট অনুমোদিত উত্তোলন' : 'Total Withdrawals'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-white block">
              ৳{formatCurrency(totalApprovedWithdrawals, isBn && useBengaliDigits)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {isBn ? 'অনুমোদিত ও পরিশোধিত সঞ্চয় উত্তোলন' : 'Approved savings withdrawals'}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-cyan-300 text-xs mb-1 font-semibold">
              <span>{isBn ? 'বর্তমান সঞ্চয় স্থিতি (পাসবুক জের)' : 'Current Net Savings Balance'}</span>
              <PiggyBank className="w-4 h-4" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-cyan-300 block">
              ৳{formatCurrency(currentNetSavings, isBn && useBengaliDigits)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {isBn ? 'পাসবুক লেজার অনুযায়ী কার্যকর ব্যালেন্স' : 'Current active net balance'}
            </span>
          </div>
        </div>
      </div>

      {/* Pending Transactions Notice (Explicitly explaining the approval rule) */}
      {pendingTransactions.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-3 text-xs text-amber-950 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <p className="font-bold text-amber-900 text-sm">
              {isBn 
                ? `${toBengaliNumber(pendingTransactions.length)}টি লেনদেন অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে (Pending Approval)`
                : `${pendingTransactions.length} transaction requests awaiting Admin approval`}
            </p>
            <p className="text-amber-800 leading-relaxed">
              {isBn 
                ? 'নিয়মানুযায়ী কোনো লেনদেন অনুমোদন না হওয়া পর্যন্ত তা মূল সঞ্চয় স্থিতি, শেয়ার হিসাব বা পাসবুকে যুক্ত হয় না। অ্যাডমিন কর্তৃক যাচাই ও অনুমোদিত হওয়ার পর স্বয়ংক্রিয়ভাবে নিচের লেজারে কার্যকর হবে।'
                : 'Per accounting regulations, pending transactions do not affect member balances, shares, or the passbook ledger until explicitly approved by an Administrator.'}
            </p>
          </div>
        </div>
      )}

      {/* Share-wise Profit & Deposit Tracking Card for Active Member */}
      {shareWiseSummary && shareWiseSummary.totalShares > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{isBn ? 'শেয়ারভিত্তিক পৃথক সঞ্চয় ও অর্জিত লভ্যাংশ ট্র্যাকিং' : 'Share-wise Deposits & Profit Tracking'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                    {isBn ? `${toBengaliNumber(shareWiseSummary.totalShares)}টি শেয়ার` : `${shareWiseSummary.totalShares} Shares`}
                  </span>
                </h4>
                <p className="text-xs text-slate-500">
                  {isBn 
                    ? 'প্রতিটি শেয়ারের আলাদা মোট জমা, আনুপাতিক অর্জিত লাভ ও মোট সঞ্চয় স্থিতি'
                    : 'Track each share\'s separate deposit, allocated profit, and total savings'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsShareSummaryExpanded(!isShareSummaryExpanded)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{isShareSummaryExpanded ? (isBn ? 'সংক্ষিপ্ত করুন' : 'Collapse') : (isBn ? 'বিস্তারিত দেখুন' : 'Expand')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isShareSummaryExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isShareSummaryExpanded && (
            <>
              {/* Share Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {shareWiseSummary.shares.map(s => (
                  <div 
                    key={s.shareNo}
                    className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2 hover:border-blue-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-blue-600 text-white font-mono text-xs font-bold">
                        {isBn ? `শেয়ার #${toBengaliNumber(s.shareNo)}` : `Share #${s.shareNo}`}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                        {toBengaliNumber(s.depositPercentage)}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>{isBn ? 'মোট জমা (Deposit):' : 'Deposit:'}</span>
                        <span className="font-bold text-slate-900 font-mono">
                          ৳{formatCurrency(s.totalDeposit, isBn && useBengaliDigits)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700">
                        <span className="font-medium">{isBn ? 'অর্জিত লাভ (Profit):' : 'Profit:'}</span>
                        <span className="font-black font-mono text-emerald-700">
                          +৳{formatCurrency(s.totalProfit, isBn && useBengaliDigits)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 font-bold text-indigo-950">
                        <span>{isBn ? 'মোট সঞ্চয় স্থিতি (Total):' : 'Total Savings:'}</span>
                        <span className="font-black text-indigo-900 font-mono text-sm">
                          ৳{formatCurrency(s.totalSavings, isBn && useBengaliDigits)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Summary Footer Strip */}
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-950">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{isBn ? 'সকল শেয়ারের সমন্বিত মোট হিসাব (Grand Total):' : 'All Shares Combined Grand Total:'}</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
                  <span className="text-slate-700">
                    {isBn ? 'মোট জমা:' : 'Deposit:'}{' '}
                    <strong className="text-slate-950">৳{formatCurrency(shareWiseSummary.totalDeposit, isBn && useBengaliDigits)}</strong>
                  </span>
                  <span className="text-emerald-700">
                    {isBn ? 'মোট লভ্যাংশ:' : 'Profit:'}{' '}
                    <strong className="text-emerald-800">+৳{formatCurrency(shareWiseSummary.totalProfit, isBn && useBengaliDigits)}</strong>
                  </span>
                  <span className="text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                    {isBn ? 'সর্বমোট সঞ্চয়:' : 'Total:'}{' '}
                    <strong className="text-indigo-950 font-black">৳{formatCurrency(shareWiseSummary.totalSavings, isBn && useBengaliDigits)}</strong>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: isBn ? 'সকল অনুমোদিত লেনদেন' : 'All Approved' },
              { id: 'deposit', label: isBn ? 'সঞ্চয় জমা' : 'Deposits' },
              { id: 'withdraw', label: isBn ? 'উত্তোলন' : 'Withdrawals' },
              { id: 'loan', label: isBn ? 'ঋণ ও কিস্তি' : 'Loans' },
              { id: 'profit', label: isBn ? 'লভ্যাংশ' : 'Profit' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Date Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isBn ? 'খুঁজুন (ভাউচার, সদস্য, মন্তব্য)...' : 'Search voucher, member...'}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Passbook Ledger Table: strictly showing requested columns */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'অনুমোদিত পাসবুক লেজার খতিয়ান' : 'Approved Passbook Ledger'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              <ShieldCheck className="w-3 h-3" />
              <span>{isBn ? 'শুধুমাত্র অ্যাডমিন অনুমোদিত' : 'Admin-Approved Only'}</span>
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {isBn ? `মোট: ${toBengaliNumber(filteredRows.length)}টি` : `Total: ${filteredRows.length}`}
            </span>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="text-center py-14 text-slate-400 text-xs space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              {isBn ? 'কোনো অনুমোদিত লেনদেন পাওয়া যায়নি।' : 'No approved transactions found.'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {isBn 
                ? 'পাসবুকে শুধুমাত্র অ্যাডমিন কর্তৃক অনুমোদিত লেনদেনসমূহ প্রদর্শিত হয়।' 
                : 'Only transactions approved by an Administrator appear in this ledger.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                  <th className="py-3 px-3 text-center w-10">#</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">{isBn ? 'তারিখ ও সময়' : 'Date'}</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">{isBn ? 'সদস্য' : 'Member'}</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">{isBn ? 'লেনদেনের ধরণ' : 'Transaction Type'}</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">{isBn ? 'শেয়ার নম্বর' : 'Share Number'}</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">{isBn ? 'পরিমাণ (৳)' : 'Amount (৳)'}</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">{isBn ? 'আবেদনকারী / আদায়কারী' : 'Requester/Collector'}</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">{isBn ? 'অনুমোদনকারী' : 'Approver'}</th>
                  <th className="py-3 px-3 text-center w-16">{isBn ? 'রসিদ' : 'Receipt'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const typeInfo = getTransactionTypeName(row.type, isBn);
                  const isCredit = ['deposit', 'dps_deposit', 'fdr_deposit', 'share_purchase', 'profit_share', 'dividend', 'loan_installment', 'loan_payment'].includes(row.type);
                  const isDebit = ['withdraw', 'withdrawal', 'share_closure', 'loan_disbursed'].includes(row.type);
                  const shareNumberText = getTxShareNumber(row, isBn);
                  const requesterText = row.collectedBy || row.memberName || (isBn ? 'সদস্য' : 'Member');
                  const approverText = row.verifiedBy || (isBn ? 'অ্যাডমিন (অনুমোদিত)' : 'Admin (Approved)');

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* # */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                        {isBn || useBengaliDigits ? toBengaliNumber(row.serialNo) : row.serialNo}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 block">
                          {formatBengaliDate(row.date, isBn)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {row.time || (row.voucherNo ? `#${row.voucherNo}` : '')}
                        </span>
                      </td>

                      {/* Member */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">
                          {row.memberName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          #{row.memberNo}
                        </span>
                      </td>

                      {/* Transaction Type */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap ${typeInfo.badge}`}>
                            {typeInfo.label}
                          </span>
                          {row.notes && (
                            <span className="text-[11px] text-slate-500 block truncate max-w-xs" title={row.notes}>
                              {row.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Share Number */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {shareNumberText !== '—' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold font-mono">
                            <Layers className="w-3 h-3 text-amber-600" />
                            <span>{shareNumberText}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <span className={`text-sm font-black font-mono block ${isCredit ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {isCredit ? '+' : '-'}{formatCurrency(row.amount, isBn && useBengaliDigits)}
                        </span>
                        {activeMember && row.runningBalance !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {isBn ? 'জের: ' : 'Bal: '}৳{formatCurrency(row.runningBalance, isBn && useBengaliDigits)}
                          </span>
                        )}
                      </td>

                      {/* Requester / Collector */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-700 font-medium">
                            {requesterText}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono pl-5 block">
                          {row.paymentMethod}
                        </span>
                      </td>

                      {/* Approver */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{approverText}</span>
                        </div>
                      </td>

                      {/* Receipt Action */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openReceiptForTx(row)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-colors cursor-pointer"
                          title={isBn ? 'রসিদ দেখুন ও প্রিন্ট করুন' : 'View / Print Receipt'}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{isBn ? 'রসিদ' : 'Receipt'}</span>
                        </button>
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
};
