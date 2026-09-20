import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  HandCoins, 
  ClipboardList, 
  Menu 
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';

interface BottomNavProps {
  onToggleSidebar: () => void;
  onOpenQuickDeposit: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  onToggleSidebar, 
  onOpenQuickDeposit 
}) => {
  const { activeTab, setActiveTab, loans } = useSomiti();
  const { language, t } = useLanguage();
  const isBn = language === 'bn';

  const pendingLoansCount = loans.filter(l => l.status === 'pending').length;

  const isDashboardActive = activeTab === 'dashboard';
  const isMembersActive = ['members', 'all_members', 'active_members', 'new_member', 'member_profile'].includes(activeTab);
  const isLoansActive = ['loans', 'loans_list', 'loans_apply', 'loans_pending', 'loans_kisti'].includes(activeTab);
  const isFieldSheetActive = activeTab === 'field_sheet' || activeTab === 'collection_sheet';

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-1.5 py-1 flex items-center justify-around transition-all select-none no-print"
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
        onClick={onOpenQuickDeposit}
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
        onClick={onToggleSidebar}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all cursor-pointer min-w-[56px] text-slate-500 hover:text-slate-800"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 tracking-tight">{isBn ? 'মেনু' : 'Menu'}</span>
      </button>
    </nav>
  );
};
