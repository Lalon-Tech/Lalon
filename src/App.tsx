import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
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
import { BottomNav } from './components/layout/BottomNav';
import { MemberDepositView } from './components/members/MemberDepositView';
import { MemberLoanPaymentView } from './components/members/MemberLoanPaymentView';
import { MemberPassbookView } from './components/members/MemberPassbookView';
import { MemberSettingsView } from './components/members/MemberSettingsView';
import { FieldCollectionSheet } from './components/field/FieldCollectionSheet';
import { TrialBalanceReport } from './components/reports/TrialBalanceReport';
import { BalanceSheetReport } from './components/reports/BalanceSheetReport';
import { MemberAnnualStatement } from './components/reports/MemberAnnualStatement';
import { AuditLogViewer } from './components/audit/AuditLogViewer';
import { BackupRestoreCenter } from './components/backup/BackupRestoreCenter';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { InactivityWarningModal } from './components/common/InactivityWarningModal';
import { Loader2, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { useModalScrollLock } from './hooks/useModalScrollLock';
import { useDynamicManifest } from './hooks/useDynamicManifest';
import { useMobileBackNavigation } from './hooks/useMobileBackNavigation';
import { registerBackHandler } from './utils/backHandlerRegistry';

const AppContent: React.FC = () => {
  // Synchronize browser icon, apple-touch-icon, and PWA manifest dynamically when settings.logoUrl changes
  useDynamicManifest();

  const { 
    user, 
    loading, 
    inactivityWarning, 
    inactivitySecondsRemaining, 
    stayLoggedIn, 
    logOut 
  } = useAuth();
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Lock background scroll when inactivity modal or mobile drawer is open
  useModalScrollLock(inactivityWarning || sidebarOpen);

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
    currentUser,
    updateMember,
    useBengaliDigits,
    activeReceipt,
    closeReceiptModal
  } = useSomiti();

  // Mobile Back Navigation with persistent history stack, overlay interception & Home protection
  const { navigateBack, showHomeToast } = useMobileBackNavigation({
    user,
    activeTab,
    setActiveTab,
    selectedMemberId,
    setSelectedMemberId,
    isBn: language === 'bn'
  });

  // Intercept mobile Back button for all root overlays (mobile drawer and modals)
  useEffect(() => {
    if (sidebarOpen) {
      return registerBackHandler(() => {
        setSidebarOpen(false);
        return true;
      });
    }
    if (showQuickDepositModal) {
      return registerBackHandler(() => {
        setShowQuickDepositModal(false);
        return true;
      });
    }
    if (showQuickWithdrawModal) {
      return registerBackHandler(() => {
        setShowQuickWithdrawModal(false);
        return true;
      });
    }
    if (showQuickLoanModal) {
      return registerBackHandler(() => {
        setShowQuickLoanModal(false);
        return true;
      });
    }
    if (showQuickKistiModal) {
      return registerBackHandler(() => {
        setShowQuickKistiModal(false);
        return true;
      });
    }
    if (showNewMemberModal) {
      return registerBackHandler(() => {
        setShowNewMemberModal(false);
        return true;
      });
    }
    if (showAuthModal) {
      return registerBackHandler(() => {
        setShowAuthModal(false);
        return true;
      });
    }
    if (activeReceipt && closeReceiptModal) {
      return registerBackHandler(() => {
        closeReceiptModal();
        return true;
      });
    }
  }, [
    sidebarOpen,
    showQuickDepositModal,
    showQuickWithdrawModal,
    showQuickLoanModal,
    showQuickKistiModal,
    showNewMemberModal,
    showAuthModal,
    activeReceipt,
    closeReceiptModal,
    setSidebarOpen,
    setShowQuickDepositModal,
    setShowQuickWithdrawModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal,
    setShowNewMemberModal,
    setShowAuthModal
  ]);

  // Post Login Redirect: After successful login or session switch, always redirect to the Dashboard
  const previousUserUidRef = useRef<string | null>(null);
  useEffect(() => {
    const currentUid = user ? user.uid : null;
    if (currentUid && previousUserUidRef.current !== currentUid) {
      setActiveTab('dashboard');
      setSelectedMemberId(null);
    }
    previousUserUidRef.current = currentUid;
  }, [user, setActiveTab, setSelectedMemberId]);

  const isMember = currentUser?.role === 'member';

  // Loading state (only for initial auth check, never locks UI indefinitely)
  if (loading) {
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
    'users', 'user_management', 'banking', 'accounts',
    'excel', 'excel_import', 'reports', 'reports_daily', 'reports_monthly',
    'reports_member', 'reports_income_expense', 'reports_yearly',
    'all_members', 'new_member', 'active_members', 'recycle_bin', 'member_recycle_bin',
    'members', 'members_all', 'loans_kisti', 'transactions_kisti'
  ];

  const renderActiveView = () => {
    // If member accesses settings or member_settings, directly display MemberSettingsView
    if (isMember && (activeTab === 'settings' || activeTab === 'member_settings' || activeTab === 'settings_member')) {
      const targetMemberId = currentUser?.memberId || (members.length > 0 ? members[0].id : '');
      const targetMember = members.find(m => m.id === targetMemberId);
      if (targetMember) {
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <MemberSettingsView 
              member={targetMember} 
              onUpdateMember={updateMember}
              isBn={language === 'bn'}
              useBengaliDigits={useBengaliDigits}
              onClose={() => navigateBack('dashboard')} 
            />
          </div>
        );
      }
    }

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
      case 'recycle_bin':
      case 'member_recycle_bin':
        return <MemberList />;

      case 'members_new':
      case 'new_member':
        return (
          <div className="space-y-4 pb-16 min-h-full">
            <div className="flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={() => navigateBack('all_members')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                ← {language === 'bn' ? 'সকল সদস্য তালিকায় ফিরে যান' : 'Back to Member List'}
              </button>
            </div>
            <NewMemberModal isOpen={true} isEmbedded={true} onClose={() => navigateBack('all_members')} />
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
                navigateBack('dashboard');
              } else {
                navigateBack('all_members'); 
              }
            }} 
          />
        );

      case 'nominees':
      case 'nominee':
        return <NomineesView />;

      case 'member_deposit':
        return <MemberDepositView />;

      case 'member_loan_payment':
      case 'member_loan':
        return <MemberLoanPaymentView />;

      case 'member_passbook':
      case 'passbook':
        return <MemberPassbookView />;

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

      case 'field_sheet':
      case 'collection_sheet':
        return <FieldCollectionSheet />;

      case 'trial_balance':
      case 'reports_trial_balance':
        return <TrialBalanceReport />;

      case 'balance_sheet':
      case 'reports_balance_sheet':
        return <BalanceSheetReport />;

      case 'member_annual':
      case 'member_statement':
      case 'reports_member_annual':
        return <MemberAnnualStatement />;

      case 'audit_logs':
      case 'audit':
      case 'activity_logs':
        return <AuditLogViewer />;

      case 'backup':
      case 'backup_restore':
        return <BackupRestoreCenter />;

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

      case 'member_settings':
      case 'settings_member': {
        const targetMemberSettingsId = (isMember && currentUser?.memberId)
          ? currentUser.memberId
          : (selectedMemberId || (members.length > 0 ? members[0].id : ''));
        const targetMember = members.find(m => m.id === targetMemberSettingsId) || members[0];
        if (!targetMember) {
          return (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto my-12">
              <p className="text-slate-600 dark:text-slate-400">
                {language === 'bn' ? 'কোনো সদস্য নির্বাচন করা হয়নি' : 'No member selected'}
              </p>
            </div>
          );
        }
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <MemberSettingsView 
              member={targetMember} 
              onUpdateMember={updateMember}
              isBn={language === 'bn'}
              useBengaliDigits={useBengaliDigits}
              onClose={() => { 
                if (isMember) {
                  navigateBack('dashboard');
                } else {
                  navigateBack('all_members'); 
                }
              }} 
            />
          </div>
        );
      }

      case 'settings':
        if (isMember) {
          const targetMId = currentUser?.memberId || (members.length > 0 ? members[0].id : '');
          const targetMember = members.find(m => m.id === targetMId) || members[0];
          if (targetMember) {
            return (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <MemberSettingsView 
                  member={targetMember} 
                  onUpdateMember={updateMember}
                  isBn={language === 'bn'}
                  useBengaliDigits={useBengaliDigits}
                  onClose={() => navigateBack('dashboard')} 
                />
              </div>
            );
          }
        }
        return <SettingsView />;

      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0b1120] flex flex-col font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white w-full max-w-full overflow-x-hidden transition-colors duration-200">
      {/* Top Fixed Header */}
      <Header 
        onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1 pt-14 sm:pt-16">
        {/* Left Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          onOpenAuthModal={() => setShowAuthModal(true)}
        />

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 lg:pl-72 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full min-w-0 transition-all">
          <div className="max-w-7xl mx-auto w-full min-w-0">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav 
        isSidebarOpen={sidebarOpen}
        onOpenMenu={() => setSidebarOpen(true)} 
      />

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
      <OfflineIndicator />

      {/* Enhanced Inactivity Auto-Logout Warning with Circular Timer & Progress Bar */}
      <InactivityWarningModal
        isOpen={inactivityWarning}
        secondsRemaining={inactivitySecondsRemaining}
        totalSeconds={60}
        onStayLoggedIn={stayLoggedIn}
        onLogOut={logOut}
      />

      {/* Firebase Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Mobile Home Screen Navigation Protection Toast */}
      {showHomeToast && (
        <div 
          role="status" 
          aria-live="polite"
          className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/95 text-white dark:bg-white/95 dark:text-slate-900 text-xs font-semibold rounded-full shadow-xl backdrop-blur-md border border-slate-700 dark:border-slate-300 pointer-events-none select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          {language === 'bn' ? '🏠 আপনি হোম ড্যাশবোর্ডে আছেন' : '🏠 You are on the Home Dashboard'}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SomitiProvider>
            <AppContent />
          </SomitiProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
