import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  FileDown,
  Clock
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import jsPDF from 'jspdf';
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
    users,
    currentUser,
    useBengaliDigits 
  } = useSomiti();

  const [copied, setCopied] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [generatingType, setGeneratingType] = useState<'pdf' | 'image' | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const printableReceiptRef = useRef<HTMLDivElement>(null);

  const tx = activeReceipt || selectedReceiptTx;
  useModalScrollLock(Boolean(tx));

  // Reset scroll position to top whenever a new receipt is opened
  useEffect(() => {
    if (tx && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [tx]);

  if (!tx) return null;

  const handleClose = () => {
    if (closeReceiptModal) closeReceiptModal();
    if (setActiveReceipt) setActiveReceipt(null);
  };

  const member = members.find(m => m.id === tx.memberId || m.memberNo === tx.memberNo);
  const typeInfo = getTransactionTypeName(tx.type);
  const amountInWords = numberToBengaliWords(tx.amount);
  const formattedDate = formatBengaliDate(tx.date, false);
  const somitiTitle = settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড';

  const memberFullName = (tx.memberName || member?.name || '').trim();
  const memberAccountNo = (tx.memberNo || member?.memberNo || '').trim();

  // Helper to test if a name string erroneously points to the member
  const isMemberReference = (nameToCheck: string | undefined | null): boolean => {
    if (!nameToCheck) return true;
    const clean = nameToCheck.trim().toLowerCase();
    if (!clean) return true;
    if (clean === 'member' || clean === 'সদস্য' || clean === 'গ্রাহক' || clean === 'customer') return true;
    if (memberFullName && (clean === memberFullName.toLowerCase() || memberFullName.toLowerCase().includes(clean) || clean.includes(memberFullName.toLowerCase()))) {
      return true;
    }
    if (memberAccountNo && clean === memberAccountNo.toLowerCase()) {
      return true;
    }
    return false;
  };

  // Transaction status
  const isTxPending = tx.status === 'pending';
  const isTxRejected = tx.status === 'cancelled' || (tx.status as string) === 'rejected';
  const isTxApproved = !isTxPending && !isTxRejected;

  // Determine actual Collector/Cashier who processed the transaction ONLY when approved
  let collectorFullName = '';

  if (isTxApproved) {
    // 1. Transaction's verifiedBy if not pointing to member
    if (tx.verifiedBy && !isMemberReference(tx.verifiedBy)) {
      collectorFullName = tx.verifiedBy.trim();
    }
    // 2. Transaction's collectedBy if not pointing to member
    else if (tx.collectedBy && !isMemberReference(tx.collectedBy)) {
      collectorFullName = tx.collectedBy.trim();
    }
    // 3. Member's assigned collector
    else if (member?.assignedCollectorId) {
      const assignedUser = users.find(u => u.id === member.assignedCollectorId || u.userUid === member.assignedCollectorId);
      const assignedMem = members.find(m => m.id === member.assignedCollectorId || m.memberNo === member.assignedCollectorId);
      if (assignedUser?.name && !isMemberReference(assignedUser.name)) {
        collectorFullName = assignedUser.name.trim();
      } else if (assignedMem?.name && !isMemberReference(assignedMem.name)) {
        collectorFullName = assignedMem.name.trim();
      }
    }

    // 4. Default to settings Cashier or active Cashier / Admin in system
    if (!collectorFullName || isMemberReference(collectorFullName)) {
      if (settings.cashierName && !isMemberReference(settings.cashierName)) {
        collectorFullName = settings.cashierName.trim();
      } else {
        const cashierUser = users.find(u => u.role === 'cashier' && u.status === 'active' && !isMemberReference(u.name));
        if (cashierUser?.name) {
          collectorFullName = cashierUser.name.trim();
        } else {
          const adminUser = users.find(u => u.role === 'admin' && u.status === 'active' && !isMemberReference(u.name));
          if (adminUser?.name) {
            collectorFullName = adminUser.name.trim();
          } else if (settings.secretaryName && !isMemberReference(settings.secretaryName)) {
            collectorFullName = settings.secretaryName.trim();
          } else {
            collectorFullName = 'আজিজুর রহমান (ক্যাশিয়ার)';
          }
        }
      }
    }
  }

  // Approver Name for metadata
  const approverFullName = isTxApproved
    ? ((tx.verifiedBy && !isMemberReference(tx.verifiedBy))
        ? tx.verifiedBy.trim()
        : (settings.secretaryName && !isMemberReference(settings.secretaryName))
          ? settings.secretaryName.trim()
          : collectorFullName)
    : '';

  // Search for Collector/Cashier's saved digital signature ONLY when approved
  let collectorSignatureUrl: string | null = null;

  if (isTxApproved && collectorFullName) {

  // Check in members list (many staff/collectors are members with signatureUrl)
  const matchedCollectorMember = members.find(m => {
    if (!m.signatureUrl) return false;
    const mName = m.name.trim().toLowerCase();
    const cName = collectorFullName.toLowerCase();
    return mName === cName || (mName.length > 3 && cName.includes(mName)) || (cName.length > 3 && mName.includes(cName));
  });
  if (matchedCollectorMember?.signatureUrl) {
    collectorSignatureUrl = matchedCollectorMember.signatureUrl;
  }

  // Check in users list
  if (!collectorSignatureUrl) {
    const matchedUser = users.find(u => {
      const uName = u.name.trim().toLowerCase();
      const cName = collectorFullName.toLowerCase();
      return uName === cName || (uName.length > 3 && cName.includes(uName));
    });
    if ((matchedUser as any)?.signatureUrl) {
      collectorSignatureUrl = (matchedUser as any).signatureUrl;
    }
  }

  // Check localStorage for saved digital signature
  if (!collectorSignatureUrl && typeof window !== 'undefined') {
    try {
      const localSig = localStorage.getItem(`somiti_signature_${collectorFullName}`) ||
                       localStorage.getItem('somiti_cashier_signature') ||
                       localStorage.getItem('cashier_signature');
      if (localSig) collectorSignatureUrl = localSig;
    } catch {}
  }
  }

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
লেনদেনের স্থিতি : ${isTxPending ? 'অনুমোদনের অপেক্ষায় (Pending)' : isTxRejected ? 'বাতিল / প্রত্যাখ্যাত (Cancelled / Rejected)' : 'অনুমোদিত ও কার্যকর (Approved)'}
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
আদায়কারী / ক্যাশিয়ার : ${isTxPending ? '(অনুমোদনের পর প্রযোজ্য)' : isTxRejected ? '(বাতিলকৃত)' : (collectorFullName || 'অফিস ক্যাশিয়ার')}
অনুমোদনকারী কর্মকর্তা : ${isTxPending ? '(অনুমোদনের পর প্রযোজ্য)' : isTxRejected ? '(বাতিলকৃত)' : (approverFullName || 'প্রধান প্রশাসক')}
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

  // Helper for html-to-image capture options
  const captureOptions = {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    cacheBust: true,
    skipFonts: true,
    fontEmbedCSS: '',
    imagePlaceholder: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E',
    filter: (node: HTMLElement) => !node.classList?.contains('no-print'),
  };

  // Share Receipt as Image (PNG)
  const handleShareImage = async () => {
    const node = printableReceiptRef.current || document.getElementById('printable-receipt');
    if (!node) return;

    setGeneratingType('image');
    try {
      const blob = await toBlob(node, captureOptions);
      if (!blob) throw new Error('Image generation failed');

      const fileName = `Money-Receipt-${tx.voucherNo || tx.id}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Native Web Share with file if supported
      const canShareFile = typeof navigator !== 'undefined' && 
                           typeof navigator.canShare === 'function' && 
                           navigator.canShare({ files: [file] });

      if (canShareFile) {
        await navigator.share({
          title: `${somitiTitle} - মানি রসিদ #${tx.voucherNo}`,
          text: `${somitiTitle} - মানি রসিদ #${tx.voucherNo}\nসদস্য: ${tx.memberName || member?.name}\nমোট: ৳${tx.amount.toLocaleString('en-IN')}`,
          files: [file],
        });
        setShareFeedback('রসিদের ছবি সফলভাবে শেয়ার করা হয়েছে!');
      } else {
        // Fallback: direct download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setShareFeedback('রসিদের পূর্ণাঙ্গ ছবি (Image) ডাউনলোড সম্পন্ন হয়েছে! আপনি যেকোনো অ্যাপে পাঠাতে পারবেন।');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Image share notice:', err);
        setShareFeedback('ছবি তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setGeneratingType(null);
      setTimeout(() => setShareFeedback(null), 4000);
    }
  };

  // Share Receipt as PDF
  const handleSharePdf = async () => {
    const node = printableReceiptRef.current || document.getElementById('printable-receipt');
    if (!node) return;

    setGeneratingType('pdf');
    try {
      const imgData = await toPng(node, captureOptions);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Maintain margins and aspect ratio
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;

      let renderWidth = availableWidth;
      let renderHeight = (imgProps.height * renderWidth) / imgProps.width;

      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = (imgProps.width * renderHeight) / imgProps.height;
      }

      const xOffset = margin + (availableWidth - renderWidth) / 2;
      const yOffset = margin;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');

      const pdfBlob = pdf.output('blob');
      const fileName = `Money-Receipt-${tx.voucherNo || tx.id}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Native Web Share with file if supported
      const canShareFile = typeof navigator !== 'undefined' && 
                           typeof navigator.canShare === 'function' && 
                           navigator.canShare({ files: [file] });

      if (canShareFile) {
        await navigator.share({
          title: `${somitiTitle} - মানি রসিদ #${tx.voucherNo}`,
          text: `${somitiTitle} - মানি রসিদ #${tx.voucherNo}\nসদস্য: ${tx.memberName || member?.name}\nমোট: ৳${tx.amount.toLocaleString('en-IN')}`,
          files: [file],
        });
        setShareFeedback('রসিদের PDF সফলভাবে শেয়ার করা হয়েছে!');
      } else {
        // Fallback: direct PDF save
        pdf.save(fileName);
        setShareFeedback('রসিদের পূর্ণাঙ্গ PDF ফাইল ডাউনলোড সম্পন্ন হয়েছে! আপনি যেকোনো অ্যাপে পাঠাতে পারবেন।');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('PDF share notice:', err);
        setShareFeedback('PDF ফাইল তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setGeneratingType(null);
      setTimeout(() => setShareFeedback(null), 4000);
    }
  };

  const handleWhatsAppShare = () => {
    const encoded = encodeURIComponent(plainTextReceipt.trim());
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleMessengerShare = () => {
    handleCopyText();
    const messengerUrl = 'https://www.messenger.com';
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
    setShareFeedback('রসিদটি কপি হয়েছে! মেসেঞ্জারে পেস্ট করে সহজে পাঠিয়ে দিন।');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${somitiTitle} - অর্থ আদায় মানি রসিদ #${tx.voucherNo}`);
    const body = encodeURIComponent(plainTextReceipt.trim());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeTextShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${somitiTitle} - মানি রসিদ #${tx.voucherNo}`,
          text: plainTextReceipt.trim(),
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div 
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl flex flex-col h-[92vh] h-[92dvh] max-h-[92vh] max-h-[92dvh] overflow-hidden my-auto animate-in fade-in-50 zoom-in-95 relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Control Action Bar (Fixed at Top of Modal) */}
        <div className="no-print bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800 shrink-0 select-none shadow-md z-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white leading-tight">
                  মানি রসিদ ও ভাউচার (Money Receipt)
                </h3>
                <p className="text-[10px] text-slate-300 font-mono leading-none mt-0.5">#{tx.voucherNo}</p>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Share PDF Button */}
              <button
                onClick={handleSharePdf}
                disabled={generatingType !== null}
                title="রসিদ PDF হিসেবে শেয়ার বা সংরক্ষণ করুন"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {generatingType === 'pdf' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{generatingType === 'pdf' ? 'PDF হচ্ছে...' : 'PDF'}</span>
              </button>

              {/* Share Image Button */}
              <button
                onClick={handleShareImage}
                disabled={generatingType !== null}
                title="রসিদের পূর্ণাঙ্গ ছবি (PNG) শেয়ার বা ডাউনলোড করুন"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {generatingType === 'image' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                <span>{generatingType === 'image' ? 'ছবি হচ্ছে...' : 'ছবি'}</span>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                title="রসিদ প্রিন্ট করুন"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">প্রিন্ট</span>
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
                title="রসিদ বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Social Share Strip */}
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between gap-1.5 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
              <Share2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>শেয়ার অপশন:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* WhatsApp Share */}
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-[11px] font-bold transition-colors cursor-pointer"
                title="WhatsApp-এ শেয়ার করুন"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              {/* Messenger Share */}
              <button
                onClick={handleMessengerShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0084FF]/20 hover:bg-[#0084FF]/30 text-[#40a7ff] border border-[#0084FF]/40 text-[11px] font-bold transition-colors cursor-pointer"
                title="Facebook Messenger-এ পাঠান"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Messenger</span>
              </button>

              {/* Email Share */}
              <button
                onClick={handleEmailShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                title="ইমেইলে পাঠান"
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ইমেইল</span>
              </button>

              {/* Copy Full Text */}
              <button
                onClick={handleCopyText}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                title="রসিদের তথ্য কপি করুন"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'কপি হয়েছে!' : 'কপি'}</span>
              </button>

              {/* Native System Share */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeTextShare}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                  title="অন্যান্য অ্যাপে শেয়ার করুন"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">অন্যান্য</span>
                </button>
              )}
            </div>
          </div>

          {/* Feedback Toast */}
          {shareFeedback && (
            <div className="mt-2 p-2 bg-emerald-950/90 border border-emerald-500/60 rounded-lg text-emerald-200 text-[11px] flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}
        </div>

        {/* Dedicated Smooth Scrollable Viewport Container */}
        <div 
          ref={scrollContainerRef}
          id="receipt-modal-scroll-area"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 md:p-6 bg-slate-100/60"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
          tabIndex={0}
        >
          {/* Printable Official Receipt Paper Card */}
          <div 
            ref={printableReceiptRef}
            id="printable-receipt"
            className="w-full max-w-2xl mx-auto bg-white text-slate-800 space-y-4 sm:space-y-5 relative rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-8 shadow-xs pb-10"
          >
            {/* Subtle Security Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
              <span className="text-7xl sm:text-8xl font-black text-slate-900 rotate-[-25deg] tracking-widest uppercase">
                BONDHU SOMITI
              </span>
            </div>

            {/* Top Decorative Border */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-indigo-600 to-emerald-600 rounded-full" />

            {/* Somiti Official Header */}
            <div className="text-center pb-3 border-b-2 border-slate-800 relative">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-2">
                <img
                  src={settings.logoUrl === '/logo.svg' ? '/icon.svg' : (settings.logoUrl || '/icon.svg')}
                  alt="বন্ধু সমবায় সমিতি"
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain bg-white rounded-2xl p-1 border border-slate-200 shadow-2xs"
                  crossOrigin="anonymous"
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
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-1 bg-slate-900 text-white text-xs font-bold uppercase rounded-lg shadow-xs tracking-wider">
                <span>{typeInfo.isCredit ? 'অর্থ আদায় ও জমা মানি রসিদ (Cash Receipt)' : 'অর্থ প্রদান ভাউচার (Payment Voucher)'}</span>
              </div>
            </div>

            {/* Metadata Grid (Voucher No, Date, Status, Collector) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200">
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
                  {isTxPending ? (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>অনুমোদনের অপেক্ষায় (Pending)</span>
                    </span>
                  ) : isTxRejected ? (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded text-[11px]">
                      <X className="w-3 h-3 text-rose-600" />
                      <span>বাতিল / প্রত্যাখ্যাত (Rejected)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>অনুমোদিত ও কার্যকর (Approved)</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                {/* Highlighted Actual Collector/Cashier's Name */}
                <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                  <span className="text-slate-500 font-medium">কালেক্টর / আদায়কারী:</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{collectorFullName}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                  <span className="text-slate-500 font-medium">অনুমোদনকারী কর্মকর্তা:</span>
                  <span className="font-semibold text-slate-700">
                    {approverFullName}
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

              <div className="p-3.5 sm:p-4 space-y-2.5 bg-white">
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

            {/* Signatures & Official Stamp Section */}
            <div className="pt-6 sm:pt-8 grid grid-cols-3 gap-2 sm:gap-4 items-end text-center text-xs">
              
              {/* Depositor / Member Signature */}
              <div className="flex flex-col items-center">
                <div className="w-full min-h-12 border-b border-slate-400 flex flex-col items-center justify-end pb-1 px-1">
                  {member?.signatureUrl ? (
                    <img
                      src={member.signatureUrl}
                      alt={tx.memberName || 'সদস্যের স্বাক্ষর'}
                      className="max-h-10 max-w-[120px] object-contain mb-0.5 select-none"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 text-[11px] truncate block w-full">
                      {tx.memberName || member?.name || 'সদস্যের স্বাক্ষর'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  জমা প্রদানকারী / সদস্যের স্বাক্ষর
                </span>
              </div>

              {/* Official Stamp with Collector/Cashier's Full Name Correctly Visible */}
              <div className="flex flex-col items-center justify-center">
                <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-dashed p-1 flex flex-col items-center justify-center text-center rotate-[-4deg] shadow-xs relative select-none ${
                  isTxRejected
                    ? 'border-rose-600/90 text-rose-900 bg-rose-50/70'
                    : isTxPending
                      ? 'border-amber-600/90 text-amber-900 bg-amber-50/70'
                      : 'border-emerald-600/90 text-emerald-900 bg-emerald-50/70'
                }`}>
                  <div className={`w-full h-full rounded-full border p-1 flex flex-col items-center justify-center ${
                    isTxRejected
                      ? 'border-rose-500/50'
                      : isTxPending
                        ? 'border-amber-500/50'
                        : 'border-emerald-500/50'
                  }`}>
                    {/* Header */}
                    <div className={`flex items-center gap-0.5 ${
                      isTxRejected ? 'text-rose-800' : isTxPending ? 'text-amber-800' : 'text-emerald-800'
                    }`}>
                      <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${
                        isTxRejected ? 'text-rose-600' : isTxPending ? 'text-amber-600' : 'text-emerald-600'
                      }`} />
                      <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-wider">
                        {settings.somitiName ? settings.somitiName.substring(0, 16) : 'BONDHU SOMITI'}
                      </span>
                    </div>

                    <span className={`text-[6.5px] font-bold uppercase tracking-tight mt-0.5 ${
                      isTxRejected ? 'text-rose-700' : isTxPending ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {isTxRejected ? 'বাতিলকৃত সিলমোহর' : isTxPending ? 'অপেক্ষমাণ সিলমোহর' : 'অনুমোদিত সিলমোহর'}
                    </span>

                    {/* Collector/Cashier's Full Name in Stamp only when approved */}
                    {isTxPending ? (
                      <div className="w-full my-0.5 px-1 py-0.5 rounded border shadow-2xs bg-amber-100/90 border-amber-400/80 text-amber-900">
                        <span className="text-[6.5px] sm:text-[7px] font-bold uppercase tracking-wider block leading-none">
                          যাচাই ও অনুমোদন
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-amber-950 block leading-tight px-0.5 mt-0.5">
                          অনুমোদনের অপেক্ষায়
                        </span>
                      </div>
                    ) : isTxRejected ? (
                      <div className="w-full my-0.5 px-1 py-0.5 rounded border shadow-2xs bg-rose-100/90 border-rose-400/80 text-rose-900">
                        <span className="text-[6.5px] sm:text-[7px] font-bold uppercase tracking-wider block leading-none">
                          লেনদেন অবস্থা
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-rose-950 block leading-tight px-0.5 mt-0.5">
                          বাতিল / প্রত্যাখ্যাত
                        </span>
                      </div>
                    ) : (
                      <div className="w-full my-0.5 px-1 py-0.5 rounded border shadow-2xs bg-emerald-100/90 border-emerald-400/80 text-emerald-900">
                        <span className="text-[6.5px] sm:text-[7px] font-bold uppercase tracking-wider block leading-none">
                          আদায়কারী / ক্যাশিয়ার
                        </span>
                        <span className="text-[8.5px] sm:text-[9.5px] font-black block leading-tight px-0.5 mt-0.5 break-words">
                          {collectorFullName}
                        </span>
                      </div>
                    )}

                    {/* Seal Verification Date */}
                    <span className={`text-[6.5px] font-semibold leading-none ${
                      isTxRejected ? 'text-rose-700' : isTxPending ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {formattedDate} • {isTxRejected ? 'CANCELLED / REJECTED' : isTxPending ? 'PENDING' : 'APPROVED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collector / Cashier Signature (NEVER Member's Name, ONLY when Approved!) */}
              <div className="flex flex-col items-center">
                <div className="w-full min-h-12 border-b border-slate-400 flex flex-col items-center justify-end pb-1 px-1">
                  {isTxPending ? (
                    <div className="py-1 text-center w-full">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        অনুমোদনের পর স্বাক্ষর
                      </span>
                    </div>
                  ) : isTxRejected ? (
                    <div className="py-1 text-center w-full">
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        বাতিলকৃত
                      </span>
                    </div>
                  ) : collectorSignatureUrl ? (
                    <img
                      src={collectorSignatureUrl}
                      alt={collectorFullName}
                      className="max-h-10 max-w-[130px] object-contain mb-0.5 select-none"
                    />
                  ) : (
                    <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-wide block w-full truncate">
                      {collectorFullName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  {isTxPending ? 'অনুমোদনকারী কর্মকর্তার স্বাক্ষর' : 'কালেক্টর / ক্যাশিয়ারের স্বাক্ষর'}
                </span>
                <span className={`text-[9px] font-semibold block ${
                  isTxPending ? 'text-amber-600' : isTxRejected ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {isTxPending ? '(অনুমোদনের পর প্রযোজ্য)' : isTxRejected ? '(বাতিলকৃত লেনদেন)' : '(অনুমোদিত কর্মকর্তা)'}
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
    </div>
  );
};
