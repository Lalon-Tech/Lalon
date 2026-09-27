import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Apple, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  WifiOff, 
  Copy, 
  Check,
  ArrowRight,
  HelpCircle,
  QrCode,
  Layers,
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLogoTransformStyle } from '../../utils/logoUtils';

export const AppDownloadView: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { settings } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [installing, setInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');

  const somitiName = settings.somitiName || (isBn ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bondhu Samabay Somiti Ltd.');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white overflow-hidden shadow-2xl p-6 sm:p-10 border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 justify-between">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-1.5 ring-4 ring-emerald-400/40 shadow-2xl shrink-0 overflow-hidden flex items-center justify-center">
              <img 
                src={settings.logoUrl || '/logo.svg'} 
                alt={somitiName}
                className="w-full h-full object-contain rounded-2xl"
                style={getLogoTransformStyle(settings)}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isBn ? 'অফিসিয়াল সমবায় অ্যাপ' : 'Official Somiti App'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {somitiName}
              </h1>
              <p className="text-sm text-blue-200/90 max-w-xl">
                {isBn 
                  ? 'প্লে স্টোরের ঝামেলা ছাড়াই সরাসরি আপনার মোবাইল বা কম্পিউটারে অ্যাপ ডাউনলোড ও ইনস্টল করুন।'
                  : 'Download and install the official app directly to your mobile or PC.'
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
            {isInstalled ? (
              <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{isBn ? 'ইতিমধ্যে ইনস্টল করা আছে' : 'Already Installed'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={installing}
                className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-base shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
              >
                <Download className={`w-5 h-5 ${installing ? 'animate-bounce' : ''}`} />
                <span>
                  {installing 
                    ? (isBn ? 'ইনস্টল হচ্ছে...' : 'Installing...') 
                    : (isBn ? 'সরাসরি অ্যাপ ইনস্টল করুন' : 'Direct Install App')}
                </span>
              </button>
            )}

            <div className="text-[11px] text-blue-200/70 text-center">
              {isBn ? 'Android • iPhone/iPad • Windows PC • Mac' : 'Compatible with all devices'}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? 'সুপার ফাস্ট পারফরম্যান্স' : 'Super Fast Performance'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isBn ? 'কোনো লোডিং ঝামেলা ছাড়াই পলকে সব পেজ ওপেন হয়।' : 'Instant screen transitions with zero lag.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
            <WifiOff className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? 'অফলাইন ও ক্যাশ ব্যাকআপ' : 'Offline & Cache Backup'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isBn ? 'নেটওয়ার্ক ড্রপ করলেও মেম্বার তালিকা ও রিপোর্ট দেখা যায়।' : 'Cached data accessible even during network drops.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? '১০০% নিরাপদ ও ক্লাউড সিঙ্ক' : '100% Cloud Synced'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isBn ? 'Firebase ক্লাউডের সাথে স্বয়ংক্রিয়ভাবে লেনদেন সেভ থাকে।' : 'Direct synchronization with live secure database.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? 'ফুলস্ক্রিন অ্যাপ লুক' : 'Native App Experience'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isBn ? 'ব্রাউজার বার ছাড়া আসল মোবাইল অ্যাপ্লিকেশনের মতো চলবে।' : 'Runs without browser URL bars in standalone view.'}
          </p>
        </div>
      </div>

      {/* Step by Step Guide for Android / iOS / Desktop */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {isBn ? 'কিভাবে সরাসরি ফোনে বা কম্পিউটারে ডাউনলোড করবেন?' : 'How to install directly on your device?'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {isBn ? 'আপনার ডিভাইসের ধরণ অনুযায়ী সহজ ধাপগুলো অনুসরণ করুন:' : 'Select your device type to view detailed instructions:'}
        </p>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5 mb-6 max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android Phone</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iPhone / iPad</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>PC / Windows</span>
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'android' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                  ১
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isBn ? '৩-ডট মেনু ওপেন করুন' : 'Open 3-Dot Menu'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isBn ? 'Chrome ব্রাউজারের উপরে ডানপাশের তিন ডট (⋮) বাটনে চাপ দিন।' : 'Tap the three-dots (⋮) icon in the top right of Chrome.'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                  ২
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isBn ? '"Install app" চাপুন' : 'Select "Install app"'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isBn ? 'তালিকা থেকে "Install app" বা "Add to Home screen" নির্বাচন করুন।' : 'Choose "Install app" or "Add to Home screen" from the menu.'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                  ৩
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isBn ? 'হোমস্ক্রিনে সরাসরি চালু করুন' : 'Launch Directly'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isBn ? 'আপনার ফোনে সমিতির লোগোসহ সরাসরি অ্যাপ তৈরি হয়ে যাবে।' : 'App icon is created on your home screen ready for use.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ios' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                  ১
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isBn ? 'Safari ব্রাউজার' : 'Use Safari'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isBn ? 'আইফোনে Safari ব্রাউজার ব্যবহার করুন।' : 'Open the site in Safari on your iPhone or iPad.'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                  ২
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isBn ? 'Share আইকন চাপুন' : 'Tap Share Icon'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isBn ? 'ব্রাউজারের নিচের সারিতে থাকা Share [⎋] বাটনে চাপ দিন।' : 'Tap the Share icon [⎋] on the bottom toolbar.'}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center mb-3">
                  ৩
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  {isBn ? 'Add to Home Screen' : 'Add to Home Screen'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isBn ? '"Add to Home Screen" (➕) চাপুন এবং উপরে Add দিন।' : 'Scroll down, tap "Add to Home Screen" and tap Add.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'desktop' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base text-indigo-950 dark:text-indigo-200">
                  {isBn ? 'উইন্ডোজ ডেস্কটপ শর্টকাট ডাউনলোড করুন' : 'Download Windows Desktop Shortcut'}
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1 max-w-lg">
                  {isBn ? 'এই ফাইলটি ডাউনলোড করে আপনার কম্পিউটারের ডেস্কটপে রাখলে ডাবল ক্লিকেই সমিতি সফটওয়্যার চালু হয়ে যাবে।' : 'Save this shortcut file directly to your desktop for 1-click launch.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadDesktopShortcut}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isBn ? 'শর্টকাট ফাইল ডাউনলোড' : 'Download Shortcut'}</span>
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              💡 <span className="font-bold text-slate-800 dark:text-slate-200">Chrome/Edge টিপস: </span>
              ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা ইনস্টল আইকনে (⊕) ক্লিক করলে ব্রাউজার ফ্রেম ছাড়া স্বাধীন অ্যাপ হিসেবে পিসিতে ইনস্টল হয়ে যাবে।
            </div>
          </div>
        )}
      </div>

      {/* Share / Mobile Link Box */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? 'অন্যান্য ডিভাইসে লিংক পাঠান' : 'Share Link for Other Devices'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn ? 'যে কোনো মোবাইল বা কম্পিউটার ব্রাউজারে এই লিংক পেস্ট করে ডাউনলোড করুন:' : 'Copy this link and open in any mobile or desktop browser:'}
          </p>
          <div className="mt-2 font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-lg inline-block break-all">
            {appUrl}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>{isBn ? 'কপি সফল হয়েছে' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{isBn ? 'লিংক কপি করুন' : 'Copy Link'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
