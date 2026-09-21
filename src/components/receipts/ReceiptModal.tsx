import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  ShieldCheck, 
  Share2, 
  Download, 
  Mail, 
  Copy, 
  Check, 
  UserCheck, 
  Building2, 
  Phone, 
  MapPin, 
  FileText,
  Calendar,
  CreditCard,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  numberToBengaliWords, 
  getTransactionTypeName,
  toBengaliNumber 
} from '../../utils/bengaliUtils';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

export const ReceiptModal: React.FC = () => {
  const { 
    activeReceipt,
    selectedReceiptTx, 
    setActiveReceipt,
    closeReceiptModal, 
    settings, 
    members,
    useBengaliDigits 
  } = useSomiti();

  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const tx = activeReceipt || selectedReceiptTx;
  useModalScrollLock(Boolean(tx));
  if (!tx) return null;

  const handleClose = () => {
    if (closeReceiptModal) closeReceiptModal();
    if (setActiveReceipt) setActiveReceipt(null);
  };

  const member = members.find(m => m.id === tx.memberId || m.memberNo === tx.memberNo);
  const typeInfo = getTransactionTypeName(tx.type);
  const amountInWords = numberToBengaliWords(tx.amount);
  const collectorName = tx.collectedBy || tx.verifiedBy || 'দায়িত্বপ্রাপ্ত কর্মকর্তা (Staff Officer)';
  const approverName = tx.verifiedBy || collectorName;

  const formattedDate = formatBengaliDate(tx.date, false);
  const somitiTitle = settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড';

  // Structured Plaintext Receipt for Sharing & Downloading
  const plainTextReceipt = `
========================================
       ${somitiTitle}
    গণপ্রজাতন্ত্রী বাংলাদেশ সরকার নিবন্ধিত
   রেজিস্ট্রেশন নং: ${settings.registrationNo || 'REG-2024-889'}
========================================
${typeInfo.isCredit ? 'অর্থ আদায় ও জমা মানি রসিদ (Cash Receipt)' : 'অর্থ প্রদান ভাউচার (Payment Voucher)'}
ভাউচার নং : ${tx.voucherNo}
তারিখ ও সময় : ${formattedDate}, ${tx.time || ''}
লেনদেনের স্থিতি : অনুমোদিত ও কার্যকর (Approved)
----------------------------------------
সদস্যের নাম : ${tx.memberName || member?.name || 'সাধারণ গ্রাহক'}
সদস্য আইডি  : ${tx.memberNo || member?.memberNo || 'N/A'}
মোবাইল নম্বর : ${member?.phone || 'N/A'}
----------------------------------------
লেনদেনের খাত : ${typeInfo.label}
বিবরণ/মন্তব্য : ${tx.notes || 'নিয়মিত লেনদেন'}
${tx.billingPeriod ? `বিলিং কিস্তি  : ${tx.billingPeriod}\n` : ''}পরিশোধ মাধ্যম : ${tx.paymentMethod === 'cash' ? 'নগদ ক্যাশ (Cash)' : tx.paymentMethod === 'bank' ? 'ব্যাংক ট্রান্সফার' : tx.paymentMethod}
----------------------------------------
মোট পরিমাণ   : ৳ ${tx.amount.toLocaleString('en-IN')} /-
কথায়        : ${amountInWords}
----------------------------------------
আদায়কারী / কালেক্টর : ${collectorName}
অনুমোদনকারী কর্মকর্তা : ${approverName}
========================================
* ডিজিটাল সমবায় সফটওয়্যার দ্বারা স্বয়ংক্রিয়ভাবে তৈরি।
`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainTextReceipt.trim());
      setCopied(true);
      setShareFeedback('রসিদের পূর্ণ বিবরণ ক্লিপবোর্ডে কপি করা হয়েছে!');
      setTimeout(() => {
        setCopied(false);
        setShareFeedback(null);
      }, 3000);
    } catch {
      setShareFeedback('কপি করতে ব্যর্থ হয়েছে।');
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  const handleDownloadTextFile = () => {
    const blob = new Blob([plainTextReceipt.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Money-Receipt-${tx.voucherNo || tx.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShareFeedback('রসিদ টেক্সট ফাইল ডাউনলোড সম্পন্ন হয়েছে!');
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleDownloadHtmlReceipt = () => {
    const receiptElement = document.getElementById('printable-receipt');
    if (!receiptElement) return;

    const fullHtml = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Money Receipt - ${tx.voucherNo}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Hind Siliguri', sans-serif; background-color: #f8fafc; padding: 20px; }
    @media print {
      body { background: white; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen">
  <div class="no-print mb-4 flex gap-2">
    <button onclick="window.print()" style="background:#059669;color:white;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;border:none;">🖨️ প্রিন্ট করুন (Print)</button>
  </div>
  <div style="max-width: 680px; width: 100%; background: white; border-radius: 16px; border: 1px solid #cbd5e1; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); overflow: hidden;">
    ${receiptElement.outerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Money-Receipt-${tx.voucherNo || tx.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShareFeedback('ডিজিটাল রসিদ (HTML) ফাইল ডাউনলোড সম্পন্ন হয়েছে!');
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(plainTextReceipt.trim());
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMessengerShare = () => {
    // Copy the receipt first so user can paste immediately into messenger chat
    handleCopyText();
    // Try opening Messenger web or native protocol
    const messengerUrl = 'https://www.messenger.com';
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
    setShareFeedback('রসিদটি কপি হয়েছে! মেসেঞ্জারে পেস্ট করে সহজে পাঠিয়ে দিন।');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${somitiTitle} - অর্থ আদায় মানি রসিদ #${tx.voucherNo}`);
    const body = encodeURIComponent(plainTextReceipt.trim());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${somitiTitle} - মানি রসিদ #${tx.voucherNo}`,
          text: plainTextReceipt.trim(),
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))]">
        
        {/* Top Control Action Bar (Hidden on Print) */}
        <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-4 sm:px-6 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  মানি রসিদ ও ভাউচার (Money Receipt)
                </h3>
                <p className="text-[10px] text-slate-300 font-mono">#{tx.voucherNo}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrint}
                title="রসিদ প্রিন্ট করুন বা PDF হিসেবে সংরক্ষণ করুন"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>প্রিন্ট / PDF</span>
              </button>

              <button
                onClick={handleDownloadHtmlReceipt}
                title="ডিজিটাল রসিদ (HTML) ফাইল ডাউনলোড করুন"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">HTML রসিদ</span>
              </button>

              <button
                onClick={handleDownloadTextFile}
                title="রসিদ টেক্সট ফাইল ডাউনলোড করুন"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">টেক্সট</span>
              </button>

              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Social Share Strip */}
          <div className="mt-2.5 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>সহজে শেয়ার করুন:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-[11px] font-bold transition-colors cursor-pointer"
                title="WhatsApp-এ শেয়ার করুন"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              {/* Messenger */}
              <button
                onClick={handleMessengerShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0084FF]/20 hover:bg-[#0084FF]/30 text-[#40a7ff] border border-[#0084FF]/40 text-[11px] font-bold transition-colors cursor-pointer"
                title="Facebook Messenger-এ পাঠান"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Messenger</span>
              </button>

              {/* Email */}
              <button
                onClick={handleEmailShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                title="ইমেইলে পাঠান"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>ইমেইল</span>
              </button>

              {/* Copy Full Text */}
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                title="রসিদের তথ্য কপি করুন"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে!' : 'কপি টেক্সট'}</span>
              </button>

              {/* Native System Share if supported */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                  title="অন্যান্য অ্যাপে শেয়ার করুন"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>অন্যান্য</span>
                </button>
              )}
            </div>
          </div>

          {/* Toast Notification */}
          {shareFeedback && (
            <div className="mt-2 p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}
        </div>

        {/* Printable Official Receipt Paper Container */}
        <div 
          className="p-6 sm:p-8 bg-white text-slate-800 space-y-5 relative overflow-y-auto flex-1 min-h-0" 
          id="printable-receipt"
        >
          {/* Subtle Security Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <span className="text-8xl font-black text-slate-900 rotate-[-25deg] tracking-widest uppercase">
              BONDHU SOMITI
            </span>
          </div>

          {/* Top Decorative Border */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-indigo-600 to-emerald-600 rounded-full" />

          {/* Somiti Official Header */}
          <div className="text-center pb-3 border-b-2 border-slate-800 relative">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
              <img
                src={settings.logoUrl || '/icon.svg'}
                alt="বন্ধু সমবায় সমিতি"
                className="w-14 h-14 object-contain bg-white rounded-xl p-1 border border-slate-200 shadow-2xs"
                referrerPolicy="no-referrer"
              />
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 shadow-2xs mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের সমবায় অধিদপ্তর নিবন্ধিত</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-wide text-slate-900 uppercase leading-tight">
                  {somitiTitle}
                </h1>
                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest">
                  UNITY • GROWTH • TRUST
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              রেজিস্ট্রেশন নং: <span className="font-semibold text-slate-800">{settings.registrationNo || 'REG-2024-889'}</span>
              {settings.address && ` • ${settings.address}`}
            </p>
            
            <p className="text-[11px] text-slate-500 mt-0.5">
              {settings.phone && <span>মোবাইল: {settings.phone}</span>}
              {settings.phone && settings.email && <span> • </span>}
              {settings.email && <span>ইমেইল: {settings.email}</span>}
            </p>

            {/* Document Title Badge */}
            <div className="mt-3 inline-flex items-center gap-2 px-5 py-1 bg-slate-900 text-white text-xs font-bold uppercase rounded-lg shadow-xs tracking-wider">
              <span>{typeInfo.isCredit ? 'অর্থ আদায় ও জমা মানি রসিদ (Cash Receipt)' : 'অর্থ প্রদান ভাউচার (Payment Voucher)'}</span>
            </div>
          </div>

          {/* Metadata Grid (Voucher No, Date, Status, Collector) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                <span className="text-slate-500 font-medium">ভাউচার / রসিদ নং:</span>
                <span className="font-mono font-bold text-slate-900 text-sm px-2 py-0.5 bg-white border border-slate-300 rounded-md">
                  {tx.voucherNo}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                <span className="text-slate-500 font-medium">তারিখ ও সময়:</span>
                <span className="font-semibold text-slate-800">
                  {formattedDate}{tx.time ? `, ${tx.time}` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                <span className="text-slate-500 font-medium">লেনদেনের অবস্থা:</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>অনুমোদিত ও কার্যকর (Approved)</span>
                </span>
              </div>
            </div>

            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
              {/* Highlighted Collector's Name */}
              <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                <span className="text-slate-500 font-medium">কালেক্টর / আদায়কারী:</span>
                <div className="flex items-center gap-1 font-bold text-slate-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{collectorName}</span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                <span className="text-slate-500 font-medium">অনুমোদনকারী কর্মকর্তা:</span>
                <span className="font-semibold text-slate-700">
                  {approverName}
                </span>
              </div>
              <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                <span className="text-slate-500 font-medium">পরিশোধ পদ্ধতি:</span>
                <span className="font-bold text-slate-800 uppercase px-1.5 py-0.5 bg-slate-200 rounded text-[11px]">
                  {tx.paymentMethod === 'cash' ? 'নগদ ক্যাশ (Cash)' : tx.paymentMethod === 'bank' ? 'ব্যাংক ট্রান্সফার' : tx.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Member & Particulars Details */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
              <span>সদস্য ও লেনদেনের তথ্যাদি</span>
              <span className="text-[11px] font-normal text-slate-500">গ্রাহক অনুলিপি (Customer Copy)</span>
            </div>

            <div className="p-4 space-y-2.5 bg-white">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">সদস্যের পুরো নাম:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {tx.memberName || member?.name || 'সাধারণ গ্রাহক'}
                </span>
              </div>

              {(tx.memberNo || member?.memberNo) && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">সদস্য নম্বর (Account No):</span>
                  <span className="font-mono font-bold text-blue-700 text-xs px-2 py-0.5 bg-blue-50 rounded">
                    {tx.memberNo || member?.memberNo}
                  </span>
                </div>
              )}

              {member?.phone && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">মোবাইল নম্বর:</span>
                  <span className="font-mono text-slate-800">{member.phone}</span>
                </div>
              )}

              {member?.address && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">ঠিকানা:</span>
                  <span className="text-slate-700">{member.address}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">লেনদেনের খাত / ধরন:</span>
                <span className="font-bold text-slate-800">
                  {typeInfo.label} {tx.notes ? `(${tx.notes})` : ''}
                </span>
              </div>

              {tx.billingPeriod && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">কিস্তির মাস ও বছর:</span>
                  <span className="font-bold text-emerald-800">
                    {tx.billingPeriod}
                  </span>
                </div>
              )}

              {tx.selectedShares && tx.selectedShares.length > 0 && (
                <div className="p-3 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span>পরিশোধিত শেয়ার ({toBengaliNumber(tx.selectedShares.length)} টি):</span>
                    <span className="font-semibold">
                      {tx.selectedShares.map(s => {
                        const sAmt = tx.shareAmounts?.[s] || tx.shareRate;
                        return sAmt ? `শেয়ার #${toBengaliNumber(s)} (৳${toBengaliNumber(sAmt)})` : `শেয়ার #${toBengaliNumber(s)}`;
                      }).join(', ')}
                    </span>
                  </div>
                  {tx.unpaidShares && tx.unpaidShares.length > 0 && (
                    <div className="flex items-center justify-between text-amber-800 font-semibold text-[11px] pt-1 border-t border-emerald-200/50">
                      <span>পরবর্তীতে প্রদেয় বকেয়া শেয়ার ({toBengaliNumber(tx.unpaidShares.length)} টি):</span>
                      <span>{tx.unpaidShares.map(s => `শেয়ার #${toBengaliNumber(s)}`).join(', ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Prominent Paid Amount Banner */}
              <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-xl border-2 border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    {typeInfo.isCredit ? 'মোট আদায়কৃত অর্থ (Total Received):' : 'মোট প্রদত্ত অর্থ (Total Paid):'}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    পরিশোধ সফল ও সম্পন্ন হয়েছে
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-900 text-xl sm:text-2xl font-mono tracking-tight">
                    {formatCurrency(tx.amount, useBengaliDigits)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Bengali Words */}
          <div className="p-3 bg-slate-100 rounded-xl text-xs border border-slate-200 flex items-start gap-2">
            <span className="text-slate-500 font-bold shrink-0">কথায় (In Words):</span>
            <span className="font-bold text-slate-900 italic">
              {amountInWords}
            </span>
          </div>

          {/* Signatures & Official Stamp */}
          <div className="pt-8 grid grid-cols-3 gap-2 sm:gap-4 items-end text-center text-xs">
            {/* Depositor Signature */}
            <div>
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="font-semibold text-slate-800 text-[11px] truncate">
                  {tx.memberName || 'সদস্যের স্বাক্ষর'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                জমা প্রদানকারী / সদস্যের স্বাক্ষর
              </span>
            </div>

            {/* Official Stamp */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-emerald-600/70 p-1 flex flex-col items-center justify-center text-center text-emerald-800 bg-emerald-50/50 rotate-[-8deg] shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span className="text-[8px] sm:text-[9px] font-black uppercase leading-tight">
                  {settings.somitiName ? settings.somitiName.substring(0, 14) : 'BONDHU SOMITI'}
                </span>
                <span className="text-[7px] sm:text-[8px] text-emerald-700 font-semibold leading-tight">
                  অনুমোদিত সিল
                </span>
              </div>
            </div>

            {/* Collector / Approver Signature */}
            <div>
              <div className="h-10 border-b border-slate-400 flex items-end justify-center pb-1">
                <span className="font-bold text-slate-900 text-xs truncate">
                  {collectorName}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                কালেক্টর / ক্যাশিয়ারের স্বাক্ষর
              </span>
            </div>
          </div>

          {/* Security & Verification Footer */}
          <div className="pt-4 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-1">
            <span>* এটি বন্ধু সমবায় সমিতি লিমিটেড ক্লাউড সফটওয়্যার দ্বারা অনুমোদিত ও যাচাইকৃত রসিদ।</span>
            <span className="font-mono text-slate-500 font-semibold">SECURITY HASH: {tx.id.substring(0, 12).toUpperCase()}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
