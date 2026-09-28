import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Building, 
  Coins, 
  UserCheck, 
  FileCode, 
  Download, 
  Upload, 
  RotateCcw,
  Trash2,
  CheckCircle2,
  Sparkles,
  Cloud,
  Database,
  RefreshCw,
  AlertTriangle,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Check,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Move,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sliders,
  Smartphone,
  ExternalLink,
  Circle,
  Square,
  Maximize2,
  Minimize2,
  Palette,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { compressLogoImage } from '../../utils/imageUtils';
import { ThemeToggle } from '../common/ThemeToggle';
import { 
  getLogoTransformStyle, 
  getLogoShapeClass, 
  getLogoContainerStyle 
} from '../../utils/logoUtils';
import { 
  generateAppIconPackage, 
  syncLogoAssetsToServer, 
  downloadDataUrlFile 
} from '../../utils/appIconGenerator';

export const SettingsView: React.FC = () => {
  const { language } = useLanguage();
  const { 
    settings, 
    updateSettings, 
    useBengaliDigits, 
    setUseBengaliDigits,
    members,
    loans,
    transactions,
    clearAllData,
    resetToDemoData,
    exportDatabaseJson,
    importDatabaseJson,
    firestoreConnected,
    isSyncing,
    lastSyncTime,
    syncAllToFirestore,
    syncAllFromFirestore,
  } = useSomiti();

  const [somitiName, setSomitiName] = useState(settings.somitiName);
  const [somitiNameEn, setSomitiNameEn] = useState(settings.somitiNameEn);
  const [registrationNo, setRegistrationNo] = useState(settings.registrationNo);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [presidentName, setPresidentName] = useState(settings.presidentName);
  const [secretaryName, setSecretaryName] = useState(settings.secretaryName);
  const [cashierName, setCashierName] = useState(settings.cashierName);

  const [sharePricePerUnit, setSharePricePerUnit] = useState(settings.sharePricePerUnit);
  const [defaultAdmissionFee, setDefaultAdmissionFee] = useState(settings.defaultAdmissionFee);
  const [defaultLoanInterestRate, setDefaultLoanInterestRate] = useState(settings.defaultLoanInterestRate);
  const [defaultDpsInterestRate, setDefaultDpsInterestRate] = useState(settings.defaultDpsInterestRate);

  // Logo state and handlers
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '/logo.png');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoScale, setLogoScale] = useState<number>(settings.logoScale ?? 1.0);
  const [logoOffsetX, setLogoOffsetX] = useState<number>(settings.logoOffsetX ?? 0);
  const [logoOffsetY, setLogoOffsetY] = useState<number>(settings.logoOffsetY ?? 0);
  const [logoShape, setLogoShape] = useState<'circle' | 'rounded' | 'square'>(settings.logoShape || 'circle');
  const [logoBgColor, setLogoBgColor] = useState<string>(settings.logoBgColor || '#ffffff');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync settings when loaded from Firestore or updated
  useEffect(() => {
    if (settings) {
      setSomitiName(settings.somitiName || '');
      setSomitiNameEn(settings.somitiNameEn || '');
      setRegistrationNo(settings.registrationNo || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setPresidentName(settings.presidentName || '');
      setSecretaryName(settings.secretaryName || '');
      setCashierName(settings.cashierName || '');
      setSharePricePerUnit(settings.sharePricePerUnit ?? 100);
      setDefaultAdmissionFee(settings.defaultAdmissionFee ?? 50);
      setDefaultLoanInterestRate(settings.defaultLoanInterestRate ?? 10);
      setDefaultDpsInterestRate(settings.defaultDpsInterestRate ?? 8);
      setLogoScale(settings.logoScale ?? 1.0);
      setLogoOffsetX(settings.logoOffsetX ?? 0);
      setLogoOffsetY(settings.logoOffsetY ?? 0);
      setLogoShape(settings.logoShape || 'circle');
      setLogoBgColor(settings.logoBgColor || '#ffffff');
      if (!logoPreview) {
        setLogoUrl(settings.logoUrl || '/logo.png');
      }
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setActionFeedback({
        type: 'error',
        message: language === 'bn' ? 'অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (PNG, JPG, SVG, WebP) নির্বাচন করুন।' : 'Please select a valid image file.'
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setActionFeedback({
        type: 'error',
        message: language === 'bn' ? 'ছবির সাইজ সর্বোচ্চ ৮ মেগাবাইট (8MB) হতে পারবে।' : 'Image size must be under 8MB.'
      });
      return;
    }

    try {
      setActionFeedback({
        type: 'info',
        message: language === 'bn' ? 'লোগো অপ্টিমাইজ করা হচ্ছে...' : 'Optimizing logo...'
      });

      const optimizedLogo = await compressLogoImage(file);
      setLogoUrl(optimizedLogo);
      setLogoPreview(optimizedLogo);
      setActionFeedback({
        type: 'success',
        message: language === 'bn' 
          ? 'নতুন লোগো সফলভাবে লোড হয়েছে! এটিকে আপনার স্থায়ী ডিফল্ট লোগো করতে নিচে "সকল সেটিংস সংরক্ষণ করুন" বাটনে চাপুন।' 
          : 'New logo loaded! Click "Save" below to make it your permanent default logo.'
      });
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || (language === 'bn' ? 'লোগো লোড করতে সমস্যা হয়েছে।' : 'Failed to load logo.')
      });
    }
  };

  const handleResetLogo = () => {
    const defaultLogoUrl = '/logo.png';
    setLogoUrl(defaultLogoUrl);
    setLogoPreview(null);
    setLogoScale(1.0);
    setLogoOffsetX(0);
    setLogoOffsetY(0);
    setLogoShape('circle');
    setLogoBgColor('#ffffff');
    if (logoInputRef.current) logoInputRef.current.value = '';
    setActionFeedback({
      type: 'info',
      message: language === 'bn' ? 'অফিসিয়াল ডিফল্ট লোগো, সাইজ ও বৃত্তাকার শেপে ফিরিয়ে আনা হয়েছে।' : 'Reverted to official default logo.'
    });
  };

  const handleZoomIn = () => {
    setLogoScale(prev => Math.min(2.5, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setLogoScale(prev => Math.max(0.3, Number((prev - 0.1).toFixed(2))));
  };

  const handleMoveLeft = () => {
    setLogoOffsetX(prev => Math.max(-50, prev - 3));
  };

  const handleMoveRight = () => {
    setLogoOffsetX(prev => Math.min(50, prev + 3));
  };

  const handleMoveUp = () => {
    setLogoOffsetY(prev => Math.max(-50, prev - 3));
  };

  const handleMoveDown = () => {
    setLogoOffsetY(prev => Math.min(50, prev + 3));
  };

  const handleCenterLogo = () => {
    setLogoScale(1);
    setLogoOffsetX(0);
    setLogoOffsetY(0);
    setActionFeedback({
      type: 'info',
      message: language === 'bn' ? 'লোগোর অবস্থান সেন্টারে রিসেট করা হয়েছে (Zoom 100%, X: 0%, Y: 0%)।' : 'Logo centered and reset to default.'
    });
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleApplyLogoTransform = () => {
    updateSettings({
      logoUrl,
      logoScale: Number(logoScale.toFixed(2)),
      logoOffsetX: Math.round(logoOffsetX),
      logoOffsetY: Math.round(logoOffsetY),
      logoShape,
      logoBgColor,
    });
    // Immediately persist updated icon package to disk
    syncLogoAssetsToServer(logoUrl, {
      scale: logoScale,
      offsetX: logoOffsetX,
      offsetY: logoOffsetY,
      shape: logoShape,
      bgColor: logoBgColor,
    }).catch(console.warn);

    setActionFeedback({
      type: 'success',
      message: language === 'bn' 
        ? 'লোগোর সাইজ, বৃত্তাকার/শেপ ও পজিশন সফলভাবে মোবাইল অ্যাপ আইকন ও ডিফল্ট হিসেবে সংরক্ষিত হয়েছে!' 
        : 'Logo size, shape & position permanently saved as mobile app icon!'
    });
    try {
      confetti({ particleCount: 30, spread: 55, origin: { y: 0.6 } });
    } catch (_) {}
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleDownloadAppIcon = async () => {
    try {
      setActionFeedback({
        type: 'info',
        message: language === 'bn' ? 'হাই-রেজ্যুলুশন মোবাইল অ্যাপ আইকন তৈরি হচ্ছে...' : 'Generating app icon PNG...'
      });
      const icons = await generateAppIconPackage(logoUrl, {
        scale: logoScale,
        offsetX: logoOffsetX,
        offsetY: logoOffsetY,
        shape: logoShape,
        bgColor: logoBgColor,
      });
      if (icons?.icon512) {
        downloadDataUrlFile(icons.icon512, 'bondhu_somiti_mobile_icon_512.png');
        setActionFeedback({
          type: 'success',
          message: language === 'bn' 
            ? 'মোবাইল অ্যাপ আইকন (512x512 PNG) সফলভাবে ডাউনলোড হয়েছে! এটি যেকোনো ফোন বা অ্যাপ ম্যানিফেস্টে ব্যবহার করা যাবে।' 
            : 'App icon (512x512 PNG) downloaded!'
        });
      }
    } catch (e) {
      setActionFeedback({
        type: 'error',
        message: language === 'bn' ? 'আইকন ডাউনলোড করতে সমস্যা হয়েছে।' : 'Error downloading icon.'
      });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const [isSaved, setIsSaved] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // In-app Modal and Feedback States (avoids sandboxed iframe window.confirm/alert blocks)
  const [showClearModal, setShowClearModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isProcessingClear, setIsProcessingClear] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handlePushToCloud = async () => {
    const success = await syncAllToFirestore();
    if (success) {
      setSyncFeedback(language === 'bn' ? 'সফলভাবে ক্লাউড ফায়ারস্টোরে আপলোড হয়েছে!' : 'Successfully uploaded to Cloud Firestore!');
    } else {
      setSyncFeedback(language === 'bn' ? 'ফায়ারস্টোরে আপলোড ব্যর্থ হয়েছে।' : 'Failed to upload to Firestore.');
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handlePullFromCloud = async () => {
    const success = await syncAllFromFirestore();
    if (success) {
      setSyncFeedback(language === 'bn' ? 'ফায়ারস্টোর থেকে লেটেস্ট ডাটা লোড হয়েছে!' : 'Latest data synced from Firestore!');
    } else {
      setSyncFeedback(language === 'bn' ? 'ডাটা ফেচ ব্যর্থ হয়েছে।' : 'Failed to fetch data.');
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      somitiName: somitiName.trim(),
      somitiNameEn: somitiNameEn.trim(),
      registrationNo: registrationNo.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      presidentName: presidentName.trim(),
      secretaryName: secretaryName.trim(),
      cashierName: cashierName.trim(),
      logoUrl: logoUrl,
      logoScale: Number(logoScale.toFixed(2)),
      logoOffsetX: Math.round(logoOffsetX),
      logoOffsetY: Math.round(logoOffsetY),
      logoShape: logoShape,
      logoBgColor: logoBgColor,
      sharePricePerUnit: Number(sharePricePerUnit),
      defaultAdmissionFee: Number(defaultAdmissionFee),
      defaultLoanInterestRate: Number(defaultLoanInterestRate),
      defaultDpsInterestRate: Number(defaultDpsInterestRate),
    });

    // Sync physical PWA PNG icons (192, 512, maskable, apple-touch) to public assets
    syncLogoAssetsToServer(logoUrl, {
      scale: logoScale,
      offsetX: logoOffsetX,
      offsetY: logoOffsetY,
      shape: logoShape,
      bgColor: logoBgColor,
    }).catch(console.warn);

    setIsSaved(true);
    setActionFeedback({
      type: 'success',
      message: language === 'bn' 
        ? 'আপনার নির্বাচিত লোগো, সাইজ ও শেপ সফলভাবে মোবাইল অ্যাপ আইকন ও স্থায়ী ডিফল্ট হিসেবে সংরক্ষিত হয়েছে!' 
        : 'Your selected logo, size & shape have been saved as mobile app icon and default logo!'
    });
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
    setTimeout(() => setIsSaved(false), 4000);
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const exportBackupJson = () => {
    exportDatabaseJson();
    setActionFeedback({
      type: 'success',
      message: language === 'bn' 
        ? 'সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON) সফলভাবে আপনার ডিভাইসে ডাউনলোড হয়েছে।' 
        : 'Full database backup (JSON) has been downloaded to your device.'
    });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (content) {
          const success = importDatabaseJson(content);
          if (success) {
            setActionFeedback({
              type: 'success',
              message: language === 'bn' 
                ? 'ডাটাবেজ ব্যাকআপ সফলভাবে রিস্টোর করা হয়েছে!' 
                : 'Database backup restored successfully!'
            });
            try {
              confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
            } catch (_) {}
          } else {
            setActionFeedback({
              type: 'error',
              message: language === 'bn' 
                ? 'ভুল ফরম্যাট! ব্যাকআপ ফাইলটি সঠিক JSON ফরম্যাটে নেই।' 
                : 'Invalid format! The file is not a valid backup JSON.'
            });
          }
        }
      } catch (err) {
        setActionFeedback({
          type: 'error',
          message: language === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে।' : 'Error reading backup file.'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setTimeout(() => setActionFeedback(null), 6000);
  };

  const confirmClearAllData = async () => {
    try {
      setIsProcessingClear(true);
      await clearAllData();
      setShowClearModal(false);
      setActionFeedback({
        type: 'success',
        message: language === 'bn' 
          ? 'সফল হয়েছে! সমস্ত ডেমো ডাটা মুছে ডাটাবেজ সম্পূর্ণ শূন্য (০ সদস্য) করা হয়েছে। আপনি এখন আপনার সমিতির সদস্যদের আসল তথ্য এন্ট্রি করতে পারবেন।'
          : 'Success! Database cleared to 0 members. You can now start entering your own members and transactions.'
      });
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch (_) {}
    } catch (err) {
      console.error(err);
      setActionFeedback({
        type: 'error',
        message: language === 'bn' ? 'ডাটা মুছতে সমস্যা হয়েছে।' : 'Error clearing database.'
      });
    } finally {
      setIsProcessingClear(false);
      setTimeout(() => setActionFeedback(null), 7000);
    }
  };

  const confirmResetDemoData = () => {
    try {
      resetToDemoData();
      setShowResetModal(false);
      setActionFeedback({
        type: 'success',
        message: language === 'bn' 
          ? 'ডেমো স্যাম্পল ডাটা সফলভাবে পুনরায় লোড করা হয়েছে।'
          : 'Demo sample data reloaded successfully.'
      });
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      } catch (_) {}
    } catch (err) {
      console.error(err);
      setActionFeedback({
        type: 'error',
        message: language === 'bn' ? 'ডেমো ডাটা লোড করতে সমস্যা হয়েছে।' : 'Failed to reload demo data.'
      });
    } finally {
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Action Notification Banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
          actionFeedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : actionFeedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : actionFeedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold">{actionFeedback.message}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setActionFeedback(null)}
            className="p-1 rounded-md hover:bg-black/5 text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              সমিতি সেটিংস ও কনফিগারেশন (Settings)
            </h2>
            <p className="text-xs text-slate-500">
              সমিতির প্রাতিষ্ঠানিক তথ্য, স্বাক্ষরকারী প্যানেল ও আর্থিক হার নিয়ন্ত্রণ
            </p>
          </div>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold animate-in fade-in self-start sm:self-auto">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>১. সমিতির সাধারণ ও প্রাতিষ্ঠানিক তথ্য</span>
          </h3>

          {/* Logo & Mobile App Icon Management */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row items-center lg:items-start gap-6">
            {/* App Icon & Logo Preview */}
            <div className="shrink-0 flex flex-col items-center">
              <div 
                className={`w-24 h-24 sm:w-28 sm:h-28 ${getLogoShapeClass(logoShape)} p-1.5 border-2 border-emerald-500/50 shadow-md flex items-center justify-center overflow-hidden transition-all`}
                style={getLogoContainerStyle({ logoBgColor })}
              >
                <img
                  src={logoPreview || logoUrl || '/logo.png'}
                  alt="সমিতির লোগো ও অ্যাপ আইকন"
                  className={`w-full h-full object-contain ${getLogoShapeClass(logoShape)}`}
                  style={getLogoTransformStyle({ logoScale, logoOffsetX, logoOffsetY })}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              <span className="mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                {logoShape === 'circle' ? 'বৃত্তাকার (Circle)' : logoShape === 'rounded' ? 'কার্ভড স্কোয়ার' : 'চারকোনা (Square)'}
              </span>
            </div>

            <div className="flex-1 text-center lg:text-left space-y-4 w-full min-w-0">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center justify-center lg:justify-start gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>সমিতির লোগো ও অ্যাপ আইকন (Logo & App Icon)</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  আপনার সমিতির লোগো আপলোড এবং শেপ ও সাইজ নির্ধারণ করুন। এটি রশিদ, রিপোর্ট এবং মোবাইল অ্যাপ আইকন হিসেবে প্রদর্শিত হবে।
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-0.5">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="somiti-logo-file-input"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>নতুন লোগো / আইকন আপলোড</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAppIcon}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300/80 cursor-pointer active:scale-95"
                  title="512x512 PNG আইকন ডাউনলোড"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>অ্যাপ আইকন ডাউনলোড (.png)</span>
                </button>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all border border-rose-200 cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>সংরক্ষিত ডিফল্ট লোগোতে ফিরুন</span>
                  </button>
                )}
              </div>

              {/* 1. Shape Options: Circle (বৃত্তাকার), Squircle (কার্ভড), Square (চারকোনা) + Background */}
              <div className="bg-white/95 rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">
                        লোগো ও অ্যাপ আইকন শেপ অপশন (Circle / Shape Options)
                      </h5>
                      <p className="text-[10.5px] text-slate-500">
                        মোবাইল অ্যাপ আইকন এবং ওয়েব লোগোর জন্য বৃত্তাকার বা আপনার পছন্দের ফ্রেম নির্বাচন করুন
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                    নির্বাচিত: {logoShape === 'circle' ? 'বৃত্তাকার (Circle)' : logoShape === 'rounded' ? 'কার্ভড স্কোয়ার' : 'চারকোনা (Square)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Circle (বৃত্তাকার) - Recommended */}
                  <button
                    type="button"
                    onClick={() => setLogoShape('circle')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      logoShape === 'circle'
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      logoShape === 'circle' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white text-slate-400'
                    }`}>
                      <Circle className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">বৃত্তাকার (Circle)</span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">ডিফল্ট</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 truncate">গোলাকার ফ্রেম ও সিল</p>
                    </div>
                  </button>

                  {/* Option 2: Squircle / Rounded (কার্ভড স্কোয়ার) */}
                  <button
                    type="button"
                    onClick={() => setLogoShape('rounded')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      logoShape === 'rounded'
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 ${
                      logoShape === 'rounded' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-400'
                    }`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900">কার্ভড স্কোয়ার</span>
                      <p className="text-[10.5px] text-slate-500 truncate">স্মার্টফোন অ্যাপ স্টাইল</p>
                    </div>
                  </button>

                  {/* Option 3: Square (চারকোনা) */}
                  <button
                    type="button"
                    onClick={() => setLogoShape('square')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      logoShape === 'square'
                        ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      logoShape === 'square' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-400'
                    }`}>
                      <Square className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900">চারকোনা (Square)</span>
                      <p className="text-[10.5px] text-slate-500 truncate">ফ্ল্যাট বর্গাকার রূপ</p>
                    </div>
                  </button>
                </div>

                {/* Background color selector for circle/badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                    <Palette className="w-3.5 h-3.5 text-slate-500" />
                    <span>আইকন ব্যাকগ্রাউন্ড কালার:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { label: 'সাদা', value: '#ffffff', bg: 'bg-white' },
                      { label: 'সবুজ', value: '#059669', bg: 'bg-emerald-600' },
                      { label: 'নেভি ব্লু', value: '#1b2a59', bg: 'bg-[#1b2a59]' },
                      { label: 'স্বচ্ছ', value: 'transparent', bg: 'bg-slate-200' },
                    ].map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setLogoBgColor(c.value)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                          logoBgColor === c.value
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full border border-black/10 shrink-0 ${c.bg}`}></span>
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Logo Resize & Zoom Controls + Position Controls */}
              <div className="mt-4 pt-4 border-t border-slate-200/90 bg-white/95 rounded-xl p-3.5 sm:p-4.5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">
                        লোগো সাইজ ও রিসাইজ অপশন (Resize & Zoom Options)
                      </h5>
                      <p className="text-[10.5px] text-slate-500">
                        স্লাইডার টেনে অথবা বাটনে চাপ দিয়ে লোগোটি রিংয়ের ভেতরে নিখুঁতভাবে রিসাইজ করুন
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs font-mono">
                      সাইজ / Zoom: {Math.round(logoScale * 100)}%
                    </span>
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      X: {logoOffsetX > 0 ? `+${logoOffsetX}` : logoOffsetX}% | Y: {logoOffsetY > 0 ? `+${logoOffsetY}` : logoOffsetY}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* 1. Dedicated Resize & Zoom Controls */}
                  <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <ZoomIn className="w-4 h-4 text-emerald-600" />
                        <span>সাইজ সমন্বয় / রিসাইজ (Resize Slider)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoScale(1.0);
                          setLogoOffsetX(0);
                          setLogoOffsetY(0);
                        }}
                        className="text-[10.5px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                      >
                        অটো ফিট (১০০%)
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleZoomOut}
                        title="১০% ছোট করুন (Zoom Out)"
                        disabled={logoScale <= 0.3}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-bold"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                        <span>-১০%</span>
                      </button>

                      <input
                        type="range"
                        min="0.3"
                        max="2.5"
                        step="0.01"
                        value={logoScale}
                        onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-600 cursor-pointer h-2.5 bg-slate-200 rounded-lg"
                      />

                      <button
                        type="button"
                        onClick={handleZoomIn}
                        title="১০% বড় করুন (Zoom In)"
                        disabled={logoScale >= 2.5}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-bold"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>+১০%</span>
                      </button>
                    </div>

                    {/* Quick Preset Resize Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10.5px] text-slate-500 font-bold block">
                        দ্রুত সাইজ বাটন (Quick Size Presets):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { label: '৫০% (খুব ছোট)', val: 0.5 },
                          { label: '৭৫% (ছোট)', val: 0.75 },
                          { label: '১০০% (স্বাভাবিক)', val: 1.0 },
                          { label: '১২৫% (মাঝারি)', val: 1.25 },
                          { label: '১৫০% (বড়)', val: 1.5 },
                          { label: '১৮০%', val: 1.8 },
                          { label: '২০০% (খুব বড়)', val: 2.0 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => setLogoScale(preset.val)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                              Math.abs(logoScale - preset.val) < 0.03
                                ? 'bg-emerald-600 text-white shadow-2xs ring-1 ring-emerald-700'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Position Controls (Move Left / Right, Move Up / Down, Center) */}
                  <div className="space-y-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5">
                        <Move className="w-4 h-4 text-blue-600" />
                        <span>পজিশন স্থানান্তর (Move & Align)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleCenterLogo}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 active:scale-95 text-emerald-800 text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs"
                        title="সেন্টার ও ডিফল্ট পজিশনে রিসেট করুন"
                      >
                        <Crosshair className="w-3 h-3 text-emerald-700" />
                        <span>Center (সেন্টার)</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                      {/* Directional Pad */}
                      <div className="inline-grid grid-cols-3 gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
                        <div></div>
                        <button
                          type="button"
                          onClick={handleMoveUp}
                          title="উপরে সরান (Move Up)"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <div></div>

                        <button
                          type="button"
                          onClick={handleMoveLeft}
                          title="বামে সরান (Move Left)"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleCenterLogo}
                          title="সেন্টার (Center)"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Crosshair className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleMoveRight}
                          title="ডানে সরান (Move Right)"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <div></div>
                        <button
                          type="button"
                          onClick={handleMoveDown}
                          title="নিচে সরান (Move Down)"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 active:scale-95 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <div></div>
                      </div>

                      {/* Sliders for precision X and Y control */}
                      <div className="flex-1 w-full space-y-2 text-[11px] text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-right font-bold text-slate-500">X:</span>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={logoOffsetX}
                            onChange={(e) => setLogoOffsetX(parseInt(e.target.value, 10))}
                            className="flex-1 accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                            title="Horizontal Position X"
                          />
                          <span className="w-8 text-right font-mono text-[10px]">{logoOffsetX}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-6 text-right font-bold text-slate-500">Y:</span>
                          <input
                            type="range"
                            min="-50"
                            max="50"
                            step="1"
                            value={logoOffsetY}
                            onChange={(e) => setLogoOffsetY(parseInt(e.target.value, 10))}
                            className="flex-1 accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                            title="Vertical Position Y"
                          />
                          <span className="w-8 text-right font-mono text-[10px]">{logoOffsetY}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instant Save / Apply Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500">
                    💡 প্রিভিউতে সকল পরিবর্তন তাৎক্ষণিকভাবে প্রদর্শিত হচ্ছে। স্থায়ী করতে ডানপাশের বাটনে চাপুন।
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCenterLogo}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                      <span>পজিশন রিসেট</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyLogoTransform}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>সাইজ, শেপ ও পজিশন সেভ করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সমিতির নাম (বাংলায়)
              </label>
              <input
                type="text"
                value={somitiName}
                onChange={(e) => setSomitiName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সমিতির নাম (ইংরেজি)
              </label>
              <input
                type="text"
                value={somitiNameEn}
                onChange={(e) => setSomitiNameEn(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                রেজিস্ট্রেশন নম্বর
              </label>
              <input
                type="text"
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অফিসিয়াল ফোন নম্বর
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                অফিসিয়াল ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              কার্যালয়ের ঠিকানা
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Executive Committee */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>২. প্রধান স্বাক্ষরকারী ও কর্মকর্তা প্যানেল</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সভাপতির নাম
              </label>
              <input
                type="text"
                value={presidentName}
                onChange={(e) => setPresidentName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সাধারণ সম্পাদকের নাম
              </label>
              <input
                type="text"
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কোষাধ্যক্ষ / হিসাবরক্ষক
              </label>
              <input
                type="text"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Financial Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>৩. আর্থিক প্যারামিটার ও ডিফল্ট পলিসি</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রতি শেয়ারের মূল্য (৳)
              </label>
              <input
                type="number"
                value={sharePricePerUnit}
                onChange={(e) => setSharePricePerUnit(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ভর্তি ফি (৳)
              </label>
              <input
                type="number"
                value={defaultAdmissionFee}
                onChange={(e) => setDefaultAdmissionFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ডিফল্ট ঋণের মুনাফা (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={defaultLoanInterestRate}
                onChange={(e) => setDefaultLoanInterestRate(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ডিফল্ট ডিপিএস মুনাফা (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={defaultDpsInterestRate}
                onChange={(e) => setDefaultDpsInterestRate(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Cloud Firestore Database Live Sync Section */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-6 rounded-2xl border border-blue-900/50 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{language === 'bn' ? 'ক্লাউড ফায়ারস্টোর ডাটাবেজ (Cloud Firestore)' : 'Cloud Firestore Database'}</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {language === 'bn' ? 'সক্রিয় ও সংযুক্ত' : 'Live & Connected'}
                  </span>
                </h3>
                <p className="text-xs text-blue-200/70">
                  {language === 'bn' 
                    ? 'আপনার সমস্ত সমিতির সদস্য, ঋণ, সঞ্চয় ও লেনদেনের ডাটা স্বয়ংক্রিয়ভাবে ক্লাউড ডাটাবেজে রিয়েল-টাইমে সেভ হয়।'
                    : 'All members, loans, savings, and transactions sync in real-time to Google Cloud Firestore.'}
                </p>
              </div>
            </div>

            {lastSyncTime && (
              <span className="text-xs text-slate-400">
                {language === 'bn' ? `সর্বশেষ সিঙ্ক: ${lastSyncTime}` : `Last sync: ${lastSyncTime}`}
              </span>
            )}
          </div>

          {syncFeedback && (
            <div className="p-3 bg-blue-900/50 border border-blue-500/40 rounded-xl text-xs text-blue-200 font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isSyncing}
              onClick={handlePushToCloud}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? (language === 'bn' ? 'সিঙ্ক হচ্ছে...' : 'Syncing...') : (language === 'bn' ? 'সব ডাটা ফায়ারস্টোরে আপলোড (Push)' : 'Push All Data to Firestore')}</span>
            </button>

            <button
              type="button"
              disabled={isSyncing}
              onClick={handlePullFromCloud}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{language === 'bn' ? 'ফায়ারস্টোর হতে ফ্রেশ ডাটা রিফ্রেশ (Pull)' : 'Pull Fresh Data from Firestore'}</span>
            </button>
          </div>
        </div>

        {/* Display and Backup Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <FileCode className="w-4 h-4 text-amber-600" />
            <span>৪. ডাটা ব্যাকআপ ও ডিসপ্লে সেটিংস</span>
          </h3>

          {/* Global Theme / Dark Mode Setting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'সিস্টেম থিম ও চোখের আরাম (Light / Dark Mode)' : 'System Theme & Eye Comfort'}
              </h4>
              <p className="text-xs text-slate-500">
                {language === 'bn' 
                  ? 'চোখের সুরক্ষায় ডার্ক মোড ব্যবহার করুন অথবা স্ট্যান্ডার্ড লাইট মোড সিলেক্ট করুন।' 
                  : 'Toggle dark mode to reduce eye strain or use clean light mode.'}
              </p>
            </div>
            <ThemeToggle variant="segmented" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <h4 className="text-sm font-bold text-slate-800">বাংলা সংখ্যা ডিসপ্লে (Bengali Digits)</h4>
              <p className="text-xs text-slate-500">টাকার অঙ্ক ও সংখ্যা বাংলায় (১, ২, ৩...) অথবা ইংরেজিতে (1, 2, 3...) প্রদর্শন করুন</p>
            </div>
            <button
              type="button"
              onClick={() => setUseBengaliDigits(!useBengaliDigits)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                useBengaliDigits ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-800'
              }`}
            >
              {useBengaliDigits ? 'বাংলা সংখ্যা সক্রিয় (১২৩৪৫)' : 'ইংরেজি সংখ্যা সক্রিয় (12345)'}
            </button>
          </div>

          <div className="p-5 bg-linear-to-br from-amber-50/80 to-orange-50/50 border border-amber-200 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
              <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>নতুন সমিতি শুরু বা ডাটা ব্যবস্থাপনা</span>
              </h4>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                members.length === 0 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${members.length === 0 ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                <span>
                  {members.length === 0 
                    ? (language === 'bn' ? 'ডাটাবেজ প্রস্তুত: ০ জন সদস্য' : 'Database Ready: 0 Members')
                    : (language === 'bn' ? `বর্তমান ডাটাবেজ: ${members.length} জন সদস্য, ${loans.length} টি ঋণ` : `Current DB: ${members.length} members, ${loans.length} loans`)}
                </span>
              </span>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed">
              {language === 'bn'
                ? 'আপনি কি আপনার নিজস্ব সমিতির কাজ শুরু করতে চান? নিচের লাল বাটনে ক্লিক করে সব ডেমো মেম্বার মুছে ০ সদস্য থেকে একদম নতুন শুরু করতে পারেন। অথবা প্রয়োজনমতো ডেমো ডাটা পুনরায় লোড করতে পারবেন।'
                : 'Ready to launch your own somiti operations? Click the red button to wipe all demo members and start completely fresh from 0 members.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
              >
                <Trash2 className="w-4 h-4" />
                <span>সব ডেমো ডাটা মুছুন (০ সদস্য থেকে নতুন শুরু)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4 text-blue-600" />
                <span>ডেমো ডাটা পুনরায় লোড করুন</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={exportBackupJson}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-98"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON ডাউনলোড)</span>
            </button>

            <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>ব্যাকআপ ফাইল থেকে রিস্টোর (JSON আপলোড)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackupJson}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>সকল সেটিংস সংরক্ষণ করুন ✓</span>
          </button>
        </div>
      </form>

      {/* Clear All Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {language === 'bn' ? 'সব ডেমো ডাটা মুছে ০ সদস্য থেকে শুরু' : 'Clear All Demo Data (Start Fresh)'}
                  </h3>
                  <p className="text-xs text-rose-600 font-medium">
                    {language === 'bn' ? '⚠️ সতর্কতা: এই প্রক্রিয়াটি অপরিবর্তনীয়' : '⚠️ Warning: This action is irreversible'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                disabled={isProcessingClear}
                onClick={() => setShowClearModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="leading-relaxed">
                {language === 'bn'
                  ? 'আপনি কি নিশ্চিত যে সমস্ত টেস্ট/ডেমো মেম্বার এবং তাদের সব ঋণ ও লেনদেনের ডাটা মুছে ফেলতে চান? এটি সম্পন্ন হলে আপনার ডাটাবেজে ০ জন সদস্য থাকবে এবং আপনি সম্পূর্ণ নতুন করে আপনার আসল সমিতির ডাটা এন্ট্রি করতে পারবেন।'
                  : 'Are you sure you want to delete all test/demo members and all associated transactions? Your database will be reset to 0 members, ready for your real somiti records.'}
              </p>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <span className="font-bold text-rose-700 block">{language === 'bn' ? 'যা যা মুছে যাবে:' : 'What will be removed:'}</span>
                  <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                    <li>{language === 'bn' ? 'সব সদস্য তালিকা' : 'All members'}</li>
                    <li>{language === 'bn' ? 'সকল ঋণ ও কিস্তি' : 'All loans & installments'}</li>
                    <li>{language === 'bn' ? 'সঞ্চয়, DPS ও FDR' : 'All savings & DPS'}</li>
                    <li>{language === 'bn' ? 'ব্যবসা ফান্ডিং ও লাভ' : 'Business fundings & profit'}</li>
                    <li>{language === 'bn' ? 'সমস্ত লেনদেন ও ভাউচার' : 'All transactions & vouchers'}</li>
                  </ul>
                </div>
                <div className="space-y-1 border-l pl-3 border-slate-200">
                  <span className="font-bold text-emerald-700 block">{language === 'bn' ? 'যা সুরক্ষিত থাকবে:' : 'What stays safe:'}</span>
                  <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                    <li>{language === 'bn' ? 'সমিতির নাম ও তথ্য' : 'Somiti name & info'}</li>
                    <li>{language === 'bn' ? 'আপনার অ্যাডমিন অ্যাকাউন্ট' : 'Your admin account'}</li>
                    <li>{language === 'bn' ? 'সুদের হার ও সেটিংস' : 'Interest rates & settings'}</li>
                    <li>{language === 'bn' ? 'ব্যাংক হিসাব (ব্যালেন্স ০)' : 'Bank account (balance 0)'}</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {language === 'bn'
                    ? 'পরামর্শ: ডাটা মুছে ফেলার আগে বর্তমান ডাটার একটি কপি রাখতে চাইলে "সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON)" ডাউনলোড করে নিতে পারেন।'
                    : 'Tip: You can download a complete JSON backup before wiping out demo records.'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <button
                type="button"
                disabled={isProcessingClear}
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isProcessingClear}
                onClick={confirmClearAllData}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-60 cursor-pointer"
              >
                {isProcessingClear ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Wiping database...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{language === 'bn' ? 'হ্যাঁ, সব ডাটা মুছুন (০ সদস্য)' : 'Yes, Delete All Data (0 Members)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Demo Data Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-200 space-y-4 animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-blue-600">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <RotateCcw className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {language === 'bn' ? 'ডেমো ডাটা পুনরায় লোড' : 'Reload Demo Sample Data'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'bn' ? 'স্যাম্পল সদস্য ও লেনদেন রিস্টোর' : 'Restore sample members & ledger'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowResetModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'bn'
                ? 'আপনি কি পূর্বনির্ধারিত ডেমো স্যাম্পল মেম্বার, ঋণ ও লেনদেনের ডাটা পুনরায় লোড করতে চান? এটি টেস্ট করার জন্য প্রস্তুত স্যাম্পল ডাটাবেজ প্রদান করবে।'
                : 'Do you want to reload the predefined sample demo members, loans, and transactions? This provides ready-to-test sample data.'}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmResetDemoData}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'bn' ? 'হ্যাঁ, ডেমো ডাটা লোড করুন' : 'Yes, Load Demo Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
