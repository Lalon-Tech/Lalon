import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Save, 
  Layers, 
  Coins, 
  CreditCard, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  User, 
  Briefcase,
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileSignature,
  FileText,
  DollarSign,
  Info
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { Member, Gender, MemberStatus } from '../../types';
import { PhotoUploadField } from '../common/PhotoUploadField';
import { 
  formatCurrency, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { updateMember, settings, isUserAdmin, useBengaliDigits } = useSomiti();

  // Tab section
  const [activeTab, setActiveTab] = useState<'shares' | 'personal' | 'photo' | 'nominee'>('shares');

  // Basic Info
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nid, setNid] = useState('');
  const [dob, setDob] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [joiningDate, setJoiningDate] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');
  const [status, setStatus] = useState<MemberStatus>('active');
  const [notes, setNotes] = useState('');

  // Shares & Financials
  const [shareCount, setShareCount] = useState<number>(1);
  const [shareUnitPrice, setShareUnitPrice] = useState<number>(100);
  const [shareValue, setShareValue] = useState<number>(1000);
  const [admissionFee, setAdmissionFee] = useState<number>(0);
  const [generalSavingsBalance, setGeneralSavingsBalance] = useState<number>(0);
  const [dpsSavingsBalance, setDpsSavingsBalance] = useState<number>(0);
  const [fdrSavingsBalance, setFdrSavingsBalance] = useState<number>(0);
  const [activeLoanBalance, setActiveLoanBalance] = useState<number>(0);

  // Nominee Info
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [nomineeNid, setNomineeNid] = useState('');
  const [nomineeAddress, setNomineeAddress] = useState('');
  const [nomineePercentage, setNomineePercentage] = useState<number>(100);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setNameEn(member.nameEn || '');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setNid(member.nid || '');
      setDob(member.dob || '');
      setOccupation(member.occupation || '');
      setMonthlyIncome(member.monthlyIncome || 0);
      setJoiningDate(member.joiningDate || '');
      setGender(member.gender || 'male');
      setFatherName(member.fatherName || '');
      setMotherName(member.motherName || '');
      setSpouseName(member.spouseName || '');
      setPresentAddress(member.presentAddress || '');
      setPermanentAddress(member.permanentAddress || '');
      setPhotoUrl(member.photoUrl || '');
      setSignatureUrl(member.signatureUrl || '');
      setStatus(member.status || 'active');
      setNotes(member.notes || '');

      const unit = settings.sharePricePerUnit || 1000;
      setShareUnitPrice(unit);
      setShareCount(member.shareCount ?? 1);
      setShareValue(member.shareValue ?? ((member.shareCount ?? 1) * unit));
      setAdmissionFee(member.admissionFee || 0);

      setGeneralSavingsBalance(member.generalSavingsBalance || 0);
      setDpsSavingsBalance(member.dpsSavingsBalance || 0);
      setFdrSavingsBalance(member.fdrSavingsBalance || 0);
      setActiveLoanBalance(member.activeLoanBalance || 0);

      const nom = member.nominees?.[0];
      setNomineeName(nom?.name || '');
      setNomineeRelation(nom?.relation || (isBn ? 'স্ত্রী' : 'Spouse'));
      setNomineePhone(nom?.phone || '');
      setNomineeNid(nom?.nid || '');
      setNomineeAddress(nom?.address || member.presentAddress || '');
      setNomineePercentage(nom?.percentage || 100);

      setSavedSuccess(false);
      setErrorMessage('');
    }
  }, [member, settings.sharePricePerUnit, isBn]);

  if (!isOpen || !member) return null;

  const handleShareCountChange = (count: number) => {
    const validCount = Math.max(0, count);
    setShareCount(validCount);
    setShareValue(validCount * shareUnitPrice);
  };

  const handleUnitPriceChange = (price: number) => {
    const validPrice = Math.max(0, price);
    setShareUnitPrice(validPrice);
    setShareValue(shareCount * validPrice);
  };

  // Total savings strictly represents accumulated deposit balances (general + dps + fdr), share value is fixed equity
  const calculatedTotalSavings = 
    Number(generalSavingsBalance || 0) + 
    Number(dpsSavingsBalance || 0) + 
    Number(fdrSavingsBalance || 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে সদস্যের নাম দিন।' : 'Please enter member name.');
      setActiveTab('personal');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে মোবাইল নম্বর দিন।' : 'Please enter phone number.');
      setActiveTab('personal');
      return;
    }

    const updatedNominees = member.nominees && member.nominees.length > 0 ? [
      {
        ...member.nominees[0],
        name: nomineeName.trim() || member.nominees[0].name,
        relation: nomineeRelation.trim() || member.nominees[0].relation,
        phone: nomineePhone.trim() || member.nominees[0].phone,
        nid: nomineeNid.trim() || member.nominees[0].nid,
        address: nomineeAddress.trim() || member.nominees[0].address || presentAddress,
        percentage: Number(nomineePercentage) || 100,
      },
      ...member.nominees.slice(1)
    ] : [
      {
        id: `nom-${Date.now()}`,
        name: nomineeName.trim() || (isBn ? 'নমিনি' : 'Nominee'),
        relation: nomineeRelation.trim() || (isBn ? 'পরিবার' : 'Family'),
        phone: nomineePhone.trim(),
        nid: nomineeNid.trim(),
        address: nomineeAddress.trim() || presentAddress,
        percentage: Number(nomineePercentage) || 100,
      }
    ];

    try {
      updateMember(member.id, {
        name: name.trim(),
        nameEn: nameEn.trim(),
        phone: phone.trim(),
        email: email.trim(),
        nid: nid.trim(),
        dob: dob.trim(),
        occupation: occupation.trim(),
        monthlyIncome: Number(monthlyIncome) || 0,
        joiningDate: joiningDate || member.joiningDate,
        gender,
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        spouseName: spouseName.trim(),
        presentAddress: presentAddress.trim(),
        permanentAddress: permanentAddress.trim(),
        photoUrl,
        signatureUrl,
        status,
        notes: notes.trim(),
        shareCount: Number(shareCount),
        shareValue: Number(shareValue),
        admissionFee: Number(admissionFee),
        generalSavingsBalance: Number(generalSavingsBalance),
        dpsSavingsBalance: Number(dpsSavingsBalance),
        fdrSavingsBalance: Number(fdrSavingsBalance),
        activeLoanBalance: Number(activeLoanBalance),
        totalSavings: calculatedTotalSavings,
        nominees: updatedNominees,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err?.message || (isBn ? 'তথ্য সংরক্ষণ করতে সমস্যা হয়েছে।' : 'Failed to update member information.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-xs">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {isBn ? 'সদস্য তথ্য ও শেয়ার সংশোধন' : 'Edit Member Info & Shares'}
                </h3>
                <span className="font-mono bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded text-xs font-bold border border-blue-400/30">
                  {member.memberNo}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {member.name} {member.phone ? `• ${member.phone}` : ''}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-1 border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('shares')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shares'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isBn ? 'শেয়ার ও ব্যালেন্স সংশোধন' : 'Shares & Balances'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isBn ? 'ব্যক্তিগত ও যোগাযোগ তথ্য' : 'Personal & Contact'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'photo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSignature className="w-3.5 h-3.5" />
            <span>{isBn ? 'ছবি ও স্বাক্ষর' : 'Photo & Signature'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nominee')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'nominee'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isBn ? 'নমিনি ও মন্তব্য' : 'Nominee & Notes'}</span>
          </button>
        </div>

        {/* Notification alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-semibold shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{isBn ? 'সদস্য তথ্য ও শেয়ার সফলভাবে আপডেট করা হয়েছে!' : 'Member information and shares updated successfully!'}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: SHARES & BALANCES */}
          {activeTab === 'shares' && (
            <div className="space-y-5">
              {/* Highlighted Share Capital Box */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 rounded-2xl p-4.5 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-900">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>{isBn ? 'শেয়ার মূলধন সংশোধন ও হিসাব' : 'Share Capital Modification'}</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-800 bg-blue-100/90 px-2.5 py-0.5 rounded-md">
                    {isBn ? 'সদস্যের মূল শেয়ার ক্যাপিটাল' : 'Member Share Capital'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'সক্রিয় শেয়ার সংখ্যা (টি)' : 'Active Share Count'} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={shareCount}
                      onChange={(e) => handleShareCountChange(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {isBn ? 'সদস্যের সক্রিয় শেয়ার সংখ্যা (যেমন: ১, ২, ৪ ইত্যাদি)' : 'Active share count of this member'}
                    </span>
                  </div>

                  <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
                    <span className="text-[11px] text-slate-500 font-medium">সঞ্চয় ও জমা নীতি:</span>
                    <span className="text-xs font-semibold text-slate-700 mt-0.5">
                      সদস্য যখন ভাউচারের মাধ্যমে টাকা জমা (Deposit) করবেন, শুধুমাত্র তখনই মূল সঞ্চয় ব্যালেন্সে মোট জমা বৃদ্ধি পাবে।
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    {isBn 
                      ? 'টিপস: কোনো সদস্যের শেয়ার সংখ্যা ভুল এন্ট্রি হলে (যেমন ২ টি শেয়ারের জায়গায় ৫০ টি) এখান থেকে সঠিক সংখ্যা বসিয়ে সেভ করলেই সফটওয়্যারের সর্বমোট শেয়ার মূলধন ও ব্যালেন্স সাথে সাথে ঠিক হয়ে যাবে।' 
                      : 'Tip: If a member’s shares were misentered, correcting the count here immediately recalculates total share capital, equity balances, and reports.'}
                  </p>
                </div>
              </div>

              {/* Financial Balances Section (Admin control) */}
              <div className="border border-slate-200 rounded-2xl p-4.5 space-y-3.5 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>{isBn ? 'সঞ্চয় ও ঋণ স্থিতি সমন্বয় (অ্যাডমিন কন্ট্রোল)' : 'Savings & Loan Balance Adjustments'}</span>
                  </div>
                  {!isUserAdmin && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                      {isBn ? 'শুধুমাত্র অ্যাডমিন সংশোধন করতে পারেন' : 'Admin Only'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'সাধারণ সঞ্চয় স্থিতি (৳)' : 'General Savings (৳)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      disabled={!isUserAdmin}
                      value={generalSavingsBalance}
                      onChange={(e) => setGeneralSavingsBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'ডিপিএস সঞ্চয় স্থিতি (৳)' : 'DPS Savings (৳)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      disabled={!isUserAdmin}
                      value={dpsSavingsBalance}
                      onChange={(e) => setDpsSavingsBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'এফডিআর সঞ্চয় স্থিতি (৳)' : 'FDR Savings (৳)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      disabled={!isUserAdmin}
                      value={fdrSavingsBalance}
                      onChange={(e) => setFdrSavingsBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'চলতি ঋণ স্থিতি (৳)' : 'Active Loan Balance (৳)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      disabled={!isUserAdmin}
                      value={activeLoanBalance}
                      onChange={(e) => setActiveLoanBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-rose-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Summary total display */}
                <div className="pt-2 flex items-center justify-between text-xs bg-slate-100 px-3.5 py-2 rounded-xl font-bold">
                  <span className="text-slate-700">{isBn ? 'সদস্যের সর্বমোট সঞ্চয় স্থিতি:' : 'Total Calculated Savings:'}</span>
                  <span className="text-emerald-700 text-sm font-extrabold font-mono">
                    {formatCurrency(calculatedTotalSavings, isBn && useBengaliDigits)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & CONTACT */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'সদস্যের নাম (বাংলা)' : 'Member Name (Bangla)'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'নাম (English)' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'মোবাইল নম্বর' : 'Phone Number'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'জাতীয় পরিচয়পত্র / NID' : 'National ID / NID'}
                  </label>
                  <input
                    type="text"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'লিঙ্গ' : 'Gender'}
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="male">{isBn ? 'পুরুষ (Male)' : 'Male'}</option>
                    <option value="female">{isBn ? 'মহিলা (Female)' : 'Female'}</option>
                    <option value="other">{isBn ? 'অন্যান্য (Other)' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'সদস্যপদ অবস্থা' : 'Membership Status'}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MemberStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="active">{isBn ? 'সক্রিয় সদস্য (Active)' : 'Active'}</option>
                    <option value="inactive">{isBn ? 'নিষ্ক্রিয় (Inactive)' : 'Inactive'}</option>
                    <option value="pending">{isBn ? 'অনুমোদন অপেক্ষমাণ (Pending)' : 'Pending'}</option>
                    <option value="defaulter">{isBn ? 'খেলাপি (Defaulter)' : 'Defaulter'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'পেশা' : 'Occupation'}
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'মাসিক আয় (৳)' : 'Monthly Income (৳)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'যোগদানের তারিখ' : 'Joining Date'}
                  </label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'পিতার নাম' : "Father's Name"}
                  </label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'মাতার নাম' : "Mother's Name"}
                  </label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'স্বামী / স্ত্রীর নাম' : "Spouse's Name"}
                  </label>
                  <input
                    type="text"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}
                  </label>
                  <input
                    type="text"
                    value={presentAddress}
                    onChange={(e) => setPresentAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
                  </label>
                  <input
                    type="text"
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PHOTO & SIGNATURE */}
          {activeTab === 'photo' && (
            <div className="space-y-6">
              <div>
                <PhotoUploadField
                  label={isBn ? 'সদস্যের ছবি' : 'Member Photo'}
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  helperText={isBn ? 'ডিভাইস থেকে ছবি আপলোড করুন অথবা ওয়েবক্যাম/স্যাম্পল ছবি বেছে নিন' : 'Upload photo from device or choose avatar'}
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'স্বাক্ষর / সই এর ইমেজ বা লিঙ্ক (Signature)' : 'Signature Image / Link'}
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={signatureUrl}
                  onChange={(e) => setSignatureUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                {signatureUrl && (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                    <img src={signatureUrl} alt="Signature Preview" className="max-h-16 object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NOMINEE & NOTES */}
          {activeTab === 'nominee' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'নমিনির নাম' : 'Nominee Name'}
                  </label>
                  <input
                    type="text"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'সম্পর্ক' : 'Relation'}
                  </label>
                  <input
                    type="text"
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'নমিনির মোবাইল নম্বর' : 'Nominee Phone'}
                  </label>
                  <input
                    type="tel"
                    value={nomineePhone}
                    onChange={(e) => setNomineePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'নমিনির NID' : 'Nominee NID'}
                  </label>
                  <input
                    type="text"
                    value={nomineeNid}
                    onChange={(e) => setNomineeNid(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'নমিনির ঠিকানা' : 'Nominee Address'}
                  </label>
                  <input
                    type="text"
                    value={nomineeAddress}
                    onChange={(e) => setNomineeAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'অংশীদারিত্বের হার (%)' : 'Share Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={nomineePercentage}
                    onChange={(e) => setNomineePercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'অতিরিক্ত প্রাতিষ্ঠানিক মন্তব্য / নোট' : 'Administrative Notes'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isBn ? 'সদস্য সম্পর্কে কোনো বিশেষ তথ্য বা রেকর্ড...' : 'Any special notes regarding this member...'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              {activeTab === 'shares' && (
                <span>
                  {isBn ? 'শেয়ার মূলধন:' : 'Share Capital:'} <strong className="text-blue-900">{formatCurrency(shareValue, isBn && useBengaliDigits)}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isBn ? 'সকল তথ্য ও শেয়ার সংরক্ষণ করুন' : 'Save Member & Shares'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
