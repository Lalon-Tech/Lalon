import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useLanguage } from '../../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 text-white px-4 py-2 text-xs font-semibold shadow-xl backdrop-blur-xs border border-amber-400/30 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>
        {isBn 
          ? 'ইন্টারনেট সংযোগ বিচ্ছিন্ন — ক্যাশ ডাটা প্রদর্শিত হচ্ছে' 
          : 'Offline Mode — Showing cached data'}
      </span>
    </div>
  );
};
