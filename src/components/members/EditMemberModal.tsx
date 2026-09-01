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
  AlertCircle
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { Member, Gender } from '../../types';
import { PhotoUploadField } from '../common/PhotoUploadField';

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
  const { updateMember, settings, isUserAdmin } = useSomiti();

  // Basic Info
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [occupation, setOccupation] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'closed'>('active');

  // Shares & Financials
  const [shareCount, setShareCount] = useState<number>(1);
  const [shareValue, setShareValue] = useState<number>(1000);
  const [generalSavingsBalance, setGeneralSavingsBalance] = useState<number>(0);
  const [dpsSavingsBalance, setDpsSavingsBalance] = useState<number>(0);
  const [fdrSavingsBalance, setFdrSavingsBalance] = useState<number>(0);
  const [activeLoanBalance, setActiveLoanBalance] = useState<number>(0);

  // Nominee Info
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRelation, setNomineeRelation] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [nomineeNid, setNomineeNid] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setNameEn(member.nameEn || '');
      setPhone(member.phone || '');
      setNid(member.nid || '');
      setOccupation(member.occupation || '');
      setGender(member.gender || 'male');
      setFatherName(member.fatherName || '');
      setMotherName(member.motherName || '');
      setSpouseName(member.spouseName || '');
      setPresentAddress(member.presentAddress || '');
      setPermanentAddress(member.permanentAddress || '');
      setPhotoUrl(member.photoUrl || '');
      setStatus(member.status || 'active');

      setShareCount(member.shareCount ?? 1);
      setShareValue(member.shareValue ?? (member.shareCount * (settings.sharePricePerUnit || 100)));
      setGeneralSavingsBalance(member.generalSavingsBalance || 0);
      setDpsSavingsBalance(member.dpsSavingsBalance || 0);
      setFdrSavingsBalance(member.fdrSavingsBalance || 0);
      setActiveLoanBalance(member.activeLoanBalance || 0);

      const nom = member.nominees?.[0];
      setNomineeName(nom?.name || '');
      setNomineeRelation(nom?.relation || 'স্ত্রী');
      setNomineePhone(nom?.phone || '');
      setNomineeNid(nom?.nid || '');
    }
  }, [member, settings.sharePricePerUnit]);

  if (!isOpen || !member) return null;

  const handleShareCountChange = (count: number) => {
    const validCount = Math.max(0, count);
    setShareCount(validCount);
    const unitPrice = settings.sharePricePerUnit || 100;
    setShareValue(validCount * unitPrice);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('সদস্যের নাম দিন।');
      return;
    }

    const calculatedTotalSavings = 
      Number(generalSavingsBalance) + 
      Number(dpsSavingsBalance) + 
      Number(fdrSavingsBalance) + 
      Number(shareValue);

    const updatedNominees = member.nominees && member.nominees.length > 0 ? [
      {
        ...member.nominees[0],
        name: nomineeName.trim() || member.nominees[0].name,
        relation: nomineeRelation.trim() || member.nominees[0].relation,
        phone: nomineePhone.trim() || member.nominees[0].phone,
        nid: nomineeNid.trim() || member.nominees[0].nid,
      },
      ...member.nominees.slice(1)
    ] : [
      {
        id: `nom-${Date.now()}`,
        name: nomineeName.trim() || 'নমিনি',
        relation: nomineeRelation.trim() || 'পরিবার',
        phone: nomineePhone.trim(),
        nid: nomineeNid.trim(),
        percentage: 100,
        address: presentAddress,
      }
    ];

    updateMember(member.id, {
      name: name.trim(),
      nameEn: nameEn.trim(),
      phone: phone.trim(),
      nid: nid.trim(),
      occupation: occupation.trim(),
      gender,
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      spouseName: spouseName.trim(),
      presentAddress: presentAddress.trim(),
      permanentAddress: permanentAddress.trim(),
      photoUrl,
      status,
      shareCount: Number(shareCount),
      shareValue: Number(shareValue),
      generalSavingsBalance: Number(generalSavingsBalance),
      dpsSavingsBalance: Number(dpsSavingsBalance),
      fdrSavingsBalance: Number(fdrSavingsBalance),
      activeLoanBalance: Number(activeLoanBalance),
      totalSavings: calculatedTotalSavings,
      nominees: updatedNominees,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">সদস্য তথ্য ও শেয়ার সংশোধন</h3>
              <p className="text-xs text-slate-300">
                সদস্য নং: <span className="font-mono text-blue-300">{member.memberNo}</span> • {member.name}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Shares & Financial Balances Correction Section */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>শেয়ার সংখ্যা ও সঞ্চয় স্থিতি সংশোধন</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                ভুল এন্ট্রি হলে এখানে সংশোধন করুন
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শেয়ার সংখ্যা (টি) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={shareCount}
                  onChange={(e) => handleShareCountChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  যেমন: ২ টি শেয়ার (যদি ভুলবশত ৫০ দেয়া হয়ে থাকে)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শেয়ার মূল্য / মূলধন (৳)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={shareValue}
                  onChange={(e) => setShareValue(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {isUserAdmin && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      সাধারণ সঞ্চয় স্থিতি (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={generalSavingsBalance}
                      onChange={(e) => setGeneralSavingsBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      বকেয়া ঋণ স্থিতি (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={activeLoanBalance}
                      onChange={(e) => setActiveLoanBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Member Personal Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <User className="w-4 h-4 text-blue-600" />
              <span>ব্যক্তিগত তথ্য</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সদস্যের নাম (বাংলা) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নাম (English)
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  জাতীয় পরিচয়পত্র / NID
                </label>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পেশা (Occupation)
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সদস্যপদ অবস্থা
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="active">সক্রিয় সদস্য (Active)</option>
                  <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                  <option value="closed">বন্ধ / বাতিল (Closed)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পিতার নাম
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মাতার নাম
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                বর্তমান ঠিকানা
              </label>
              <input
                type="text"
                value={presentAddress}
                onChange={(e) => setPresentAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Nominee Details */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>নমিনি তথ্য</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নমিনির নাম
                </label>
                <input
                  type="text"
                  value={nomineeName}
                  onChange={(e) => setNomineeName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সম্পর্ক
                </label>
                <input
                  type="text"
                  value={nomineeRelation}
                  onChange={(e) => setNomineeRelation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>তথ্য সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
