import React, { useState } from 'react';
import { X, UserPlus, Image, CheckCircle, ShieldCheck, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { Gender } from '../../types';
import { PhotoUploadField } from '../common/PhotoUploadField';

export const NewMemberModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { addMember, settings, setSelectedMemberId, setActiveTab } = useSomiti();

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
  const [admissionFee, setAdmissionFee] = useState(settings.defaultAdmissionFee || 500);
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

  if (!isOpen) return null;

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !nid.trim()) {
      alert('অনুগ্রহ করে নাম, মোবাইল নম্বর এবং জাতীয় পরিচয়পত্র নম্বর পূরণ করুন।');
      return;
    }

    const shareVal = (shareCount || 0) * (settings.sharePricePerUnit || 100);

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">নতুন সদস্য ভর্তি ফরম</h3>
              <p className="text-xs text-slate-400">সমিতির নিয়মানুযায়ী সদস্য অন্তর্ভুক্তি</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeStep === 1 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">
              ১
            </span>
            <span>ব্যক্তিগত তথ্য</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeStep === 2 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">
              ২
            </span>
            <span>সদস্যপদ ও শেয়ার</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeStep === 3 ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">
              ৩
            </span>
            <span>নমিনি তথ্য</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Personal Details */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সদস্যের পুরো নাম (বাংলায়) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: জুনাঈদ হাসান"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নাম (ইংরেজি - বড় হাতের অক্ষরে)
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
                    মোবাইল নম্বর <span className="text-rose-500">*</span>
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
                    জাতীয় পরিচয়পত্র (NID) নম্বর <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="১০/১৩/১৭ ডিজিটের NID"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    জন্ম তারিখ
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
                    পিতার নাম
                  </label>
                  <input
                    type="text"
                    placeholder="পিতার নাম"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মাতার নাম
                  </label>
                  <input
                    type="text"
                    placeholder="মাতার নাম"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    স্বামী / স্ত্রীর নাম (যদি থাকে)
                  </label>
                  <input
                    type="text"
                    placeholder="স্বামী বা স্ত্রীর নাম"
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    বর্তমান ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    placeholder="বাড়ি, রোড, এলাকা, জেলা"
                    value={presentAddress}
                    onChange={(e) => setPresentAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    স্থায়ী ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    placeholder="গ্রাম, ডাকঘর, থানা, জেলা"
                    value={permanentAddress}
                    onChange={(e) => setPermanentAddress(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পেশা / ব্যবসা
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ফার্মেসি ব্যবসায়ী"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মাসিক আনুমানিক আয় (৳)
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
                    লিঙ্গ
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="male">পুরুষ (Male)</option>
                    <option value="female">মহিলা (Female)</option>
                    <option value="other">অন্যান্য (Other)</option>
                  </select>
                </div>
              </div>

              {/* Member Photo Upload & Selector */}
              <div className="pt-1 border-t border-slate-100">
                <PhotoUploadField
                  label="সদস্যের প্রোফাইল ছবি আপলোড (Member Photo)"
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  helperText="কম্পিউটার/মোবাইল গ্যালারি বা ক্যামেরা থেকে আসল ছবি আপলোড করুন অথবা স্যাম্পল ছবি নির্বাচন করুন"
                />
              </div>
            </div>
          )}

          {/* Step 2: Membership & Shares */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                  সমিতির শেয়ার ও ভর্তি পলিসি
                </h4>
                <p className="text-xs text-blue-800">
                  প্রতি শেয়ারের অভিহিত মূল্য ৳ {settings.sharePricePerUnit || 100} টাকা। প্রত্যেক সদস্যকে ন্যূনতম ১০টি শেয়ার ক্রয় করতে হবে।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শেয়ার সংখ্যা
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={shareCount}
                    onChange={(e) => setShareCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    মোট শেয়ার মূল্য: ৳ {((shareCount || 0) * (settings.sharePricePerUnit || 100)).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ভর্তি ফি (৳)
                  </label>
                  <input
                    type="number"
                    value={admissionFee}
                    onChange={(e) => setAdmissionFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মাসিক ডিপিএস / সঞ্চয় অঙ্গীকার (৳)
                </label>
                <input
                  type="number"
                  placeholder="যেমন: ২০০০"
                  value={monthlyDps}
                  onChange={(e) => setMonthlyDps(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  সদস্য প্রতি মাসে এই পরিমাণ সঞ্চয় কিস্তি হিসেবে জমা রাখবেন।
                </span>
              </div>
            </div>
          )}

          {/* Step 3: Nominee */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                সদস্যের অবর্তমানে বা জরুরি প্রয়োজনে তাঁর সঞ্চয় ও শেয়ারের আইনগত দাবিদার হিসেবে নমিনি তথ্য অত্যন্ত গুরুত্বপূর্ণ।
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নমিনির পুরো নাম <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: শারমিন আক্তার"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সদস্যের সাথে সম্পর্ক <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={nomineeRelation}
                    onChange={(e) => setNomineeRelation(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="স্ত্রী">স্ত্রী (Wife)</option>
                    <option value="স্বামী">স্বামী (Husband)</option>
                    <option value="পিতা">পিতা (Father)</option>
                    <option value="মাতা">মাতা (Mother)</option>
                    <option value="পুত্র">পুত্র (Son)</option>
                    <option value="কন্যা">কন্যা (Daughter)</option>
                    <option value="ভাই">ভাই (Brother)</option>
                    <option value="বোন">বোন (Sister)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নমিনির মোবাইল নম্বর
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
                    নমিনির জাতীয় পরিচয়পত্র (NID)
                  </label>
                  <input
                    type="text"
                    placeholder="NID নম্বর"
                    value={nomineeNid}
                    onChange={(e) => setNomineeNid(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    অংশীদারিত্বের শতকরা হার (%)
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
                  নমিনির বর্তমান ঠিকানা
                </label>
                <textarea
                  rows={2}
                  placeholder="নমিনির ঠিকানা"
                  value={nomineeAddress}
                  onChange={(e) => setNomineeAddress(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Nominee Photo Upload */}
              <div className="pt-2 border-t border-slate-100">
                <PhotoUploadField
                  label="নমিনির ছবি (Nominee Photo - Optional)"
                  value={nomineePhotoUrl}
                  onChange={setNomineePhotoUrl}
                  helperText="নমিনির কম্পিউটার/মোবাইল গ্যালারি বা ক্যামেরা থেকে ছবি আপলোড করুন"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep((activeStep - 1) as 1 | 2)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                ← পূর্ববর্তী ধাপ
              </button>
            ) : (
              <div></div>
            )}

            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep((activeStep + 1) as 2 | 3)}
                className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                পরবর্তী ধাপ →
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
              >
                সদস্য নিবন্ধন সম্পন্ন করুন ✓
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
