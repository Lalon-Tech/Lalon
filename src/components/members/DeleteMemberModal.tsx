import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  User, 
  Phone, 
  Calendar, 
  Wallet, 
  CreditCard, 
  PieChart, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Member } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

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
  const { deleteMember, useBengaliDigits, loans, savingsSchemes, businessFundings } = useSomiti();

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const memberLoans = loans.filter(l => l.memberId === member.id && l.status === 'active');
  const activeLoanAmount = member.activeLoanBalance || memberLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
  const totalSavings = member.totalSavingsBalance || (member.generalSavingsBalance || 0) + (member.dpsSavingsBalance || 0) + (member.fdrSavingsBalance || 0);
  const shareCount = member.shareCount || 0;
  const hasActiveBusiness = businessFundings.some(b => b.memberId === member.id && b.status === 'active');

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await deleteMember(member.id);
      setIsDeleting(false);
      onClose();
      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      console.error('Failed to delete member:', err);
      setErrorMsg(isBn ? 'সদস্য মুছে ফেলতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to delete member. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 my-6">
        
        {/* Header */}
        <div className="p-4 bg-rose-50/80 border-b border-rose-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="p-2 bg-rose-100 rounded-xl border border-rose-200 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                {isBn ? 'সদস্য মুছে ফেলার নিশ্চিতকরণ' : 'Confirm Member Deletion'}
              </h3>
              <p className="text-[11px] text-rose-600">
                {isBn ? 'এই পদক্ষেপটি অপরিবর্তনীয়' : 'This action is irreversible'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          
          {/* Member Identity Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 font-black text-base flex items-center justify-center shrink-0 overflow-hidden border border-slate-300">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span>{member.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-sm text-slate-900 truncate">{member.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                  #{member.memberNo}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {member.phone || (isBn ? 'মোবাইল নেই' : 'No phone')}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatBengaliDate(member.joinDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Financial summary & warnings */}
          {(activeLoanAmount > 0 || totalSavings > 0 || shareCount > 0 || hasActiveBusiness) && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{isBn ? 'বিদ্যমান আর্থিক স্থিতি সতর্কতা:' : 'Existing Financial Balance Warning:'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                {activeLoanAmount > 0 && (
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">{isBn ? 'বকেয়া ঋণ' : 'Active Loan'}</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(activeLoanAmount, isBn && useBengaliDigits)}
                    </span>
                  </div>
                )}
                {totalSavings > 0 && (
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">{isBn ? 'মোট সঞ্চয় স্থিতি' : 'Total Savings'}</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(totalSavings, isBn && useBengaliDigits)}
                    </span>
                  </div>
                )}
                {shareCount > 0 && (
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">{isBn ? 'শেয়ার সংখ্যা' : 'Shares'}</span>
                    <span className="font-bold text-blue-700">
                      {isBn ? `${toBengaliNumber(shareCount)} টি` : `${shareCount} pcs`}
                    </span>
                  </div>
                )}
                {hasActiveBusiness && (
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">{isBn ? 'ব্যবসা বিনিয়োগ' : 'Business'}</span>
                    <span className="font-bold text-purple-700">
                      {isBn ? 'সক্রিয় রয়েছে' : 'Active'}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed pt-1">
                {isBn 
                  ? '⚠️ এই সদস্যকে মুছে ফেললে সদস্যের মূল প্রোফাইল এবং সম্পর্কিত ডাটা সিস্টেম থেকে বাদ দেওয়া হবে।'
                  : '⚠️ Deleting this member will remove the member profile and associated records from the database.'}
              </p>
            </div>
          )}

          <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
            {isBn 
              ? `আপনি কি নিশ্চিত যে ${member.name} (সদস্য নং: ${member.memberNo})-কে স্থায়ীভাবে মুছে ফেলতে চান?`
              : `Are you sure you want to permanently delete member ${member.name} (#${member.memberNo})?`}
          </p>

          {errorMsg && (
            <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            {isBn ? 'বাতিল করুন' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isBn ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'হ্যাঁ, সদস্য মুছে ফেলুন' : 'Yes, Delete Member'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
