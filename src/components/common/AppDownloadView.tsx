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
  AlertCircle,
  FileCode2
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { getLogoTransformStyle } from '../../utils/logoUtils';

export const AppDownloadView: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { settings } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [downloadingApk, setDownloadingApk] = useState(false);
  const [installingPwa, setInstallingPwa] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'ios' | 'desktop'>('apk');

  const somitiName = settings.somitiName || (isBn ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bondhu Samabay Somiti Ltd.');
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const apkDownloadUrl = settings.apkDownloadUrl || '/downloads/Bondhu_Somiti.apk';
  const apkVersion = settings.apkVersion || 'v2.5.0';

  const handleDownloadApk = () => {
    setDownloadingApk(true);
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.download = 'Bondhu_Somiti.apk';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingApk(false);
    }, 1500);
  };

  const handleInstallClick = async () => {
    setInstallingPwa(true);
    try {
      await install();
    } finally {
      setInstallingPwa(false);
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
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white overflow-hidden shadow-2xl p-6 sm:p-10 border border-emerald-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
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
                <span>{isBn ? 'অফিসিয়াল Android APK' : 'Official Android APK Package'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {somitiName}
              </h1>
              <p className="text-sm text-emerald-200/90 max-w-xl">
                {isBn 
                  ? 'সরাসরি আপনার মোবাইল বা কম্পিউটারে অফিশিয়াল APK ফাইল ডাউনলোড করে ইনস্টল করুন।'
                  : 'Download and install the official Android APK file directly to your smartphone.'
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadApk}
              disabled={downloadingApk}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-base shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
            >
              <Download className={`w-5 h-5 ${downloadingApk ? 'animate-bounce' : ''}`} />
              <span>
                {downloadingApk 
                  ? (isBn ? 'ডাউনলোড হচ্ছে...' : 'Downloading...') 
                  : (isBn ? 'সরাসরি APK ডাউনলোড করুন' : 'Direct APK Download')}
              </span>
            </button>

            <div className="text-[11px] text-emerald-300/80 text-center font-medium">
              ফাইল: Bondhu_Somiti.apk • ভার্সন: {apkVersion}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Step APK Install Guide Banner */}
      <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/80 shadow-xs">
        <h3 className="font-extrabold text-base text-amber-900 dark:text-amber-200 flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>{isBn ? 'মোবাইলে APK ফাইল ইনস্টল করার নিয়ম (৩টি সহজ ধাপ):' : 'How to install the APK file on your phone:'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center mb-2">
              ১
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              {isBn ? 'APK ফাইল ডাউনলোড' : 'Download File'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn 
                ? 'উপরের "সরাসরি APK ডাউনলোড" বাটনে চাপুন। ব্রাউজারে "Download anyway" বা "OK" অপশন আসলে চাপুন।' 
                : 'Click Download APK. If your browser asks "Download anyway", tap it.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center mb-2">
              ২
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              {isBn ? 'ফাইল ওপেন করুন' : 'Open Downloaded File'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn 
                ? 'ডাউনলোড শেষে আপনার ফোনের নোটিফিকেশন বার অথবা Downloads ফোল্ডার থেকে ফাইলটিতে চাপ দিন।' 
                : 'Tap the completed download from your notification bar or Downloads folder.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center mb-2">
              ৩
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
              {isBn ? 'ইনস্টল সম্পন্ন' : 'Install & Launch'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isBn 
                ? '"Install" বাটনে ট্যাপ করুন। যদি পারমিশন চায়, "Allow from this source" অন করে দিন। অ্যাপ চালু করুন!' 
                : 'Tap "Install" (Allow unknown apps if prompted). Your app is ready!'}
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
            <Smartphone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? 'সরাসরি Android APK' : 'Pure Android APK'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isBn ? 'প্লে স্টোরের কোনো ঝামেলা ছাড়াই সরাসরি ফোনে ইনস্টল করা যায়।' : 'No Play Store sign-in required.'}
          </p>
        </div>

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
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? '১০০% নিরাপদ ক্লাউড' : '100% Cloud Synced'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isBn ? 'Firebase ক্লাউডের সাথে স্বয়ংক্রিয়ভাবে লেনদেন সেভ থাকে।' : 'Direct synchronization with live secure database.'}
          </p>
        </div>
      </div>

      {/* Alternative Device Guides: iOS & PC */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {isBn ? 'অন্যান্য ডিভাইসে অ্যাপ চালানোর নিয়ম' : 'Other Devices & Platforms'}
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          {isBn ? 'আইফোন বা কম্পিউটারে ব্যবহার করার জন্য নিচের নিয়মগুলো অনুসরণ করুন:' : 'Select platform below:'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* iOS Card */}
          <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-300 font-bold text-sm">
              <Apple className="w-5 h-5" />
              <span>iPhone ও iPad (iOS)</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              অ্যাপল আইফোনে Safari ব্রাউজার দিয়ে সাইটটি খুলুন। নিচে থাকা <span className="font-bold text-blue-600">Share [⎋]</span> আইকন চাপুন এবং <span className="font-bold text-blue-600">"Add to Home Screen" (➕)</span> সিলেক্ট করুন।
            </p>
          </div>

          {/* Windows / PC Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-300 font-bold text-sm">
                <Monitor className="w-5 h-5" />
                <span>PC ও Windows কম্পিউটার</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadDesktopShortcut}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isBn ? 'শর্টকাট ফাইল' : 'Shortcut'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              উইন্ডোজ কম্পিউটারের ডেস্কটপে শর্টকাট ফাইল সেভ করুন অথবা ক্রোম ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা ইনস্টল (⊕) বাটনে ক্লিক করুন।
            </p>
          </div>
        </div>
      </div>

      {/* Share / Mobile Link Box */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            {isBn ? 'অন্যান্য মোবাইলে ডাউনলোড লিংক পাঠান' : 'Share Download Link'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn ? 'যে কোনো মোবাইল বা কম্পিউটার ব্রাউজারে এই লিংক পেস্ট করে ডাউনলোড করুন:' : 'Copy this link and open in any mobile or desktop browser:'}
          </p>
          <div className="mt-2 font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg inline-block break-all">
            {appUrl}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer shrink-0"
        >
          {copiedLink ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
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
