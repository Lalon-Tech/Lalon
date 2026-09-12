import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  UserCheck, 
  Mail, 
  Hash, 
  Search, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  User, 
  Building, 
  CreditCard,
  Trash2,
  Loader2,
  Sparkles,
  Link2
} from 'lucide-react';
import { AppUser, Member } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { generateNextUserUid } from '../../utils/mockData';

interface ApproveUserModalProps {
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApproveUserModal: React.FC<ApproveUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { members, users, approveUserRegistration, rejectUserRegistration, language } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [userUid, setUserUid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setError(null);
      setSuccess(null);
      setSearchTerm('');

      // Auto-suggest next User UID
      const nextUid = user.userUid || generateNextUserUid(users);
      setUserUid(nextUid);

      // Attempt smart match by email
      const matchedMember = members.find(
        m => m.email && m.email.toLowerCase() === user.email.toLowerCase()
      );
      if (matchedMember) {
        setSelectedMemberId(matchedMember.id);
      } else {
        setSelectedMemberId('');
      }
    }
  }, [isOpen, user, members, users]);

  // Filter members by search term
  const filteredMembers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return members.slice(0, 15); // Show first 15 for convenience
    return members.filter(m => 
      m.name.toLowerCase().includes(term) ||
      m.memberNo.toLowerCase().includes(term) ||
      (m.phone && m.phone.includes(term)) ||
      (m.nid && m.nid.includes(term)) ||
      (m.email && m.email.toLowerCase().includes(term))
    );
  }, [members, searchTerm]);

  // Currently selected member object
  const selectedMember = useMemo(() => {
    return members.find(m => m.id === selectedMemberId);
  }, [members, selectedMemberId]);

  // Check if selected member is already linked to another active user
  const existingLinkedUser = useMemo(() => {
    if (!selectedMemberId) return null;
    return users.find(u => u.memberId === selectedMemberId && u.id !== user?.id);
  }, [users, selectedMemberId, user]);

  if (!isOpen || !user) return null;

  const handleApprove = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedMemberId) {
      setError(language === 'bn' ? 'অনুগ্রহ করে একজন বিদ্যমান সদস্য প্রোফাইল নির্বাচন করুন।' : 'Please select an existing member profile to link.');
      return;
    }

    const cleanUid = userUid.trim();
    if (!cleanUid) {
      setError(language === 'bn' ? 'ইউজার ইউআইডি (BS-####) প্রদান করা আবশ্যক।' : 'User UID is required.');
      return;
    }

    // Check UID uniqueness
    const duplicateUidUser = users.find(
      u => u.id !== user.id && u.userUid?.toLowerCase() === cleanUid.toLowerCase()
    );
    if (duplicateUidUser) {
      setError(
        language === 'bn'
          ? `এই User UID (${cleanUid}) ইতিপূর্বে '${duplicateUidUser.name}' কে প্রদান করা হয়েছে!`
          : `User UID (${cleanUid}) is already assigned to ${duplicateUidUser.name}!`
      );
      return;
    }

    setLoading(true);
    try {
      await approveUserRegistration(user.id, selectedMemberId, cleanUid);
      setSuccess(
        language === 'bn'
          ? `সফলভাবে অনুমোদিত হয়েছে! অ্যাকাউন্টটি সক্রিয় করা হয়েছে এবং সদস্য প্রোফাইলে (${user.email}) যুক্ত হয়েছে।`
          : `Account approved and linked successfully! Email updated on member profile.`
      );
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'অনুমোদন সম্পন্ন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত এই রেজিস্ট্রেশন আবেদনটি বাতিল করতে চান?' : 'Are you sure you want to reject and remove this registration?')) {
      return;
    }

    setRejectLoading(true);
    setError(null);
    try {
      await rejectUserRegistration(user.id, 'প্রশাসক কর্তৃক বাতিল');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'প্রত্যাখ্যান করা সম্ভব হয়নি।');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0 shadow-inner">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>{language === 'bn' ? 'নতুন নিবন্ধন অনুমোদন' : 'Pending Registration'}</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {language === 'bn' ? 'সদস্য একাউন্ট পর্যালোচনা ও অনুমোদন' : 'Review & Approve Member Account'}
              </h3>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>{user.email}</span>
                <span className="text-slate-500">•</span>
                <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'নতুন'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-semibold">{success}</div>
            </div>
          )}

          {/* Step 1: Link Existing Member Profile */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center">1</span>
                <span>{language === 'bn' ? 'বিদ্যমান সদস্য প্রোফাইল নির্বাচন করুন (Link Member Profile)' : 'Link Member Profile'}</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {language === 'bn' ? `মোট সদস্য: ${members.length}` : `Total: ${members.length}`}
              </span>
            </div>

            {/* Member Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'সদস্যের নাম, সদস্য নং (যেমন: M-1001), ফোন নম্বর দিয়ে খুঁজুন...' : 'Search by Name, Member No, Phone...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Member Selection List */}
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
              {filteredMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  {language === 'bn' ? 'কোন সদস্য প্রোফাইল পাওয়া যায়নি।' : 'No members found matching your search.'}
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const isSelected = m.id === selectedMemberId;
                  const isEmailMatch = m.email && m.email.toLowerCase() === user.email.toLowerCase();
                  const isAlreadyLinked = users.some(u => u.memberId === m.id && u.id !== user.id);

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMemberId(m.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-blue-50/90 border-l-4 border-l-blue-600' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={m.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={m.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 truncate text-xs sm:text-sm">{m.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {m.memberNo}
                            </span>
                            {isEmailMatch && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                {language === 'bn' ? 'ইমেইল ম্যাচ' : 'Email Match'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate mt-0.5">
                            {m.phone && <span>{m.phone}</span>}
                            {m.presentAddress && <span>• {m.presentAddress}</span>}
                            {m.email && <span className="text-slate-400">({m.email})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isAlreadyLinked && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {language === 'bn' ? 'অন্য একাউন্টে লিংকড' : 'Already Linked'}
                          </span>
                        )}
                        <input
                          type="radio"
                          name="selected_member"
                          checked={isSelected}
                          onChange={() => setSelectedMemberId(m.id)}
                          className="w-4 h-4 text-blue-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Member Preview Card */}
            {selectedMember && (
              <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-blue-600" />
                    {language === 'bn' ? 'সংযুক্ত হতে যাওয়া সদস্য প্রোফাইল:' : 'Selected Member Profile to Link:'}
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    {selectedMember.memberNo}
                  </span>
                </div>
                <div className="text-xs text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 font-medium">নাম: </span>
                    <span className="font-bold text-slate-900">{selectedMember.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">মোবাইল: </span>
                    <span className="font-semibold text-slate-800">{selectedMember.phone || 'দেওয়া হয়নি'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">ঠিকানা: </span>
                    <span className="text-slate-700 truncate">{selectedMember.presentAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">বর্তমান ইমেইল: </span>
                    <span className="text-slate-700 font-mono text-[11px]">{selectedMember.email || 'নাই'}</span>
                  </div>
                </div>
                {existingLinkedUser && (
                  <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ দ্রষ্টব্য: এই সদস্যের সাথে ইতিমধ্যে ইউজার ({existingLinkedUser.email}) সংযুক্ত রয়েছে। অনুমোদন করলে বর্তমান নতুন ইউজারে এটি স্থানান্তর হবে।
                  </p>
                )}
                <div className="pt-1.5 border-t border-blue-100 flex items-center gap-1.5 text-[11px] text-blue-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    অনুমোদনের পর নিবন্ধিত ইমেইল (<span className="font-bold">{user.email}</span>) স্বয়ংক্রিয়ভাবে এই সদস্যের প্রোফাইলে যুক্ত হবে।
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Assign User UID (BS-####) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] flex items-center justify-center">2</span>
                <span>{language === 'bn' ? 'ইউজার ইউআইডি নির্ধারণ করুন (User UID)' : 'Assign User UID (BS-####)'}</span>
                <span className="text-rose-500 font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={() => setUserUid(generateNextUserUid(users))}
                className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 transition-colors cursor-pointer"
              >
                {language === 'bn' ? 'পরবর্তী ফ্রি UID সাজেস্ট করুন' : 'Auto Suggest Next UID'}
              </button>
            </div>

            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. BS-1010"
                value={userUid}
                onChange={(e) => setUserUid(e.target.value.toUpperCase())}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all uppercase"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {language === 'bn' 
                ? 'সদস্য এই ইউআইডি (যেমন: BS-1010) অথবা তার নিবন্ধিত ইমেইল দিয়ে সহজে লগইন করতে পারবেন।'
                : 'Member can log in using either this UID or registered email address.'}
            </p>
          </div>

          {/* Final Summary Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {language === 'bn' ? 'অনুমোদনের পর কার্যকারিতা:' : 'Workflow Chain:'}
            </span>
            <p className="font-semibold text-blue-900">
              User Account ({user.email}) → User UID ({userUid || 'BS-####'}) → Linked Member ({selectedMember ? selectedMember.name : 'প্রোফাইল'}) → Member Dashboard
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReject}
            disabled={loading || rejectLoading}
            className="w-full sm:w-auto px-4 py-2.5 text-rose-700 hover:bg-rose-100/70 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {rejectLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{language === 'bn' ? 'আবেদন প্রত্যাখ্যান ও মুছুন' : 'Reject & Delete'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={loading || rejectLoading || !selectedMemberId || !userUid.trim()}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'bn' ? 'অনুমোদন হচ্ছে...' : 'Approving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'bn' ? 'অনুমোদন ও একাউন্ট সক্রিয় করুন' : 'Approve & Activate Account'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
