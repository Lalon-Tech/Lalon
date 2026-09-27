import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Apple, 
  CheckCircle2, 
  ExternalLink, 
  X, 
  Sparkles, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  WifiOff,
  Copy,
  Check
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLogoTransformStyle } from '../../utils/logoUtils';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { settings } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [installing, setInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  if (!isOpen) return null;

  const somitiName = settings.somitiName || (isBn ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bondhu Samabay Somiti Ltd.');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await install();
      if (success) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Direct Desktop Windows Shortcut Download (.url file)
  const handleDownloadDesktopShortcut = () => {
    const fileContent = `[InternetShortcut]\nURL=${appUrl}\nIconIndex=0\nIconFile=${appUrl}/favicon.ico\n`;
    const blob = new Blob([fileContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${somitiName.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_')}_App.url`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Somiti Branding */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title={isBn ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white p-1 ring-4 ring-emerald-400/40 shadow-xl shrink-0 overflow-hidden flex items-center justify-center">
              <img 
                src={settings.logoUrl || '/logo.svg'} 
                alt={somitiName}
                className="w-full h-full object-contain rounded-xl"
                style={getLogoTransformStyle(settings)}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{isBn ? 'অফিসিয়াল অ্যাপ' : 'Official App'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">
                {somitiName}
              </h2>
              <p className="text-xs text-blue-200/90 mt-0.5">
                {isBn ? 'মোবাইল ও কম্পিউটারের জন্য সরাসরি ডাউনলোড ও ইনস্টল' : 'Direct install & download for Mobile & PC'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Status / Direct Action Banner */}
          {isInstalled ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {isBn ? 'অ্যাপটি ইতিমধ্যে আপনার ডিভাইসে ইনস্টল করা আছে!' : 'App is already installed on your device!'}
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {isBn ? 'আপনি আপনার ডিভাইসের হোমস্ক্রিন বা অ্যাপ তালিকা থেকে এটি সরাসরি খুলতে পারেন।' : 'You can launch it directly from your device home screen.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>{isBn ? 'এক ক্লিকে সরাসরি ইনস্টল করুন' : 'Instant One-Click Install'}</span>
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1 max-w-sm">
                    {isInstallable 
                      ? (isBn ? 'আপনার ব্রাউজার প্রস্তুত! নিচের বাটনে চাপ দিয়ে সরাসরি আপনার হোমস্ক্রিনে অ্যাপ ডাউনলোড করুন।' : 'Your browser is ready! Click the button to add to your device.')
                      : (isBn ? 'প্লে স্টোর ছাড়াও সরাসরি আপনার মোবাইল বা পিসিতে অ্যাপের মতো চলবে।' : 'Runs like a native app on mobile or desktop without Play Store.')
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="px-5 py-3 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-75"
                >
                  <Download className={`w-4.5 h-4.5 text-emerald-700 ${installing ? 'animate-bounce' : ''}`} />
                  <span>
                    {installing 
                      ? (isBn ? 'ইনস্টল হচ্ছে...' : 'Installing...') 
                      : (isBn ? 'এখনই ডাউনলোড করুন' : 'Download Now')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Feature Perks */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'অতি দ্রুত' : 'Super Fast'}</div>
              <div className="text-[10px] text-slate-500">{isBn ? '১ সেকেন্ডে লোড' : 'Instant Load'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <WifiOff className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'অফলাইন ক্যাশ' : 'Offline Cache'}</div>
              <div className="text-[10px] text-slate-500">{isBn ? 'দুর্বল নেটেও সচল' : 'Network Resilient'}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{isBn ? 'নিরাপদ ক্লাউড' : 'Cloud Secure'}</div>
              <div className="text-[10px] text-slate-500">{isBn ? '১০০% অটো ব্যাকআপ' : 'Auto Backup'}</div>
            </div>
          </div>

          {/* Device Tabs & Step-by-Step Direct Download Guide */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {isBn ? 'ডিভাইস অনুযায়ী সরাসরি ডাউনলোড নিয়ম' : 'Device Installation Instructions'}
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'desktop'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Laptop</span>
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ১
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">ক্রোম ব্রাউজারে ৩টি ডট চাপুন: </span>
                    স্ক্রিনের উপরের ডানপাশের তিন ডট মেনু (<span className="font-mono font-bold">⋮</span>) বাটনে চাপ দিন।
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ২
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">ইনস্টল অপশন নির্বাচন করুন: </span>
                    মেনু থেকে <span className="font-bold text-emerald-600 dark:text-emerald-400">"Install app"</span> অথবা <span className="font-bold text-emerald-600 dark:text-emerald-400">"Add to Home screen"</span> অপশনে ট্যাপ করুন।
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ৩
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">সরাসরি অ্যাপ চালু করুন: </span>
                    কয়েক সেকেন্ডের মধ্যে আপনার ফোনের হোমস্ক্রিনে সমিতির লোগোসহ অ্যাপ আইকন চলে আসবে!
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ১
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Safari ব্রাউজার দিয়ে খুলুন: </span>
                    আইফোনে Safari ব্রাউজার ব্যবহার করুন।
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ২
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Share বাটনে ট্যাপ করুন: </span>
                    সাফারির নিচের মেনুবারে থাকা <span className="font-bold text-blue-600 dark:text-blue-400">Share [⎋]</span> আইকনটিতে চাপ দিন।
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    ৩
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Add to Home Screen: </span>
                    নিচে স্ক্রোল করে <span className="font-bold text-blue-600 dark:text-blue-400">"Add to Home Screen" (➕)</span> সিলেক্ট করে উপরে 'Add' দিন। অ্যাপ তৈরি হয়ে যাবে।
                  </div>
                </div>
              </div>
            )}

            {/* Desktop / PC Instructions */}
            {activeTab === 'desktop' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                      {isBn ? 'ডেস্কটপ শর্টকাট ফাইল (.url)' : 'Windows Desktop Shortcut (.url)'}
                    </div>
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      {isBn ? 'সরাসরি কম্পিউটারের ডেস্কটপে শর্টকাট ফাইল সেভ করুন' : 'Direct 1-click shortcut for Windows'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadDesktopShortcut}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ডাউনলোড' : 'Download'}</span>
                  </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Chrome বা Edge ব্রাউজারে: </span>
                  অ্যাড্রেস বারের ডানপাশে থাকা <span className="font-bold text-indigo-600 dark:text-indigo-400">ইনস্টল আইকন (⊕)</span> এ ক্লিক করলেই উইন্ডোজ কম্পিউটারে সরাসরি অ্যাপ্লিকেশন হিসেবে সেভ হয়ে যাবে।
                </div>
              </div>
            )}
          </div>

          {/* Copy Shareable Link */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-slate-500">
                {isBn ? 'মোবাইলে ডাউনলোড করতে লিংক কপি করুন' : 'Share / Mobile link'}
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate">
                {appUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isBn ? 'কপি হয়েছে' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কপি লিংক' : 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PWA v2.0 • Offline Ready</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isBn ? 'ঠিক আছে' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
