import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  UserPlus, 
  ArrowDownRight, 
  ArrowUpRight, 
  CreditCard, 
  Receipt, 
  FileText, 
  ChevronDown,
  Bell,
  Coins,
  Menu,
  LogIn,
  LogOut,
  Flame,
  UserCheck
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { getAllPendingApprovals } from '../../utils/approvalRegistry';
import { toBengaliNumber } from '../../utils/bengaliUtils';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenAuthModal }) => {
  const { language, t } = useLanguage();
  const { 
    currentUser, 
    searchQuery, 
    setSearchQuery, 
    useBengaliDigits, 
    setUseBengaliDigits,
    setShowNewMemberModal,
    setShowQuickDepositModal,
    setShowQuickWithdrawModal,
    setShowQuickLoanModal,
    setShowQuickKistiModal,
    setActiveTab,
    setSelectedMemberId,
    members,
    loans,
    businessFundings,
    users
  } = useSomiti();

  const pendingApprovalsCount = React.useMemo(() => {
    return getAllPendingApprovals({ loans, businessFundings, members, users }).length;
  }, [loans, businessFundings, members, users]);

  const { user: firebaseUser, logOut } = useAuth();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMembers = searchQuery.trim()
    ? members.filter(
        m => {
          const q = searchQuery.toLowerCase();
          return (
            (m.name ?? '').toLowerCase().includes(q) ||
            (m.nameEn ?? '').toLowerCase().includes(q) ||
            (m.memberNo ?? '').toLowerCase().includes(q) ||
            (m.phone ?? '').includes(searchQuery) ||
            (m.nid ?? '').includes(searchQuery)
          );
        }
      ).slice(0, 6)
    : [];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-2xs px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 lg:pl-68 transition-all">
      {/* Left: Hamburger menu on mobile + User Profile badge */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            title="মেনু খুলুন"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setActiveTab('users')}>
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-blue-500/20 shadow-xs"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{currentUser.name}</h2>
            <p className="text-[11px] text-slate-500">
              {language === 'bn' ? `${currentUser.roleTitle} • ${t('your_profile')}` : `${currentUser.role === 'admin' ? 'Admin & CEO' : currentUser.roleTitle} • ${t('your_profile')}`}
            </p>
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* Live Search dropdown */}
        {showSearchResults && filteredMembers.length > 0 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 border-b border-slate-100">
              {t('search_results')} ({filteredMembers.length})
            </div>
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedMemberId(m.id);
                  setActiveTab('member_profile');
                  setShowSearchResults(false);
                  setSearchQuery('');
                }}
                className="px-3 py-2 hover:bg-blue-50 flex items-center justify-between cursor-pointer border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <img src={m.photoUrl} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.memberNo} • {m.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {m.status === 'active' ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Quick Add, Language toggle & User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Authentication Status & Profile */}
        {firebaseUser && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold shadow-2xs">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <button
              onClick={onOpenAuthModal}
              title={t('profile_security')}
              className="max-w-[110px] sm:max-w-[150px] truncate hover:underline text-left cursor-pointer"
            >
              {firebaseUser.displayName || firebaseUser.email?.split('@')[0]}
            </button>
            <button
              onClick={logOut}
              title={t('logout')}
              className="p-1 hover:bg-rose-100 hover:text-rose-700 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Admin Approvals Notification Bell */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('dashboard');
            setTimeout(() => {
              const el = document.getElementById('approval-notification-center');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
          }}
          className={`relative p-2 rounded-xl transition-all cursor-pointer ${
            pendingApprovalsCount > 0
              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title={
            language === 'bn'
              ? pendingApprovalsCount > 0
                ? `${toBengaliNumber(pendingApprovalsCount)}টি প্রশাসনিক অনুমোদন অপেক্ষমাণ`
                : 'কোনো অনুমোদন অপেক্ষমাণ নেই'
              : `${pendingApprovalsCount} pending approvals`
          }
        >
          <Bell className="w-5 h-5" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
              {language === 'bn' ? toBengaliNumber(pendingApprovalsCount) : pendingApprovalsCount}
            </span>
          )}
        </button>

        {/* Language Selector: Bangla | English */}
        <LanguageSwitcher variant="segmented" />

        {/* Quick Add Button & Dropdown */}
        <div ref={addMenuRef} className="relative">
          <button
            id="quick-action-btn"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_new')}</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-slate-700 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t('quick_actions')}
              </div>
              <button
                onClick={() => {
                  setActiveTab('new_member');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{t('new_member_admission')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('tx_deposit');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>{t('deposit_money_voucher')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('tx_withdraw');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>{t('withdraw_money_voucher')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('loans_kisti');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Coins className="w-4 h-4 text-teal-600" />
                <span>{t('collect_kisti_voucher')}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('loans_apply');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>{t('approve_new_loan')}</span>
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => {
                  setActiveTab('accounts');
                  setShowAddMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>{t('new_voucher_entry')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
