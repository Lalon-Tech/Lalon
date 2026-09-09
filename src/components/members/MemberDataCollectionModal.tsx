import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  X, 
  Printer, 
  Send,
  MessageSquare,
  FileCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useSomiti } from '../../context/SomitiContext';

export const MemberDataCollectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { settings } = useSomiti();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const somitiName = settings.somitiName || (isBn ? 'বন্ধু সঞ্চয় ও ঋণদান সমবায় সমিতি লিঃ' : 'Bondhu Somiti Ltd.');

  // Formatted Text for Messenger Group copy-paste
  const messengerText = `📢 【 সদস্য ভর্তি তথ্য সংগ্রহ ফরম 】
━━━━━━━━━━━━━━━━━━━━━━━━━━
সমিতি: ${somitiName}

সম্মানিত সদস্যবৃন্দ, আমাদের সমিতির ডিজিটাল সফটওয়্যারে সকল সদস্যের তথ্য ও ডাটাবেজ এন্ট্রি করা হচ্ছে। নিচে উল্লেখিত তথ্যসমূহ মেসেঞ্জার গ্রুপে লিখে অথবা ইনবক্সে দ্রুত পাঠান:

১. সদস্যের ব্যক্তিগত তথ্য:
  • পূর্ণ নাম (বাংলায়): 
  • পূর্ণ নাম (ইংরেজিতে): 
  • মোবাইল নম্বর: 
  • জন্ম তারিখ (দিন/মাস/বছর): 
  • লিঙ্গ: [ ] পুরুষ   [ ] মহিলা
  • জাতীয় পরিচয়পত্র (NID) / জন্ম নিবন্ধন নং: 
  • পিতার নাম: 
  • মাতার নাম: 
  • স্বামী / স্ত্রীর নাম (প্রযোজ্য ক্ষেত্রে): 
  • পেশা: 
  • রক্তের গ্রুপ (যদি জানা থাকে): 

২. ঠিকানা:
  • বর্তমান ঠিকানা: (গ্রাম/মহল্লা, ডাকঘর, থানা/উপজেলা, জেলা)
  • স্থায়ী ঠিকানা: (গ্রাম/মহল্লা, ডাকঘর, থানা/উপজেলা, জেলা)

৩. নমিনির তথ্য:
  • নমিনির নাম: 
  • সদস্যের সাথে সম্পর্ক: (যেমন: মা / বাবা / স্ত্রী / ভাই / সন্তান)
  • নমিনির মোবাইল নম্বর: 
  • নমিনির NID / জন্ম নিবন্ধন নং: 
  • নমিনির ঠিকানা: 
  • লভ্যাংশ বা অংশের হার: ১০০%

৪. প্রাথমিক সঞ্চয় ও শেয়ার তথ্য:
  • শেয়ার সংখ্যা: (যেমন: ১টি / ২টি ইত্যাদি)
  • প্রতি মাসে সঞ্চয় জমার পরিমাণ (৳): 

৫. যেসব ডকুমেন্টস ছবি তুলে ইনবক্সে পাঠাতে হবে:
  ১. সদস্যের পাসপোর্ট সাইজ ছবি (১ কপি)
  ২. সদস্যের NID কার্ডের উভয় পিঠের স্পষ্ট ছবি
  ৩. নমিনির পাসপোর্ট সাইজ ছবি (১ কপি)
  ৪. নমিনির NID কার্ডের স্পষ্ট ছবি
  ৫. সদস্যের স্বাক্ষর (সাদা কাগজে সই করে ছবি)

⚠️ পূর্বের সদস্য হলে:
  • পূর্বের মোট মূল সঞ্চয় জমা (টাকা): 
  • বর্তমান ঋণ বা ডিপিএস (যদি থাকে): 
━━━━━━━━━━━━━━━━━━━━━━━━━━
ধন্যবাদান্তে,
${somitiName} পরিচালনা কমিটি`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messengerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Generate Word Document (.doc / XML HTML format compatible with MS Word, Google Docs, WPS)
  const handleDownloadWord = () => {
    const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>সদস্য ভর্তি তথ্য ফরম - ${somitiName}</title>
  <style>
    body { font-family: 'Calibri', 'SolaimanLipi', 'SutonnyMJ', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 20px; }
    .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 20px; }
    .title { font-size: 18pt; font-weight: bold; color: #1e3a8a; margin: 0; }
    .subtitle { font-size: 13pt; font-weight: bold; color: #334155; margin-top: 4px; }
    .tag { font-size: 10pt; background-color: #f1f5f9; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-top: 5px; }
    .section-title { font-size: 12pt; font-weight: bold; background-color: #e2e8f0; padding: 6px 10px; margin-top: 15px; margin-bottom: 10px; border-left: 4px solid #1e3a8a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    td, th { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10.5pt; }
    .label { width: 32%; font-weight: bold; background-color: #f8fafc; color: #334155; }
    .value { width: 68%; }
    .doc-list { background-color: #fffbeb; border: 1px solid #fef3c7; padding: 12px; border-radius: 6px; margin-top: 15px; }
    .doc-list ul { margin: 5px 0; padding-left: 20px; }
    .footer { margin-top: 40px; }
    .signatures { width: 100%; margin-top: 50px; }
    .signatures td { border: none; text-align: center; padding-top: 40px; }
    .sig-line { border-top: 1px solid #334155; display: inline-block; width: 180px; padding-top: 5px; font-weight: bold; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${somitiName}</h1>
    <div class="subtitle">নতুন সদস্য ভর্তি ও তথ্য সংগ্রহ ফরম (Member Admission Form)</div>
    <div class="tag">সফটওয়্যার ডাটাবেজ এন্ট্রি ও মেসেঞ্জার গ্রুপ তথ্য ফরম</div>
  </div>

  <p><strong>প্রিয় সদস্য,</strong><br>আমাদের সমিতির সার্বিক হিসাব ডিজিটালাইজেশন প্রক্রিয়ার অংশ হিসেবে সকল সদস্যের ব্যক্তিগত ও নমিনির তথ্য সংগ্রহ করা হচ্ছে। অনুগ্রহ করে নিম্নের ছকে চাহিত তথ্যসমূহ পূরণ করে জমা দিন।</p>

  <div class="section-title">১. সদস্যের ব্যক্তিগত ও পারিবারিক তথ্য (Personal Info)</div>
  <table>
    <tr>
      <td class="label">সদস্যের নাম (বাংলায়)</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">সদস্যের নাম (ইংরেজিতে - NID অনুযায়ী)</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">মোবাইল নম্বর (সচল)</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">জাতীয় পরিচয়পত্র (NID) নম্বর</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">জন্ম তারিখ (দিন/মাস/বছর)</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">লিঙ্গ</td>
      <td class="value">[  ] পুরুষ    [  ] মহিলা    [  ] অন্যান্য</td>
    </tr>
    <tr>
      <td class="label">পিতার নাম</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">মাতার নাম</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">স্বামী / স্ত্রীর নাম (বিবাহিত হলে)</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">পেশা ও কর্মস্থল</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">মাসিক আনুমানিক আয় (টাকায়)</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">রক্তের গ্রুপ (ঐচ্ছিক)</td>
      <td class="value"></td>
    </tr>
  </table>

  <div class="section-title">২. ঠিকানার বিবরণ (Address Details)</div>
  <table>
    <tr>
      <td class="label">বর্তমান ঠিকানা</td>
      <td class="value">গ্রাম/মহল্লা: ............................. ডাকঘর: .............................<br>থানা/উপজেলা: ............................. জেলা: .............................</td>
    </tr>
    <tr>
      <td class="label">স্থায়ী ঠিকানা</td>
      <td class="value">গ্রাম/মহল্লা: ............................. ডাকঘর: .............................<br>থানা/উপজেলা: ............................. জেলা: .............................</td>
    </tr>
  </table>

  <div class="section-title">৩. নমিনির তথ্য (Nominee Information)</div>
  <table>
    <tr>
      <td class="label">নমিনির পূর্ণ নাম</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">সদস্যের সাথে সম্পর্ক</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">নমিনির মোবাইল নম্বর</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">নমিনির NID / জন্ম নিবন্ধন নং</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">নমিনির ঠিকানা</td>
      <td class="value"></td>
    </tr>
    <tr>
      <td class="label">প্রাপ্য অংশ / লভ্যাংশের শতকরা হার</td>
      <td class="value">১০০%</td>
    </tr>
  </table>

  <div class="section-title">৪. সঞ্চয় ও সমিতির আর্থিক তথ্য (Financial Commitments)</div>
  <table>
    <tr>
      <td class="label">শেয়ার ক্রয়ের সংখ্যা</td>
      <td class="value">........... টি (প্রতি শেয়ার মূল্য: ........... টাকা)</td>
    </tr>
    <tr>
      <td class="label">নিয়মিত মাসিক সঞ্চয় আমানত (টাকায়)</td>
      <td class="value">৳ ......................../-</td>
    </tr>
    <tr>
      <td class="label">ডিপিএস বা এফডিআর (যদি করতে চান)</td>
      <td class="value">মেয়াদ: ........... বছর, মাসিক কিস্তি: ৳ ..................../-</td>
    </tr>
    <tr>
      <td class="label">পূর্বের সদস্য হলে মোট পূর্বের জমা স্থিতি</td>
      <td class="value">৳ ......................../-</td>
    </tr>
  </table>

  <div class="doc-list">
    <strong>📌 আবেদনের সাথে যেসকল কাগজপত্র ও ছবি জমা দিতে হবে:</strong>
    <ul>
      <li>১. সদস্যের সাম্প্রতিক পাসপোর্ট সাইজ রঙিন ছবি (২ কপি)</li>
      <li>২. সদস্যের জাতীয় পরিচয়পত্র (NID) / জন্ম সনদের স্পষ্ট ফটোকপি</li>
      <li>৩. নমিনির পাসপোর্ট সাইজ ছবি (১ কপি)</li>
      <li>৪. নমিনির জাতীয় পরিচয়পত্র (NID) / জন্ম সনদের ফটোকপি</li>
      <li>৫. সদস্যের নমুনা স্বাক্ষর</li>
    </ul>
  </div>

  <table class="signatures">
    <tr>
      <td>
        <div class="sig-line">সদস্যের স্বাক্ষর ও তারিখ</div>
      </td>
      <td>
        <div class="sig-line">যাচাইকারী / মাঠ কর্মী</div>
      </td>
      <td>
        <div class="sig-line">সাধারণ সম্পাদক / সভাপতি</div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `সদস্য_ভর্তি_তথ্য_সংগ্রহ_ফরম_${somitiName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-auto flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base">
                {isBn ? 'সদস্য ভর্তি তথ্য ফরম (Word ও Messenger শেয়ার)' : 'Member Admission Data Form (Word & Messenger)'}
              </h2>
              <p className="text-[11px] text-blue-200">
                {isBn ? 'মেসেঞ্জার গ্রুপে দিন অথবা Word ফাইল ডাউনলোড করে প্রিন্ট করুন' : 'Share in Messenger group or download Word file'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Top Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              {isBn ? 'মেসেঞ্জারের জন্য ফরম্যাটেড টেক্সট:' : 'Messenger formatted text:'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'মেসেঞ্জার টেক্সট কপি করুন' : 'Copy Messenger Text')}</span>
            </button>

            {/* Word Download Button */}
            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBn ? 'Word ফাইল ডাউনলোড (.doc)' : 'Download Word (.doc)'}</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-slate-50/50">
          {/* Quick Notice for Messenger */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Send className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong>{isBn ? 'মেসেঞ্জারে দেওয়ার নিয়ম:' : 'How to share in Messenger:'}</strong>{' '}
              {isBn 
                ? 'উপরের "মেসেঞ্জার টেক্সট কপি করুন" বাটনে ক্লিক করুন এবং আপনার সমিতির মেসেঞ্জার গ্রুপে পেস্ট (Paste) করে দিন। সদস্যরা এই ছকটি পূরণ করে পাঠালে আপনি সফটওয়্যারের "+ নতুন সদস্য ভর্তি" অপশনে গিয়ে সহজে এন্ট্রি করতে পারবেন।' 
                : 'Click "Copy Messenger Text" and paste it directly into your Messenger group. Members can fill it out and reply.'}
            </div>
          </div>

          {/* Preview of Messenger Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{isBn ? 'মেসেঞ্জার টেক্সট প্রিভিউ:' : 'Messenger Text Preview:'}</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {isBn ? 'সরাসরি কপি ও সেন্ড উপযোগী' : 'Ready to copy and send'}
              </span>
            </div>
            <pre className="p-4 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto shadow-2xs select-all">
              {messengerText}
            </pre>
          </div>

          {/* Word Document Feature Highlight */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-indigo-950">
                  {isBn ? 'অফিশিয়াল মাইক্রোসফট ওয়ার্ড (.doc) ফরম' : 'Official Microsoft Word (.doc) Form'}
                </h4>
                <p className="text-[11px] text-indigo-800">
                  {isBn ? 'সমিতির প্যাড, পূর্ণাঙ্গ টেবিল ছক ও স্বাক্ষরসহ A4 সাইজে সাজানো Word ফাইল' : 'Complete admission application form ready for Word/Google Docs printing'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadWord}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBn ? 'ডাউনলোড' : 'Download'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
