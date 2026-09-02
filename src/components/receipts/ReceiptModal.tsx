import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  numberToBengaliWords, 
  getTransactionTypeName,
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const ReceiptModal: React.FC = () => {
  const { 
    selectedReceiptTx, 
    closeReceiptModal, 
    settings, 
    useBengaliDigits 
  } = useSomiti();

  if (!selectedReceiptTx) return null;

  const typeInfo = getTransactionTypeName(selectedReceiptTx.type);
  const amountInWords = numberToBengaliWords(selectedReceiptTx.amount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-6">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">মানি রসিদ প্রিভিউ (Official Money Receipt)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={closeReceiptModal}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-8 bg-white text-slate-800 space-y-6" id="printable-receipt">
          {/* Somiti Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 relative">
            <div className="inline-block border border-slate-300 bg-slate-50 px-3 py-0.5 rounded-full text-[11px] font-semibold text-slate-600 mb-1">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত
            </div>
            <h1 className="text-2xl font-black tracking-wide text-slate-900 uppercase">
              {settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              রেজিস্ট্রেশন নং: {settings.registrationNo} • {settings.address}
            </p>
            <p className="text-[11px] text-slate-500">
              মোবাইল: {settings.phone} • ইমেইল: {settings.email}
            </p>

            {/* Receipt Title Badge */}
            <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white text-xs font-bold uppercase rounded-md tracking-wider">
              {typeInfo.isCredit ? 'জমা রসিদ (Cash Receipt)' : 'প্রদান ভাউচার (Payment Voucher)'}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 text-xs border-b border-slate-200 pb-3 gap-2">
            <div>
              <span className="text-slate-500 font-medium">ভাউচার / রসিদ নং: </span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {selectedReceiptTx.voucherNo}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 font-medium">তারিখ ও সময়: </span>
              <span className="font-bold text-slate-900">
                {formatBengaliDate(selectedReceiptTx.date, false)}, {selectedReceiptTx.time}
              </span>
            </div>
          </div>

          {/* Member & Transaction Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">সদস্যের নাম:</span>
              <span className="font-bold text-slate-900 text-sm">
                {selectedReceiptTx.memberName || 'সাধারণ গ্রাহক'}
              </span>
            </div>
            {selectedReceiptTx.memberNo && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">সদস্য নম্বর:</span>
                <span className="font-mono font-bold text-blue-700">
                  {selectedReceiptTx.memberNo}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">লেনদেনের খাত / বিবরণ:</span>
              <span className="font-semibold text-slate-800">
                {typeInfo.label} {selectedReceiptTx.notes ? `(${selectedReceiptTx.notes})` : ''}
              </span>
            </div>
            {selectedReceiptTx.billingPeriod && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500">কিস্তির মাস ও বছর:</span>
                <span className="font-bold text-emerald-800">
                  {selectedReceiptTx.billingPeriod}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500">পরিশোধের মাধ্যম:</span>
              <span className="font-semibold uppercase text-slate-800">
                {selectedReceiptTx.paymentMethod}
              </span>
            </div>
            {selectedReceiptTx.selectedShares && selectedReceiptTx.selectedShares.length > 0 && (
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>পরিশোধিত শেয়ার ({toBengaliNumber(selectedReceiptTx.selectedShares.length)} টি):</span>
                  <span className="font-semibold">
                    {selectedReceiptTx.selectedShares.map(s => {
                      const sAmt = selectedReceiptTx.shareAmounts?.[s] || selectedReceiptTx.shareRate;
                      return sAmt ? `শেয়ার #${toBengaliNumber(s)} (৳${toBengaliNumber(sAmt)})` : `শেয়ার #${toBengaliNumber(s)}`;
                    }).join(', ')}
                  </span>
                </div>
                {selectedReceiptTx.unpaidShares && selectedReceiptTx.unpaidShares.length > 0 && (
                  <div className="flex items-center justify-between text-amber-800 font-semibold text-[11px] pt-1 border-t border-emerald-200/50">
                    <span>পরবর্তীতে প্রদেয় বকেয়া শেয়ার ({toBengaliNumber(selectedReceiptTx.unpaidShares.length)} টি):</span>
                    <span>{selectedReceiptTx.unpaidShares.map(s => `শেয়ার #${toBengaliNumber(s)}`).join(', ')}</span>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-slate-700 font-bold text-sm">আদায় / প্রদানের পরিমাণ:</span>
              <span className="font-extrabold text-emerald-800 text-lg">
                {formatCurrency(selectedReceiptTx.amount, useBengaliDigits)}
              </span>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-3 bg-slate-100 rounded-lg text-xs border border-slate-200">
            <span className="text-slate-500 font-semibold">কথায়: </span>
            <span className="font-bold text-slate-800 italic">
              {amountInWords}
            </span>
          </div>

          {/* Signatures */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                {selectedReceiptTx.memberName || 'সদস্যের স্বাক্ষর'}
              </div>
              <span className="text-[11px] text-slate-400">জমা প্রদানকারী / গ্রহীতার স্বাক্ষর</span>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1 font-bold text-slate-700">
                {selectedReceiptTx.collectedBy || 'দায়িত্বপ্রাপ্ত কর্মকর্তা'}
              </div>
              <span className="text-[11px] text-slate-400">ক্যাশিয়ার / অনুমোদনের স্বাক্ষর</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-400">
            * এটি বন্ধু সমবায় সমিতি লিমিটেড সফটওয়্যার দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত বৈধ রসিদ।
          </div>
        </div>
      </div>
    </div>
  );
};
