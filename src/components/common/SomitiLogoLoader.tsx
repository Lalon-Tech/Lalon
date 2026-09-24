import React from 'react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';

export interface SomitiLogoLoaderProps {
  /**
   * 'full': Full-screen standalone loading view (e.g. initial app loading, login gate)
   * 'overlay': Semi-transparent overlay over current screen with backdrop-blur
   * 'pull-to-refresh': Compact header indicator for mobile pull-to-refresh
   * 'inline': Compact inline loader inside a card or view
   */
  variant?: 'full' | 'overlay' | 'pull-to-refresh' | 'inline';
  message?: string;
  subMessage?: string;
  className?: string;
  isRefreshing?: boolean;
  pullProgress?: number; // 0 to 1 for pull-to-refresh drag indicator
}

export const SomitiLogoLoader: React.FC<SomitiLogoLoaderProps> = ({
  variant = 'full',
  message,
  subMessage,
  className = '',
  isRefreshing = true,
  pullProgress = 1,
}) => {
  const { settings } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Use the existing Bondhu Somiti logo exactly as it is
  const logoSrc =
    settings?.logoUrl && settings.logoUrl !== '/logo.svg' && settings.logoUrl !== '/logo-horizontal.svg'
      ? settings.logoUrl
      : '/icon.svg';

  const somitiTitle = settings?.somitiName || (isBn ? 'বন্ধু সমবায় সমিতি' : 'Bondhu Somiti');
  const defaultMsg = message || (isBn ? 'তথ্য লোড হচ্ছে...' : 'Loading...');

  // 1. Pull-to-Refresh Compact Indicator (Mobile & Tablet Home/Dashboard)
  if (variant === 'pull-to-refresh') {
    const scale = Math.min(1, Math.max(0.6, pullProgress));
    const opacity = Math.min(1, Math.max(0.2, pullProgress));

    return (
      <div 
        className={`flex items-center justify-center transition-all duration-200 pointer-events-none select-none ${className}`}
        style={{ transform: `scale(${scale})`, opacity }}
      >
        <div className="relative flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 dark:bg-slate-900/95 shadow-lg border border-emerald-500/30 backdrop-blur-md">
          {/* Glowing halo behind logo */}
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 blur-xs animate-somiti-halo" />

          {/* Existing Bondhu Somiti Logo */}
          <div className="relative w-7 h-7 rounded-full bg-white p-0.5 ring-2 ring-emerald-500/60 shadow-xs flex items-center justify-center overflow-hidden shrink-0 animate-somiti-glow">
            <img
              src={logoSrc}
              alt={somitiTitle}
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative text-left pr-1">
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {isRefreshing ? (isBn ? 'রিফ্রেশ হচ্ছে...' : 'Refreshing...') : (isBn ? 'ছেড়ে দিন' : 'Release to refresh')}
            </p>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide">
              {somitiTitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Inline Card Loader
  if (variant === 'inline') {
    return (
      <div className={`flex flex-col items-center justify-center py-8 px-4 ${className}`}>
        <div className="relative flex items-center justify-center mb-3">
          <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-md animate-somiti-halo" />
          <div className="relative w-12 h-12 rounded-full bg-white p-1 ring-2 ring-emerald-500/50 shadow-md flex items-center justify-center overflow-hidden animate-somiti-glow">
            <img
              src={logoSrc}
              alt={somitiTitle}
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{defaultMsg}</p>
        {subMessage && <p className="text-[10px] text-slate-400 mt-0.5">{subMessage}</p>}
      </div>
    );
  }

  // 3. Overlay or Full Screen Loader
  const isOverlay = variant === 'overlay';

  return (
    <div
      className={`flex flex-col items-center justify-center select-none transition-all duration-300 ${
        isOverlay
          ? 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs'
          : 'min-h-screen w-full bg-gradient-to-b from-[#070d1e] via-[#0c152e] to-[#070d1e] text-white'
      } ${className}`}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Animated Brand Logo Container */}
        <div className="relative flex items-center justify-center mb-5">
          {/* Soft outer aura / glow effect */}
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-emerald-500/25 via-cyan-500/20 to-blue-600/25 blur-xl animate-somiti-halo" />

          {/* Outer elegant ring */}
          <div className="relative p-1.5 rounded-full bg-gradient-to-b from-white/20 to-white/5 border border-white/25 shadow-2xl backdrop-blur-md">
            {/* Round Badge with existing logo */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white p-1 ring-4 ring-emerald-400/50 shadow-xl flex items-center justify-center overflow-hidden animate-somiti-glow">
              <img
                src={logoSrc}
                alt={somitiTitle}
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Somiti Title & Motto */}
        <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide mb-1 drop-shadow-xs">
          {somitiTitle}
        </h2>
        <p className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 tracking-widest uppercase mb-4">
          UNITY • GROWTH • TRUST
        </p>

        {/* Loading status message & subtle pulsing bar */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <span>{defaultMsg}</span>
            <span className="inline-flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:200ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:400ms]" />
            </span>
          </div>

          {subMessage && (
            <p className="text-[11px] text-slate-400 max-w-xs">{subMessage}</p>
          )}

          {/* Elegant soft progress shimmer bar */}
          <div className="w-36 h-1 bg-slate-800/80 rounded-full overflow-hidden mt-1 border border-white/10">
            <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full animate-[somiti-shimmer_1.6s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
};
