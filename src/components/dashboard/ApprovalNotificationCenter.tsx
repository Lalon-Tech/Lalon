import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  HandCoins, 
  Briefcase, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Calendar, 
  User, 
  ArrowRight,
  Filter,
  DollarSign,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  UserCheck,
  Sparkles,
  Check,
  X,
  UserCog,
  PiggyBank,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAllPendingApprovals } from '../../utils/approvalRegistry';
import { PendingApprovalItem, ApprovalCategory } from '../../types/approval';
import { BusinessFunding, AppUser } from '../../types';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { BusinessFundingDetailsModal } from '../business/BusinessFundingDetailsModal';
import { ApproveUserModal } from '../users/ApproveUserModal';

export const ApprovalNotificationCenter: React.FC = () => {
  const { 
    loans, 
    businessFundings, 
    members, 
    users,
    transactions,
    memberUpdateRequests,
    currentUser, 
    isUserAdmin,
    setActiveTab, 
    useBengaliDigits,
    approvePendingTransaction,
    rejectPendingTransaction,
    approveMemberUpdate,
    rejectMemberUpdate
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Action status message
  const [actionAlert, setActionAlert] = useState<{ message: string; isError?: boolean } | null>(null);

  // Selected funding for the dedicated Details & Decision modal
  const [selectedFundingForModal, setSelectedFundingForModal] = useState<BusinessFunding | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Selected user for account approval modal
  const [selectedUserForModal, setSelectedUserForModal] = useState<AppUser | null>(null);
  const [isApproveUserModalOpen, setIsApproveUserModalOpen] = useState<boolean>(false);

  // Active filter for categories: 'all' | 'loan' | 'business_funding' | 'user_registration' | 'deposit' | 'savings_withdrawal' | 'share_purchase' | 'member_profile_update'
  const [selectedCategory, setSelectedCategory] = useState<'all' | ApprovalCategory>('all');

  // Aggregated list from the extensible Central Approval Registry
  const allPendingItems = useMemo(() => {
    return getAllPendingApprovals({ loans, businessFundings, members, users, transactions, memberUpdateRequests });
  }, [loans, businessFundings, members, users, transactions, memberUpdateRequests]);

  // Counts by category
  const loanPendingCount = useMemo(() => 
    allPendingItems.filter(item => item.category === 'loan').length, 
    [allPendingItems]
  );
  
  const businessFundingPendingCount = useMemo(() => 
    allPendingItems.filter(item => item.category === 'business_funding').length, 
    [allPendingItems]
  );

  const userRegistrationPendingCount = useMemo(() => 
    allPendingItems.filter(item => item.category === 'user_registration').length, 
    [allPendingItems]
  );

  const transactionPendingCount = useMemo(() => 
    allPendingItems.filter(item => ['deposit', 'savings_withdrawal', 'share_purchase', 'share_surrender'].includes(item.category)).length, 
    [allPendingItems]
  );

  const profilePendingCount = useMemo(() => 
    allPendingItems.filter(item => item.category === 'member_profile_update').length, 
    [allPendingItems]
  );

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return allPendingItems;
    if (selectedCategory === 'deposit') {
      return allPendingItems.filter(item => ['deposit', 'savings_withdrawal', 'share_purchase', 'share_surrender'].includes(item.category));
    }
    return allPendingItems.filter(item => item.category === selectedCategory);
  }, [allPendingItems, selectedCategory]);

  const num = (val: number | string) => isBn || useBengaliDigits ? toBengaliNumber(val) : val.toString();
  const fmt = (val: number) => formatCurrency(val, isBn || useBengaliDigits);

  // If user is not admin or there are no pending items, return null
  if (!isUserAdmin || allPendingItems.length === 0) {
    return null;
  }

  const handleApproveTx = async (txId: string) => {
    const res = await approvePendingTransaction(txId);
    setActionAlert({ message: res.message, isError: !res.success });
    setTimeout(() => setActionAlert(null), 4000);
  };

  const handleRejectTx = async (txId: string) => {
    const res = await rejectPendingTransaction(txId);
    setActionAlert({ message: res.message, isError: !res.success });
    setTimeout(() => setActionAlert(null), 4000);
  };

  const handleApproveProfile = async (reqId: string) => {
    const res = await approveMemberUpdate(reqId);
    setActionAlert({ message: res.message, isError: !res.success });
    setTimeout(() => setActionAlert(null), 4000);
  };

  const handleRejectProfile = async (reqId: string) => {
    const res = await rejectMemberUpdate(reqId);
    setActionAlert({ message: res.message, isError: !res.success });
    setTimeout(() => setActionAlert(null), 4000);
  };

  const handleCardClick = (item: PendingApprovalItem) => {
    if (item.category === 'business_funding') {
      const funding = item.rawItem as BusinessFunding;
      setSelectedFundingForModal(funding);
      setIsDetailsModalOpen(true);
    } else if (item.category === 'loan') {
      setActiveTab('loans_pending');
    } else if (item.category === 'user_registration') {
      const userObj = item.rawItem as AppUser;
      setSelectedUserForModal(userObj);
      setIsApproveUserModalOpen(true);
    }
  };

  return (
    <>
      <section 
        id="approval-notification-center"
        aria-label="Pending Approvals"
        className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in-50"
      >
        {/* Header Notification Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 pb-2 border-b border-amber-200/60">
          <div className="flex items-center gap-3.5">
            <div className="relative p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md shrink-0">
              <Bell className="w-5 h-5 animate-bounce" style={{ animationDuration: '2.5s' }} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  {isBn ? 'প্রশাসনিক অনুমোদন অপেক্ষমাণ!' : 'Admin Approvals Required!'}
                </h3>
                <span className="px-2.5 py-0.5 bg-rose-600 text-white text-xs font-bold rounded-full shadow-2xs">
                  {num(allPendingItems.length)} {isBn ? 'টি নতুন আবেদন' : 'Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {isBn 
                  ? 'নতুন সদস্য নিবন্ধন, ঋণ বিতরণ, সঞ্চয় লেনদেন এবং প্রোফাইল সংশোধনী প্রশাসনিক সিদ্ধান্তের অপেক্ষায় রয়েছে।'
                  : 'Member registrations, loans, savings transactions, and profile updates require admin review.'}
              </p>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {isBn ? 'সকল' : 'All'} ({num(allPendingItems.length)})
            </button>

            {userRegistrationPendingCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('user_registration')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'user_registration'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isBn ? 'সদস্য নিবন্ধন' : 'Registrations'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === 'user_registration' ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'
                }`}>
                  {num(userRegistrationPendingCount)}
                </span>
              </button>
            )}

            {loanPendingCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('loan')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'loan'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5" />
                <span>{isBn ? 'ঋণ' : 'Loans'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === 'loan' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'
                }`}>
                  {num(loanPendingCount)}
                </span>
              </button>
            )}

            {businessFundingPendingCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('business_funding')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'business_funding'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isBn ? 'ব্যবসা বিনিয়োগ' : 'Business'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === 'business_funding' ? 'bg-indigo-800 text-indigo-100' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {num(businessFundingPendingCount)}
                </span>
              </button>
            )}

            {transactionPendingCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('deposit')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'deposit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>{isBn ? 'সঞ্চয় ও লেনদেন' : 'Transactions'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === 'deposit' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {num(transactionPendingCount)}
                </span>
              </button>
            )}

            {profilePendingCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('member_profile_update')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'member_profile_update'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <UserCog className="w-3.5 h-3.5" />
                <span>{isBn ? 'প্রোফাইল সংশোধন' : 'Profile Edits'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedCategory === 'member_profile_update' ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-800'
                }`}>
                  {num(profilePendingCount)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Status Alert Banner */}
        {actionAlert && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            actionAlert.isError 
              ? 'bg-rose-50 text-rose-800 border border-rose-200' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            <span>{actionAlert.message}</span>
            <button 
              type="button" 
              onClick={() => setActionAlert(null)}
              className="p-1 hover:bg-black/5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map(item => {
            const isLoan = item.category === 'loan';
            const isBf = item.category === 'business_funding';
            const isUserReg = item.category === 'user_registration';
            const isProfileUpdate = item.category === 'member_profile_update';
            const isTx = ['deposit', 'savings_withdrawal', 'share_purchase', 'share_surrender'].includes(item.category);

            const accentColor = isLoan 
              ? 'bg-amber-500' 
              : isBf 
              ? 'bg-indigo-600' 
              : isUserReg 
              ? 'bg-blue-600' 
              : isProfileUpdate 
              ? 'bg-purple-600' 
              : 'bg-emerald-600';

            const badgeColor = isLoan
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : isBf
              ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
              : isUserReg
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : isProfileUpdate
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div 
                key={`${item.category}-${item.id}`}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />

                {/* Card Top: Type Badge & Application ID */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                    {isLoan ? (
                      <HandCoins className="w-3 h-3 text-amber-600" />
                    ) : isBf ? (
                      <Briefcase className="w-3 h-3 text-indigo-600" />
                    ) : isUserReg ? (
                      <UserCheck className="w-3 h-3 text-blue-600" />
                    ) : isProfileUpdate ? (
                      <UserCog className="w-3 h-3 text-purple-600" />
                    ) : (
                      <PiggyBank className="w-3 h-3 text-emerald-600" />
                    )}
                    <span>{isBn ? item.categoryLabelBn : item.categoryLabelEn}</span>
                  </span>

                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[140px]">
                    {item.applicationNo}
                  </span>
                </div>

                {/* Member / User Profile Info */}
                <div className="flex items-center gap-3">
                  {item.memberPhoto ? (
                    <img 
                      src={item.memberPhoto} 
                      alt={item.memberName} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isLoan ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                      : isBf ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : isUserReg ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : isProfileUpdate ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {item.memberName ? item.memberName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                      {item.memberName}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.memberNo && <span className="font-semibold text-slate-700">{item.memberNo} • </span>}
                      {item.title}
                    </p>
                  </div>
                </div>

                {/* Key Details Card */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                  {isUserReg ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">{isBn ? 'রোল:' : 'Role:'}</span>
                        <span className="font-bold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          সদস্য (Member)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.requestDate}
                        </span>
                        <span className="font-medium text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200 truncate max-w-[150px]">
                          {item.subTitle}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-blue-700 pt-0.5 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>{item.profitOrInterestRate}</span>
                      </div>
                    </>
                  ) : isProfileUpdate ? (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.requestDate}
                        </span>
                        <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          সংশোধন আবেদন
                        </span>
                      </div>
                      {item.subTitle && (
                        <div className="text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                          {item.subTitle}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">
                          {isTx ? (isBn ? 'লেনদেনের পরিমাণ:' : 'Amount:') : (isBn ? 'অনুরোধকৃত অর্থ:' : 'Requested Amount:')}
                        </span>
                        <span className={`font-extrabold text-sm ${isTx ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {fmt(item.amount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {item.requestDate}
                        </span>
                        {item.subTitle && (
                          <span className="font-medium text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200 truncate max-w-[150px]">
                            {item.subTitle}
                          </span>
                        )}
                      </div>

                      {item.profitOrInterestRate && (
                        <div className="text-[10.5px] text-indigo-700 pt-0.5 font-medium">
                          {item.profitOrInterestRate}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Status & Action Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>{isBn ? item.statusLabelBn : item.statusLabelEn}</span>
                  </span>

                  {isUserReg ? (
                    <button
                      type="button"
                      onClick={() => handleCardClick(item)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <span>{isBn ? 'সদস্য লিংক ও অনুমোদন' : 'Link & Approve'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : isBf ? (
                    <button
                      type="button"
                      onClick={() => handleCardClick(item)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <span>{isBn ? 'আবেদন ও সিদ্ধান্ত' : 'Review & Decide'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : isTx ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveTx(item.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                        title={isBn ? 'অনুমোদন করুন' : 'Approve'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectTx(item.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title={isBn ? 'বাতিল করুন' : 'Reject'}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাতিল' : 'Reject'}</span>
                      </button>
                    </div>
                  ) : isProfileUpdate ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApproveProfile(item.id)}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                        title={isBn ? 'অনুমোদন করুন' : 'Approve'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isBn ? 'অনুমোদন' : 'Approve'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectProfile(item.id)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title={isBn ? 'বাতিল করুন' : 'Reject'}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাতিল' : 'Reject'}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab('loans_pending')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <span>{isBn ? 'যাচাই ও অনুমোদন' : 'Review Loan'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Business Funding Details & Admin Decision Modal */}
      <BusinessFundingDetailsModal
        funding={selectedFundingForModal}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedFundingForModal(null);
        }}
        onSuccess={() => {
          setIsDetailsModalOpen(false);
          setSelectedFundingForModal(null);
        }}
        onNavigateToFunding={() => {
          setActiveTab('business_funding');
        }}
      />

      {/* User Registration Approval & Member Linking Modal */}
      <ApproveUserModal
        user={selectedUserForModal}
        isOpen={isApproveUserModalOpen}
        onClose={() => {
          setIsApproveUserModalOpen(false);
          setSelectedUserForModal(null);
        }}
        onSuccess={() => {
          setIsApproveUserModalOpen(false);
          setSelectedUserForModal(null);
        }}
      />
    </>
  );
};
