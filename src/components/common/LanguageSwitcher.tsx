import React from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSomiti } from '../../context/SomitiContext';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'segmented' | 'dropdown' | 'compact';
  darkTheme?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'segmented', 
  darkTheme = false 
}) => {
  const { language, setLanguage } = useLanguage();
  const { setUseBengaliDigits } = useSomiti();

  const handleSelectLanguage = (lang: 'bn' | 'en') => {
    setLanguage(lang);
    setUseBengaliDigits(lang === 'bn');
  };

  if (variant === 'compact') {
    return (
      <button
        id="language-compact-toggle-btn"
        onClick={() => handleSelectLanguage(language === 'bn' ? 'en' : 'bn')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
          darkTheme 
            ? 'bg-[#131d36] border border-slate-700/80 text-cyan-300 hover:bg-[#1c2a4d]' 
            : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
        }`}
        title="ভাষা পরিবর্তন / Switch Language"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>{language === 'bn' ? 'বাংলা' : 'English'}</span>
      </button>
    );
  }

  // Segmented Pill [ বাংলা | English ]
  return (
    <div 
      className={`inline-flex items-center p-1 rounded-xl border transition-all ${
        darkTheme
          ? 'bg-[#101932] border-slate-700/80 shadow-inner'
          : 'bg-slate-100/90 border-slate-300/80 shadow-xs'
      }`}
    >
      <button
        type="button"
        id="lang-btn-bn"
        onClick={() => handleSelectLanguage('bn')}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'bn'
            ? darkTheme
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-emerald-600 text-white shadow-sm font-extrabold'
            : darkTheme
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <span>বাংলা</span>
      </button>

      <button
        type="button"
        id="lang-btn-en"
        onClick={() => handleSelectLanguage('en')}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          language === 'en'
            ? darkTheme
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold'
              : 'bg-emerald-600 text-white shadow-sm font-extrabold'
            : darkTheme
              ? 'text-slate-400 hover:text-slate-200'
              : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <span>English</span>
      </button>
    </div>
  );
};
