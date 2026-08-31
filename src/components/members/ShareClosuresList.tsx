import React, { useState } from 'react';
import { Archive, Search, FileText, CheckCircle, Calendar, ShieldCheck, DollarSign, ArrowRight, UserCheck, AlertCircle, Info, ExternalLink, Printer } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { ShareClosure } from '../../types';
import { formatCurrency, formatBengaliDate, formatBengaliNumber } from '../../utils/bengaliUtils';

interface ShareClosuresListProps {
  memberId?: string; // If provided, filter for that member
  onOpenClosureModal?: (memberId?: string) => void;
}

export const ShareClosuresList: React.FC<ShareClosuresListProps> = ({
  memberId,
  onOpenClosureModal,
}) => {
  const {
    shareClosures,
    members,
    transactions,
    openReceiptForTx,
    useBengaliDigits,
    setSelectedMemberId,
    setActiveTab,
  } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClosure, setSelectedClosure] = useState<ShareClosure | null>(null);

  const filteredClosures = shareClosures.filter(c => {
    if (memberId && c.memberId !== memberId) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.memberName.toLowerCase().includes(term) ||
      c.memberNo.toLowerCase().includes(term) ||
      c.voucherNo.toLowerCase().includes(term) ||
      (c.notes && c.notes.toLowerCase().includes(term))
    );
  });

  const totalClosedShares = filteredClosures.reduce((sum, c) => sum + (c.closedSharesCount || 0), 0);
  const totalPrincipalRefunded = filteredClosures.reduce((sum, c) => sum + (c.principalAmount || 0), 0);
  const totalProfitDistributed = filteredClosures.reduce((sum, c) => sum + (c.profitAmount || 0), 0);
  const totalRefundAmount = filteredClosures.reduce((sum, c) => sum + (c.totalRefundAmount || 0), 0);

  const handlePrintReceipt = (closure: ShareClosure) => {
    const tx = transactions.find(t => t.voucherNo === closure.voucherNo || (t.type === 'share_surrender' && t.date === closure.closureDate && t.memberId === closure.memberId));
    if (tx) {
      openReceiptForTx(tx);
    } else {
      // Fallback synthetic tx
      openReceiptForTx({
        id: closure.id,
        voucherNo: closure.voucherNo,
        memberId: closure.memberId,
        memberName: closure.memberName,
        memberNo: closure.memberNo,
        type: 'share_surrender',
        amount: closure.totalRefundAmount,
        date: closure.closureDate,
        time: '12:00 PM',
        paymentMethod: closure.paymentMethod,
        collectedBy: closure.handledBy,
        notes: closure.notes,
        status: 'completed',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-300">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">শেয়ার ক্লোজার ও সমর্পণ স্থায়ী আর্কাইভ</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  নিষ্ক্রিয় সংরক্ষিত রেকর্ড
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {memberId 
                  ? 'এই সদস্যের পূর্বে নিষ্পত্তিকৃত ও বন্ধকৃত শেয়ারের সংরক্ষিত তথ্য'
                  : 'সমিতির সকল সদস্যের বন্ধকৃত ও সমর্পণকৃত শেয়ারের স্থায়ী অডিট ট্রেইল'}
              </p>
            </div>
          </div>

          {onOpenClosureModal && (
            <button
              onClick={() => onOpenClosureModal(memberId)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Archive className="w-4 h-4" />
              <span>নতুন শেয়ার ক্লোজ করুন</span>
            </button>
          )}
        </div>

        {/* Aggregated Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-slate-400 block">মোট ক্লোজকৃত শেয়ার</span>
            <span className="text-base font-bold text-amber-300">
              {formatBengaliNumber(totalClosedShares, useBengaliDigits)} টি
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-slate-400 block">মোট মূলধন ফেরত</span>
            <span className="text-base font-bold text-slate-200">
              {formatCurrency(totalPrincipalRefunded, useBengaliDigits)}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-slate-400 block">প্রদত্ত লভ্যাংশ/লাভ</span>
            <span className="text-base font-bold text-emerald-300">
              {formatCurrency(totalProfitDistributed, useBengaliDigits)}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-xl border border-white/5">
            <span className="text-[11px] text-slate-400 block">মোট পরিশোধিত অর্থ</span>
            <span className="text-base font-bold text-rose-300">
              {formatCurrency(totalRefundAmount, useBengaliDigits)}
            </span>
          </div>
        </div>
      </div>

      {/* Info notice about separate storage */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">পৃথক স্টোরেজ নীতি:</span>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            এখানে রক্ষিত বন্ধকৃত শেয়ারের তথ্য শুধুমাত্র অডিট ও রেফারেন্সের জন্য পৃথক সংগ্রহে সংরক্ষিত। এটি সমিতির বর্তমান সক্রিয় আর্থিক স্থিতি বা সদস্যের বিদ্যমান সক্রিয় শেয়ারের হিসাবে কোনো বিভ্রান্তি ঘটায় না।
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      {!memberId && (
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="সদস্যের নাম, নম্বর বা ভাউচার দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap font-medium">
            মোট রেকর্ড: {formatBengaliNumber(filteredClosures.length, useBengaliDigits)} টি
          </span>
        </div>
      )}

      {/* Closures Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">তারিখ</th>
                <th className="py-3 px-3.5">ভাউচার নং</th>
                {!memberId && <th className="py-3 px-3.5">সদস্যের বিবরণ</th>}
                <th className="py-3 px-3.5 text-center">বন্ধকৃত শেয়ার</th>
                <th className="py-3 px-3.5 text-right">মূলধন ফেরত (৳)</th>
                <th className="py-3 px-3.5 text-right">লভ্যাংশ/মুনাফা (৳)</th>
                <th className="py-3 px-3.5 text-right font-bold text-slate-800">মোট প্রদেয় (৳)</th>
                <th className="py-3 px-3.5 text-center">অবশিষ্ট সক্রিয় শেয়ার</th>
                <th className="py-3 px-3.5">দায়িত্বপ্রাপ্ত</th>
                <th className="py-3 px-3.5 text-center">রসিদ ও বিবরণ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClosures.length === 0 ? (
                <tr>
                  <td colSpan={memberId ? 9 : 10} className="py-10 text-center text-slate-400">
                    <div className="space-y-2">
                      <Archive className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-medium">
                        {memberId 
                          ? 'এই সদস্যের এখনো কোনো শেয়ার বন্ধ বা সমর্পণ করার রেকর্ড নেই।' 
                          : 'কোনো শেয়ার ক্লোজার বা সমর্পণের রেকর্ড পাওয়া যায়নি।'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClosures.map((closure) => (
                  <tr key={closure.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5 font-medium whitespace-nowrap">
                      {formatBengaliDate(closure.closureDate, true)}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-700">
                      {closure.voucherNo}
                    </td>
                    {!memberId && (
                      <td className="py-3 px-3.5">
                        <button
                          onClick={() => {
                            setSelectedMemberId(closure.memberId);
                            setActiveTab('members');
                          }}
                          className="font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{closure.memberName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({closure.memberNo})</span>
                        </button>
                      </td>
                    )}
                    <td className="py-3 px-3.5 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        {formatBengaliNumber(closure.closedSharesCount, useBengaliDigits)} টি
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-medium">
                      {formatCurrency(closure.principalAmount, useBengaliDigits)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-semibold text-emerald-700">
                      + {formatCurrency(closure.profitAmount, useBengaliDigits)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-rose-700">
                      {formatCurrency(closure.totalRefundAmount, useBengaliDigits)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {formatBengaliNumber(closure.remainingActiveShares, useBengaliDigits)} টি
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-500 whitespace-nowrap">
                      {closure.handledBy || 'Admin'}
                    </td>
                    <td className="py-3 px-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handlePrintReceipt(closure)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          title="ভাউচার রসিদ"
                        >
                          <Printer className="w-3 h-3" />
                          <span>রসিদ</span>
                        </button>
                        <button
                          onClick={() => setSelectedClosure(closure)}
                          className="px-2 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          title="বিস্তারিত বিবরণ"
                        >
                          বিস্তারিত
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {selectedClosure && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Archive className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-bold text-sm">শেয়ার সমর্পণ ও নিষ্পত্তির বিস্তারিত তথ্য</h4>
                  <span className="text-[11px] text-slate-300 font-mono">{selectedClosure.voucherNo}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClosure(null)}
                className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">সদস্যের নাম:</span>
                  <span className="font-bold text-slate-800">{selectedClosure.memberName} ({selectedClosure.memberNo})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">নিষ্পত্তির তারিখ:</span>
                  <span className="font-bold text-slate-800">{formatBengaliDate(selectedClosure.closureDate, true)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">বন্ধকৃত শেয়ার সংখ্যা:</span>
                  <span className="font-bold text-rose-600">{formatBengaliNumber(selectedClosure.closedSharesCount, useBengaliDigits)} টি</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">প্রতি শেয়ার মূল্যমান:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedClosure.unitPrice, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">ফেরতকৃত মূলধন:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(selectedClosure.principalAmount, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">প্রদত্ত মুনাফা / লভ্যাংশ:</span>
                  <span className="font-bold text-emerald-600">+ {formatCurrency(selectedClosure.profitAmount, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200 text-slate-900 bg-rose-50/60 -mx-4 px-4 rounded">
                  <span className="font-bold">সদস্যকে মোট প্রদেয় অর্থ:</span>
                  <span className="font-black text-rose-700 text-sm">{formatCurrency(selectedClosure.totalRefundAmount, useBengaliDigits)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">পরিশোধের মাধ্যম:</span>
                  <span className="font-bold uppercase text-slate-800">{selectedClosure.paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">অবশিষ্ট সক্রিয় শেয়ার:</span>
                  <span className="font-bold text-blue-700">{formatBengaliNumber(selectedClosure.remainingActiveShares, useBengaliDigits)} টি</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">দায়িত্বপ্রাপ্ত কর্মকর্তা:</span>
                  <span className="font-bold text-slate-800">{selectedClosure.handledBy}</span>
                </div>
              </div>

              {selectedClosure.notes && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-slate-700">
                  <span className="font-bold text-amber-900 block mb-0.5">মন্তব্য:</span>
                  <p>{selectedClosure.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClosure(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePrintReceipt(selectedClosure);
                    setSelectedClosure(null);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>রসিদ প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
