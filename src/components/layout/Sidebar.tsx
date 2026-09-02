import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BadgePercent,
  PiggyBank,
  FileSignature,
  FileSpreadsheet,
  Building2,
  Receipt,
  Settings as SettingsIcon,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  FileText,
  Sparkles,
  HelpCircle,
  Video,
  LogOut,
  LogIn,
  Flame,
  FolderDown,
  Calculator,
  UserPlus
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  subItems?: { id: string; label: string; action?: () => void }[];
}

export const Sidebar: React.FC<{ 
  isOpen: boolean; 
  setIsOpen: (open: boolean) => void;
  onOpenAuthModal?: () => void;
}> = ({ isOpen, setIsOpen, onOpenAuthModal }) => {
  const { language, t } = useLanguage();
  const { 
    activeTab, 
    setActiveTab, 
    settings, 
    members,
    selectedMemberId,
    setSelectedMemberId,
    setShowNewMemberModal,
    setShowQuickDepositModal,
    setShowQuickWithdrawModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal
  } = useSomiti();

  const { user: firebaseUser, logOut } = useAuth();

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    members: true,
    transactions: false,
    savings: false,
    reports: false,
  });

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.subItems) {
      toggleSubmenu(item.id);
    } else {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      }
    }
    setActiveTab(item.id);
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'members',
      label: t('members'),
      icon: Users,
      subItems: [
        { 
          id: 'all_members', 
          label: t('all_members'),
          action: () => {
            setSelectedMemberId(null);
            setActiveTab('all_members');
          }
        },
        { 
          id: 'new_member', 
          label: t('new_member'), 
          action: () => {
            setShowNewMemberModal(true);
          }
        },
        { 
          id: 'active_members', 
          label: t('active_members'),
          action: () => {
            setSelectedMemberId(null);
            setActiveTab('active_members');
          }
        },
        { 
          id: 'member_profile', 
          label: t('member_profile'),
          action: () => {
            if (!selectedMemberId && members.length > 0) {
              setSelectedMemberId(members[0].id);
            }
            setActiveTab('member_profile');
          }
        },
      ],
    },
    {
      id: 'transactions',
      label: t('transactions'),
      icon: BadgePercent,
      subItems: [
        { id: 'tx_deposit', label: t('tx_deposit'), action: () => { setShowQuickDepositModal(true); setActiveTab('transactions'); } },
        { id: 'tx_withdraw', label: t('tx_withdraw'), action: () => { setShowQuickWithdrawModal(true); setActiveTab('transactions'); } },
        { id: 'tx_loan', label: t('tx_loan'), action: () => { setShowQuickLoanModal(true); setActiveTab('loans'); } },
        { id: 'tx_kisti', label: t('tx_kisti'), action: () => { setShowQuickKistiModal(true); setActiveTab('loans'); } },
        { id: 'tx_history', label: language === 'bn' ? 'লেনদেন হিস্ট্রি' : 'Transaction History', action: () => setActiveTab('transactions') },
      ],
    },
    {
      id: 'savings',
      label: t('savings'),
      icon: PiggyBank,
      subItems: [
        { id: 'savings_dps', label: t('savings_dps'), action: () => setActiveTab('savings') },
        { id: 'savings_fdr', label: t('savings_fdr'), action: () => setActiveTab('savings') },
        { id: 'savings_ledger', label: language === 'bn' ? 'সদস্য সঞ্চয় লেজার' : 'Member Savings Ledger', action: () => setActiveTab('savings') },
      ],
    },
    {
      id: 'nominees',
      label: language === 'bn' ? 'নমিনি ও ওয়ারিশ' : 'Nominee & Legal Heir',
      icon: UserCheck,
    },
    {
      id: 'agreements',
      label: language === 'bn' ? 'চুক্তিপত্র ও স্ট্যাম্প' : 'Agreement & Stamp',
      icon: FileSignature,
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: TrendingUp,
      subItems: [
        { id: 'report_daily', label: t('daily_report'), action: () => setActiveTab('reports_daily') },
        { id: 'report_monthly', label: t('monthly_report'), action: () => setActiveTab('reports_monthly') },
        { id: 'report_members', label: t('member_report'), action: () => setActiveTab('reports_member') },
        { id: 'report_income_expense', label: t('income_expense_report'), action: () => setActiveTab('reports_income_expense') },
        { id: 'report_yearly', label: t('yearly_report'), action: () => setActiveTab('reports_yearly') },
      ],
    },
    {
      id: 'accounts',
      label: t('accounts'),
      icon: FileText,
    },
    {
      id: 'banking',
      label: t('bank'),
      icon: Building2,
    },
    {
      id: 'users',
      label: t('users_roles'),
      icon: ShieldCheck,
    },
    {
      id: 'excel',
      label: t('excel'),
      icon: FolderDown,
    },
    {
      id: 'receipts',
      label: language === 'bn' ? 'রসিদ ও প্রিন্ট' : 'Receipts & Print',
      icon: Receipt,
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: SettingsIcon,
    },
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Somiti Branding Header */}
        <div className="p-4.5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md font-bold text-lg">
            {language === 'bn' ? 'ব' : 'B'}
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-base text-white truncate tracking-wide">
              {settings.somitiName || (language === 'bn' ? 'বন্ধু সমিতি' : 'Bondhu Somiti')}
            </h1>
            <p className="text-xs text-blue-400 font-medium truncate">
              {settings.registrationNo || (language === 'bn' ? 'সমবায় সমিতি লিঃ' : 'Cooperative Society Ltd.')}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {language === 'bn' ? 'প্রধান মেনু' : 'Main Menu'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isExpanded = expandedMenus[item.id];
            const hasSub = item.subItems && item.subItems.length > 0;

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  id={`nav-${item.id}`}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {hasSub && (
                    <span className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </button>

                {/* Sub-menu items */}
                {hasSub && isExpanded && (
                  <div className="pl-9 pr-2 py-1 space-y-1">
                    {item.subItems!.map((sub) => {
                      const isSubActive = 
                        activeTab === sub.id || 
                        (sub.id === 'all_members' && (activeTab === 'members' || activeTab === 'all_members' || activeTab === 'members_all') && !selectedMemberId) ||
                        (sub.id === 'active_members' && (activeTab === 'active_members' || activeTab === 'members_active')) ||
                        (sub.id === 'member_profile' && (activeTab === 'member_profile' || activeTab === 'members_profile' || (selectedMemberId !== null && (activeTab === 'members' || activeTab.startsWith('members_')))));

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            if (window.innerWidth < 1024) {
                              setIsOpen(false);
                            }
                            if (sub.action) {
                              sub.action();
                            } else {
                              setActiveTab(sub.id);
                            }
                          }}
                          className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center gap-2 cursor-pointer ${
                            isSubActive
                              ? 'bg-blue-600/30 text-blue-300 font-semibold'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSubActive ? 'bg-blue-400' : 'bg-slate-500'}`}></span>
                          <span className="truncate">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer User Info & Firebase Auth */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
          {firebaseUser ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-emerald-500/30">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate">{firebaseUser.displayName || firebaseUser.email}</p>
                  <p className="text-[10px] text-emerald-400 truncate">
                    {language === 'bn' ? 'Firebase লগইন সক্রিয়' : 'Firebase Auth Active'}
                  </p>
                </div>
              </div>
              <button
                onClick={logOut}
                title={language === 'bn' ? 'লগআউট করুন' : 'Log out'}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="sidebar-firebase-login-btn"
              onClick={() => {
                if (onOpenAuthModal) onOpenAuthModal();
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'bn' ? 'Firebase লগইন / সাইন-আপ' : 'Firebase Login / Sign-up'}</span>
            </button>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{language === 'bn' ? 'অনলাইন সিস্টেম' : 'Online System'}</span>
            </div>
            <span>{language === 'bn' ? '© ২০২৬ বন্ধু' : '© 2026 Bondhu'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
