import React, { useState } from 'react';
import { 
  FileSignature, 
  Printer, 
  ShieldCheck, 
  Award, 
  UserCheck, 
  CheckCircle,
  FileText,
  Users,
  Sparkles,
  User
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber,
  numberToBengaliWords 
} from '../../utils/bengaliUtils';

export const AgreementsView: React.FC = () => {
  const { 
    members, 
    loans, 
    settings, 
    useBengaliDigits 
  } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [agreementType, setAgreementType] = useState<'membership' | 'loan_bond' | 'savings_cert'>('loan_bond');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id || '');

  // 1st Party (On Behalf of Society with Seal) Customization
  const [firstPartySource, setFirstPartySource] = useState<'member' | 'other'>('other');
  const [firstPartyMemberId, setFirstPartyMemberId] = useState<string>(members[0]?.id || '');
  const [firstPartyCustomName, setFirstPartyCustomName] = useState<string>(settings.presidentName || '');
  const [firstPartyDesignation, setFirstPartyDesignation] = useState<string>('সভাপতি');

  const selectedFirstPartyMember = members.find(m => m.id === firstPartyMemberId);
  const firstPartyDisplayName = firstPartySource === 'member'
    ? (selectedFirstPartyMember?.name || (members.length > 0 ? members[0].name : ''))
    : (firstPartyCustomName.trim() || settings.presidentName || 'সভাপতি / সাধারণ সম্পাদক');

  // 2. Membership Form Approving Officer Customization
  const [approverSource, setApproverSource] = useState<'member' | 'other'>('other');
  const [approverMemberId, setApproverMemberId] = useState<string>(members[0]?.id || '');
  const [approverCustomName, setApproverCustomName] = useState<string>(settings.secretaryName || '');
  const [approverDesignation, setApproverDesignation] = useState<string>('সাধারণ সম্পাদক');

  const selectedApproverMember = members.find(m => m.id === approverMemberId);
  const approverDisplayName = approverSource === 'member'
    ? (selectedApproverMember?.name || (members.length > 0 ? members[0].name : ''))
    : (approverCustomName.trim() || settings.secretaryName || 'সাধারণ সম্পাদক');

  // 3. Savings & Share Certificate President & Seal Customization
  const [certConfigTab, setCertConfigTab] = useState<'president' | 'secretary'>('president');
  const [certPresidentSource, setCertPresidentSource] = useState<'member' | 'other'>('other');
  const [certPresidentMemberId, setCertPresidentMemberId] = useState<string>(members[0]?.id || '');
  const [certPresidentCustomName, setCertPresidentCustomName] = useState<string>(settings.presidentName || '');
  const [certPresidentDesignation, setCertPresidentDesignation] = useState<string>('সভাপতি');

  const selectedCertPresidentMember = members.find(m => m.id === certPresidentMemberId);
  const certPresidentDisplayName = certPresidentSource === 'member'
    ? (selectedCertPresidentMember?.name || (members.length > 0 ? members[0].name : ''))
    : (certPresidentCustomName.trim() || settings.presidentName || 'সভাপতি');

  // 4. Savings & Share Certificate Secretary Customization
  const [certSecretarySource, setCertSecretarySource] = useState<'member' | 'other'>('other');
  const [certSecretaryMemberId, setCertSecretaryMemberId] = useState<string>(members[0]?.id || '');
  const [certSecretaryCustomName, setCertSecretaryCustomName] = useState<string>(settings.secretaryName || '');
  const [certSecretaryDesignation, setCertSecretaryDesignation] = useState<string>('সাধারণ সম্পাদক');

  const selectedCertSecretaryMember = members.find(m => m.id === certSecretaryMemberId);
  const certSecretaryDisplayName = certSecretarySource === 'member'
    ? (selectedCertSecretaryMember?.name || (members.length > 0 ? members[0].name : ''))
    : (certSecretaryCustomName.trim() || settings.secretaryName || 'সাধারণ সম্পাদক');

  const member = members.find(m => m.id === selectedMemberId) || members[0];
  const loan = loans.find(l => l.id === selectedLoanId) || loans[0];
  const borrowerMember = members.find(m => m.id === loan?.memberId || m.memberNo === loan?.memberNo) || member;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Selector Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
          <button
            onClick={() => setAgreementType('loan_bond')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              agreementType === 'loan_bond' ? 'bg-white text-indigo-700 shadow-xs font-extrabold' : 'text-slate-600'
            }`}
          >
            ১০০ টাকার স্ট্যাম্পে ঋণ চুক্তিপত্র (Loan Bond)
          </button>
          <button
            onClick={() => setAgreementType('membership')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              agreementType === 'membership' ? 'bg-white text-blue-700 shadow-xs font-extrabold' : 'text-slate-600'
            }`}
          >
            সদস্যপদ অঙ্গীকারনামা (Membership)
          </button>
          <button
            onClick={() => setAgreementType('savings_cert')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-all ${
              agreementType === 'savings_cert' ? 'bg-white text-emerald-700 shadow-xs font-extrabold' : 'text-slate-600'
            }`}
          >
            সঞ্চয় ও শেয়ার সনদ (Certificate)
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          {agreementType === 'loan_bond' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{isBn ? 'ঋণ নির্বাচন:' : 'Select Loan:'}</span>
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                {loans.length === 0 ? (
                  <option value="">{isBn ? 'কোনো ঋণ সংরক্ষিত নেই (নমুনা প্রিভিউ)' : 'No loans recorded (Sample)'}</option>
                ) : (
                  loans.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.loanNo} - {l.memberName} ({formatCurrency(l.principalAmount, useBengaliDigits)})
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">{isBn ? 'সদস্য নির্বাচন:' : 'Select Member:'}</span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.memberNo} - {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isBn ? 'প্রিন্ট করুন' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* 1st Party (On Behalf of Society) Configuration Panel for Loan Bond */}
      {agreementType === 'loan_bond' && (
        <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-purple-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-3.5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>{isBn ? '১ম পক্ষ (সমিতির পক্ষে সিলমোহর) প্রতিনিধি নির্বাচন' : '1st Party (Society Seal) Representative'}</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    {firstPartySource === 'member' ? (isBn ? 'সদস্য তালিকা থেকে' : 'From Member') : (isBn ? 'অন্য ব্যক্তি / কর্মকর্তা' : 'Other Person / Officer')}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isBn 
                    ? 'ঋণ চুক্তিতে ১ম পক্ষ (সমিতির প্রতিনিধি) হিসেবে সদস্য তালিকা থেকে নির্বাচন করুন অথবা অন্য ব্যক্তির নাম ও পদবী লিখুন' 
                    : 'Select a member or specify another person & designation representing the society on the bond'}
                </p>
              </div>
            </div>

            {/* Current Active Preview Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs shadow-2xs self-start sm:self-auto">
              <span className="text-slate-500 text-[11px]">{isBn ? 'চুক্তিপত্রে ১ম পক্ষ:' : '1st Party:'}</span>
              <span className="font-bold text-indigo-950">{firstPartyDisplayName}</span>
              {firstPartyDesignation && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-[10px] font-semibold text-indigo-700 border border-indigo-100">
                  {firstPartyDesignation}
                </span>
              )}
            </div>
          </div>

          {/* Controls: Source Switcher + Member Dropdown or Custom Input + Designation */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Mode Switcher Tabs */}
            <div className="md:col-span-4 flex rounded-xl bg-slate-200/80 p-1">
              <button
                type="button"
                onClick={() => setFirstPartySource('member')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  firstPartySource === 'member'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isBn ? 'সদস্য তালিকা থেকে' : 'From Members'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFirstPartySource('other')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  firstPartySource === 'other'
                    ? 'bg-white text-indigo-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{isBn ? 'অন্য ব্যক্তি / কাস্টম' : 'Other Person'}</span>
              </button>
            </div>

            {/* Selection/Input Area */}
            <div className="md:col-span-8 flex flex-col sm:flex-row items-center gap-2.5">
              {firstPartySource === 'member' ? (
                <div className="w-full sm:flex-1">
                  <select
                    value={firstPartyMemberId}
                    onChange={(e) => setFirstPartyMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {members.length === 0 ? (
                      <option value="">{isBn ? 'কোনো সদস্য নেই' : 'No members found'}</option>
                    ) : (
                      members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.memberNo} - {m.name} {m.phone ? `(${m.phone})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div className="w-full sm:flex-1">
                  <input
                    type="text"
                    value={firstPartyCustomName}
                    onChange={(e) => setFirstPartyCustomName(e.target.value)}
                    placeholder={isBn ? 'অন্য ব্যক্তির নাম (যেমন: মোঃ রফিকুল আলম)' : 'Enter name (e.g. Md. Rafiqul Alam)'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Designation (পদবী) Input */}
              <div className="w-full sm:w-60">
                <input
                  type="text"
                  value={firstPartyDesignation}
                  onChange={(e) => setFirstPartyDesignation(e.target.value)}
                  placeholder={isBn ? 'পদবী (যেমন: সভাপতি / ম্যানেজার)' : 'Designation (e.g. President)'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Quick Designations & Officer Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {isBn ? 'দ্রুত পদবী বাছাই:' : 'Designation Presets:'}
            </span>
            {['সভাপতি', 'সাধারণ সম্পাদক', 'ব্যবস্থাপক / ম্যানেজার', 'কোষাধ্যক্ষ', 'নির্বাহী পরিচালক', 'অনুমোদিত প্রতিনিধি'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFirstPartyDesignation(role)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  firstPartyDesignation === role
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                {role}
              </button>
            ))}

            {firstPartySource === 'other' && (settings.presidentName || settings.secretaryName || settings.cashierName) && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-slate-500">{isBn ? 'সমিতির কর্মকর্তা দ্রুত লোড:' : 'Quick Officers:'}</span>
                {settings.presidentName && (
                  <button
                    type="button"
                    onClick={() => {
                      setFirstPartyCustomName(settings.presidentName);
                      setFirstPartyDesignation('সভাপতি');
                    }}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-semibold border border-indigo-200 cursor-pointer"
                  >
                    {isBn ? 'সভাপতি:' : 'Pres:'} {settings.presidentName}
                  </button>
                )}
                {settings.secretaryName && (
                  <button
                    type="button"
                    onClick={() => {
                      setFirstPartyCustomName(settings.secretaryName);
                      setFirstPartyDesignation('সাধারণ সম্পাদক');
                    }}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-semibold border border-indigo-200 cursor-pointer"
                  >
                    {isBn ? 'সম্পাদক:' : 'Sec:'} {settings.secretaryName}
                  </button>
                )}
                {settings.cashierName && (
                  <button
                    type="button"
                    onClick={() => {
                      setFirstPartyCustomName(settings.cashierName);
                      setFirstPartyDesignation('কোষাধ্যক্ষ');
                    }}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[10px] font-semibold border border-indigo-200 cursor-pointer"
                  >
                    {isBn ? 'কোষাধ্যক্ষ:' : 'Cashier:'} {settings.cashierName}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. Non-Judicial Stamp Loan Bond */}
      {agreementType === 'loan_bond' && (
        <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-lg p-10 space-y-6 max-w-4xl mx-auto font-serif leading-relaxed text-slate-900">
          {/* Simulated Stamp Header */}
          <div className="border-4 border-double border-indigo-950 p-4 text-center rounded-xl bg-slate-50/50 mb-6">
            <div className="text-xs uppercase tracking-widest font-sans text-indigo-900 font-bold">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • ১০০ টাকার নন-জুডিশিয়াল স্ট্যাম্প সমতুল্য
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1 uppercase">
              ঋণ বিতরণ ও জামিনদারের অঙ্গীকারনামা চুক্তিপত্র
            </h2>
          </div>

          <div className="text-xs font-sans text-right border-b border-slate-300 pb-2">
            <span>ঋণ হিসাব নং: <strong>{loan?.loanNo || 'LN-2026-001'}</strong></span> | 
            <span className="ml-2">তারিখ: <strong>{formatBengaliDate(loan?.disbursedDate || '2026-08-01', false)}</strong></span>
          </div>

          <div className="text-sm space-y-4 font-sans text-justify">
            <p>
              <strong>১ম পক্ষ (ঋণদাতা):</strong> {settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}, রেজিস্ট্রেশন নং: {settings.registrationNo || 'রেজি নং: ১৯৩৮/ঢাকা/২০১৮'}, কার্যালয়: {settings.address || 'উত্তরা, ঢাকা'}
              {firstPartyDisplayName && (
                <span> (সমিতির পক্ষে সিলমোহর ও প্রতিনিধিত্বকারী: <strong>{firstPartyDisplayName}</strong>{firstPartyDesignation ? `, ${firstPartyDesignation}` : ''})</span>
              )}।
            </p>
            <p>
              <strong>২য় পক্ষ (ঋণগ্রহীতা):</strong> {loan?.memberName || borrowerMember?.name || 'ঋণগ্রহীতা'}, পিতা: {borrowerMember?.fatherName || 'মৃত আবুল কালাম'}, মাতা: {borrowerMember?.motherName || 'রাবেয়া বেগম'}, বর্তমান ঠিকানা: {borrowerMember?.presentAddress || 'উত্তরা, ঢাকা'}, সদস্য নং: {loan?.memberNo || borrowerMember?.memberNo || 'M-001'}।
            </p>
            <p>
              <strong>৩য় পক্ষ (জামিনদার):</strong> {loan?.guarantorName || 'মোঃ রফিকুল ইসলাম'}, সম্পর্ক: {loan?.guarantorRelation || 'সমিতি সদস্য ও ব্যবসায়িক অংশীদার'}।
            </p>

            <h4 className="font-bold underline text-slate-900 pt-2 font-serif">চুক্তির শর্তাবলি:</h4>
            <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-800">
              <li>
                ২য় পক্ষ তাঁর <strong>"{loan?.purpose || 'ব্যবসা সম্প্রসারণ'}"</strong> উদ্দেশ্যে ১ম পক্ষের নিকট হইতে নগদ/ব্যাংকের মাধ্যমে সর্বমোট <strong>{formatCurrency(loan?.principalAmount || 50000, useBengaliDigits)}</strong> ({numberToBengaliWords(loan?.principalAmount || 50000)}) ঋণ গ্রহণ করিলেন।
              </li>
              <li>
                উক্ত ঋণের বিপরীতে ধার্যকৃত মোট লভ্যাংশ সহ প্রদেয় টাকার পরিমাণ <strong>{formatCurrency(loan?.totalAmount || 56000, useBengaliDigits)}</strong>, যাহা সর্বমোট <strong>{toBengaliNumber(loan?.totalInstallments || 12)}</strong> টি নিয়মিত কিস্তিতে (প্রতি কিস্তি <strong>{formatCurrency(loan?.installmentAmount || 4667, useBengaliDigits)}</strong>) পরিশোধ করিতে বাধ্য থাকিবেন।
              </li>
              <li>
                নির্ধারিত সময়ের মধ্যে কিস্তি পরিশোধে ব্যর্থ হইলে সমিতির প্রচলিত নিয়মানুযায়ী দৈনিক/মাসিক বিলম্ব ফি প্রযোজ্য হইবে।
              </li>
              <li>
                ৩য় পক্ষ (জামিনদার) এই মর্মে অঙ্গীকার করিতেছেন যে, ঋণগ্রহীতা ঋণের অর্থ পরিশোধে অপারগ বা ব্যর্থ হইলে জামিনদার নিজ দায়িত্বে অবশিষ্ট সকল বকেয়া টাকা ১ম পক্ষকে পরিশোধ করিতে আইনগতভাবে দায়বদ্ধ থাকিবেন।
              </li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="pt-16 grid grid-cols-3 gap-6 text-center text-xs font-sans border-t border-slate-300 mt-12">
            <div>
              <div className="border-t-2 border-slate-800 pt-1 font-bold">
                {loan?.memberName || borrowerMember?.name || 'ঋণগ্রহীতা'}
              </div>
              <span className="text-slate-600">২য় পক্ষ (ঋণগ্রহীতার স্বাক্ষর)</span>
            </div>
            <div>
              <div className="border-t-2 border-slate-800 pt-1 font-bold">
                {loan?.guarantorName || 'জামিনদার'}
              </div>
              <span className="text-slate-600">৩য় পক্ষ (জামিনদারের স্বাক্ষর)</span>
            </div>
            <div>
              <div className="border-t-2 border-slate-800 pt-1 font-bold text-slate-900">
                {firstPartyDisplayName || settings.presidentName || 'সভাপতি / সাধারণ সম্পাদক'}
              </div>
              {firstPartyDesignation && (
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                  {firstPartyDesignation}
                </div>
              )}
              <span className="text-slate-600 font-medium">১ম পক্ষ (সমিতির পক্ষে সিলমোহর)</span>
            </div>
          </div>
        </div>
      )}

      {/* Approver Configuration Panel for Membership Agreement */}
      {agreementType === 'membership' && (
        <div className="bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-xs space-y-3.5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>{isBn ? 'অনুমোদনকারী কর্মকর্তার স্বাক্ষর কনফিগারেশন' : 'Approving Officer Signature'}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    {approverSource === 'member' ? (isBn ? 'সদস্য তালিকা থেকে' : 'From Member') : (isBn ? 'অন্য ব্যক্তি / কর্মকর্তা' : 'Other Person / Officer')}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isBn 
                    ? 'সদস্য ভর্তি ফরম ও অঙ্গীকারনামায় অনুমোদনকারী কর্মকর্তা হিসেবে সদস্য তালিকা থেকে বেছে নিন অথবা অন্য ব্যক্তির নাম ও পদবী লিখুন' 
                    : 'Select a member or specify another person & designation as the approving officer'}
                </p>
              </div>
            </div>

            {/* Active Preview Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs shadow-2xs self-start sm:self-auto">
              <span className="text-slate-500 text-[11px]">{isBn ? 'অনুমোদনকারী:' : 'Approver:'}</span>
              <span className="font-bold text-blue-950">{approverDisplayName}</span>
              {approverDesignation && (
                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-semibold text-blue-700 border border-blue-100">
                  {approverDesignation}
                </span>
              )}
            </div>
          </div>

          {/* Mode Switcher Tabs + Selection/Input */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4 flex rounded-xl bg-slate-200/80 p-1">
              <button
                type="button"
                onClick={() => setApproverSource('member')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  approverSource === 'member'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{isBn ? 'সদস্য তালিকা থেকে' : 'From Members'}</span>
              </button>
              <button
                type="button"
                onClick={() => setApproverSource('other')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  approverSource === 'other'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{isBn ? 'অন্য ব্যক্তি / কাস্টম' : 'Other Person'}</span>
              </button>
            </div>

            <div className="md:col-span-8 flex flex-col sm:flex-row items-center gap-2.5">
              {approverSource === 'member' ? (
                <div className="w-full sm:flex-1">
                  <select
                    value={approverMemberId}
                    onChange={(e) => setApproverMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {members.length === 0 ? (
                      <option value="">{isBn ? 'কোনো সদস্য নেই' : 'No members found'}</option>
                    ) : (
                      members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.memberNo} - {m.name} {m.phone ? `(${m.phone})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div className="w-full sm:flex-1">
                  <input
                    type="text"
                    value={approverCustomName}
                    onChange={(e) => setApproverCustomName(e.target.value)}
                    placeholder={isBn ? 'অনুমোদনকারী কর্মকর্তার নাম (যেমন: মোঃ রফিকুল আলম)' : 'Approving officer name'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              )}

              <div className="w-full sm:w-60">
                <input
                  type="text"
                  value={approverDesignation}
                  onChange={(e) => setApproverDesignation(e.target.value)}
                  placeholder={isBn ? 'পদবী (যেমন: সাধারণ সম্পাদক)' : 'Designation (e.g. Secretary)'}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Quick Designation Presets & Officer Auto-Fill */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {isBn ? 'দ্রুত পদবী বাছাই:' : 'Designation Presets:'}
            </span>
            {['সাধারণ সম্পাদক', 'সভাপতি', 'ব্যবস্থাপক / ম্যানেজার', 'অনুমোদনকারী কর্মকর্তা', 'কোষাধ্যক্ষ', 'পরিচালক'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setApproverDesignation(role)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  approverDesignation === role
                    ? 'bg-blue-600 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                }`}
              >
                {role}
              </button>
            ))}

            {approverSource === 'other' && (settings.secretaryName || settings.presidentName) && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-slate-500">{isBn ? 'কর্মকর্তা লোড:' : 'Quick Officers:'}</span>
                {settings.secretaryName && (
                  <button
                    type="button"
                    onClick={() => {
                      setApproverCustomName(settings.secretaryName);
                      setApproverDesignation('সাধারণ সম্পাদক');
                    }}
                    className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-semibold border border-blue-200 cursor-pointer"
                  >
                    {isBn ? 'সম্পাদক:' : 'Sec:'} {settings.secretaryName}
                  </button>
                )}
                {settings.presidentName && (
                  <button
                    type="button"
                    onClick={() => {
                      setApproverCustomName(settings.presidentName);
                      setApproverDesignation('সভাপতি');
                    }}
                    className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-semibold border border-blue-200 cursor-pointer"
                  >
                    {isBn ? 'সভাপতি:' : 'Pres:'} {settings.presidentName}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Membership Agreement */}
      {agreementType === 'membership' && (
        <div className="bg-white rounded-2xl border-2 border-slate-800 shadow-lg p-10 space-y-6 max-w-4xl mx-auto font-sans leading-relaxed text-slate-900">
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-2xl font-bold uppercase">{settings.somitiName}</h1>
            <p className="text-xs text-slate-600">{settings.registrationNo} • {settings.address}</p>
            <h3 className="text-base font-bold underline mt-2">সদস্য ভর্তি ফরম ও অঙ্গীকারনামা</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div><strong>সদস্য নং:</strong> {member?.memberNo}</div>
            <div><strong>যোগদানের তারিখ:</strong> {formatBengaliDate(member?.joiningDate || '2025-01-01', false)}</div>
            <div><strong>সদস্যের নাম:</strong> {member?.name}</div>
            <div><strong>মোবাইল:</strong> {member?.phone}</div>
            <div><strong>জাতীয় পরিচয়পত্র:</strong> {member?.nid}</div>
            <div><strong>পেশা:</strong> {member?.occupation}</div>
            <div><strong>শেয়ার সংখ্যা:</strong> {toBengaliNumber(member?.shareCount || 0)} টি ({formatCurrency(member?.shareValue || 0, useBengaliDigits)})</div>
            <div><strong>ভর্তি ফি:</strong> {formatCurrency(member?.admissionFee || 500, useBengaliDigits)}</div>
          </div>

          <p className="text-xs text-justify leading-relaxed">
            আমি স্বেচ্ছায় {settings.somitiName}-এর সদস্যপদ গ্রহণ করিলাম এবং সমিতির সার্বিক নীতিমালা ও সিদ্ধান্ত নিঃশর্তভাবে মানিয়া চলিব। আমার অবর্তমানে আমার মনোনীত নমিনি <strong>{member?.nominees[0]?.name || 'মনোনীত নমিনি'}</strong> আমার সঞ্চয় ও শেয়ারের উত্তরাধিকারী হইবেন।
          </p>

          <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-t border-slate-500 pt-1 font-bold text-slate-900">{member?.name}</div>
              <span className="text-slate-500">সদস্যের স্বাক্ষর</span>
            </div>
            <div>
              <div className="border-t border-slate-500 pt-1 font-bold text-slate-900">
                {approverDisplayName || settings.secretaryName || 'সাধারণ সম্পাদক'}
              </div>
              {approverDesignation && (
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                  {approverDesignation}
                </div>
              )}
              <span className="text-slate-500 font-medium">অনুমোদনকারী কর্মকর্তার স্বাক্ষর</span>
            </div>
          </div>
        </div>
      )}

      {/* President & Seal / Secretary Configuration Panel for Savings & Share Certificate */}
      {agreementType === 'savings_cert' && (
        <div className="bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3.5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>{isBn ? 'সনদপত্রে সভাপতি ও সিলমোহর কনফিগারেশন' : 'Certificate Signatures & Seal Configuration'}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-medium">
                    {certConfigTab === 'president'
                      ? (certPresidentSource === 'member' ? (isBn ? 'সভাপতি: সদস্য তালিকা' : 'Pres: Member') : (isBn ? 'সভাপতি: কাস্টম/অন্য ব্যক্তি' : 'Pres: Custom'))
                      : (certSecretarySource === 'member' ? (isBn ? 'সম্পাদক: সদস্য তালিকা' : 'Sec: Member') : (isBn ? 'সম্পাদক: কাস্টম/অন্য ব্যক্তি' : 'Sec: Custom'))
                    }
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isBn 
                    ? 'শেয়ার ও সঞ্চয় আমানত সনদে "সভাপতি ও সিলমোহর" এবং "সাধারণ সম্পাদক" স্বাক্ষরকারী নির্বাচন বা টাইপ করুন' 
                    : 'Configure the President & Seal or General Secretary signatures on the certificate'}
                </p>
              </div>
            </div>

            {/* Active Preview Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs shadow-2xs">
                <span className="text-slate-500 text-[11px]">{isBn ? 'সভাপতি ও সিলমোহর:' : 'President:'}</span>
                <span className="font-bold text-amber-950">{certPresidentDisplayName}</span>
                {certPresidentDesignation && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-semibold text-amber-800 border border-amber-200">
                    {certPresidentDesignation}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs">
                <span className="text-slate-500 text-[11px]">{isBn ? 'সম্পাদক:' : 'Sec:'}</span>
                <span className="font-bold text-slate-800">{certSecretaryDisplayName}</span>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: President & Seal vs Secretary */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCertConfigTab('president')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                certConfigTab === 'president'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isBn ? '১. সভাপতি ও সিলমোহর স্বাক্ষর' : '1. President & Seal Signature'}
            </button>
            <button
              type="button"
              onClick={() => setCertConfigTab('secretary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                certConfigTab === 'secretary'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isBn ? '২. সাধারণ সম্পাদক স্বাক্ষর' : '2. General Secretary Signature'}
            </button>
          </div>

          {/* Configuration Form for President & Seal */}
          {certConfigTab === 'president' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-4 flex rounded-xl bg-slate-200/80 p-1">
                  <button
                    type="button"
                    onClick={() => setCertPresidentSource('member')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      certPresidentSource === 'member'
                        ? 'bg-white text-amber-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সদস্য তালিকা থেকে' : 'From Members'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertPresidentSource('other')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      certPresidentSource === 'other'
                        ? 'bg-white text-amber-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অন্য ব্যক্তি / কাস্টম' : 'Other Person'}</span>
                  </button>
                </div>

                <div className="md:col-span-8 flex flex-col sm:flex-row items-center gap-2.5">
                  {certPresidentSource === 'member' ? (
                    <div className="w-full sm:flex-1">
                      <select
                        value={certPresidentMemberId}
                        onChange={(e) => setCertPresidentMemberId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      >
                        {members.length === 0 ? (
                          <option value="">{isBn ? 'কোনো সদস্য নেই' : 'No members found'}</option>
                        ) : (
                          members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.memberNo} - {m.name} {m.phone ? `(${m.phone})` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="w-full sm:flex-1">
                      <input
                        type="text"
                        value={certPresidentCustomName}
                        onChange={(e) => setCertPresidentCustomName(e.target.value)}
                        placeholder={isBn ? 'সভাপতির নাম লিখুন (যেমন: মোঃ মোস্তফা কামাল)' : 'Enter President name'}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="w-full sm:w-60">
                    <input
                      type="text"
                      value={certPresidentDesignation}
                      onChange={(e) => setCertPresidentDesignation(e.target.value)}
                      placeholder={isBn ? 'পদবী (যেমন: সভাপতি)' : 'Designation (e.g. President)'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Presets for President */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {isBn ? 'দ্রুত পদবী বাছাই:' : 'Designation Presets:'}
                </span>
                {['সভাপতি', 'চেয়ারম্যান', 'ম্যানেজিং ডিরেক্টর', 'প্রধান নির্বাহী', 'কার্যনির্বাহী সদস্য'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setCertPresidentDesignation(role)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      certPresidentDesignation === role
                        ? 'bg-amber-700 text-white font-bold shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {role}
                  </button>
                ))}

                {certPresidentSource === 'other' && settings.presidentName && (
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-slate-500">{isBn ? 'সমিতির সভাপতি লোড:' : 'Quick President:'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCertPresidentCustomName(settings.presidentName);
                        setCertPresidentDesignation('সভাপতি');
                      }}
                      className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-semibold border border-amber-300 cursor-pointer"
                    >
                      {isBn ? 'সভাপতি:' : 'Pres:'} {settings.presidentName}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Configuration Form for Secretary */
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-4 flex rounded-xl bg-slate-200/80 p-1">
                  <button
                    type="button"
                    onClick={() => setCertSecretarySource('member')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      certSecretarySource === 'member'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{isBn ? 'সদস্য তালিকা থেকে' : 'From Members'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCertSecretarySource('other')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      certSecretarySource === 'other'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অন্য ব্যক্তি / কাস্টম' : 'Other Person'}</span>
                  </button>
                </div>

                <div className="md:col-span-8 flex flex-col sm:flex-row items-center gap-2.5">
                  {certSecretarySource === 'member' ? (
                    <div className="w-full sm:flex-1">
                      <select
                        value={certSecretaryMemberId}
                        onChange={(e) => setCertSecretaryMemberId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      >
                        {members.length === 0 ? (
                          <option value="">{isBn ? 'কোনো সদস্য নেই' : 'No members found'}</option>
                        ) : (
                          members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.memberNo} - {m.name} {m.phone ? `(${m.phone})` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="w-full sm:flex-1">
                      <input
                        type="text"
                        value={certSecretaryCustomName}
                        onChange={(e) => setCertSecretaryCustomName(e.target.value)}
                        placeholder={isBn ? 'সাধারণ সম্পাদকের নাম লিখুন' : 'Enter Secretary name'}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  )}

                  <div className="w-full sm:w-60">
                    <input
                      type="text"
                      value={certSecretaryDesignation}
                      onChange={(e) => setCertSecretaryDesignation(e.target.value)}
                      placeholder={isBn ? 'পদবী (যেমন: সাধারণ সম্পাদক)' : 'Designation'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Presets for Secretary */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {isBn ? 'দ্রুত পদবী বাছাই:' : 'Designation Presets:'}
                </span>
                {['সাধারণ সম্পাদক', 'যুগ্ম সম্পাদক', 'কোষাধ্যক্ষ', 'ব্যবস্থাপক / ম্যানেজার'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setCertSecretaryDesignation(role)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      certSecretaryDesignation === role
                        ? 'bg-slate-800 text-white font-bold shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {role}
                  </button>
                ))}

                {certSecretarySource === 'other' && settings.secretaryName && (
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <span className="text-slate-400">|</span>
                    <span className="font-semibold text-slate-500">{isBn ? 'সমিতির সম্পাদক লোড:' : 'Quick Secretary:'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCertSecretaryCustomName(settings.secretaryName);
                        setCertSecretaryDesignation('সাধারণ সম্পাদক');
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-semibold border border-slate-300 cursor-pointer"
                    >
                      {isBn ? 'সম্পাদক:' : 'Sec:'} {settings.secretaryName}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Savings & Share Certificate */}
      {agreementType === 'savings_cert' && (
        <div className="bg-gradient-to-b from-amber-50/40 via-white to-amber-50/40 rounded-2xl border-4 border-double border-amber-700 shadow-xl p-12 space-y-8 max-w-4xl mx-auto text-center font-serif text-slate-900">
          <div className="flex justify-center">
            <div className="p-3 bg-amber-100 rounded-full border-2 border-amber-600 text-amber-800">
              <Award className="w-10 h-10" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-wider uppercase">
              {settings.somitiName}
            </h1>
            <p className="text-xs text-slate-600 font-sans mt-1">
              রেজিস্ট্রেশন নং: {settings.registrationNo} • {settings.address}
            </p>
            <h2 className="text-xl font-bold text-amber-900 underline mt-4">
              শেয়ার ও সঞ্চয় আমানত সনদপত্র
            </h2>
          </div>

          <div className="text-sm font-sans leading-loose max-w-2xl mx-auto text-slate-800">
            এই মর্মে প্রত্যয়ন করা যাইতেছে যে, জনাব/জনাবা <strong>{member?.name}</strong>, সদস্য নং: <strong>{member?.memberNo}</strong>, জাতীয় পরিচয়পত্র নং: <strong>{member?.nid}</strong>, {settings.somitiName}-এর একজন সক্রিয় ও বৈধ অংশীদার। তিনি সমিতিতে <strong>{toBengaliNumber(member?.shareCount || 50)}</strong> টি শেয়ার বাবদ মূলধন <strong>{formatCurrency(member?.shareValue || 5000, useBengaliDigits)}</strong> টাকা এবং নিয়মিত সঞ্চয় আমানত জমা রাখিয়াছেন।
          </div>

          <div className="pt-16 grid grid-cols-2 gap-16 text-center text-xs font-sans">
            <div>
              <div className="border-t-2 border-slate-800 pt-1 font-bold text-slate-900">
                {certSecretaryDisplayName || settings.secretaryName || 'সাধারণ সম্পাদক'}
              </div>
              {certSecretaryDesignation && (
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                  {certSecretaryDesignation}
                </div>
              )}
              <span className="text-slate-600">সাধারণ সম্পাদক</span>
            </div>
            <div>
              <div className="border-t-2 border-slate-800 pt-1 font-bold text-slate-900">
                {certPresidentDisplayName || settings.presidentName || 'সভাপতি'}
              </div>
              {certPresidentDesignation && (
                <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                  {certPresidentDesignation}
                </div>
              )}
              <span className="text-slate-600 font-medium">সভাপতি ও সিলমোহর</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
