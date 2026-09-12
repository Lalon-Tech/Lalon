import React, { useState } from 'react';
import { X, CreditCard, Calculator, FileSignature, CheckCircle, ShieldCheck, Phone } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';

export interface NewLoanModalProps { 
  isOpen: boolean; 
  onClose: () => void;
  initialMemberId?: string;
  lockMember?: boolean;
}

export const NewLoanModal: React.FC<NewLoanModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMemberId,
  lockMember 
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    bankAccounts, 
    applyForLoan, 
    settings, 
    useBengaliDigits,
    selectedMemberId
  } = useSomiti();

  const isMemberLocked = lockMember !== undefined ? lockMember : Boolean(initialMemberId || selectedMemberId);
  const effectiveTargetId = (initialMemberId && members.some(m => m.id === initialMemberId))
    ? initialMemberId
    : (selectedMemberId && members.some(m => m.id === selectedMemberId))
      ? selectedMemberId
      : (members[0]?.id || '');

  const [selectedId, setSelectedId] = useState(effectiveTargetId);
  const memberId = isMemberLocked ? effectiveTargetId : (selectedId || effectiveTargetId);
  const setMemberId = setSelectedId;
  const currentMember = members.find(m => m.id === memberId);

  // Sync memberId with active member whenever modal opens
  React.useEffect(() => {
    const targetId = initialMemberId || selectedMemberId;
    if (targetId && members.some(m => m.id === targetId)) {
      setSelectedId(targetId);
    }
  }, [isOpen, initialMemberId, selectedMemberId, members]);
  const [principalAmount, setPrincipalAmount] = useState<number>(50000);
  const [interestRate, setInterestRate] = useState<number>(settings.defaultLoanInterestRate || 12);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [installmentFrequency, setInstallmentFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [purpose, setPurpose] = useState(isBn ? 'ব্যবসায়িক চলতি মূলধন' : 'Working Capital Investment');
  const [guarantorMemberId, setGuarantorMemberId] = useState(members[1]?.id || '');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState(isBn ? 'সমিতি সদস্য' : 'Society Member');
  const [disbursementMethod, setDisbursementMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [processingFee, setProcessingFee] = useState<number>(500);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  if (!isOpen) return null;

  // Real-time calculation
  const totalInterest = (principalAmount * (interestRate / 100));
  const totalPayable = principalAmount + totalInterest;

  let totalInstallments = termMonths;
  if (installmentFrequency === 'weekly') totalInstallments = termMonths * 4;
  if (installmentFrequency === 'daily') totalInstallments = termMonths * 30;

  const perInstallment = Math.ceil(totalPayable / (totalInstallments || 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || principalAmount <= 0) {
      alert(isBn ? 'সদস্য ও সঠিক ঋণের পরিমাণ পূরণ করুন।' : 'Please select member and enter valid loan amount.');
      return;
    }

    const res = applyForLoan({
      memberId,
      principalAmount: Number(principalAmount),
      interestRate: Number(interestRate),
      termMonths: Number(termMonths),
      installmentFrequency,
      purpose: purpose.trim(),
      guarantorMemberId: guarantorMemberId || undefined,
      guarantorName: guarantorName.trim() || undefined,
      guarantorPhone: guarantorPhone.trim() || undefined,
      guarantorRelation: guarantorRelation.trim() || undefined,
      disbursementMethod,
      bankAccountId: disbursementMethod === 'bank' ? bankAccountId : undefined,
      processingFee: Number(processingFee) || 0,
    });

    if (!res.success) {
      alert(res.message);
      return;
    }

    alert(isBn ? 'ঋণের আবেদন সফলভাবে জমা হয়েছে! আবেদনটি পেন্ডিং অবস্থায় আছে, অ্যাডমিন অনুমোদন করার পর ঋণ বিতরণ কার্যকর হবে।' : 'Loan application submitted successfully! It is now pending and will be disbursed once approved by Admin.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-6">
        {/* Header */}
        <div className="bg-indigo-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-700 rounded-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {isMemberLocked && currentMember
                  ? (isBn ? `${currentMember.name}-এর ঋণ আবেদন` : `New Loan for ${currentMember.name}`)
                  : (isBn ? 'নতুন ঋণের আবেদন (Loan Application)' : 'New Loan Application')}
              </h3>
              <p className="text-xs text-indigo-200">
                {isMemberLocked && currentMember
                  ? (isBn ? `সদস্য নং: #${currentMember.memberNo} • ঋণ মঞ্জুরি ও কিস্তি নির্ধারণ` : `Member #${currentMember.memberNo} • Loan Grant & Schedule`)
                  : (isBn ? 'আবেদন জমাদানের পর অ্যাডমিন অনুমোদনের অপেক্ষায় থাকবে' : 'Application will be pending until Admin approval')}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-lg text-indigo-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Member Selection or Dedicated Member Account */}
          {isMemberLocked && currentMember ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {isBn ? 'ঋণগ্রহীতা সদস্যের নিজস্ব একাউন্ট' : 'Borrower Member Account'}
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    {isBn ? 'নির্দিষ্ট একাউন্ট' : 'Locked Account'}
                  </span>
                </div>

                {/* Dedicated Member Identity Card */}
                <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-white rounded-xl border border-indigo-200 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden border border-indigo-200">
                        {currentMember.photoUrl ? (
                          <img src={currentMember.photoUrl} alt={currentMember.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{currentMember.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 truncate">
                            {currentMember.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200">
                            #{currentMember.memberNo}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {currentMember.phone || (isBn ? 'মোবাইল নেই' : 'No phone')}
                          </span>
                          <span className="text-indigo-700 font-semibold">
                            {isBn ? 'শেয়ার:' : 'Shares:'} {displayCount(currentMember.shareCount || 0)} {isBn ? 'টি' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-medium block">
                        {isBn ? 'মোট সঞ্চয়' : 'Total Savings'}
                      </span>
                      <span className="text-sm font-black text-emerald-700 font-mono">
                        {formatCurrency(currentMember.totalSavings || 0, isBn && useBengaliDigits)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'ঋণের উদ্দেশ্য' : 'Loan Purpose'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? "যেমন: ব্যবসা সম্প্রসারণ" : "e.g., Business Expansion"}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'ঋণগ্রহীতা সদস্য' : 'Borrower Member'} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'ঋণের উদ্দেশ্য' : 'Loan Purpose'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? "যেমন: ব্যবসা সম্প্রসারণ" : "e.g., Business Expansion"}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'মূল ঋণের পরিমাণ (৳)' : 'Principal Amount (৳)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1000}
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'বার্ষিক লাভ / মুনাফার হার (%)' : 'Interest Rate (%)'}
              </label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'মেয়াদ (মাস)' : 'Term (Months)'}
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'কিস্তির ধরন / ফ্রিকোয়েন্সি' : 'Installment Frequency'}
              </label>
              <select
                value={installmentFrequency}
                onChange={(e) => setInstallmentFrequency(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="monthly">{isBn ? 'মাসিক কিস্তি (Monthly)' : 'Monthly'}</option>
                <option value="weekly">{isBn ? 'সাপ্তাহিক কিস্তি (Weekly)' : 'Weekly'}</option>
                <option value="daily">{isBn ? 'দৈনিক কিস্তি (Daily)' : 'Daily'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'ঋণ বিতরণ ফি (Processing Fee ৳)' : 'Processing Fee (৳)'}
              </label>
              <input
                type="number"
                min={0}
                value={processingFee}
                onChange={(e) => setProcessingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950 pb-1 border-b border-indigo-200">
              <Calculator className="w-4 h-4 text-indigo-700" />
              <span>{isBn ? 'ঋণ ও কিস্তি হিসাব বিবরণী' : 'Loan & Installment Calculation Breakdown'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block">{isBn ? 'মোট লাভ / মুনাফা:' : 'Total Interest:'}</span>
                <span className="font-bold text-slate-800">{formatCurrency(totalInterest, isBn && useBengaliDigits)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isBn ? 'সর্বমোট প্রদেয়:' : 'Total Payable:'}</span>
                <span className="font-bold text-indigo-900">{formatCurrency(totalPayable, isBn && useBengaliDigits)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isBn ? 'মোট কিস্তি সংখ্যা:' : 'Total Installments:'}</span>
                <span className="font-bold text-slate-800">{displayCount(totalInstallments)} {isBn ? 'টি' : ''}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isBn ? 'প্রতি কিস্তির পরিমাণ:' : 'Per Installment:'}</span>
                <span className="font-extrabold text-indigo-700 text-sm">{formatCurrency(perInstallment, isBn && useBengaliDigits)}</span>
              </div>
            </div>
          </div>

          {/* Guarantor Info */}
          <div className="border-t border-slate-200 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileSignature className="w-4 h-4 text-indigo-600" />
              <span>{isBn ? 'জামিনদার / গ্যারান্টার তথ্য' : 'Guarantor Information'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isBn ? 'সমিতির সদস্য জামিনদার' : 'Member Guarantor'}
                </label>
                <select
                  value={guarantorMemberId}
                  onChange={(e) => setGuarantorMemberId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="">{isBn ? 'বহিরাগত জামিনদার' : 'External Guarantor'}</option>
                  {members.filter(m => m.id !== memberId).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isBn ? 'জামিনদারের নাম' : "Guarantor's Name"}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? "যেমন: মোহাম্মদ রহিম" : "e.g., John Doe"}
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {isBn ? 'জামিনদারের মোবাইল' : "Guarantor's Phone"}
                </label>
                <input
                  type="tel"
                  placeholder={isBn ? "০১৭XXXXXXXX" : "+88017XXXXXXXX"}
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Disbursement Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'বিতরণের মাধ্যম' : 'Disbursement Method'}
              </label>
              <select
                value={disbursementMethod}
                onChange={(e) => setDisbursementMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="cash">{isBn ? 'নগদ ক্যাশ (Cash)' : 'Cash'}</option>
                <option value="bank">{isBn ? 'ব্যাংক ট্রান্সফার / চেক (Bank)' : 'Bank Transfer / Cheque'}</option>
              </select>
            </div>

            {disbursementMethod === 'bank' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'সমিতির প্রদানকারী ব্যাংক' : 'Society Bank Account'}
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isBn ? 'ঋণের আবেদন জমা দিন ✓' : 'Submit Loan Application ✓'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
