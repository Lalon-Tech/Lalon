import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  User, 
  Calendar, 
  Coins, 
  ShieldAlert, 
  Lock, 
  RotateCcw, 
  FileText, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Loan } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatCurrency } from '../../utils/bengaliUtils';

interface DeleteLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  onDeleted?: () => void;
}

export const DeleteLoanModal: React.FC<DeleteLoanModalProps> = ({
  isOpen,
  onClose,
  loan,
  onDeleted
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { deleteLoan, useBengaliDigits, transactions, currentUser } = useSomiti();

  const [mode, setMode] = useState<'safe_reversal' | 'permanent_delete'>('safe_reversal');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !loan) return null;

  // Authorization Check: Admin, President, Secretary only
  const isAuthorized = 
    currentUser?.role === 'admin' || 
    currentUser?.role === 'president' || 
    currentUser?.role === 'secretary';

  // Count associated transactions for this loan
  const relatedTransactions = transactions.filter(t => t.loanId === loan.id);
  const totalPaid = loan.paidAmount || 0;
  const remainingDue = loan.remainingAmount || 0;

  const handleDelete = async () => {
    setErrorMsg(null);

    if (!isAuthorized) {
      setErrorMsg(isBn ? 'অনুমতি নেই: শুধুমাত্র অনুমোদিত অ্যাডমিন বা সভাপতি ঋণ হিসাব ডিলিট বা রিভার্স করতে পারেন।' : 'Unauthorized: Only Admin or President can delete or reverse a loan account.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে ঋণ বাতিল বা অপসরণের কারণ উল্লেখ করুন।' : 'Please state a reason for this deletion/reversal.');
      return;
    }

    // If permanent delete, require typing loan number
    if (mode === 'permanent_delete' && confirmText.trim() !== loan.loanNo.trim()) {
      setErrorMsg(isBn ? `স্থায়ী অপসরণ নিশ্চিত করতে ঠিক "${loan.loanNo}" লিখুন।` : `Please type "${loan.loanNo}" to confirm permanent deletion.`);
      return;
    }

    setIsDeleting(true);
    try {
      const res = deleteLoan(loan.id, {
        mode,
        reason: reason.trim()
      });

      if (res.success) {
        setIsDeleting(false);
        onClose();
        if (onDeleted) onDeleted();
      } else {
        setIsDeleting(false);
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setIsDeleting(false);
      setErrorMsg(err?.message || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-4">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between text-white ${
          mode === 'permanent_delete' ? 'bg-rose-700' : 'bg-amber-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${mode === 'permanent_delete' ? 'bg-rose-800' : 'bg-amber-700'}`}>
              {mode === 'permanent_delete' ? (
                <Trash2 className="w-5 h-5 text-rose-100" />
              ) : (
                <RotateCcw className="w-5 h-5 text-amber-100" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>{isBn ? (mode === 'permanent_delete' ? 'ঋণ হিসাব স্থায়ী অপসরণ' : 'নিরাপদ ঋণ রিভার্সাল ও বাতিলকরণ') : (mode === 'permanent_delete' ? 'Permanent Delete Loan' : 'Safe Loan Reversal')}</span>
                <span className="font-mono text-xs px-2 py-0.5 bg-black/20 rounded border border-white/20">
                  {loan.loanNo}
                </span>
              </h3>
              <p className="text-xs text-white/90">
                {isBn ? `${loan.memberName} (${loan.memberNo || ''})` : loan.memberName}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-black/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Admin Permission Guard Alert */}
          {!isAuthorized ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">
                  {isBn ? 'প্রবেশাধিকার সংরক্ষিত (Admin Only)' : 'Admin-Only Access Required'}
                </p>
                <p className="text-xs mt-0.5 text-rose-700">
                  {isBn 
                    ? 'আর্থিক হিসাব সুরক্ষার জন্য শুধুমাত্র অ্যাডমিন বা সভাপতি ঋণ হিসাব ডিলিট বা রিভার্স করার অনুমতি রাখেন।'
                    : 'To protect financial integrity, only administrators or presidents may delete or reverse loans.'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Loan Financial Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              {isBn ? 'ঋণ হিসাবের বিদ্যমান স্থিতি ও লেনদেন' : 'Loan Status & Balances'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">{isBn ? 'মূল ঋণ:' : 'Principal:'}</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrency(loan.principalAmount, isBn && useBengaliDigits)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">{isBn ? 'মোট প্রদেয়:' : 'Total Payable:'}</span>
                <span className="text-xs font-bold text-slate-800">{formatCurrency(loan.totalAmount, isBn && useBengaliDigits)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">{isBn ? 'পরিশোধিত:' : 'Paid:'}</span>
                <span className="text-xs font-bold text-emerald-700">{formatCurrency(totalPaid, isBn && useBengaliDigits)}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">{isBn ? 'চলতি বকেয়া:' : 'Due Balance:'}</span>
                <span className="text-xs font-bold text-rose-600">{formatCurrency(remainingDue, isBn && useBengaliDigits)}</span>
              </div>
            </div>

            {relatedTransactions.length > 0 && (
              <p className="text-[11px] text-amber-800 mt-2.5 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                {isBn 
                  ? `এই ঋণের সাথে মোট ${relatedTransactions.length}টি লেজার লেনদেন (বিতরণ ও কিস্তি) সংযুক্ত রয়েছে।` 
                  : `This loan has ${relatedTransactions.length} recorded ledger transaction(s).`}
              </p>
            )}
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isBn ? 'কার্যপদ্ধতি নির্বাচন করুন' : 'Select Operation Mode'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('safe_reversal')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  mode === 'safe_reversal' 
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400/40' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <RotateCcw className={`w-4 h-4 ${mode === 'safe_reversal' ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">
                    {isBn ? 'নিরাপদ রিভার্সাল (প্রস্তাবিত)' : 'Safe Reversal (Recommended)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isBn 
                    ? 'ঋণটি অকার্যকর হিসেবে সংরক্ষিত থাকবে, বকেয়া ০ হবে, সদস্যের চলতি ঋণ সমন্বয় হবে এবং স্থায়ী অডিট ট্রেইল থাকবে।' 
                    : 'Cancels loan, resets due balance to 0, reconciles member balance, and preserves audit trail.'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode('permanent_delete')}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  mode === 'permanent_delete' 
                    ? 'border-rose-500 bg-rose-50/70 ring-2 ring-rose-400/40' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className={`w-4 h-4 ${mode === 'permanent_delete' ? 'text-rose-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">
                    {isBn ? 'স্থায়ী অপসরণ (Permanent Delete)' : 'Permanent Delete'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {isBn 
                    ? 'ডাটাবেজ থেকে ঋণ এবং সম্পর্কিত অনাথ লেনদেন সম্পূর্ণরূপে মুছে ফেলা হবে। সমস্ত লেজার ও ক্যাশ রিক্যালকুলেট হবে।' 
                    : 'Completely purges loan and associated transactions from database and ledger.'}
                </p>
              </button>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'বাতিল বা অপসরণের কারণ (বাধ্যতামূলক) *' : 'Reason for Deletion/Reversal (Mandatory) *'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder={isBn ? 'যেমন: সদস্য ঋণ গ্রহণ করেননি, ভুল এন্ট্রি সংশোধন...' : 'e.g. Mistaken duplicate entry, or loan canceled...'}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Permanent Delete Confirmation Input */}
          {mode === 'permanent_delete' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-bold text-rose-900">
                {isBn 
                  ? `নিশ্চিত করতে ঋণ নম্বর "${loan.loanNo}" টাইপ করুন:` 
                  : `Type "${loan.loanNo}" to confirm permanent deletion:`}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={loan.loanNo}
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-sm font-mono font-bold text-rose-900 focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || !isAuthorized}
              className={`px-5 py-2.5 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                mode === 'permanent_delete' 
                  ? 'bg-rose-600 hover:bg-rose-700' 
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isBn ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'Processing...'}</span>
                </>
              ) : mode === 'permanent_delete' ? (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>{isBn ? 'স্থায়ীভাবে মুছে ফেলুন' : 'Permanently Delete'}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>{isBn ? 'নিরাপদ রিভার্সাল সম্পন্ন করুন' : 'Execute Safe Reversal'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
