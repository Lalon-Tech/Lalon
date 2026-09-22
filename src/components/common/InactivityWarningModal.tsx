import React, { useEffect } from 'react';
import { Clock, ShieldAlert, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toBengaliNumber } from '../../utils/bengaliUtils';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

interface InactivityWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  totalSeconds?: number;
  onStayLoggedIn: () => void;
  onLogOut: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  totalSeconds = 60,
  onStayLoggedIn,
  onLogOut,
}) => {
  useModalScrollLock(isOpen);
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Keyboard accessibility: Enter to stay signed in, Escape to log out
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onStayLoggedIn();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onLogOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStayLoggedIn, onLogOut]);

  if (!isOpen) return null;

  // Clamped remaining seconds & ratio
  const clampedSeconds = Math.max(0, Math.min(totalSeconds, secondsRemaining));
  const progressRatio = totalSeconds > 0 ? clampedSeconds / totalSeconds : 0;
  const progressPercent = Math.round(progressRatio * 100);

  // SVG Circular progress dimensions
  const radius = 52;
  const strokeWidth = 8;
  const center = 65;
  const circumference = 2 * Math.PI * radius;
  // Progress decreases as time runs out
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Severity tiers
  const isCritical = clampedSeconds <= 15;
  const isUrgent = clampedSeconds <= 30 && clampedSeconds > 15;

  // Color schemes based on urgency
  const themeColors = isCritical
    ? {
        stroke: '#f43f5e', // rose-500
        text: 'text-rose-600',
        bgLight: 'bg-rose-50',
        border: 'border-rose-200',
        ring: 'ring-rose-100',
        barGradient: 'from-rose-500 to-red-600',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
        buttonPrimary: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-400 text-white shadow-rose-600/30',
      }
    : isUrgent
    ? {
        stroke: '#f97316', // orange-500
        text: 'text-orange-600',
        bgLight: 'bg-orange-50',
        border: 'border-orange-200',
        ring: 'ring-orange-100',
        barGradient: 'from-amber-500 to-orange-500',
        badgeBg: 'bg-orange-100 text-orange-800 border-orange-300',
        buttonPrimary: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-400 text-white shadow-orange-600/30',
      }
    : {
        stroke: '#f59e0b', // amber-500
        text: 'text-amber-600',
        bgLight: 'bg-amber-50',
        border: 'border-amber-200',
        ring: 'ring-amber-100',
        barGradient: 'from-amber-400 to-amber-500',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-400 text-white shadow-indigo-600/30',
      };

  // Formatted countdown MM:SS
  const mins = Math.floor(clampedSeconds / 60);
  const secs = clampedSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const displayFormattedTime = isBn ? toBengaliNumber(formattedTime) : formattedTime;
  const displaySeconds = isBn ? toBengaliNumber(clampedSeconds) : clampedSeconds;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-4 sm:p-6 flex min-h-full items-center justify-center animate-fadeIn"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-warning-title"
      aria-describedby="inactivity-warning-desc"
    >
      <div className={`relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border ${themeColors.border} text-center space-y-5 my-auto animate-in fade-in zoom-in-95 transition-all duration-300`}>
        
        {/* Top Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${themeColors.bgLight} ${themeColors.text}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
              {isBn ? 'নিরাপত্তা প্রটোকল' : 'Security Protocol'}
            </span>
          </div>
          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${themeColors.badgeBg} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : 'bg-amber-500'}`} />
            {isCritical 
              ? (isBn ? 'জরুরি সতর্কতা' : 'Critical Alert')
              : (isBn ? 'অটো-লগআউট সতর্কতা' : 'Auto-Logout Warning')}
          </span>
        </div>

        {/* Circular Countdown Timer */}
        <div className="relative flex items-center justify-center pt-1">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg 
              className="w-full h-full transform -rotate-90 drop-shadow-xs" 
              viewBox="0 0 130 130"
            >
              {/* Background circle track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                className="stroke-slate-100"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Secondary faint track */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                className={`${isCritical ? 'stroke-rose-100' : 'stroke-amber-100'}`}
                strokeWidth={strokeWidth}
                strokeDasharray="4 4"
                fill="transparent"
              />
              {/* Animated Foreground Circular Progress Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={themeColors.stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease-in-out',
                }}
              />
            </svg>

            {/* Center Content: Seconds Remaining */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
              <div className="flex items-center gap-1 text-slate-400 mb-0.5">
                <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-500 animate-spin' : themeColors.text}`} style={{ animationDuration: isCritical ? '3s' : '8s' }} />
              </div>
              <span className={`text-4xl font-black tracking-tight ${themeColors.text} ${isCritical ? 'animate-pulse scale-105' : ''} transition-transform`}>
                {displaySeconds}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                {isBn ? 'সেকেন্ড বাকি' : 'seconds left'}
              </span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 px-2">
          <h4 id="inactivity-warning-title" className="text-lg font-bold text-slate-900 leading-snug">
            {isBn ? 'আপনি কি এখনো আছেন?' : 'Are you still there?'}
          </h4>
          <p id="inactivity-warning-desc" className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            {isBn 
              ? `দীর্ঘক্ষণ কোনো কার্যকলাপ না থাকায় আপনার অ্যাকাউন্ট সুরক্ষার জন্য আর মাত্র `
              : `Due to inactivity, for the security of your cooperative account, you will be logged out in `}
            <strong className={`font-bold ${themeColors.text}`}>
              {displaySeconds} {isBn ? 'সেকেন্ড' : 'seconds'}
            </strong>
            {isBn ? ` পর সেশন স্বয়ংক্রিয়ভাবে সমাপ্ত হবে।` : `.`}
          </p>
        </div>

        {/* Visual Horizontal Progress Bar */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 space-y-1.5 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
              {isBn ? 'সময় গণনা' : 'Time Remaining'}
            </span>
            <span className={`font-mono font-bold ${themeColors.text}`}>
              {displayFormattedTime} ({displaySeconds}s)
            </span>
          </div>

          {/* Progress bar track */}
          <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${themeColors.barGradient} transition-all duration-1000 ease-linear shadow-xs`}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={clampedSeconds}
              aria-valuemin={0}
              aria-valuemax={totalSeconds}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5 pt-0.5">
            <span>{isBn ? '০ সেকেন্ড' : '0s'}</span>
            <span>{isBn ? '৩০ সেকেন্ড' : '30s'}</span>
            <span>{isBn ? `${toBengaliNumber(totalSeconds)} সেকেন্ড` : `${totalSeconds}s`}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onLogOut}
            className="w-full sm:w-auto sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200/80 hover:border-slate-300"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>{isBn ? 'এখনই লগআউট' : 'Log Out Now'}</span>
          </button>

          <button
            type="button"
            autoFocus
            onClick={onStayLoggedIn}
            className={`w-full sm:w-auto sm:flex-1 py-3 px-4 ${themeColors.buttonPrimary} text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-hidden focus:ring-2`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isBn ? 'সেশন চালু রাখুন' : 'Stay Signed In'}</span>
            <span className="hidden sm:inline-block text-[10px] opacity-80 font-normal">↵</span>
          </button>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-[10px] text-slate-400 select-none">
          {isBn 
            ? 'কীবোর্ডের Enter চাপলে সেশন সচল থাকবে, অথবা Escape চাপলে লগআউট হবে' 
            : 'Press Enter to stay signed in, or Escape to log out'}
        </p>
      </div>
    </div>
  );
};
