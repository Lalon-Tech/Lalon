import React, { useState } from 'react';
import { 
  FileSignature, 
  Printer, 
  ShieldCheck, 
  Award, 
  UserCheck, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
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

  const [agreementType, setAgreementType] = useState<'membership' | 'loan_bond' | 'savings_cert'>('loan_bond');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [selectedLoanId, setSelectedLoanId] = useState(loans[0]?.id || '');

  const member = members.find(m => m.id === selectedMemberId) || members[0];
  const loan = loans.find(l => l.id === selectedLoanId) || loans[0];

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
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
            >
              {loans.map(l => (
                <option key={l.id} value={l.id}>
                  {l.loanNo} - {l.memberName} ({formatCurrency(l.principalAmount, useBengaliDigits)})
                </option>
              ))}
            </select>
          ) : (
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
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

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
              <strong>১ম পক্ষ (ঋণদাতা):</strong> {settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}, রেজিস্ট্রেশন নং: {settings.registrationNo}, কার্যালয়: {settings.address}।
            </p>
            <p>
              <strong>২য় পক্ষ (ঋণগ্রহীতা):</strong> {loan?.memberName}, পিতা: {member?.fatherName || 'মৃত আবুল কালাম'}, মাতা: {member?.motherName || 'রাবেয়া বেগম'}, বর্তমান ঠিকানা: {member?.presentAddress || 'উত্তরা, ঢাকা'}, সদস্য নং: {loan?.memberNo}।
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
                {loan?.memberName}
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
              <div className="border-t-2 border-slate-800 pt-1 font-bold">
                {settings.presidentName || 'সভাপতি / সাধারণ সম্পাদক'}
              </div>
              <span className="text-slate-600">১ম পক্ষ (সমিতির পক্ষে সিলমোহর)</span>
            </div>
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
              <div className="border-t border-slate-500 pt-1 font-bold">{member?.name}</div>
              <span className="text-slate-500">সদস্যের স্বাক্ষর</span>
            </div>
            <div>
              <div className="border-t border-slate-500 pt-1 font-bold">{settings.secretaryName || 'সাধারণ সম্পাদক'}</div>
              <span className="text-slate-500">অনুমোদনকারী কর্মকর্তার স্বাক্ষর</span>
            </div>
          </div>
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
              <div className="border-t-2 border-slate-800 pt-1 font-bold">{settings.secretaryName || 'সাধারণ সম্পাদক'}</div>
              <span className="text-slate-600">সাধারণ সম্পাদক</span>
            </div>
            <div>
              <div className="border-t-2 border-slate-800 pt-1 font-bold">{settings.presidentName || 'সভাপতি'}</div>
              <span className="text-slate-600">সভাপতি ও সিলমোহর</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
