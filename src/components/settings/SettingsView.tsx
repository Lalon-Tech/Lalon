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
  RefreshCw
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
    clearAllData,
    resetToDemoData,
    exportDatabaseJson,
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
    const fullBackup = {
      timestamp: new Date().toISOString(),
      members: localStorage.getItem('bondhu_somiti_members'),
      loans: localStorage.getItem('bondhu_somiti_loans'),
      savings: localStorage.getItem('bondhu_somiti_savings'),
      transactions: localStorage.getItem('bondhu_somiti_transactions'),
      income_expense: localStorage.getItem('bondhu_somiti_income_expense'),
      bank_accounts: localStorage.getItem('bondhu_somiti_bank_accounts'),
      settings: localStorage.getItem('bondhu_somiti_settings'),
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bondhu_somiti_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleClearAllData = async () => {
    if (window.confirm('⚠️ সতর্কতা: আপনি কি সমস্ত মেম্বার, ঋণ ও লেনদেন মুছে সম্পূর্ণ শূন্য (০ সদস্য) থেকে নতুন ডাটা এন্ট্রি শুরু করতে চান?')) {
      await clearAllData();
      alert('সফল হয়েছে! আপনার ডাটাবেজ এখন সম্পূর্ণ খালি। আপনি এখন নতুন করে সদস্যদের তথ্য ও লেনদেন এন্ট্রি করতে পারবেন।');
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('আপনি কি পূর্বনির্ধারিত ডেমো স্যাম্পল ডাটা পুনরায় লোড করতে চান?')) {
      resetToDemoData();
      alert('ডেমো ডাটা সফলভাবে পুনরায় লোড করা হয়েছে।');
    }
  };

  return (
    <div className="space-y-6 pb-16">
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

          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>নতুন সমিতি শুরু বা ডাটা ব্যবস্থাপনা</span>
            </h4>
            <p className="text-xs text-amber-800">
              আপনি কি আপনার নিজস্ব সমিতির কাজ শুরু করতে চান? নিচের লাল বাটনে ক্লিক করে সব ডেমো মেম্বার মুছে ০ সদস্য থেকে একদম নতুন শুরু করতে পারেন।
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleClearAllData}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>সব ডেমো ডাটা মুছুন (০ সদস্য থেকে নতুন শুরু)</span>
              </button>

              <button
                type="button"
                onClick={handleResetDemoData}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-colors"
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
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>সম্পূর্ণ ডাটাবেজ ব্যাকআপ (JSON ডাউনলোড)</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>সকল সেটিংস সংরক্ষণ করুন ✓</span>
          </button>
        </div>
      </form>
    </div>
  );
};
