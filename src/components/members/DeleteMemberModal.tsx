import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  X, 
  Phone, 
  Calendar, 
  Wallet, 
  CreditCard, 
  Building2, 
  PieChart, 
  Clock, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Member } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';
import { validateMemberRemoval } from '../../utils/memberRemovalValidation';

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
    deleteMember, 
    useBengaliDigits, 
    loans, 
    savingsSchemes, 
    businessFundings,
    profitDistributions,
    businessProfitRecords,
    transactions,
    settings
  } = useSomiti();

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  // Run comprehensive financial validation
  const validation = validateMemberRemoval(member, {
    loans,
    savingsSchemes,
    businessFundings,
    profitDistributions,
    businessProfitRecords,
    transactions,
    settings
  });

  const handleDelete = async () => {
    if (!validation.canRemove) return;
    
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const success = await deleteMember(member.id);
      if (success) {
        setIsDeleting(false);
        onClose();
        if (onDeleted) {
          onDeleted();
        }
      } else {
        setErrorMsg(
          isBn 
            ? 'সদস্য মুছে ফেলা সম্ভব হয়নি। অনুগ্রহ করে সকল বকেয়া হিসাব পরীক্ষা করুন।' 
            : 'Could not delete member. Please verify all outstanding financial accounts.'
        );
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Failed to delete member:', err);
      setErrorMsg(
        isBn 
          ? 'সদস্য মুছে ফেলতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' 
          : 'Failed to delete member. Please try again.'
      );
      setIsDeleting(false);
    }
  };

  const getRecordIcon = (key: string) => {
    switch (key) {
      case 'deposit_savings':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'loan':
        return <CreditCard className="w-4 h-4 text-rose-600" />;
      case 'business_funding':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'profit_sharing':
        return <PieChart className="w-4 h-4 text-blue-600" />;
      case 'pending_tx':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  // =========================================================================
  // VIEW 1: CANNOT REMOVE MEMBER (Outstanding or pending records exist)
  // =========================================================================
  if (!validation.canRemove) {
    return (
      <div 
        id="cannot-remove-member-modal-overlay"
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      >
        <div 
          id="cannot-remove-member-modal-content"
          className="bg-white rounded-2xl shadow-2xl border border-rose-200/90 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 my-6"
        >
          {/* Header */}
          <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 rounded-xl border border-rose-200 text-rose-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">
                  {isBn ? 'সদস্য অপসারণ করা যাবে না' : 'Cannot Remove Member'}
                </h3>
                <p className="text-xs text-rose-700 font-medium">
                  {isBn 
                    ? 'অনিষ্পন্ন আর্থিক হিসাব বা দায়-দেনা বিদ্যমান' 
                    : 'Active or unsettled financial records exist'}
                </p>
              </div>
            </div>
            <button
              id="close-cannot-remove-modal-x"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-colors cursor-pointer"
              title={isBn ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            
            {/* Member Identity Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-slate-300">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{member.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 truncate">{member.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
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

            {/* Warning Message Statement */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">
                {isBn 
                  ? 'এই সদস্যকে অপসারণ করা যাবে না কারণ নিচের হিসাব/রেকর্ডসমূহ এখনও অনিষ্পন্ন রয়েছে:'
                  : 'This member cannot be removed because the following records are still pending:'}
              </p>
            </div>

            {/* Itemized Pending Records List */}
            <div className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              {validation.pendingRecords.map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                      {getRecordIcon(item.key)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-800">
                          {isBn ? item.labelBn : item.labelEn}
                        </span>
                        {item.count !== undefined && item.count > 1 && (
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                            {isBn ? `${toBengaliNumber(item.count)}টি` : `${item.count} items`}
                          </span>
                        )}
                      </div>
                      {(item.detailsBn || item.detailsEn) && (
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {isBn ? item.detailsBn : item.detailsEn}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <span className="text-xs font-bold text-rose-700 font-mono">
                      {formatCurrency(item.amount, isBn && useBengaliDigits)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Instruction callout banner */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed font-semibold">
                {isBn ? (
                  <>অনুগ্রহ করে সদস্য মুছে ফেলার পূর্বে সকল বকেয়া ও আর্থিক রেকর্ড সম্পূর্ণ নিষ্পত্তি করুন।</>
                ) : (
                  <>Please clear/settle all outstanding records before removing this member.</>
                )}
              </div>
            </div>

          </div>

          {/* Footer - Only OK / Close button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
            <button
              id="cannot-remove-ok-close-btn"
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {isBn ? 'ঠিক আছে / বন্ধ করুন' : 'OK / Close'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CONFIRM REMOVE MEMBER (All financial records are 0 and cleared)
  // =========================================================================
  return (
    <div 
      id="confirm-remove-member-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div 
        id="confirm-remove-member-modal-content"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in-50 zoom-in-95 my-6"
      >
        
        {/* Header */}
        <div className="p-4 bg-rose-50/80 border-b border-rose-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="p-2 bg-rose-100 rounded-xl border border-rose-200 text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                {isBn ? 'সদস্য অপসারণ নিশ্চিতকরণ' : 'Confirm Member Removal'}
              </h3>
              <p className="text-[11px] text-rose-600">
                {isBn ? 'এই পদক্ষেপটি অপরিবর্তনীয়' : 'This action is irreversible'}
              </p>
            </div>
          </div>
          <button
            id="close-confirm-remove-modal-x"
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

          {/* Cleared Status Confirmation Badge */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-900 font-medium">
              {isBn 
                ? 'সদস্যের সকল আর্থিক হিসাব ও লেনদেন সম্পূর্ণ নিষ্পত্তি হয়েছে (০ স্থিতি)।' 
                : 'All financial accounts and records are fully settled (৳0 balance).'}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
            {isBn 
              ? `আপনি কি নিশ্চিত যে ${member.name} (সদস্য নং: ${member.memberNo})-কে সদস্য তালিকা থেকে অপসারণ করতে চান? ঐতিহাসিক লেনদেন ও রিপোর্ট অপরিবর্তিত থাকবে।`
              : `Are you sure you want to remove member ${member.name} (#${member.memberNo}) from the member directory? Historical transaction records will remain in the accounting ledger.`}
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
            id="cancel-remove-member-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            id="confirm-remove-member-btn"
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isBn ? 'অপসারণ করা হচ্ছে...' : 'Removing...'}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'হ্যাঁ, সদস্য অপসারণ করুন' : 'Yes, Remove Member'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
