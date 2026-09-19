import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  Archive,
  ShieldCheck,
  Wallet,
  CreditCard,
  Building2,
  RotateCcw,
  Info
} from 'lucide-react';
import { Member } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onDeleted?: () => void;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onDeleted
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const {
    useBengaliDigits,
    deleteMember,
    loans,
    transactions
  } = useSomiti();

  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const isBengaliNum = isBn && useBengaliDigits;
  const num = (n: number | string) => (isBengaliNum ? toBengaliNumber(n) : n.toString());

  // Calculate member stats to reassure admin that records are preserved
  const memberLoans = loans.filter(l => l.memberId === member.id && l.status === 'active');
  const activeLoanTotal = member.activeLoanBalance || 0;
  const savingsTotal = member.totalSavings || 0;
  const sharesCount = member.shareCount || 0;

  const handleMoveToRecycleBin = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const success = await deleteMember(member.id, reason.trim() || undefined);
      if (success) {
        setIsDeleting(false);
        onClose();
        if (onDeleted) {
          onDeleted();
        }
      } else {
        setErrorMsg(
          isBn
            ? 'সদস্যকে রিসাইকেল বিনে স্থানান্তর করা সম্ভব হয়নি। আবার চেষ্টা করুন।'
            : 'Could not move member to Recycle Bin. Please try again.'
        );
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Failed to move member to Recycle Bin:', err);
      setErrorMsg(
        isBn
          ? 'সার্ভারে সমস্যা দেখা দিয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Server error. Please try again.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-member-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-fadeIn"
    >
      <div
        id="delete-member-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-amber-200/80 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))]"
      >
        {/* Header - Recycle Bin Theme */}
        <div className="p-4.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600/60 rounded-xl border border-amber-400/40 text-white">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isBn ? 'সদস্য রিসাইকেল বিনে স্থানান্তর' : 'Move Member to Recycle Bin'}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                {isBn ? 'তথ্য মুছে যাবে না, নিরাপদে সংরক্ষিত থাকবে' : 'No data will be lost, safely preserved'}
              </p>
            </div>
          </div>
          <button
            id="close-delete-member-modal-x"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-amber-200 hover:text-white hover:bg-amber-600/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Member Identity Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 font-black text-base flex items-center justify-center shrink-0 overflow-hidden border border-amber-200">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span>{member.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded">
                  {member.memberNo}
                </span>
                <h4 className="font-bold text-slate-800 text-sm truncate">{member.name}</h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {member.phone || (isBn ? 'ফোন নম্বর নেই' : 'No phone')} • {member.occupation || (isBn ? 'পেশা উল্লেখ নেই' : 'No occupation')}
              </p>
            </div>
          </div>

          {/* Safety & Preservation Guarantee Box */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isBn ? 'নিরাপদ রিসাইকেল বিন নিশ্চয়তা:' : 'Safe Recycle Bin Guarantee:'}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              <li>{isBn ? 'সদস্যের শেয়ার, সঞ্চয়, ঋণ, কিস্তি এবং সকল আর্থিক লেজার হিস্ট্রি অবিকল সংরক্ষিত থাকবে।' : 'Shares, deposits, loans, installments, and ledger history remain completely preserved.'}</li>
              <li>{isBn ? 'সক্রিয় সদস্য সংখ্যা ও স্বাভাবিক দৈনন্দিন হিসাবে এই সদস্যের প্রভাব পড়বে না।' : 'Will not affect active member count or regular day-to-day calculations.'}</li>
              <li>{isBn ? 'আপনি যেকোনো সময় রিসাইকেল বিন থেকে সদস্যকে পুনরায় আগের অবস্থায় পুনরুদ্ধার (Restore) করতে পারবেন।' : 'You can restore this member back to active status at any time.'}</li>
            </ul>
          </div>

          {/* Preserved Balances Summary */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">{isBn ? 'সংরক্ষিত শেয়ার' : 'Shares'}</span>
              <span className="text-xs font-bold text-slate-800">{num(sharesCount)} টি</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">{isBn ? 'সংরক্ষিত সঞ্চয়' : 'Savings'}</span>
              <span className="text-xs font-bold text-emerald-600">{formatCurrency(savingsTotal, isBengaliNum)}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] text-slate-500 font-semibold block">{isBn ? 'চলতি ঋণ স্থিতি' : 'Loan Due'}</span>
              <span className="text-xs font-bold text-rose-600">{formatCurrency(activeLoanTotal, isBengaliNum)}</span>
            </div>
          </div>

          {/* Optional Reason for Moving to Recycle Bin */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700">
              {isBn ? 'মুছে ফেলার / রিসাইকেল বিনে পাঠানোর কারণ (ঐচ্ছিক):' : 'Reason for removal (Optional):'}
            </label>
            <input
              id="recycle-bin-reason-input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isBn ? 'যেমন: এলাকা ত্যাগ, অনুরোধক্রমে ইত্যাদি' : 'e.g. Relocation, by request, etc.'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              disabled={isDeleting}
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            id="cancel-move-to-recycle-bin-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            id="confirm-move-to-recycle-bin-btn"
            type="button"
            onClick={handleMoveToRecycleBin}
            disabled={isDeleting}
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isBn ? 'স্থানান্তর করা হচ্ছে...' : 'Moving...'}</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>{isBn ? 'রিসাইকেল বিনে স্থানান্তর করুন' : 'Move to Recycle Bin'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
