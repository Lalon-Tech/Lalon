import React, { useState } from 'react';
import { X, CreditCard, Calculator, FileSignature, CheckCircle } from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { PaymentMethod } from '../../types';
import { formatCurrency, toBengaliNumber } from '../../utils/bengaliUtils';

export const NewLoanModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { 
    members, 
    bankAccounts, 
    addLoan, 
    settings, 
    useBengaliDigits 
  } = useSomiti();

  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [principalAmount, setPrincipalAmount] = useState<number>(50000);
  const [interestRate, setInterestRate] = useState<number>(settings.defaultLoanInterestRate || 12);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [installmentFrequency, setInstallmentFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [purpose, setPurpose] = useState('ব্যবসায়িক চলতি মূলধন');
  const [guarantorMemberId, setGuarantorMemberId] = useState(members[1]?.id || '');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('সমিতি সদস্য');
  const [disbursementMethod, setDisbursementMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [processingFee, setProcessingFee] = useState<number>(500);

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
      alert('সদস্য ও সঠিক ঋণের পরিমাণ পূরণ করুন।');
      return;
    }

    addLoan({
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
              <h3 className="text-base font-bold">নতুন ঋণ অনুমোদন ও বিতরণ</h3>
              <p className="text-xs text-indigo-200">ঋণ হিসাব ও কিস্তি শিডিউল তৈরি</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-indigo-300 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ঋণগ্রহীতা সদস্য <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
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
                ঋণের উদ্দেশ্য
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: ব্যবসা সম্প্রসারণ"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মূল ঋণের পরিমাণ (৳) <span className="text-rose-500">*</span>
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
                বার্ষিক লাভ / মুনাফার হার (%)
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
                মেয়াদ (মাস)
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
                কিস্তির ধরন
              </label>
              <select
                value={installmentFrequency}
                onChange={(e) => setInstallmentFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              >
                <option value="monthly">মাসিক কিস্তি (Monthly)</option>
                <option value="weekly">সাপ্তাহিক কিস্তি (Weekly)</option>
                <option value="daily">দৈনিক কিস্তি (Daily)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ফরম ও প্রসেসিং ফি (৳)
              </label>
              <input
                type="number"
                value={processingFee}
                onChange={(e) => setProcessingFee(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Box */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase">
              <Calculator className="w-4 h-4" />
              <span>স্বয়ংক্রিয় কিস্তি ও মুনাফা হিসাব</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-700 pt-1">
              <div>
                <span className="text-slate-500 block">মোট মুনাফা:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(totalInterest, useBengaliDigits)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">মোট পরিশোধযোগ্য:</span>
                <span className="font-bold text-indigo-900">{formatCurrency(totalPayable, useBengaliDigits)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">মোট কিস্তি সংখ্যা:</span>
                <span className="font-bold">{toBengaliNumber(totalInstallments)} টি</span>
              </div>
              <div>
                <span className="text-slate-500 block">প্রতি কিস্তি প্রদেয়:</span>
                <span className="font-bold text-indigo-700 text-sm">{formatCurrency(perInstallment, useBengaliDigits)}</span>
              </div>
            </div>
          </div>

          {/* Guarantor Section */}
          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              জামিনদারের তথ্য (Guarantor)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সমিতির জামিনদার সদস্য নির্বাচন
                </label>
                <select
                  value={guarantorMemberId}
                  onChange={(e) => setGuarantorMemberId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <option value="">বহিরাগত জামিনদার</option>
                  {members.filter(m => m.id !== memberId).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {!guarantorMemberId && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      বহিরাগত জামিনদারের নাম
                    </label>
                    <input
                      type="text"
                      placeholder="জামিনদারের নাম"
                      value={guarantorName}
                      onChange={(e) => setGuarantorName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      মোবাইল নম্বর
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={guarantorPhone}
                      onChange={(e) => setGuarantorPhone(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              ঋণ বিতরণ নিশ্চিত করুন ও শিডিউল তৈরি করুন ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
