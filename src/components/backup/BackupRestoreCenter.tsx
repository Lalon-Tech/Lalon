import React, { useState, useRef } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  HardDrive
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatBengaliDate } from '../../utils/bengaliUtils';

export const BackupRestoreCenter: React.FC = () => {
  const somitiContext = useSomiti();
  const { 
    members, 
    loans, 
    savingsSchemes, 
    transactions, 
    incomeExpenses, 
    bankAccounts, 
    users, 
    settings, 
    auditLogs,
    businessFunding,
    shareClosures,
    cashInHand,
    addAuditLog
  } = somitiContext;

  const { language } = useLanguage();
  const isBn = language === 'bn';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreFile, setRestoreFile] = useState<any | null>(null);
  const [restoreStats, setRestoreStats] = useState<{ members: number; loans: number; tx: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // 1. One-Click JSON Backup Download
  const handleDownloadJsonBackup = () => {
    const backupData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      somitiName: settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড',
      metadata: {
        exportedAt: new Date().toLocaleString(),
        totalMembers: members.length,
        totalLoans: loans.length,
        totalTransactions: transactions.length,
      },
      data: {
        members,
        loans,
        savingsSchemes,
        transactions,
        incomeExpenses,
        bankAccounts,
        users,
        settings,
        auditLogs,
        businessFunding,
        shareClosures,
        cashInHand
      }
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Somiti_Full_System_Backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (addAuditLog) {
      addAuditLog({
        action: 'backup',
        entityType: 'system',
        entityId: 'backup_json',
        performedBy: 'Admin',
        details: 'পূর্ণাঙ্গ সিস্টেম JSON ব্যাকআপ ফাইল ডাউনলোড করা হয়েছে।'
      });
    }

    setStatusMessage({
      type: 'success',
      text: isBn ? 'সিস্টেমের সম্পূর্ণ ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!' : 'Full system backup JSON downloaded successfully!'
    });
  };

  // 2. One-Click Multi-Sheet Excel Backup
  const handleDownloadExcelBackup = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Members
    const membersData = members.map(m => ({
      'সদস্য নং': m.memberNo,
      'নাম': m.name,
      'ইংরেজি নাম': m.nameEn || '',
      'ফোন': m.phone,
      'জাতীয় পরিচয়পত্র': m.nid,
      'ঠিকানা': m.presentAddress,
      'পেশা': m.occupation,
      'শেয়ার সংখ্যা': m.shareCount,
      'মোট সঞ্চয় (৳)': m.totalSavings,
      'সাধারণ সঞ্চয় (৳)': m.generalSavingsBalance,
      'DPS সঞ্চয় (৳)': m.dpsSavingsBalance,
      'FDR সঞ্চয় (৳)': m.fdrSavingsBalance,
      'ভর্তির তারিখ': m.joiningDate,
      'অবস্থা': m.status
    }));
    const wsMembers = XLSX.utils.json_to_sheet(membersData);
    XLSX.utils.book_append_sheet(wb, wsMembers, 'সদস্য তালিকা');

    // Sheet 2: Loans
    const loansData = loans.map(l => ({
      'ঋণ নং': l.loanNo,
      'সদস্যের নাম': l.memberName,
      'সদস্য নং': l.memberNo,
      'মঞ্জুরকৃত টাকা (৳)': l.principalAmount,
      'সুদ/মুনাফা (৳)': l.interestAmount || 0,
      'মোট প্রদেয় (৳)': l.totalAmount,
      'মোট কিস্তি': l.totalInstallments,
      'প্রতি কিস্তির টাকা (৳)': l.installmentAmount,
      'পরিশোধিত টাকা (৳)': l.paidAmount,
      'অবশিষ্ট বকেয়া (৳)': l.remainingAmount,
      'বিতরণের তারিখ': l.disbursedDate,
      'অবস্থা': l.status
    }));
    const wsLoans = XLSX.utils.json_to_sheet(loansData);
    XLSX.utils.book_append_sheet(wb, wsLoans, 'ঋণ তালিকা');

    // Sheet 3: Transactions
    const txData = transactions.map(t => ({
      'ভাউচার নং': t.voucherNo,
      'তারিখ': t.date,
      'সময়': t.time,
      'সদস্য নং': t.memberNo || '',
      'সদস্যের নাম': t.memberName || '',
      'খাত': t.type,
      'টাকা (৳)': t.amount,
      'পেমেন্ট মাধ্যম': t.paymentMethod,
      'আদায়কারী': t.collectedBy,
      'মন্তব্য': t.notes || ''
    }));
    const wsTx = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, wsTx, 'লেনদেন লেজার');

    // Sheet 4: Accounts & Bank
    const bankData = bankAccounts.map(b => ({
      'ব্যাংকের নাম': b.bankName,
      'শাখা': b.branchName,
      'হিসাবের নাম': b.accountName,
      'অ্যাকাউন্ট নম্বর': b.accountNumber,
      'ব্যালেন্স (৳)': b.balance
    }));
    const wsBank = XLSX.utils.json_to_sheet(bankData);
    XLSX.utils.book_append_sheet(wb, wsBank, 'ব্যাংক হিসাব');

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Somiti_Workbook_Backup_${dateStr}.xlsx`);

    setStatusMessage({
      type: 'success',
      text: isBn ? 'মাল্টি-শিট এক্সেল ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!' : 'Multi-sheet Excel workbook backup downloaded successfully!'
    });
  };

  // 3. Handle File Selection for Restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed.data && !parsed.members) {
          setStatusMessage({
            type: 'error',
            text: isBn ? 'অকার্যকর ব্যাকআপ ফাইল! ফাইলটিতে সমিতি ডেটা নেই।' : 'Invalid backup file structure.'
          });
          return;
        }

        const data = parsed.data || parsed;
        setRestoreFile(data);
        setRestoreStats({
          members: (data.members || []).length,
          loans: (data.loans || []).length,
          tx: (data.transactions || []).length,
        });
        setStatusMessage(null);
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: isBn ? 'ফাইলটি পড়তে ব্যর্থ হয়েছে। অনুগ্রহ করে সঠিক JSON ব্যাকআপ ফাইল নির্বাচন করুন।' : 'Failed to parse JSON backup file.'
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              {isBn ? 'সিস্টেম ব্যাকআপ ও রিস্টোর সেন্টার' : 'System Backup & Recovery Center'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn 
                ? 'এক ক্লিকে সকল সদস্য, ঋণ, সঞ্চয় ও লেনদেনের নিরাপদ ব্যাকআপ তৈরি করুন অথবা পূর্বের ব্যাকআপ ফাইল থেকে রিস্টোর করুন।' 
                : 'One-click full system data backups and safe JSON restoration tools.'}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Backup Download Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JSON Full System Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <FileJson className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {isBn ? 'সম্পূর্ণ সিস্টেম ব্যাকআপ (JSON)' : 'Full System Backup (JSON)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isBn 
                ? 'ডাটাবেজের সকল টেবিল (সদস্য, ঋণ, কিস্তি, লেনদেন, ব্যাংক অ্যাকাউন্ট, অডিট লগ এবং সেটিংস) সহ একটি স্বয়ংসম্পূর্ণ ফাইল ডাউনলোড করবে।' 
                : 'Exports every record including members, loans, vouchers, transactions, settings and audit logs in standardized JSON format.'}
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>• মোট সদস্য: <span className="font-bold">{members.length}</span> জন</div>
              <div>• মোট ঋণ অ্যাকাউন্ট: <span className="font-bold">{loans.length}</span> টি</div>
              <div>• মোট লেনদেন: <span className="font-bold">{transactions.length}</span> টি</div>
            </div>
          </div>

          <button
            onClick={handleDownloadJsonBackup}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isBn ? 'JSON ব্যাকআপ ফাইল ডাউনলোড করুন' : 'Download JSON Backup'}</span>
          </button>
        </div>

        {/* Excel Multi-Sheet Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {isBn ? 'মাল্টি-শিট এক্সেল ব্যাকআপ (Excel Workbook)' : 'Multi-Sheet Excel Workbook'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isBn 
                ? 'একটি এক্সেল ওয়ার্কবুকের ভেতর সদস্য তালিকা, ঋণ খতিয়ান, লেনদেন লেজার এবং ব্যাংক হিসাবসমূহ পৃথক পৃথক শিটে এক্সপোর্ট করবে।' 
                : 'Generates a single organized .xlsx file with dedicated worksheets for Members, Loans, Transactions and Accounts.'}
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>• শিট ১: সদস্য রেজিস্টার ও সঞ্চয় স্থিতি</div>
              <div>• শিট ২: ঋণ খতিয়ান ও কিস্তি বকেয়া</div>
              <div>• শিট ৩: সকল জমা ও উত্তোলনের পূর্ণাঙ্গ লেজার</div>
            </div>
          </div>

          <button
            onClick={handleDownloadExcelBackup}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isBn ? 'এক্সেল ব্যাকআপ ডাউনলোড করুন' : 'Download Excel Backup'}</span>
          </button>
        </div>
      </div>

      {/* Restore Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              {isBn ? 'ব্যাকআপ ফাইল থেকে ডেটা রিকভারি / রিস্টোর' : 'Restore Data from Backup File'}
            </h3>
            <span className="text-xs text-slate-500">
              {isBn ? 'পূর্বে ডাউনলোড করা .json ব্যাকআপ ফাইল আপলোড করে ডেটা পুনরুদ্ধার করুন।' : 'Upload previously downloaded JSON backup file.'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">{isBn ? 'সতর্কতা ও নির্দেশিকা:' : 'Caution & Instructions:'}</span>
            <p className="leading-relaxed">
              {isBn 
                ? 'ব্যাকআপ রিস্টোর করার পূর্বে বর্তমান ডেটার একটি ব্যাকআপ কপি ডাউনলোড করে রাখুন। শুধুমাত্র সিস্টেম থেকে ডাউনলোড করা বৈধ JSON ব্যাকআপ ফাইলই ব্যবহার করুন।' 
                : 'Always download a fresh backup before restoring. Use only genuine backup files previously generated by this system.'}
            </p>
          </div>
        </div>

        {/* Upload Box */}
        <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50"
             onClick={() => fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-xs border border-slate-200 mb-2">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-bold text-slate-800 block">
            {isBn ? 'ব্যাকআপ JSON ফাইল সিলেক্ট করতে ক্লিক করুন' : 'Click to select JSON backup file'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {isBn ? 'সমর্থিত ফরম্যাট: .json (সর্বোচ্চ ৫০ মেগাবাইট)' : 'Supported format: .json (Max 50MB)'}
          </span>
        </div>

        {/* Restore Preview */}
        {restoreStats && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800">{isBn ? 'ফাইল বিশ্লেষণ সারসংক্ষেপ:' : 'Backup File Analysis:'}</h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">{isBn ? 'সদস্য' : 'Members'}</span>
                <span className="font-bold text-slate-800">{restoreStats.members} জন</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">{isBn ? 'ঋণ' : 'Loans'}</span>
                <span className="font-bold text-slate-800">{restoreStats.loans} টি</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block">{isBn ? 'লেনদেন' : 'Transactions'}</span>
                <span className="font-bold text-slate-800">{restoreStats.tx} টি</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestoreFile(null);
                  setRestoreStats(null);
                }}
                className="flex-1 py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusMessage({
                    type: 'success',
                    text: isBn ? 'ব্যাকআপ ফাইল সফলভাবে যাচাই করা হয়েছে এবং রিস্টোরের জন্য প্রস্তুত।' : 'Backup file verified and ready.'
                  });
                }}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isBn ? 'ডেটা প্রয়োগ নিশ্চিত করুন' : 'Confirm Apply Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
