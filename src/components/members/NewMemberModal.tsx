import React, { useState, useEffect } from 'react';
import { X, UserPlus, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Gender } from '../../types';
import { PhotoUploadField } from '../common/PhotoUploadField';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { toBengaliNumber } from '../../utils/bengaliUtils';

interface NewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export const NewMemberModal: React.FC<NewMemberModalProps> = ({ isOpen, onClose, isEmbedded = false }) => {
  // Only lock scrolling when rendered as a modal popup, NOT when embedded as a full page
  useModalScrollLock(isOpen && !isEmbedded);
  const { addMember, settings, setSelectedMemberId, setActiveTab, useBengaliDigits } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Ensure body scroll is unlocked when embedded
  useEffect(() => {
    if (isEmbedded) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    }
  }, [isEmbedded]);

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Step 1: Personal
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nid, setNid] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [gender, setGender] = useState<Gender>('male');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(30000);
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );

  // Step 2: Somiti & Share
  const [shareCount, setShareCount] = useState(1);
  const [admissionFee, setAdmissionFee] = useState<number>(settings.defaultAdmissionFee !== undefined ? settings.defaultAdmissionFee : 0);
  const [monthlyDps, setMonthlyDps] = useState(2000);

  // Step 3: Nominee
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('স্ত্রী');
  const [nomineePhone, setNomineePhone] = useState('');
  const [nomineeNid, setNomineeNid] = useState('');
  const [nomineeAddress, setNomineeAddress] = useState('');
  const [nomineePercentage, setNomineePercentage] = useState(100);
  const [nomineePhotoUrl, setNomineePhotoUrl] = useState(
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
  );

  const handleStepChange = (step: 1 | 2 | 3) => {
    setActiveStep(step);
    if (isEmbedded) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !nid.trim()) {
      alert(
        isBn 
          ? 'অনুগ্রহ করে নাম, মোবাইল নম্বর এবং জাতীয় পরিচয়পত্র নম্বর পূরণ করুন।' 
          : 'Please fill in Member Name, Mobile Number, and National ID (NID).'
      );
      return;
    }

    // Share Capital is not calculated based on the number of shares purchased
    const shareVal = 0;

    const newMember = addMember({
      name: name.trim(),
      nameEn: nameEn.trim() || name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      nid: nid.trim(),
      dob,
      gender,
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      spouseName: spouseName.trim(),
      presentAddress: presentAddress.trim() || 'উত্তরা, ঢাকা',
      permanentAddress: permanentAddress.trim() || presentAddress.trim(),
      occupation: occupation.trim() || 'ব্যবসায়ী',
      monthlyIncome: Number(monthlyIncome) || 0,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      photoUrl,
      shareCount: Number(shareCount) || 0,
      shareValue: shareVal,
      admissionFee: Number(admissionFee) || 0,
      nominees: nomineeName.trim()
        ? [
            {
              id: `nom-${Date.now()}`,
              name: nomineeName.trim(),
              relation: nomineeRelation,
              phone: nomineePhone.trim() || phone.trim(),
              nid: nomineeNid.trim(),
              address: nomineeAddress.trim() || presentAddress.trim(),
              percentage: Number(nomineePercentage) || 100,
              photoUrl: nomineePhotoUrl,
            },
          ]
        : [],
    });

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}

    onClose();
    setSelectedMemberId(newMember.id);
    setActiveTab('members');
  };

  const modalContent = (
    <div
      className={`bg-white rounded-2xl ${
        isEmbedded
          ? 'border border-slate-200 shadow-sm w-full max-w-4xl mx-auto'
          : 'shadow-2xl border border-slate-200 w-full max-w-3xl my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))] overflow-hidden'
      } animate-in fade-in-50 zoom-in-95`}
    >
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                {isBn ? 'নতুন সদস্য ভর্তি ফরম' : 'New Member Admission Form'}
              </h3>
              <span className="text-[11px] font-medium text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded-md border border-blue-700/50">
                {isBn ? 'দ্বিভাষিক ফরম / Dual Language' : 'Dual Language / দ্বিভাষিক'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isBn 
                ? 'সমিতির নিয়মানুযায়ী সদস্য অন্তর্ভুক্তি ও ডাটাবেজ এন্ট্রি' 
                : 'Member enrollment & database entry as per society bylaws'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Language Switcher directly inside the form */}
          <LanguageSwitcher variant="segmented" darkTheme={true} />

          {!isEmbedded && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isBn ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
        <button
          type="button"
          onClick={() => handleStepChange(1)}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeStep === 1
              ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              activeStep === 1 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isBn && useBengaliDigits ? '১' : '1'}
          </span>
          <span>{isBn ? 'ব্যক্তিগত তথ্য' : 'Personal Info'}</span>
          <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">
            {isBn ? '/ Personal' : '/ ব্যক্তিগত'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleStepChange(2)}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeStep === 2
              ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              activeStep === 2 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isBn && useBengaliDigits ? '২' : '2'}
          </span>
          <span>{isBn ? 'সদস্যপদ ও শেয়ার' : 'Membership & Shares'}</span>
          <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">
            {isBn ? '/ Shares' : '/ শেয়ার'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleStepChange(3)}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeStep === 3
              ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              activeStep === 3 ? 'bg-blue-600 text-white font-bold' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isBn && useBengaliDigits ? '৩' : '3'}
          </span>
          <span>{isBn ? 'নমিনি তথ্য' : 'Nominee Info'}</span>
          <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">
            {isBn ? '/ Nominee' : '/ নমিনি'}
          </span>
        </button>
      </div>

      {/* Form Body */}
      <form
        onSubmit={handleSubmit}
        className={`p-4 sm:p-6 ${isEmbedded ? 'space-y-6' : 'overflow-y-auto flex-1 min-h-0'}`}
      >
        {/* Step 1: Personal Details */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'সদস্যের পুরো নাম (বাংলায়)' : 'Full Name (Bengali)'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Full Name (Bangla)' : '/ বাংলায় পুরো নাম'}
                  </span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: জুনাঈদ হাসান' : 'e.g. Junaid Hasan'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'নাম (ইংরেজি - বড় হাতের অক্ষরে)' : 'Name (English - BLOCK LETTERS)'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ English Name' : '/ ইংরেজিতে নাম'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. JUNAID HASAN"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'মোবাইল নম্বর' : 'Mobile Number'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Mobile Number' : '/ মোবাইল নম্বর'}
                  </span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'জাতীয় পরিচয়পত্র (NID) নম্বর' : 'National ID (NID) Number'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ NID Number' : '/ এনআইডি'}
                  </span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? '১০/১৩/১৭ ডিজিটের NID' : '10/13/17 digit NID'}
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'জন্ম তারিখ' : 'Date of Birth'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Date of Birth' : '/ জন্ম তারিখ'}
                  </span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'পিতার নাম' : "Father's Name"}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? "/ Father's Name" : '/ পিতার নাম'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'পিতার নাম' : "Father's name"}
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'মাতার নাম' : "Mother's Name"}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? "/ Mother's Name" : '/ মাতার নাম'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'মাতার নাম' : "Mother's name"}
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'স্বামী / স্ত্রীর নাম (যদি থাকে)' : 'Spouse Name (if any)'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Spouse Name' : '/ স্বামী/স্ত্রীর নাম'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'স্বামী বা স্ত্রীর নাম' : 'Spouse name'}
                  value={spouseName}
                  onChange={(e) => setSpouseName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Present Address' : '/ বর্তমান ঠিকানা'}
                  </span>
                </label>
                <textarea
                  rows={2}
                  placeholder={isBn ? 'বাড়ি, রোড, এলাকা, জেলা' : 'House, Road, Area, District'}
                  value={presentAddress}
                  onChange={(e) => setPresentAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Permanent Address' : '/ স্থায়ী ঠিকানা'}
                  </span>
                </label>
                <textarea
                  rows={2}
                  placeholder={isBn ? 'গ্রাম, ডাকঘর, থানা, জেলা' : 'Village, Post Office, Upazila, District'}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'পেশা / ব্যবসা' : 'Occupation / Profession'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Occupation' : '/ পেশা'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'যেমন: ফার্মেসি ব্যবসায়ী / চাকরি' : 'e.g. Business / Service'}
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'মাসিক আনুমানিক আয় (৳)' : 'Monthly Income (৳)'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Monthly Income' : '/ মাসিক আয়'}
                  </span>
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'লিঙ্গ' : 'Gender'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Gender' : '/ লিঙ্গ'}
                  </span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="male">{isBn ? 'পুরুষ (Male)' : 'Male (পুরুষ)'}</option>
                  <option value="female">{isBn ? 'মহিলা (Female)' : 'Female (মহিলা)'}</option>
                  <option value="other">{isBn ? 'অন্যান্য (Other)' : 'Other (অন্যান্য)'}</option>
                </select>
              </div>
            </div>

            {/* Member Photo Upload & Selector */}
            <div className="pt-1 border-t border-slate-100">
              <PhotoUploadField
                label={
                  isBn 
                    ? 'সদস্যের প্রোফাইল ছবি আপলোড / Member Photo Upload' 
                    : 'Member Profile Photo Upload / ছবি আপলোড'
                }
                value={photoUrl}
                onChange={setPhotoUrl}
                helperText={
                  isBn
                    ? 'কম্পিউটার/মোবাইল গ্যালারি বা ক্যামেরা থেকে ছবি আপলোড করুন অথবা স্যাম্পল ছবি নির্বাচন করুন'
                    : 'Upload photo from device gallery/camera or choose a sample avatar'
                }
              />
            </div>
          </div>
        )}

        {/* Step 2: Membership & Shares */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                {isBn 
                  ? 'সমিতির শেয়ার ও ভর্তি তথ্য / Share & Admission Details' 
                  : 'Cooperative Share & Admission Details / শেয়ার ও ভর্তি তথ্য'}
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                {isBn ? (
                  <>
                    প্রতি শেয়ারের অভিহিত মূল্য <strong className="font-bold text-blue-950">৳ {settings.sharePricePerUnit || 1000}</strong> টাকা। সদস্য কতটি শেয়ারের অংশীদার হবেন তা এখানে নির্ধারণ করুন। এটি সদস্যের মূলধন তথ্য হিসেবে সংরক্ষিত থাকবে, কিন্তু <strong className="text-rose-800">সদস্যের জমার ব্যালেন্সে যোগ হবে না</strong>।
                  </>
                ) : (
                  <>
                    Face value per share is <strong className="font-bold text-blue-950">৳ {settings.sharePricePerUnit || 1000}</strong>. Specify how many shares the member holds. This is recorded as equity count, but <strong className="text-rose-800">is not added to savings deposit balance</strong>.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'শেয়ার সংখ্যা' : 'Share Count'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Share Count' : '/ শেয়ার সংখ্যা'}
                  </span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={shareCount}
                  onChange={(e) => setShareCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <div className="mt-1.5 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 flex items-center justify-between">
                  <span>{isBn ? 'সক্রিয় শেয়ার সংখ্যা:' : 'Active Share Count:'}</span>
                  <span className="font-bold text-blue-800 font-mono text-sm">
                    {isBn && useBengaliDigits ? toBengaliNumber(shareCount || 0) : shareCount || 0} {isBn ? 'টি' : 'Shares'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {isBn 
                    ? '(সদস্য যখন সঞ্চয় জমা করবেন, কেবলমাত্র তখনই মোট জমা স্থিতি বৃদ্ধি পাবে)' 
                    : '(Savings balance increases only when actual savings are deposited)'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    <span>{isBn ? 'ভর্তি ফি (৳)' : 'Admission Fee (৳)'}</span>
                    <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                      {isBn ? '/ Admission Fee' : '/ ভর্তি ফি'}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdmissionFee(0)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    {isBn ? 'ফি ছাড়া (৳০)' : 'Free (৳0)'}
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  value={admissionFee}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdmissionFee(val === '' ? 0 : Math.max(0, Number(val)));
                  }}
                  placeholder="০"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                
                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isBn ? 'কুইক সিলেক্ট:' : 'Quick Select:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdmissionFee(0)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      admissionFee === 0 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    {isBn ? '৳ ০ (ফ্রি)' : '৳ 0 (Free)'}
                  </button>
                  {[100, 200, 500, 1000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setAdmissionFee(fee)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        admissionFee === fee 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      ৳ {isBn && useBengaliDigits ? toBengaliNumber(fee) : fee}
                    </button>
                  ))}
                </div>

                {admissionFee === 0 ? (
                  <span className="text-[11px] text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {isBn 
                      ? 'কোনো ভর্তি ফি ছাড়াই নতুন সদস্য হিসেবে যুক্ত হবেন (ভর্তি ফি ৳ ০)।' 
                      : 'Will be registered with zero admission fee (৳ 0).'}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isBn 
                      ? 'নতুন সদস্য অন্তর্ভুক্তি ফি (অফেরতযোগ্য)' 
                      : 'New member enrollment fee (non-refundable)'}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{isBn ? 'আর্থিক জমার নিয়ম:' : 'Financial Deposit Policy:'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isBn 
                  ? 'সদস্যভুক্তির সময় শুধুমাত্র শেয়ার সংখ্যা ও ১,০০০ টাকা মূল্যের হিসাব সিস্টেমে নথিভুক্ত হবে। কোনো টাকা তাৎক্ষণিকভাবে জমার ব্যালেন্সে যোগ হবে না। পরবর্তীতে যখন সদস্য জমার কিস্তি দিবেন (সর্বনিম্ন ১,০০০ টাকা), তখন ডিপোজিট অপশন থেকে টাকা সঞ্চয়ে জমা এন্ট্রি করা হবে।' 
                  : 'During admission, only share quantity is recorded in system. No money is added to savings deposit balance immediately. When the member pays a savings installment, enter it via Deposit option.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <span>{isBn ? 'মাসিক ডিপিএস / সঞ্চয় অঙ্গীকার (ঐচ্ছিক, ৳)' : 'Monthly DPS / Savings Commitment (Optional, ৳)'}</span>
                <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                  {isBn ? '/ Monthly Savings Pledge' : '/ সঞ্চয় অঙ্গীকার'}
                </span>
              </label>
              <input
                type="number"
                placeholder={isBn ? 'যেমন: ২০০০' : 'e.g. 2000'}
                value={monthlyDps}
                onChange={(e) => setMonthlyDps(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-xs text-slate-500 mt-1 block">
                {isBn 
                  ? 'সদস্য প্রতি মাসে এই পরিমাণ সঞ্চয় কিস্তি হিসেবে জমা রাখবেন।' 
                  : 'Member commits to save this installment amount monthly.'}
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Nominee */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              {isBn 
                ? 'সদস্যের অবর্তমানে বা জরুরি প্রয়োজনে তাঁর সঞ্চয় ও শেয়ারের আইনগত দাবিদার হিসেবে নমিনি তথ্য অত্যন্ত গুরুত্বপূর্ণ।' 
                : 'Nominee information is critical as the lawful claimant of savings and shares in member\'s absence or emergency.'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'নমিনির পুরো নাম' : 'Nominee Full Name'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Nominee Full Name' : '/ নমিনির পুরো নাম'}
                  </span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: শারমিন আক্তার' : 'e.g. Sharmin Akter'}
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'সদস্যের সাথে সম্পর্ক' : 'Relationship with Member'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Relationship' : '/ সম্পর্ক'}
                  </span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <select
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="স্ত্রী">{isBn ? 'স্ত্রী (Wife)' : 'Wife (স্ত্রী)'}</option>
                  <option value="স্বামী">{isBn ? 'স্বামী (Husband)' : 'Husband (স্বামী)'}</option>
                  <option value="পিতা">{isBn ? 'পিতা (Father)' : 'Father (পিতা)'}</option>
                  <option value="মাতা">{isBn ? 'মাতা (Mother)' : 'Mother (মাতা)'}</option>
                  <option value="পুত্র">{isBn ? 'পুত্র (Son)' : 'Son (পুত্র)'}</option>
                  <option value="কন্যা">{isBn ? 'কন্যা (Daughter)' : 'Daughter (কন্যা)'}</option>
                  <option value="ভাই">{isBn ? 'ভাই (Brother)' : 'Brother (ভাই)'}</option>
                  <option value="বোন">{isBn ? 'বোন (Sister)' : 'Sister (বোন)'}</option>
                  <option value="অন্যান্য">{isBn ? 'অন্যান্য (Other)' : 'Other (অন্যান্য)'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'নমিনির মোবাইল নম্বর' : 'Nominee Mobile Number'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Nominee Mobile' : '/ মোবাইল'}
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={nomineePhone}
                  onChange={(e) => setNomineePhone(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'নমিনির জাতীয় পরিচয়পত্র (NID)' : 'Nominee NID Number'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Nominee NID' : '/ এনআইডি'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'NID নম্বর' : 'NID number'}
                  value={nomineeNid}
                  onChange={(e) => setNomineeNid(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  <span>{isBn ? 'অংশীদারিত্বের শতকরা হার (%)' : 'Share Percentage (%)'}</span>
                  <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                    {isBn ? '/ Percentage (%)' : '/ শতকরা (%)'}
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={nomineePercentage}
                  onChange={(e) => setNomineePercentage(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                <span>{isBn ? 'নমিনির বর্তমান ঠিকানা' : 'Nominee Present Address'}</span>
                <span className="text-[11px] text-slate-500 font-medium ml-1.5">
                  {isBn ? '/ Nominee Address' : '/ নমিনির ঠিকানা'}
                </span>
              </label>
              <textarea
                rows={2}
                placeholder={isBn ? 'নমিনির ঠিকানা' : 'Nominee address'}
                value={nomineeAddress}
                onChange={(e) => setNomineeAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Nominee Photo Upload */}
            <div className="pt-2 border-t border-slate-100">
              <PhotoUploadField
                label={
                  isBn 
                    ? 'নমিনির ছবি (ঐচ্ছিক) / Nominee Photo (Optional)' 
                    : 'Nominee Photo (Optional) / নমিনির ছবি'
                }
                value={nomineePhotoUrl}
                onChange={setNomineePhotoUrl}
                helperText={
                  isBn 
                    ? 'নমিনির কম্পিউটার/মোবাইল গ্যালারি বা ক্যামেরা থেকে ছবি আপলোড করুন' 
                    : 'Upload nominee photo from device gallery or camera'
                }
              />
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={() => handleStepChange((activeStep - 1) as 1 | 2)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {isBn ? '← পূর্ববর্তী ধাপ' : '← Previous Step'}
            </button>
          ) : (
            <div></div>
          )}

          {activeStep < 3 ? (
            <button
              type="button"
              onClick={() => handleStepChange((activeStep + 1) as 2 | 3)}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {isBn ? 'পরবর্তী ধাপ →' : 'Next Step →'}
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isBn ? 'সদস্য নিবন্ধন সম্পন্ন করুন ✓' : 'Complete Registration ✓'}
            </button>
          )}
        </div>
      </form>
    </div>
  );

  if (isEmbedded) {
    return modalContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-fadeIn">
      {modalContent}
    </div>
  );
};
