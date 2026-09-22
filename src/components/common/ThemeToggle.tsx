import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'dropdown-item';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'icon', 
  className = '' 
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } = useTheme();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  if (variant === 'segmented') {
    return (
      <div 
        className={`inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 ${className}`}
        role="group"
        aria-label={isBn ? 'থিম নির্বাচন করুন' : 'Select Theme'}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'light'
              ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title={isBn ? 'লাইট মোড' : 'Light Mode'}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>{isBn ? 'লাইট' : 'Light'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'dark'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title={isBn ? 'ডার্ক মোড' : 'Dark Mode'}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>{isBn ? 'ডার্ক' : 'Dark'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            theme === 'system'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title={isBn ? 'সিস্টেম অটো' : 'System Default'}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>{isBn ? 'অটো' : 'Auto'}</span>
        </button>
      </div>
    );
  }

  if (variant === 'dropdown-item') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2">
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
          <span>{isBn ? (isDark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন') : (isDark ? 'Switch to Light' : 'Switch to Dark')}</span>
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-400">
          {resolvedTheme}
        </span>
      </button>
    );
  }

  // Default 'icon' button for Header / Top Bar
  return (
    <button
      type="button"
      id="global-theme-toggle-btn"
      onClick={toggleTheme}
      className={`relative p-2 sm:p-2 rounded-xl transition-all cursor-pointer shrink-0 border border-slate-200/90 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 shadow-2xs group active:scale-95 ${className}`}
      title={
        isBn
          ? isDark
            ? 'লাইট মোড নির্বাচন করুন (চোখের আরাম)'
            : 'ডার্ক মোড নির্বাচন করুন (চোখের আরাম)'
          : isDark
            ? 'Switch to Light Mode'
            : 'Switch to Dark Mode'
      }
      aria-label={
        isBn
          ? isDark
            ? 'লাইট মোড চালু করুন'
            : 'ডার্ক মোড চালু করুন'
          : 'Toggle color theme'
      }
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4.5 h-4.5 text-amber-400 rotate-0 transition-transform duration-300 ease-out group-hover:rotate-45" />
        ) : (
          <Moon className="w-4.5 h-4.5 text-slate-600 dark:text-slate-300 transition-transform duration-300 ease-out group-hover:-rotate-12" />
        )}
      </div>
    </button>
  );
};
