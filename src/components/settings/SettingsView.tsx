import React, { useState } from 'react';
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
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';

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
      sharePricePerUnit: Number(sharePricePerUnit),
      defaultAdmissionFee: Number(defaultAdmissionFee),
      defaultLoanInterestRate: Number(defaultLoanInterestRate),
      defaultDpsInterestRate: Number(defaultDpsInterestRate),
    });

    setIsSaved(true);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch (_) {}
    setTimeout(() => setIsSaved(false), 3000);
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
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
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
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
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
            <span>৪. ডাটা ব্যাকআপ ও ভাষা ডিসপ্লে</span>
          </h3>

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b pb-3">
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
