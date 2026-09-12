import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SomitiProvider, useSomiti } from './context/SomitiContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { MemberList } from './components/members/MemberList';
import { MemberProfileView } from './components/members/MemberProfileView';
import { NewMemberModal } from './components/members/NewMemberModal';
import { TransactionManager } from './components/transactions/TransactionManager';
import { NewDepositModal } from './components/transactions/NewDepositModal';
import { NewWithdrawModal } from './components/transactions/NewWithdrawModal';
import { NewLoanModal } from './components/transactions/NewLoanModal';
import { QuickKistiModal } from './components/transactions/QuickKistiModal';
import { SavingsView } from './components/savings/SavingsView';
import { LoansView } from './components/loans/LoansView';
import { IncomeExpenseView } from './components/finance/IncomeExpenseView';
import { BankCashView } from './components/bank/BankCashView';
import { ReportsView } from './components/reports/ReportsView';
import { AgreementsView } from './components/agreements/AgreementsView';
import { UserManagementView } from './components/users/UserManagementView';
import { ExcelImportView } from './components/excel/ExcelImportView';
import { SettingsView } from './components/settings/SettingsView';
import { NomineesView } from './components/nominees/NomineesView';
import { ReceiptsView } from './components/receipts/ReceiptsView';
import { BusinessFundingView } from './components/business/BusinessFundingView';
import { ReceiptModal } from './components/receipts/ReceiptModal';
import { AuthModal } from './components/auth/AuthModal';
import { PendingApprovalView } from './components/auth/PendingApprovalView';
import { Loader2, ShieldAlert } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { 
    activeTab, 
    setActiveTab,
    members,
    selectedMemberId, 
    setSelectedMemberId,
    showNewMemberModal,
    setShowNewMemberModal,
    showQuickDepositModal,
    setShowQuickDepositModal,
    showQuickWithdrawModal,
    setShowQuickWithdrawModal,
    showQuickLoanModal,
    setShowQuickLoanModal,
    showQuickKistiModal,
    setShowQuickKistiModal,
    isDataLoading,
    currentUser
  } = useSomiti();

  const isMember = currentUser?.role === 'member';

  // Loading state
  if (loading || (user && isDataLoading)) {
    return (
      <div className="min-h-screen bg-[#070d1e] flex flex-col items-center justify-center text-cyan-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-xs font-semibold text-slate-400 tracking-wider">লোড হচ্ছে...</p>
      </div>
    );
  }

  // Strict Login Gate: Whenever anyone enters this app, always show the Login Page first
  if (!user) {
    return <LoginPage />;
  }

  // Pending Approval Gate: Unapproved or unlinked member accounts cannot access Member Dashboard or financial data
  const isPendingApproval = 
    currentUser?.status === 'pending' || 
    (currentUser?.role === 'member' && !currentUser?.memberId);

  if (isPendingApproval && currentUser?.role !== 'admin') {
    return <PendingApprovalView />;
  }

  // Rule 7: Member Access Rules - Members cannot access Admin settings or administrative actions
  const adminOnlyTabs = [
    'users', 'user_management', 'settings', 'banking', 'accounts',
    'excel', 'excel_import', 'reports', 'reports_daily', 'reports_monthly',
    'reports_member', 'reports_income_expense', 'reports_yearly',
    'business_funding', 'all_members', 'new_member', 'active_members',
    'members', 'members_all', 'loans_pending', 'loans_apply'
  ];

  const renderActiveView = () => {
    if (isMember && adminOnlyTabs.includes(activeTab)) {
      return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs text-center max-w-md mx-auto my-12 space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {language === 'bn' ? 'অ্যাক্সেস সংরক্ষিত' : 'Access Restricted'}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {language === 'bn' 
              ? 'আপনার অ্যাকাউন্ট রোল "সদস্য (Member)"। এই পৃষ্ঠাটি শুধুমাত্র সমিতির অনুমোদিত প্রশাসক এবং কর্মকর্তাদের জন্য উন্মুক্ত।'
              : 'Your account role is Member. This section is restricted to administrators.'}
          </p>
          <button
            onClick={() => {
              if (currentUser?.memberId) setSelectedMemberId(currentUser.memberId);
              setActiveTab('member_profile');
            }}
            className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            {language === 'bn' ? 'আমার প্রোফাইলে যান' : 'Go to My Profile'}
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;

      case 'members':
      case 'members_all':
      case 'all_members':
      case 'members_active':
      case 'active_members':
        return <MemberList />;

      case 'members_new':
      case 'new_member':
        return (
          <div className="space-y-4 pb-12">
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('all_members')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ← {language === 'bn' ? 'সকল সদস্য তালিকায় ফিরে যান' : 'Back to Member List'}
              </button>
            </div>
            <NewMemberModal isOpen={true} isEmbedded={true} onClose={() => setActiveTab('all_members')} />
          </div>
        );

      case 'members_profile':
      case 'member_profile':
        const targetMemberId = (isMember && currentUser?.memberId)
          ? currentUser.memberId
          : (selectedMemberId || (members.length > 0 ? members[0].id : ''));
        return (
          <MemberProfileView 
            memberId={targetMemberId} 
            onBack={() => { 
              if (isMember) {
                setActiveTab('dashboard');
              } else {
                setSelectedMemberId(null); 
                setActiveTab('all_members'); 
              }
            }} 
          />
        );

      case 'nominees':
      case 'nominee':
        return <NomineesView />;

      case 'transactions':
      case 'tx_history':
      case 'tx_deposit':
      case 'tx_withdraw':
      case 'transactions_deposit':
      case 'transactions_withdraw':
      case 'transactions_history':
        return <TransactionManager />;

      case 'receipts':
      case 'receipt_print':
        return <ReceiptsView />;

      case 'savings':
      case 'savings_dps':
      case 'savings_fdr':
      case 'savings_ledger':
      case 'savings_monthly':
      case 'savings_5year':
      case 'savings_member':
        return <SavingsView />;

      case 'loans':
      case 'loans_list':
      case 'loans_apply':
      case 'loans_pending':
      case 'loans_active':
      case 'loans_kisti':
      case 'loans_closed':
      case 'loans_calculator':
      case 'transactions_loan':
      case 'transactions_kisti':
        return <LoansView />;

      case 'business_funding':
      case 'business':
      case 'profit_distribution':
        return <BusinessFundingView />;

      case 'agreements':
        return <AgreementsView />;

      case 'reports':
      case 'report_daily':
      case 'report_monthly':
      case 'report_members':
      case 'report_income_expense':
      case 'report_yearly':
      case 'reports_daily':
      case 'reports_monthly':
      case 'reports_member':
      case 'reports_income_expense':
      case 'reports_yearly':
        return <ReportsView />;

      case 'accounts':
      case 'finance':
      case 'income_expense':
        return <IncomeExpenseView />;

      case 'banking':
      case 'bank':
      case 'bank_cash':
        return <BankCashView />;

      case 'users':
      case 'user_management':
        return <UserManagementView />;

      case 'excel':
      case 'excel_import':
        return <ExcelImportView />;

      case 'settings':
        return <SettingsView />;

      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Header */}
      <Header 
        onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          onOpenAuthModal={() => setShowAuthModal(true)}
        />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 w-full min-w-0 transition-all">
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <NewMemberModal
        isOpen={showNewMemberModal}
        onClose={() => setShowNewMemberModal(false)}
      />

      <NewDepositModal
        isOpen={showQuickDepositModal}
        onClose={() => setShowQuickDepositModal(false)}
        initialMemberId={selectedMemberId || undefined}
        lockMember={Boolean(selectedMemberId) || activeTab === 'member_profile'}
      />

      <NewWithdrawModal
        isOpen={showQuickWithdrawModal}
        onClose={() => setShowQuickWithdrawModal(false)}
        initialMemberId={selectedMemberId || undefined}
        lockMember={Boolean(selectedMemberId) || activeTab === 'member_profile'}
      />

      <NewLoanModal
        isOpen={showQuickLoanModal}
        onClose={() => setShowQuickLoanModal(false)}
        initialMemberId={selectedMemberId || undefined}
        lockMember={Boolean(selectedMemberId) || activeTab === 'member_profile'}
      />

      <QuickKistiModal
        isOpen={showQuickKistiModal}
        onClose={() => setShowQuickKistiModal(false)}
      />

      <ReceiptModal />

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SomitiProvider>
          <AppContent />
        </SomitiProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
