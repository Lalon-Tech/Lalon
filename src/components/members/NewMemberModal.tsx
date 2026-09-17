import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, ShieldCheck, Globe, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { Gender } from '../../types';
import { PhotoUploadField } from '../common/PhotoUploadField';
import { useModalScrollLock, scrollLockManager } from '../../hooks/useModalScrollLock';
import { toBengaliNumber } from '../../utils/bengaliUtils';

interface NewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

export type FormLanguageMode = 'dual' | 'bn' | 'en';

export const NewMemberModal: React.FC<NewMemberModalProps> = ({ isOpen, onClose, isEmbedded = false }) => {
  // Only lock scrolling when rendered as a modal popup, NOT when embedded as a full page
  useModalScrollLock(isOpen && !isEmbedded);
  const { addMember, settings, setSelectedMemberId, setActiveTab, useBengaliDigits } = useSomiti();
  const { language, setLanguage } = useLanguage();

  // Dual language mode state: 'dual' (default showing both Bangla & English), 'bn', or 'en'
  const [formLang, setFormLang] = useState<FormLanguageMode>('dual');

  // Form container references for scroll positioning
  const formCardRef = useRef<HTMLDivElement>(null);
  const formBodyRef = useRef<HTMLFormElement>(null);

  // Ensure body scroll is unlocked when embedded as a page
  useEffect(() => {
    if (isEmbedded) {
      scrollLockManager.forceUnlock();
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
  const [sameAsPresent, setSameAsPresent] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState(30000);
  const [photoUrl, setPhotoUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );

  // Step 2: Somiti & Share
  const [shareCount, setShareCount] = useState(1);
  const [admissionFee, setAdmissionFee] = useState<number>(
    settings.defaultAdmissionFee !== undefined ? settings.defaultAdmissionFee : 0
  );
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

  // Helper text renderers supporting Dual Language (দ্বিভাষিক), Bangla, and English
  const tDual = (bn: string, en: string): string => {
    if (formLang === 'bn') return bn;
    if (formLang === 'en') return en;
    return `${bn} / ${en}`;
  };

  const renderLabel = (bn: string, en: string, required: boolean = false) => {
    if (formLang === 'bn') {
      return (
        <span className="flex items-center gap-1">
          <span className="font-bold text-slate-800">{bn}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </span>
      );
    }
    if (formLang === 'en') {
      return (
        <span className="flex items-center gap-1">
          <span className="font-bold text-slate-800">{en}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </span>
      );
    }
    // Dual Language mode (default):
    return (
      <span className="flex items-center gap-1.5 flex-wrap">
        <span className="font-bold text-slate-800">{bn}</span>
        <span className="text-slate-500 font-medium text-[11px]">/ {en}</span>
        {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
      </span>
    );
  };

  const renderPlaceholder = (bn: string, en: string): string => {
    if (formLang === 'bn') return bn;
    if (formLang === 'en') return en;
    return `${bn} / ${en}`;
  };

  const handleStepChange = (step: 1 | 2 | 3) => {
    setActiveStep(step);
    if (isEmbedded) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (formBodyRef.current) {
      formBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !nid.trim()) {
      alert(
        formLang === 'bn'
          ? 'অনুগ্রহ করে সদস্যের নাম, মোবাইল নম্বর এবং জাতীয় পরিচয়পত্র নম্বর সঠিকভাবে পূরণ করুন।'
          : formLang === 'en'
          ? 'Please fill in Member Name, Mobile Number, and National ID (NID) correctly.'
          : 'অনুগ্রহ করে নাম, মোবাইল নম্বর এবং জাতীয় পরিচয়পত্র পূরণ করুন / Please fill in Member Name, Mobile Number, and National ID.'
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
      ref={formCardRef}
      className={`bg-white rounded-2xl ${
        isEmbedded
          ? 'border border-slate-200 shadow-sm w-full max-w-4xl mx-auto overflow-hidden'
          : 'shadow-2xl border border-slate-200 w-full max-w-3xl my-auto flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[min(92vh,860px)] overflow-hidden'
      } animate-in fade-in-50 zoom-in-95`}
    >
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-sm shrink-0">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">
                {formLang === 'bn' 
                  ? 'নতুন সদস্য ভর্তি ফরম' 
                  : formLang === 'en' 
                  ? 'New Member Admission Form' 
                  : 'নতুন সদস্য ভর্তি ফরম / New Member Admission Form'}
              </h3>
              <span className="text-[11px] font-semibold text-blue-200 bg-blue-900/80 px-2 py-0.5 rounded-md border border-blue-700/60">
                {formLang === 'dual' ? '🌐 দ্বিভাষিক (Dual Language)' : formLang === 'bn' ? 'বাংলা মোড' : 'English Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {formLang === 'bn'
                ? 'সমিতির নিয়মানুযায়ী সদস্য অন্তর্ভুক্তি ও ডাটাবেজ এন্ট্রি'
                : formLang === 'en'
                ? 'Member enrollment & society database registration'
                : 'সমিতির নিয়মানুযায়ী সদস্য অন্তর্ভুক্তি / Official Society Member Enrollment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Form Dual Language Selector */}
          <div className="inline-flex p-1 bg-slate-800 rounded-lg border border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setFormLang('dual')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                formLang === 'dual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="বাংলা ও ইংরেজি উভয় ভাষায় ফরম দেখুন"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>উভয় ভাষা (Dual)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormLang('bn');
                setLanguage('bn');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                formLang === 'bn'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => {
                setFormLang('en');
                setLanguage('en');
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                formLang === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              English
            </button>
          </div>

          {!isEmbedded && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={formLang === 'bn' ? 'বন্ধ করুন' : 'Close'}
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
            {formLang === 'en' ? '1' : useBengaliDigits ? '১' : '1'}
          </span>
          <span>
            {formLang === 'bn'
              ? 'ব্যক্তিগত তথ্য'
              : formLang === 'en'
              ? 'Personal Info'
              : '১. ব্যক্তিগত তথ্য / Personal Info'}
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
            {formLang === 'en' ? '2' : useBengaliDigits ? '২' : '2'}
          </span>
          <span>
            {formLang === 'bn'
              ? 'সদস্যপদ ও শেয়ার'
              : formLang === 'en'
              ? 'Membership & Shares'
              : '২. সদস্যপদ ও শেয়ার / Shares'}
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
            {formLang === 'en' ? '3' : useBengaliDigits ? '৩' : '3'}
          </span>
          <span>
            {formLang === 'bn'
              ? 'নমিনি তথ্য'
              : formLang === 'en'
              ? 'Nominee Info'
              : '৩. নমিনি তথ্য / Nominee Info'}
          </span>
        </button>
      </div>

      {/* Form Body - Smooth Scrolling Support in both Modal and Embedded Page */}
      <form
        ref={formBodyRef}
        onSubmit={handleSubmit}
        className={`p-4 sm:p-6 md:p-8 ${
          isEmbedded ? 'space-y-6 overflow-visible' : 'overflow-y-auto flex-1 min-h-0 overscroll-contain'
        }`}
      >
        {/* Step 1: Personal Details */}
        {activeStep === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('সদস্যের পুরো নাম (বাংলায়)', 'Full Name (Bengali)', true)}
                </label>
                <input
                  type="text"
                  required
                  placeholder={renderPlaceholder('যেমন: জুনাঈদ হাসান', 'e.g. Junaid Hasan')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('নাম (ইংরেজি - বড় হাতের অক্ষরে)', 'Full Name (English - BLOCK LETTERS)')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. JUNAID HASAN"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('মোবাইল নম্বর', 'Mobile Number', true)}
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('জাতীয় পরিচয়পত্র (NID) নম্বর', 'National ID (NID) Number', true)}
                </label>
                <input
                  type="text"
                  required
                  placeholder={renderPlaceholder('১০/১৩/১৭ ডিজিটের NID', '10/13/17 digit NID')}
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('জন্ম তারিখ', 'Date of Birth')}
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('পিতার নাম', "Father's Name")}
                </label>
                <input
                  type="text"
                  placeholder={renderPlaceholder('পিতার নাম', "Father's Name")}
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('মাতার নাম', "Mother's Name")}
                </label>
                <input
                  type="text"
                  placeholder={renderPlaceholder('মাতার নাম', "Mother's Name")}
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('স্বামী / স্ত্রীর নাম (যদি থাকে)', 'Spouse Name (If any)')}
                </label>
                <input
                  type="text"
                  placeholder={renderPlaceholder('স্বামী বা স্ত্রীর নাম', 'Spouse Name')}
                  value={spouseName}
                  onChange={(e) => setSpouseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('বর্তমান ঠিকানা', 'Present Address')}
                </label>
                <textarea
                  rows={2}
                  placeholder={renderPlaceholder('বাড়ি, রোড, এলাকা, জেলা', 'House, Road, Area, District')}
                  value={presentAddress}
                  onChange={(e) => {
                    setPresentAddress(e.target.value);
                    if (sameAsPresent) {
                      setPermanentAddress(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {renderLabel('স্থায়ী ঠিকানা', 'Permanent Address')}
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsPresent}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsPresent(checked);
                        if (checked) {
                          setPermanentAddress(presentAddress);
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{tDual('বর্তমান ঠিকানার অনুরূপ', 'Same as Present')}</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  placeholder={renderPlaceholder('গ্রাম, ডাকঘর, থানা, জেলা', 'Village, Post Office, Upazila, District')}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('পেশা / ব্যবসা', 'Occupation / Profession')}
                </label>
                <input
                  type="text"
                  placeholder={renderPlaceholder('যেমন: ব্যবসায়ী, চাকুরীজীবী', 'e.g. Business, Service')}
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('মাসিক আনুমানিক আয় (৳)', 'Monthly Income (৳)')}
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('লিঙ্গ', 'Gender')}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="male">{formLang === 'bn' ? 'পুরুষ' : formLang === 'en' ? 'Male' : 'পুরুষ (Male)'}</option>
                  <option value="female">{formLang === 'bn' ? 'মহিলা' : formLang === 'en' ? 'Female' : 'মহিলা (Female)'}</option>
                  <option value="other">{formLang === 'bn' ? 'অন্যান্য' : formLang === 'en' ? 'Other' : 'অন্যান্য (Other)'}</option>
                </select>
              </div>
            </div>

            {/* Member Photo Upload & Selector */}
            <div className="pt-2 border-t border-slate-100">
              <PhotoUploadField
                label={tDual('সদস্যের প্রোফাইল ছবি আপলোড', 'Member Profile Photo Upload')}
                value={photoUrl}
                onChange={setPhotoUrl}
                helperText={tDual(
                  'কম্পিউটার/মোবাইল গ্যালারি বা ক্যামেরা থেকে ছবি আপলোড করুন অথবা স্যাম্পল ছবি নির্বাচন করুন',
                  'Upload photo from device gallery/camera or choose a sample avatar'
                )}
              />
            </div>
          </div>
        )}

        {/* Step 2: Membership & Shares */}
        {activeStep === 2 && (
          <div className="space-y-5">
            <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-xl">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                {tDual('সমিতির শেয়ার ও ভর্তি তথ্য', 'Cooperative Share & Admission Details')}
              </h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                {formLang === 'bn' ? (
                  <>
                    প্রতি শেয়ারের অভিহিত মূল্য <strong className="font-bold text-blue-950">৳ {settings.sharePricePerUnit || 1000}</strong> টাকা। সদস্য কতটি শেয়ারের অংশীদার হবেন তা এখানে নির্ধারণ করুন। এটি সদস্যের মূলধন তথ্য হিসেবে সংরক্ষিত থাকবে, কিন্তু <strong className="text-rose-800">সদস্যের জমার ব্যালেন্সে যোগ হবে না</strong>।
                  </>
                ) : formLang === 'en' ? (
                  <>
                    Face value per share is <strong className="font-bold text-blue-950">৳ {settings.sharePricePerUnit || 1000}</strong>. Specify how many shares the member holds. This is recorded as capital equity info, but <strong className="text-rose-800">is not added to savings deposit balance</strong>.
                  </>
                ) : (
                  <>
                    প্রতি শেয়ারের অভিহিত মূল্য <strong className="font-bold text-blue-950">৳ {settings.sharePricePerUnit || 1000}</strong> টাকা। সদস্য কতটি শেয়ারের অংশীদার হবেন তা নির্ধারণ করুন। এটি মূলধন হিসেবে থাকবে (সঞ্চয় ব্যালেন্সে যোগ হবে না)।
                    <br />
                    <span className="text-[11px] text-blue-700">
                      Face value is ৳ {settings.sharePricePerUnit || 1000} per share. Recorded as capital equity count (not added to savings balance).
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('শেয়ার সংখ্যা', 'Share Count')}
                </label>
                <input
                  type="number"
                  min={0}
                  value={shareCount}
                  onChange={(e) => setShareCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900 flex items-center justify-between">
                  <span>{tDual('সক্রিয় শেয়ার সংখ্যা:', 'Active Share Count:')}</span>
                  <span className="font-bold text-blue-800 font-mono text-sm">
                    {useBengaliDigits && formLang !== 'en' ? toBengaliNumber(shareCount || 0) : shareCount || 0}{' '}
                    {formLang === 'en' ? 'Shares' : 'টি / Shares'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1.5 block">
                  {tDual(
                    '(সদস্য যখন সঞ্চয় জমা করবেন, কেবলমাত্র তখনই মোট জমা স্থিতি বৃদ্ধি পাবে)',
                    '(Savings balance increases only when actual savings are deposited)'
                  )}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {renderLabel('ভর্তি ফি (৳)', 'Admission Fee (৳)')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdmissionFee(0)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    {tDual('ফি ছাড়া (৳০)', 'Free (৳0)')}
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
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />

                {/* Quick Preset Buttons */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {tDual('কুইক সিলেক্ট:', 'Quick Select:')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdmissionFee(0)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      admissionFee === 0
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                    }`}
                  >
                    {tDual('৳ ০ (ফ্রি)', '৳ 0 (Free)')}
                  </button>
                  {[100, 200, 500, 1000].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setAdmissionFee(fee)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        admissionFee === fee
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      ৳ {useBengaliDigits && formLang !== 'en' ? toBengaliNumber(fee) : fee}
                    </button>
                  ))}
                </div>

                {admissionFee === 0 ? (
                  <span className="text-[11px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {tDual(
                      'কোনো ভর্তি ফি ছাড়াই নতুন সদস্য হিসেবে যুক্ত হবেন (ভর্তি ফি ৳ ০)।',
                      'Will be registered with zero admission fee (৳ 0).'
                    )}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 mt-2 block">
                    {tDual(
                      'নতুন সদস্য অন্তর্ভুক্তি ফি (অফেরতযোগ্য)',
                      'New member enrollment fee (non-refundable)'
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{tDual('আর্থিক জমার নিয়মাবলী:', 'Financial Deposit Policy:')}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {tDual(
                  'সদস্যভুক্তির সময় শুধুমাত্র শেয়ার সংখ্যা ও ১,০০০ টাকা মূল্যের হিসাব সিস্টেমে নথিভুক্ত হবে। কোনো টাকা তাৎক্ষণিকভাবে জমার ব্যালেন্সে যোগ হবে না। পরবর্তীতে যখন সদস্য সঞ্চয়ের কিস্তি জমা দিবেন, তখন ডিপোজিট অপশন থেকে টাকা জমা এন্ট্রি করা হবে।',
                  'During admission, only share quantity is recorded in the system. No money is added to the savings balance immediately. When member pays an installment, deposit it via the Deposit menu.'
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {renderLabel(
                  'মাসিক ডিপিএস / সঞ্চয় অঙ্গীকার (ঐচ্ছিক, ৳)',
                  'Monthly DPS / Savings Commitment (Optional, ৳)'
                )}
              </label>
              <input
                type="number"
                placeholder={renderPlaceholder('যেমন: ২০০০', 'e.g. 2000')}
                value={monthlyDps}
                onChange={(e) => setMonthlyDps(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-xs text-slate-500 mt-1 block">
                {tDual(
                  'সদস্য প্রতি মাসে এই পরিমাণ সঞ্চয় কিস্তি হিসেবে জমা রাখবেন।',
                  'Member commits to save this installment amount monthly.'
                )}
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Nominee */}
        {activeStep === 3 && (
          <div className="space-y-5">
            <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
              {tDual(
                'সদস্যের অবর্তমানে বা জরুরি প্রয়োজনে তাঁর সঞ্চয় ও শেয়ারের আইনগত দাবিদার হিসেবে নমিনি তথ্য অত্যন্ত গুরুত্বপূর্ণ।',
                "Nominee details are required as the lawful claimant of savings and shares in member's absence or emergency."
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('নমিনির পুরো নাম', 'Nominee Full Name', true)}
                </label>
                <input
                  type="text"
                  required
                  placeholder={renderPlaceholder('যেমন: শারমিন আক্তার', 'e.g. Sharmin Akter')}
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('সদস্যের সাথে সম্পর্ক', 'Relationship with Member', true)}
                </label>
                <select
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="স্ত্রী">{formLang === 'bn' ? 'স্ত্রী' : formLang === 'en' ? 'Wife' : 'স্ত্রী (Wife)'}</option>
                  <option value="স্বামী">{formLang === 'bn' ? 'স্বামী' : formLang === 'en' ? 'Husband' : 'স্বামী (Husband)'}</option>
                  <option value="পিতা">{formLang === 'bn' ? 'পিতা' : formLang === 'en' ? 'Father' : 'পিতা (Father)'}</option>
                  <option value="মাতা">{formLang === 'bn' ? 'মাতা' : formLang === 'en' ? 'Mother' : 'মাতা (Mother)'}</option>
                  <option value="পুত্র">{formLang === 'bn' ? 'পুত্র' : formLang === 'en' ? 'Son' : 'পুত্র (Son)'}</option>
                  <option value="কন্যা">{formLang === 'bn' ? 'কন্যা' : formLang === 'en' ? 'Daughter' : 'কন্যা (Daughter)'}</option>
                  <option value="ভাই">{formLang === 'bn' ? 'ভাই' : formLang === 'en' ? 'Brother' : 'ভাই (Brother)'}</option>
                  <option value="বোন">{formLang === 'bn' ? 'বোন' : formLang === 'en' ? 'Sister' : 'বোন (Sister)'}</option>
                  <option value="অন্যান্য">{formLang === 'bn' ? 'অন্যান্য' : formLang === 'en' ? 'Other' : 'অন্যান্য (Other)'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('নমিনির মোবাইল নম্বর', 'Nominee Mobile Number')}
                </label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={nomineePhone}
                  onChange={(e) => setNomineePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('নমিনির জাতীয় পরিচয়পত্র (NID)', 'Nominee NID Number')}
                </label>
                <input
                  type="text"
                  placeholder={renderPlaceholder('NID নম্বর', 'NID Number')}
                  value={nomineeNid}
                  onChange={(e) => setNomineeNid(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {renderLabel('অংশীদারিত্বের হার (%)', 'Share Percentage (%)')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={nomineePercentage}
                  onChange={(e) => setNomineePercentage(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {renderLabel('নমিনির বর্তমান ঠিকানা', 'Nominee Present Address')}
              </label>
              <textarea
                rows={2}
                placeholder={renderPlaceholder('নমিনির বর্তমান ঠিকানা', 'Nominee Present Address')}
                value={nomineeAddress}
                onChange={(e) => setNomineeAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Nominee Photo Upload */}
            <div className="pt-2 border-t border-slate-100">
              <PhotoUploadField
                label={tDual('নমিনির ছবি (ঐচ্ছিক)', 'Nominee Photo (Optional)')}
                value={nomineePhotoUrl}
                onChange={setNomineePhotoUrl}
                helperText={tDual(
                  'নমিনির কম্পিউটার/মোবাইল গ্যালারি বা ক্যামেরা থেকে ছবি আপলোড করুন',
                  'Upload nominee photo from device gallery or camera'
                )}
              />
            </div>
          </div>
        )}

        {/* Footer Controls with Dual Language Support and Clear Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={() => handleStepChange((activeStep - 1) as 1 | 2)}
              className="px-4 sm:px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{tDual('← পূর্ববর্তী ধাপ', '← Previous Step')}</span>
            </button>
          ) : (
            <div />
          )}

          {activeStep < 3 ? (
            <button
              type="button"
              onClick={() => handleStepChange((activeStep + 1) as 2 | 3)}
              className="px-5 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              <span>{tDual('পরবর্তী ধাপ →', 'Next Step →')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <Check className="w-4 h-4" />
              <span>{tDual('সদস্য নিবন্ধন সম্পন্ন করুন ✓', 'Complete Registration ✓')}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="w-full min-h-full pb-10 overflow-visible">
        {modalContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-start sm:items-center justify-center py-4 sm:py-8 animate-fadeIn">
      {modalContent}
    </div>
  );
};
