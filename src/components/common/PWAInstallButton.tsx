import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Share2, PlusSquare, ExternalLink, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'modal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone PWA mode, hide the install UI
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  // Header button format (compact & stylish)
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${className}`}
          title={isBn ? 'মোবাইলে অ্যাপ হিসেবে ইনস্টল করুন' : 'Install App on Mobile'}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {isBn ? 'অ্যাপ ইনস্টল করুন' : 'Install App'}
          </span>
          <span className="md:hidden">
            {isBn ? 'ইনস্টল' : 'Install'}
          </span>
        </button>

        {showGuideModal && (
          <InstallGuideModal 
            onClose={() => setShowGuideModal(false)} 
            isIOS={isIOS} 
            isBn={isBn} 
          />
        )}
      </>
    );
  }

  // Sidebar format (full-width navigation item style)
  if (variant === 'sidebar') {
    return (
      <>
        <div className={`p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl space-y-2.5 ${className}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                {isBn ? 'মোবাইলে অ্যাপ ইনস্টল' : 'Install Mobile App'}
              </h4>
              <p className="text-[10px] text-slate-500 truncate">
                {isBn ? 'হোম স্ক্রিন থেকে সহজে চালান' : 'Run fullscreen without browser bar'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBn ? 'ইনস্টল করুন (APK/PWA)' : 'Install Now'}</span>
          </button>
        </div>

        {showGuideModal && (
          <InstallGuideModal 
            onClose={() => setShowGuideModal(false)} 
            isIOS={isIOS} 
            isBn={isBn} 
          />
        )}
      </>
    );
  }

  // Banner format
  return (
    <>
      <div className={`bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-emerald-700/50 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold mb-1">
              <Sparkles className="w-3 h-3" />
              <span>{isBn ? 'অ্যান্ড্রয়েড ও আইফোন' : 'Android & iOS'}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {isBn ? 'বন্ধু সমিতি অ্যাপ মোবাইলে ইনস্টল করুন' : 'Install Bondhu Somiti on Mobile'}
            </h3>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              {isBn 
                ? 'ব্রাউজার বার ছাড়া ফুলস্ক্রিন অ্যাপ এবং দ্রুতগতির কার্যক্ষমতা উপভোগ করুন' 
                : 'Enjoy a native fullscreen experience directly from your home screen'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isBn ? 'অ্যাপ ইনস্টল করুন' : 'Install Mobile App'}</span>
        </button>
      </div>

      {showGuideModal && (
        <InstallGuideModal 
          onClose={() => setShowGuideModal(false)} 
          isIOS={isIOS} 
          isBn={isBn} 
        />
      )}
    </>
  );
};

// Modal giving step-by-step guidance for Android, iOS Safari & APK builder
interface InstallGuideModalProps {
  onClose: () => void;
  isIOS: boolean;
  isBn: boolean;
}

const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ onClose, isIOS, isBn }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isBn ? 'মোবাইলে অ্যাপ ইনস্টল করার নিয়ম' : 'How to Install on Mobile'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn ? 'মাত্র ২ ধাপে সরাসরি আপনার ফোনে ইনস্টল করুন' : 'Install directly in 2 simple steps'}
            </p>
          </div>
        </div>

        {/* Content based on Device */}
        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>{isBn ? 'আইফোন / আইপ্যাড (Safari)' : 'iPhone / iPad (Safari)'}</span>
            </h4>
            <ol className="space-y-2 list-decimal list-inside text-slate-600">
              <li>
                {isBn 
                  ? 'সাফারি ব্রাউজারের নিচের শেয়ার (Share) বাটনে ট্যাপ করুন।' 
                  : 'Tap the Share button at the bottom of Safari.'}
              </li>
              <li>
                {isBn 
                  ? 'একটু নিচে স্ক্রল করে "Add to Home Screen" (হোম স্ক্রিনে যোগ করুন) চাপুন।' 
                  : 'Scroll down and tap "Add to Home Screen".'}
              </li>
              <li>
                {isBn 
                  ? 'উপরে "Add" চাপুন। অ্যাপটি আপনার ফোনে ইনস্টল হয়ে যাবে।' 
                  : 'Tap "Add" in the top corner. The app will be installed on your phone.'}
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-700 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <span>{isBn ? 'অ্যান্ড্রয়েড ফোন (Chrome ব্রাউজার)' : 'Android (Chrome Browser)'}</span>
            </h4>
            <ol className="space-y-2.5 list-decimal list-inside text-emerald-900">
              <li>
                {isBn 
                  ? 'ক্রোম ব্রাউজারের উপরে ডানদিকের থ্রি-ডট (⋮) মেনুতে চাপুন।' 
                  : 'Tap the three dots (⋮) menu in Google Chrome.'}
              </li>
              <li>
                {isBn 
                  ? '"Install App" বা "Add to Home Screen" অপশনে ক্লিক করুন।' 
                  : 'Select "Install App" or "Add to Home screen".'}
              </li>
              <li>
                {isBn 
                  ? 'কনফার্ম করলেই এটি সাধারণ অ্যান্ড্রয়েড অ্যাপের মতো লোগোসহ ইনস্টল হয়ে যাবে।' 
                  : 'Confirm installation. The app will appear on your home screen with its custom icon.'}
              </li>
            </ol>
          </div>
        )}

        {/* APK Note */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1 text-[11px] text-amber-950">
            <CheckCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>{isBn ? 'সরাসরি .APK ফাইল চান?' : 'Want a standalone .APK file?'}</span>
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {isBn 
              ? 'এই অ্যাপের লিঙ্কটি PWABuilder.com-এ পেস্ট করে আপনি সরাসরি Google Play Store বা অ্যান্ড্রয়েড ডিভাইসের জন্য সাইন করা .APK ফাইল ডাউনলোড করতে পারবেন।' 
              : 'You can paste this app URL on PWABuilder.com to download a signed .apk package for direct sideloading or Play Store release.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          {isBn ? 'ঠিক আছে, বুঝতে পেরেছি' : 'Got it'}
        </button>
      </div>
    </div>
  );
};
