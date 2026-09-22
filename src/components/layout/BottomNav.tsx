import React from 'react';
import { 
  Home, 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  PiggyBank, 
  CreditCard, 
  HandCoins, 
  Briefcase, 
  BookOpen, 
  User, 
  ClipboardList, 
  Menu 
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';

interface BottomNavProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onOpenMenu?: () => void;
  onOpenQuickDeposit?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  isSidebarOpen,
  onToggleSidebar, 
  onOpenMenu,
  onOpenQuickDeposit 
}) => {
  const { 
    activeTab, 
    setActiveTab, 
    loans, 
    currentUser, 
    setSelectedMemberId,
    setShowQuickDepositModal 
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Completely hide Bottom Navigation when the Side Menu / Hamburger Menu is opened on mobile
  if (isSidebarOpen) {
    return null;
  }

  const handleMenuClick = () => {
    if (onOpenMenu) {
      onOpenMenu();
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const handleQuickDeposit = () => {
    if (onOpenQuickDeposit) {
      onOpenQuickDeposit();
    } else {
      setShowQuickDepositModal(true);
    }
  };

  const isMember = currentUser?.role === 'member';

  // ==========================================
  // MEMBER-SPECIFIC MOBILE BOTTOM NAVIGATION (6 Options in exact order)
  // 1. Home
  // 2. Deposit
  // 3. Loan Payment
  // 4. Business Funding
  // 5. Passbook & Ledger
  // 6. Profile
  // ==========================================
  if (isMember) {
    const isHomeActive = activeTab === 'dashboard';
    const isDepositActive = ['member_deposit', 'tx_deposit', 'transactions_deposit', 'deposit'].includes(activeTab);
    const isLoanPaymentActive = ['member_loan_payment', 'loans_payment', 'loans_kisti', 'loans'].includes(activeTab);
    const isBusinessFundingActive = ['business_funding', 'business', 'profit_distribution'].includes(activeTab);
    const isPassbookActive = ['member_passbook', 'passbook', 'tx_history', 'transactions_history', 'transactions', 'savings_ledger'].includes(activeTab);
    const isProfileActive = ['member_profile', 'members_profile'].includes(activeTab);

    return (
      <nav 
        id="member-bottom-navigation"
        aria-label="Member Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-lg px-1 py-1 transition-all select-none no-print"
      >
        <div className="grid grid-cols-6 items-center w-full gap-0.5">
          {/* 1. Home */}
          <button
            id="member-nav-home"
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all cursor-pointer min-w-0 w-full ${
              isHomeActive 
                ? 'text-blue-700 font-bold bg-blue-50/80 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isBn ? 'হোম ড্যাশবোর্ড' : 'Home'}
          >
            <Home className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform ${isHomeActive ? 'scale-110 text-blue-700' : ''}`} />
            <span className="text-[9.5px] sm:text-[10px] leading-tight mt-0.5 text-center truncate w-full">
              {isBn ? 'হোম' : 'Home'}
            </span>
          </button>

          {/* 2. Deposit */}
          <button
            id="member-nav-deposit"
            type="button"
            onClick={() => setActiveTab('member_deposit')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all cursor-pointer min-w-0 w-full ${
              isDepositActive 
                ? 'text-emerald-700 font-bold bg-emerald-50/80 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isBn ? 'সঞ্চয় জমা আবেদন' : 'Deposit'}
          >
            <PiggyBank className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform ${isDepositActive ? 'scale-110 text-emerald-700' : ''}`} />
            <span className="text-[9.5px] sm:text-[10px] leading-tight mt-0.5 text-center truncate w-full">
              {isBn ? 'জমা' : 'Deposit'}
            </span>
          </button>

          {/* 3. Loan Payment */}
          <button
            id="member-nav-loan-payment"
            type="button"
            onClick={() => setActiveTab('member_loan_payment')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all cursor-pointer min-w-0 w-full ${
              isLoanPaymentActive 
                ? 'text-indigo-700 font-bold bg-indigo-50/80 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isBn ? 'ঋণ ও কিস্তি পরিশোধ' : 'Loan Payment'}
          >
            <CreditCard className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform ${isLoanPaymentActive ? 'scale-110 text-indigo-700' : ''}`} />
            <span className="text-[9.5px] sm:text-[10px] leading-tight mt-0.5 text-center truncate w-full">
              {isBn ? 'ঋণ পরিশোধ' : 'Loan Pay'}
            </span>
          </button>

          {/* 4. Business Funding */}
          <button
            id="member-nav-business-funding"
            type="button"
            onClick={() => setActiveTab('business_funding')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all cursor-pointer min-w-0 w-full ${
              isBusinessFundingActive 
                ? 'text-amber-700 font-bold bg-amber-50/80 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isBn ? 'ব্যবসা ফান্ডিং ও লাভ বণ্টন' : 'Business Funding'}
          >
            <Briefcase className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform ${isBusinessFundingActive ? 'scale-110 text-amber-700' : ''}`} />
            <span className="text-[9.5px] sm:text-[10px] leading-tight mt-0.5 text-center truncate w-full">
              {isBn ? 'ব্যবসা ফান্ডিং' : 'Funding'}
            </span>
          </button>

          {/* 5. Passbook & Ledger */}
          <button
            id="member-nav-passbook"
            type="button"
            onClick={() => setActiveTab('member_passbook')}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all cursor-pointer min-w-0 w-full ${
              isPassbookActive 
                ? 'text-cyan-800 font-bold bg-cyan-50/80 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isBn ? 'পাসবুক ও লেজার হিসাব' : 'Passbook & Ledger'}
          >
            <BookOpen className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform ${isPassbookActive ? 'scale-110 text-cyan-700' : ''}`} />
            <span className="text-[9.5px] sm:text-[10px] leading-tight mt-0.5 text-center truncate w-full">
              {isBn ? 'পাসবুক' : 'Passbook'}
            </span>
          </button>

          {/* 6. Profile */}
          <button
            id="member-nav-profile"
            type="button"
            onClick={() => {
              if (currentUser?.memberId) {
                setSelectedMemberId(currentUser.memberId);
              }
              setActiveTab('member_profile');
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-lg transition-all cursor-pointer min-w-0 w-full ${
              isProfileActive 
                ? 'text-purple-700 font-bold bg-purple-50/80 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isBn ? 'আমার প্রোফাইল' : 'Profile'}
          >
            <User className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform ${isProfileActive ? 'scale-110 text-purple-700' : ''}`} />
            <span className="text-[9.5px] sm:text-[10px] leading-tight mt-0.5 text-center truncate w-full">
              {isBn ? 'প্রোফাইল' : 'Profile'}
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // ==========================================
  // ADMIN / STAFF MOBILE BOTTOM NAVIGATION (Unchanged, unaffected)
  // ==========================================
  const pendingLoansCount = loans.filter(l => l.status === 'pending').length;
  const isDashboardActive = activeTab === 'dashboard';
  const isMembersActive = ['members', 'all_members', 'active_members', 'new_member', 'member_profile'].includes(activeTab);
  const isLoansActive = ['loans', 'loans_list', 'loans_apply', 'loans_pending', 'loans_kisti'].includes(activeTab);
  const isFieldSheetActive = activeTab === 'field_sheet' || activeTab === 'collection_sheet';

  return (
    <nav 
      id="admin-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-lg px-1.5 py-1 flex items-center justify-around transition-all select-none no-print"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer min-w-[56px] ${
          isDashboardActive 
            ? 'text-blue-700 font-bold' 
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 transition-transform ${isDashboardActive ? 'scale-110 text-blue-700' : ''}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">{isBn ? 'ড্যাশবোর্ড' : 'Home'}</span>
      </button>

      {/* 2. Members */}
      <button
        type="button"
        onClick={() => setActiveTab('all_members')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer min-w-[56px] ${
          isMembersActive 
            ? 'text-blue-700 font-bold' 
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Users className={`w-5 h-5 transition-transform ${isMembersActive ? 'scale-110 text-blue-700' : ''}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">{isBn ? 'সদস্য' : 'Members'}</span>
      </button>

      {/* 3. Center Quick Deposit (+) */}
      <button
        type="button"
        onClick={handleQuickDeposit}
        className="flex flex-col items-center justify-center -mt-4 transition-transform active:scale-95 cursor-pointer"
        title={isBn ? 'দ্রুত সঞ্চয় জমা' : 'Quick Deposit'}
      >
        <div className="w-12 h-12 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 ring-4 ring-white">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold text-emerald-700 mt-0.5">{isBn ? 'জমা' : 'Deposit'}</span>
      </button>

      {/* 4. Loans & Kisti */}
      <button
        type="button"
        onClick={() => setActiveTab('loans_kisti')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer min-w-[56px] relative ${
          isLoansActive 
            ? 'text-blue-700 font-bold' 
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <HandCoins className={`w-5 h-5 transition-transform ${isLoansActive ? 'scale-110 text-blue-700' : ''}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">{isBn ? 'কিস্তি POS' : 'Kisti'}</span>
        {pendingLoansCount > 0 && (
          <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        )}
      </button>

      {/* 5. Field Collection Sheet */}
      <button
        type="button"
        onClick={() => setActiveTab('field_sheet')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer min-w-[56px] ${
          isFieldSheetActive 
            ? 'text-blue-700 font-bold' 
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <ClipboardList className={`w-5 h-5 transition-transform ${isFieldSheetActive ? 'scale-110 text-blue-700' : ''}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">{isBn ? 'ফিল্ড শিট' : 'Sheet'}</span>
      </button>

      {/* 6. More / Menu (opens sidebar) */}
      <button
        type="button"
        onClick={handleMenuClick}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer min-w-[56px] text-slate-500 hover:text-slate-800"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">{isBn ? 'মেনু' : 'Menu'}</span>
      </button>
    </nav>
  );
};
