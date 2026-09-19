import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { Member } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { toBengaliNumber } from '../../utils/bengaliUtils';

interface PermanentDeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onDeleted?: () => void;
  onPermanentlyDeleted?: () => void;
}

export const PermanentDeleteMemberModal: React.FC<PermanentDeleteMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onDeleted,
  onPermanentlyDeleted
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { permanentlyDeleteMember } = useSomiti();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const expectedConfirmText = member.memberNo;
  const isMatch = confirmText.trim().toLowerCase() === expectedConfirmText.toLowerCase();

  const handlePermanentDelete = async () => {
    if (!isMatch) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const success = await permanentlyDeleteMember(member.id);
      if (success) {
        setIsDeleting(false);
        onClose();
        if (onPermanentlyDeleted) {
          onPermanentlyDeleted();
        } else if (onDeleted) {
          onDeleted();
        }
      } else {
        setErrorMsg(
          isBn
            ? 'স্থায়ীভাবে মুছে ফেলা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Could not permanently delete member. Please try again.'
        );
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Failed to permanently delete member:', err);
      setErrorMsg(
        isBn
          ? 'সার্ভারে ত্রুটি দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          : 'Server error encountered. Please try again.'
      );
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="permanent-delete-member-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-fadeIn"
    >
      <div
        id="permanent-delete-member-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))]"
      >
        {/* Danger Header */}
        <div className="p-4.5 bg-rose-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-700/80 rounded-xl border border-rose-500 text-rose-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black">
                {isBn ? 'স্থায়ীভাবে মুছে ফেলার সতর্কতা' : 'Permanent Deletion Warning'}
              </h3>
              <p className="text-xs text-rose-100 font-medium">
                {isBn ? 'এই তথ্য আর কখনোই উদ্ধার করা যাবে না' : 'This data cannot be recovered'}
              </p>
            </div>
          </div>
          <button
            id="close-permanent-delete-modal-x"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-rose-200 hover:text-white hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Member Card */}
          <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 font-black text-base flex items-center justify-center shrink-0 overflow-hidden border border-rose-300">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span>{member.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-rose-200 text-rose-800 rounded">
                  {member.memberNo}
                </span>
                <h4 className="font-bold text-slate-800 text-sm truncate">{member.name}</h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{member.phone || 'ফোন নম্বর নেই'}</p>
            </div>
          </div>

          {/* Warning Message Box */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{isBn ? 'চিরতরে মুছে ফেলার ফলাফল:' : 'Consequences of permanent deletion:'}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              <li>{isBn ? 'সদস্যের মূল প্রোফাইল চিরতরে ডাটাবেস থেকে মুছে যাবে।' : 'Member profile will be permanently deleted from database.'}</li>
              <li>{isBn ? 'সংশ্লিষ্ট সঞ্চয়, শেয়ার এবং ঋণের সকল তথ্য মুছে যাবে।' : 'All associated savings, shares, and loan records will be deleted.'}</li>
              <li>{isBn ? 'রিসাইকেল বিন থেকেও আর পুনরুদ্ধার করা যাবে না।' : 'Cannot be restored from Recycle Bin anymore.'}</li>
            </ul>
          </div>

          {/* Type to Confirm Field */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-700">
              {isBn ? (
                <>নিশ্চিত করতে সদস্য নম্বর <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{expectedConfirmText}</span> লিখুন:</>
              ) : (
                <>Type member number <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">{expectedConfirmText}</span> to confirm:</>
              )}
            </label>
            <input
              id="confirm-permanent-delete-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={expectedConfirmText}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
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
            id="cancel-permanent-delete-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isBn ? 'বাতিল করুন' : 'Cancel'}
          </button>
          <button
            id="submit-permanent-delete-btn"
            type="button"
            onClick={handlePermanentDelete}
            disabled={!isMatch || isDeleting}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
              isMatch && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isDeleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{isBn ? 'স্থায়ীভাবে মুছে ফেলুন' : 'Permanently Delete'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
