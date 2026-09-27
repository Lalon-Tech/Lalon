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
  Check,
  FileCode2,
  AlertCircle
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
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { settings } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [installing, setInstalling] = useState(false);
  const [downloadingApk, setDownloadingApk] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'ios' | 'desktop'>('apk');

  if (!isOpen) return null;

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
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 text-white shrink-0 border-b border-emerald-900/40">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title={isBn ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white p-1 ring-4 ring-emerald-500/40 shadow-xl shrink-0 overflow-hidden flex items-center justify-center">
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
                <span>{isBn ? 'অফিসিয়াল Android APK' : 'Official Android APK'}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">
                {somitiName}
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                {isBn ? 'সরাসরি APK ফাইল ডাউনলোড ও ইনস্টলেশন সেন্টার' : 'Direct APK File Download & Installation Center'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* PRIMARY HERO: DIRECT APK FILE DOWNLOAD BUTTON */}
          <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden border border-emerald-400/30">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/15 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-extrabold mb-1.5 backdrop-blur-xs">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{isBn ? 'অ্যান্ড্রয়েড APK ফাইল (.apk)' : 'Android APK Package (.apk)'}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  <span>{isBn ? 'সরাসরি APK ফাইল ডাউনলোড' : 'Direct APK File Download'}</span>
                </h3>
                <p className="text-xs text-emerald-100 mt-1 max-w-sm">
                  {isBn 
                    ? `ফাইল সাইজ: ~১৪ মেগাবাইট • ভার্সন: ${apkVersion} • যেকোনো অ্যান্ড্রয়েড ফোনে সরাসরি চলবে।` 
                    : `File size: ~14MB • Version: ${apkVersion} • Direct Android install.`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadApk}
                disabled={downloadingApk}
                className="px-6 py-3.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-extrabold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer disabled:opacity-80"
              >
                <Download className={`w-5 h-5 text-emerald-700 ${downloadingApk ? 'animate-bounce' : ''}`} />
                <span>
                  {downloadingApk 
                    ? (isBn ? 'ডাউনলোড শুরু হচ্ছে...' : 'Starting Download...') 
                    : (isBn ? 'এখনই APK ডাউনলোড' : 'Download APK Now')}
                </span>
              </button>
            </div>
          </div>

          {/* Quick APK Installation Steps */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{isBn ? 'APK ফাইল ইনস্টল করার ৩টি সহজ ধাপ:' : '3 Easy Steps to Install the APK:'}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800">
                <span className="font-bold text-amber-700 dark:text-amber-400">১. ডাউনলোড: </span>
                {isBn ? '"APK ডাউনলোড" এ চাপুন। ব্রাউজারে "Download anyway" আসলে চাপ দিন।' : 'Tap Download APK. If prompted, tap "Download anyway".'}
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800">
                <span className="font-bold text-amber-700 dark:text-amber-400">২. ফাইল খুলুন: </span>
                {isBn ? 'ডাউনলোড শেষে মোবাইলের নোটিফিকেশন বার থেকে ফাইলে চাপ দিন।' : 'Open the downloaded file from your notification bar.'}
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800">
                <span className="font-bold text-amber-700 dark:text-amber-400">৩. ইনস্টল সম্পন্ন: </span>
                {isBn ? '"Install" এ চাপুন (পারমিশন চাইলে Allow দিন)। অ্যাপ চালু করুন!' : 'Tap "Install" (Allow unknown apps if asked). You are ready!'}
              </div>
            </div>
          </div>

          {/* Device Tabs & Alternative Direct Options */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {isBn ? 'অন্যান্য ডিভাইস ও বিকল্প ইনস্টলেশন' : 'Alternative Installation Methods'}
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('apk')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'apk'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>APK ফাইল</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pwa')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'pwa'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Web App (PWA)</span>
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

            {/* Tab: APK Info */}
            {activeTab === 'apk' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {somitiName} - APK Package
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      প্যাকেজ নাম: com.bondhu.somiti • সংস্করণ: {apkVersion}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadApk}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ডাউনলোড' : 'Download'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab: PWA Web App Instant Install */}
            {activeTab === 'pwa' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isBn ? 'ব্রাউজার ছাড়াই সরাসরি হোমস্ক্রিন অ্যাপ' : 'Browser-free Home Screen App'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isBn ? 'কোনো স্টোরেজ খরচ ছাড়াই সরাসরি এক ক্লিকে ইনস্টল করুন।' : 'Direct 1-click home screen install.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer disabled:opacity-75"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{installing ? '...' : (isBn ? 'ইনস্টল' : 'Install')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab: iOS */}
            {activeTab === 'ios' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">১. Safari ব্রাউজারে: </span>
                  নিচের মেনুবারে থাকা <span className="font-bold text-blue-600 dark:text-blue-400">Share [⎋]</span> বাটনে ট্যাপ করুন।
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">২. Add to Home Screen: </span>
                  নিচে স্ক্রোল করে <span className="font-bold text-blue-600 dark:text-blue-400">"Add to Home Screen" (➕)</span> সিলেক্ট করুন।
                </div>
              </div>
            )}

            {/* Tab: Desktop */}
            {activeTab === 'desktop' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    {isBn ? 'উইন্ডোজ ডেস্কটপ শর্টকাট (.url)' : 'Windows Desktop Shortcut (.url)'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isBn ? 'ডেস্কটপে সেভ করে সরাসরি ডাবল ক্লিকে চালু করুন' : '1-click desktop launch file'}
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
            )}
          </div>

          {/* Copy Shareable Link */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-slate-500">
                {isBn ? 'অন্যান্য মোবাইলে লিংক পাঠাতে কপি করুন' : 'Share link for other devices'}
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
            <span>APK {apkVersion} • Direct Android Package</span>
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
