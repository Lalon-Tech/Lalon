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
  ExternalLink
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { getAllPendingApprovals } from '../../utils/approvalRegistry';
import { PendingApprovalItem, ApprovalCategory } from '../../types/approval';
import { BusinessFunding } from '../../types';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';
import { BusinessFundingDetailsModal } from '../business/BusinessFundingDetailsModal';

export const ApprovalNotificationCenter: React.FC = () => {
  const { 
    loans, 
    businessFundings, 
    members, 
    currentUser, 
    isUserAdmin,
    setActiveTab, 
    useBengaliDigits 
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Selected funding for the dedicated Details & Decision modal
  const [selectedFundingForModal, setSelectedFundingForModal] = useState<BusinessFunding | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Active filter for categories: 'all' | 'loan' | 'business_funding'
  const [selectedCategory, setSelectedCategory] = useState<'all' | ApprovalCategory>('all');

  // Aggregated list from the extensible Central Approval Registry
  const allPendingItems = useMemo(() => {
    return getAllPendingApprovals({ loans, businessFundings, members });
  }, [loans, businessFundings, members]);

  // Counts by category
  const loanPendingCount = useMemo(() => 
    allPendingItems.filter(item => item.category === 'loan').length, 
    [allPendingItems]
  );
  
  const businessFundingPendingCount = useMemo(() => 
    allPendingItems.filter(item => item.category === 'business_funding').length, 
    [allPendingItems]
  );

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return allPendingItems;
    return allPendingItems.filter(item => item.category === selectedCategory);
  }, [allPendingItems, selectedCategory]);

  const num = (val: number | string) => isBn || useBengaliDigits ? toBengaliNumber(val) : val.toString();
  const fmt = (val: number) => formatCurrency(val, isBn || useBengaliDigits);

  // If there are no pending items, return null (nothing pending)
  if (allPendingItems.length === 0) {
    return null;
  }

  const handleCardClick = (item: PendingApprovalItem) => {
    if (item.category === 'business_funding') {
      const funding = item.rawItem as BusinessFunding;
      setSelectedFundingForModal(funding);
      setIsDetailsModalOpen(true);
    } else if (item.category === 'loan') {
      setActiveTab('loans_pending');
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
                  ? `মোট ${num(allPendingItems.length)}টি আবেদনের জন্য অ্যাডমিন যাচাই ও অনুমোদন প্রয়োজন (${loanPendingCount > 0 ? `ঋণ: ${num(loanPendingCount)}টি` : ''}${loanPendingCount > 0 && businessFundingPendingCount > 0 ? ', ' : ''}${businessFundingPendingCount > 0 ? `ব্যবসা ফান্ডিং: ${num(businessFundingPendingCount)}টি` : ''})।`
                  : `${num(allPendingItems.length)} request(s) awaiting review (${loanPendingCount} Loans, ${businessFundingPendingCount} Business Fundings).`}
              </p>
            </div>
          </div>

          {/* Quick Filter Category Pills */}
          <div className="flex items-center gap-1.5 flex-wrap self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <span>{isBn ? 'সকল আবেদন' : 'All'}</span>
              <span className="px-1.5 py-0.2 bg-black/20 rounded-md text-[10px]">
                {num(allPendingItems.length)}
              </span>
            </button>

            {loanPendingCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('loan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'loan'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-amber-800 border border-amber-200'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5 text-amber-500" />
                <span>{isBn ? 'ঋণ আবেদন' : 'Loans'}</span>
                <span className="px-1.5 py-0.2 bg-amber-700/20 text-current rounded-md text-[10px]">
                  {num(loanPendingCount)}
                </span>
              </button>
            )}

            {businessFundingPendingCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategory('business_funding')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'business_funding'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-white/80 hover:bg-white text-indigo-800 border border-indigo-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span>{isBn ? 'ব্যবসা বিনিয়োগ' : 'Business'}</span>
                <span className="px-1.5 py-0.2 bg-indigo-800/20 text-current rounded-md text-[10px]">
                  {num(businessFundingPendingCount)}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Pending Requests Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const isLoan = item.category === 'loan';
            const isBf = item.category === 'business_funding';

            return (
              <div 
                key={`${item.category}-${item.id}`}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-blue-400 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  isLoan ? 'bg-amber-500' : 'bg-indigo-600'
                }`} />

                {/* Card Top: Type Badge & Application ID */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isLoan 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  }`}>
                    {isLoan ? <HandCoins className="w-3 h-3 text-amber-600" /> : <Briefcase className="w-3 h-3 text-indigo-600" />}
                    <span>{isBn ? item.categoryLabelBn : item.categoryLabelEn}</span>
                  </span>

                  <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {item.applicationNo}
                  </span>
                </div>

                {/* Member Profile Info */}
                <div className="flex items-center gap-3">
                  {item.memberPhoto ? (
                    <img 
                      src={item.memberPhoto} 
                      alt={item.memberName} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isLoan ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}>
                      {item.memberName.charAt(0)}
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

                {/* Key Financial Details (Amount, Subtitle/Term, Date) */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isBn ? 'অনুরোধকৃত অর্থ:' : 'Requested Amount:'}</span>
                    <span className="font-extrabold text-sm text-slate-900">{fmt(item.amount)}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.requestDate}
                    </span>
                    {item.subTitle && (
                      <span className="font-medium text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        {item.subTitle}
                      </span>
                    )}
                  </div>

                  {item.profitOrInterestRate && (
                    <div className="text-[10.5px] text-indigo-700 pt-0.5 font-medium">
                      {item.profitOrInterestRate}
                    </div>
                  )}
                </div>

                {/* Status & Action Button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>{isBn ? item.statusLabelBn : item.statusLabelEn}</span>
                  </span>

                  {isBf ? (
                    <button
                      type="button"
                      onClick={() => handleCardClick(item)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs hover:shadow-xs cursor-pointer"
                    >
                      <span>{isBn ? 'আবেদন ও সিদ্ধান্ত' : 'Review & Decide'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
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
    </>
  );
};
