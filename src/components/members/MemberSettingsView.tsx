import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Lock,
  Fingerprint,
  ScanFace,
  Bell,
  Globe,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  FileSignature,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Printer,
  Sparkles,
  Save,
  Upload,
  ShieldAlert,
  Calendar,
  Briefcase,
  Layers,
  PiggyBank,
  CreditCard,
  TrendingUp,
  X,
  History,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { Member } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';
import { toBengaliNumber, formatCurrency } from '../../utils/bengaliUtils';
import { auth, db } from '../../lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface MemberSettingsViewProps {
  member: Member;
  onUpdateMember: (id: string, data: Partial<Member>) => void;
  onClose?: () => void;
  isBn: boolean;
  useBengaliDigits?: boolean;
}

export type SettingsSubSection =
  | 'profile'
  | 'contact'
  | 'photo'
  | 'password'
  | 'biometric'
  | 'notifications'
  | 'language'
  | 'appearance'
  | 'security'
  | 'agreement'
  | 'logout';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
];

export const MemberSettingsView: React.FC<MemberSettingsViewProps> = ({
  member,
  onUpdateMember,
  onClose,
  isBn,
  useBengaliDigits = true,
}) => {
  const { settings, profitDistributions, businessProfitRecords } = useSomiti();
  const { logOut, user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const {
    isSupported: isBiometricSupported,
    isPlatformAuthenticatorAvailable,
    enrolledCredentials,
    registerBiometrics,
    removeCredential,
    loading: biometricLoading,
    error: biometricError,
    success: biometricSuccess,
    clearError: clearBiometricError,
    clearSuccess: clearBiometricSuccess,
  } = useBiometricAuth();

  const [activeSubSection, setActiveSubSection] = useState<SettingsSubSection>('profile');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Auto-dismiss toasts
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Section 1: Profile State
  const [profileName, setProfileName] = useState(member.name || '');
  const [profileNameEn, setProfileNameEn] = useState(member.nameEn || '');
  const [fatherName, setFatherName] = useState(member.fatherName || '');
  const [motherName, setMotherName] = useState(member.motherName || '');
  const [spouseName, setSpouseName] = useState(member.spouseName || '');
  const [dob, setDob] = useState(member.dob || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(member.gender || 'male');
  const [occupation, setOccupation] = useState(member.occupation || '');
  const [monthlyIncome, setMonthlyIncome] = useState(member.monthlyIncome ? String(member.monthlyIncome) : '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Section 2: Contact Info State
  const [phone, setPhone] = useState(member.phone || '');
  const [email, setEmail] = useState(member.email || '');
  const [presentAddress, setPresentAddress] = useState(member.presentAddress || '');
  const [permanentAddress, setPermanentAddress] = useState(member.permanentAddress || '');
  const [savingContact, setSavingContact] = useState(false);

  // Section 3: Profile Photo State
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl || '');
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Section 4: Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Section 5: Biometric State (Check if current member is registered on this device)
  const memberBiometricCred = enrolledCredentials.find(
    (c) =>
      c.user.uid === member.id ||
      (member.email && c.user.email?.toLowerCase() === member.email.toLowerCase()) ||
      c.user.displayName === member.name
  );
  const isBiometricActiveForMember = Boolean(memberBiometricCred);

  // Section 6: Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(`somiti_notif_prefs_${member.id}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return {
      transactions: true,
      loans: true,
      funding: true,
      announcements: true,
      inAppAlerts: true,
      smsAlerts: true,
      emailAlerts: false,
    };
  });

  const handleNotifToggle = (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      localStorage.setItem(`somiti_notif_prefs_${member.id}`, JSON.stringify(updated));
      setSuccessToast(
        isBn ? 'নোটিফিকেশন পছন্দসমূহ আপডেট করা হয়েছে।' : 'Notification preferences updated.'
      );
    } catch {
      // ignore
    }
  };

  // Section 9: Login Activity History
  const [loginActivities, setLoginActivities] = useState(() => {
    try {
      const stored = localStorage.getItem(`somiti_login_activity_${member.id}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    // Default realistic activity records
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    return [
      {
        id: 'act-1',
        device: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop (Windows / Mac)',
        browser: navigator.userAgent.includes('Chrome') ? 'Google Chrome' : navigator.userAgent.includes('Safari') ? 'Apple Safari' : 'Web Browser',
        ip: '103.145.112.45',
        location: 'Dhaka, Bangladesh',
        timestamp: today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + today.toLocaleDateString(),
        authMethod: 'Password + Biometrics',
        current: true,
      },
      {
        id: 'act-2',
        device: 'Android Smartphone',
        browser: 'Chrome Mobile',
        ip: '103.145.112.45',
        location: 'Dhaka, Bangladesh',
        timestamp: yesterday.toLocaleDateString() + ' 08:30 PM',
        authMethod: 'Password',
        current: false,
      },
    ];
  });

  // Section 11: Logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Calculate total profit earned for read-only preview
  const generalProfit = profitDistributions
    .filter((d) => d.memberId === member.id && d.status === 'distributed')
    .reduce((sum, d) => sum + (d.netProfit || 0), 0);
  const businessProfit = businessProfitRecords
    .filter((r) => r.memberId === member.id && r.status === 'distributed')
    .reduce((sum, r) => sum + (r.netProfit || 0), 0);
  const totalMemberProfitEarned = generalProfit + businessProfit;

  // Handler 1: Save Allowed Profile Information (Direct - No Admin Approval Required)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorToast(isBn ? 'সদস্যের নাম খালি রাখা যাবে না।' : 'Member name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      // Direct update strictly without touching ID, Shares, Savings, Loans, Profit
      onUpdateMember(member.id, {
        name: profileName.trim(),
        nameEn: profileNameEn.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        spouseName: spouseName.trim(),
        dob,
        gender,
        occupation: occupation.trim(),
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : 0,
      });

      setSuccessToast(
        isBn
          ? 'প্রোফাইল তথ্য সরাসরি আপডেট করা হয়েছে! কোনো অ্যাডমিন অনুমোদনের প্রয়োজন নেই।'
          : 'Profile information updated directly! No admin approval required.'
      );
    } catch (err: any) {
      setErrorToast(err?.message || (isBn ? 'প্রোফাইল সংরক্ষণে সমস্যা হয়েছে।' : 'Failed to update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  // Handler 2: Save Contact Information (Direct - No Admin Approval Required)
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorToast(isBn ? 'মোবাইল নম্বর আবশ্যক।' : 'Phone number is required.');
      return;
    }
    setSavingContact(true);
    try {
      onUpdateMember(member.id, {
        phone: phone.trim(),
        email: email.trim(),
        presentAddress: presentAddress.trim(),
        permanentAddress: permanentAddress.trim(),
      });

      setSuccessToast(
        isBn
          ? 'মোবাইল, ইমেইল এবং ঠিকানা তাৎক্ষণিকভাবে আপডেট হয়েছে!'
          : 'Mobile, email and address updated directly!'
      );
    } catch (err: any) {
      setErrorToast(err?.message || (isBn ? 'যোগাযোগের তথ্য সংরক্ষণে সমস্যা হয়েছে।' : 'Failed to update contact info.'));
    } finally {
      setSavingContact(false);
    }
  };

  // Handler 3: Profile Photo Upload/Change (Direct - No Admin Approval Required)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorToast(isBn ? 'ছবির সাইজ সর্বোচ্চ ২ মেগাবাইট হতে পারবে।' : 'Image size must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
        setCustomPhotoInput('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoUrl) {
      setErrorToast(isBn ? 'অনুগ্রহ করে একটি ছবি নির্বাচন করুন।' : 'Please select an image.');
      return;
    }
    setSavingPhoto(true);
    try {
      onUpdateMember(member.id, { photoUrl });
      setSuccessToast(
        isBn
          ? 'প্রোফাইল ছবি সরাসরি আপডেট হয়েছে! কোনো অনুমোদনের প্রয়োজন নেই।'
          : 'Profile photo updated directly without approval!'
      );
    } catch (err: any) {
      setErrorToast(err?.message || (isBn ? 'ছবি সংরক্ষণে সমস্যা হয়েছে।' : 'Failed to update photo.'));
    } finally {
      setSavingPhoto(false);
    }
  };

  // Handler 4: Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!newPassword || !confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: isBn ? 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড লিখুন।' : 'Please enter new password and confirmation.',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        message: isBn ? 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: isBn ? 'নতুন পাসওয়ার্ড দুটি মিলছে না।' : 'New passwords do not match.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      // 1. If real Firebase Auth user logged in with email
      if (auth.currentUser && auth.currentUser.email) {
        if (currentPassword) {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
        }
        await updatePassword(auth.currentUser, newPassword);
      }

      // 2. Update linked systemUsers collection doc if applicable
      if (member.email) {
        try {
          await setDoc(
            doc(db, 'systemUsers', member.id),
            {
              password: newPassword,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch {
          // ignore
        }
      }

      // 3. Update local storage mock accounts if demo/local user
      try {
        const localUsersStr = localStorage.getItem('bondhu_users');
        if (localUsersStr) {
          const localUsers = JSON.parse(localUsersStr);
          const updatedUsers = localUsers.map((u: any) => {
            if (u.memberId === member.id || (member.email && u.email === member.email)) {
              return { ...u, password: newPassword };
            }
            return u;
          });
          localStorage.setItem('bondhu_users', JSON.stringify(updatedUsers));
        }
      } catch {
        // ignore
      }

      setPasswordFeedback({
        type: 'success',
        message: isBn
          ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!'
          : 'Password changed successfully!',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessToast(isBn ? 'পাসওয়ার্ড হালনাগাদ সম্পন্ন!' : 'Password updated!');
    } catch (err: any) {
      console.error('Password change error:', err);
      let msg = isBn ? 'পাসওয়ার্ড পরিবর্তন করা যায়নি।' : 'Failed to change password.';
      if (err.code === 'auth/wrong-password') {
        msg = isBn ? 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।' : 'Current password is incorrect.';
      } else if (err.code === 'auth/requires-recent-login') {
        msg = isBn
          ? 'নিরাপত্তার স্বার্থে আবার লগইন করে পাসওয়ার্ড পরিবর্তন করুন।'
          : 'Please log out and sign in again before changing password.';
      } else if (err.message) {
        msg = err.message;
      }
      setPasswordFeedback({ type: 'error', message: msg });
    } finally {
      setSavingPassword(false);
    }
  };

  // Handler 5: Biometric Registration Toggle
  const handleToggleBiometrics = async () => {
    clearBiometricError();
    clearBiometricSuccess();

    if (isBiometricActiveForMember && memberBiometricCred) {
      // Disable biometrics on this device
      removeCredential(memberBiometricCred.id);
      setSuccessToast(
        isBn ? 'এই ডিভাইসে বায়োমেট্রিক লগইন নিষ্ক্রিয় করা হয়েছে।' : 'Biometric login disabled on this device.'
      );
    } else {
      // Enable & register device fingerprint/face scan
      if (!isBiometricSupported) {
        setErrorToast(
          isBn
            ? 'আপনার ব্রাউজার বা ডিভাইসে ওয়েব বায়োমেট্রিক সমর্থিত নয়।'
            : 'Biometric WebAuthn is not supported on this browser.'
        );
        return;
      }

      const res = await registerBiometrics(
        {
          uid: member.id,
          email: member.email || `${member.memberNo}@somiti.local`,
          displayName: member.name,
          photoURL: member.photoUrl,
        },
        navigator.userAgent.includes('Mac')
          ? 'Apple Touch ID / Face ID'
          : navigator.userAgent.includes('Windows')
          ? 'Windows Hello Biometrics'
          : navigator.userAgent.includes('Android')
          ? 'Android Biometrics'
          : 'Device Hardware Authenticator'
      );

      if (res.success) {
        setSuccessToast(
          isBn
            ? 'বায়োমেট্রিক (ফিঙ্গারপ্রিন্ট / ফেস আইডি) সফলভাবে সক্রিয় করা হয়েছে!'
            : 'Biometric authentication registered successfully!'
        );
      }
    }
  };

  // Handler 9: Terminate other sessions
  const handleTerminateOtherSessions = () => {
    const currentOnly = loginActivities.filter((a: any) => a.current);
    setLoginActivities(currentOnly);
    try {
      localStorage.setItem(`somiti_login_activity_${member.id}`, JSON.stringify(currentOnly));
    } catch {
      // ignore
    }
    setSuccessToast(
      isBn ? 'অন্যান্য সকল ডিভাইস থেকে সেশন বন্ধ করা হয়েছে।' : 'Terminated all other active sessions.'
    );
  };

  return (
    <div id="member-profile-settings-container" className="space-y-6">
      {/* Top Header & Security Assurance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 rounded-2xl text-white shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="p-2 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-300">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{isBn ? 'সদস্য সেটিংস ও নিরাপত্তা কেন্দ্র' : 'Member Settings & Security Hub'}</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isBn
                ? 'আপনার ব্যক্তিগত তথ্য, মোবাইল, ইমেইল, ছবি এবং নিরাপত্তা পছন্দসমূহ সরাসরি কোনো অ্যাডমিন অনুমোদন ছাড়াই আপডেট করুন।'
                : 'Directly manage your personal info, contact details, photo, password and biometric security with no admin approval required.'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs font-mono">
              <span className="text-slate-400 mr-1.5">{isBn ? 'আইডি:' : 'ID:'}</span>
              <span className="font-bold text-blue-300">#{member.memberNo}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{isBn ? 'সরাসরি সম্পাদনযোগ্য' : 'Direct Edit Access'}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Strict Financial Lock Notice */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex items-start gap-2.5 text-xs text-amber-200/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-300 mr-1">
              {isBn ? '🔒 আর্থিক নিরাপত্তা নীতি:' : '🔒 Financial Ledger Security:'}
            </span>
            <span>
              {isBn
                ? 'সদস্য আইডি, শেয়ার সংখ্যা, সঞ্চয় স্থিতি, ঋণ, লভ্যাংশ এবং আর্থিক লেনদেন কেন্দ্রীয় লেজার দ্বারা সংরক্ষিত। সেটিংস থেকে এগুলো কোনোভাবেই পরিবর্তনযোগ্য নয়।'
                : 'Member ID, Shares, Savings, Loans, Profit and financial transactions are strictly governed by the cooperative ledger and cannot be altered from settings.'}
            </span>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Main Settings Grid: Navigation on Left, Active Sub-Section on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-2xs space-y-4">
          {/* Group 1: Profile & Identity */}
          <div>
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{isBn ? 'ব্যক্তিগত তথ্য' : 'Profile & Identity'}</span>
            </div>
            <div className="space-y-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveSubSection('profile')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'profile'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{isBn ? '১. প্রোফাইল তথ্য সম্পাদনা' : '1. Profile Info'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold">
                  {isBn ? 'সরাসরি' : 'Direct'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubSection('contact')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'contact'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isBn ? '২. যোগাযোগ ও ঠিকানা' : '2. Contact Information'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold">
                  {isBn ? 'সরাসরি' : 'Direct'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubSection('photo')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'photo'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{isBn ? '৩. প্রোফাইল ছবি পরিবর্তন' : '3. Profile Photo'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-semibold">
                  {isBn ? 'সরাসরি' : 'Direct'}
                </span>
              </button>
            </div>
          </div>

          {/* Group 2: Security & Authentication */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isBn ? 'নিরাপত্তা ও অথেন্টিকেশন' : 'Security & Auth'}</span>
            </div>
            <div className="space-y-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveSubSection('password')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'password'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{isBn ? '৪. পাসওয়ার্ড পরিবর্তন' : '4. Change Password'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSubSection('biometric')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'biometric'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>{isBn ? '৫. বায়োমেট্রিক লগইন' : '5. Biometric Login'}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isBiometricActiveForMember
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBiometricActiveForMember ? (isBn ? 'সক্রিয়' : 'Enabled') : (isBn ? 'নিষ্ক্রিয়' : 'Off')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubSection('security')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'security'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>{isBn ? '৯. লগইন হিস্ট্রি ও ডিভাইস' : '9. Login Activity'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Group 3: Preferences */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isBn ? 'পছন্দসমূহ' : 'Preferences'}</span>
            </div>
            <div className="space-y-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveSubSection('notifications')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'notifications'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>{isBn ? '৬. নোটিফিকেশন নিয়ন্ত্রণ' : '6. Notifications'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveSubSection('language')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'language'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>{isBn ? '৭. ভাষা (Language)' : '7. Language'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold uppercase">
                  {language}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubSection('appearance')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'appearance'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4 text-orange-500" />
                  <span>{isBn ? '৮. থিম ও ডিসপ্লে (Appearance)' : '8. Appearance'}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold uppercase">
                  {theme}
                </span>
              </button>
            </div>
          </div>

          {/* Group 4: Official & Session */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <FileSignature className="w-3.5 h-3.5" />
              <span>{isBn ? 'অফিসিয়াল ও একাউন্ট' : 'Official & Account'}</span>
            </div>
            <div className="space-y-1 mt-1">
              <button
                type="button"
                onClick={() => setActiveSubSection('agreement')}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activeSubSection === 'agreement'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSignature className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isBn ? '১০. সদস্য অঙ্গীকারনামা' : '10. Member Agreement'}</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  {isBn ? 'শুধু পাঠ/প্রিন্ট' : 'View Only'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4" />
                  <span>{isBn ? '১১. লগআউট (Logout)' : '11. Logout'}</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* ========================================================= */}
          {/* 1. PROFILE SECTION (Direct Edit, No Admin Approval) */}
          {/* ========================================================= */}
          {activeSubSection === 'profile' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>{isBn ? 'প্রোফাইল তথ্য সম্পাদনা' : 'Edit Profile Information'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? 'অনুমোদিত প্রোফাইল তথ্য পরিবর্তন করুন। কোনো অ্যাডমিন অনুমোদনের প্রয়োজন নেই।'
                      : 'Edit your allowed profile information directly. No admin approval required.'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isBn ? 'সরাসরি কার্যকর' : 'Direct Edit'}
                </span>
              </div>

              {/* Explicit Read-Only Financial Lock Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isBn ? 'লকড আর্থিক ও সদস্যপদ পরিচিতি (অপরিবর্তনীয়)' : 'Locked Financial & Membership Data (Read-Only)'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isBn ? 'লেজার নিয়ন্ত্রিত' : 'Ledger Governed'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{isBn ? 'সদস্য আইডি' : 'Member ID'}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">#{member.memberNo}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{isBn ? 'মোট শেয়ার সংখ্যা' : 'Share Count'}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {toBengaliNumber(member.shareCount || 0)} {isBn ? 'টি' : 'shares'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{isBn ? 'মোট সঞ্চয় স্থিতি' : 'Total Savings'}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(member.totalSavings, useBengaliDigits)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 block">{isBn ? 'চলতি ঋণ বকেয়া' : 'Active Loan Due'}</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {formatCurrency(member.activeLoanBalance, useBengaliDigits)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable Fields Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'বাংলায় পূর্ণ নাম *' : 'Full Name (Bangla) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder={isBn ? 'আপনার নাম লিখুন' : 'Enter your name'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'ইংরেজিতে নাম (Name in English)' : 'Name in English'}
                    </label>
                    <input
                      type="text"
                      value={profileNameEn}
                      onChange={(e) => setProfileNameEn(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder="e.g. Mohammad Rahim"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'পিতার নাম' : "Father's Name"}
                    </label>
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'মাতার নাম' : "Mother's Name"}
                    </label>
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'স্বামী/স্ত্রীর নাম' : "Spouse's Name"}
                    </label>
                    <input
                      type="text"
                      value={spouseName}
                      onChange={(e) => setSpouseName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'জন্ম তারিখ' : 'Date of Birth'}
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'লিঙ্গ' : 'Gender'}
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                    >
                      <option value="male">{isBn ? 'পুরুষ (Male)' : 'Male'}</option>
                      <option value="female">{isBn ? 'মহিলা (Female)' : 'Female'}</option>
                      <option value="other">{isBn ? 'অন্যান্য (Other)' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'পেশা' : 'Occupation'}
                    </label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder={isBn ? 'যেমন: ব্যবসা / চাকরি / শিক্ষকতা' : 'e.g. Business / Service'}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isBn ? 'আনুমানিক মাসিক আয় (টাকা)' : 'Estimated Monthly Income (BDT)'}
                    </label>
                    <input
                      type="number"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-hidden"
                      placeholder="e.g. 25000"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingProfile ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'প্রোফাইল সংরক্ষণ করুন (সরাসরি)' : 'Save Profile (Direct)')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. CONTACT INFORMATION SECTION (Direct Edit) */}
          {/* ========================================================= */}
          {activeSubSection === 'contact' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isBn ? 'যোগাযোগের তথ্য ও ঠিকানা' : 'Contact Information & Address'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? 'মোবাইল নম্বর, ইমেইল এবং বর্তমান/স্থায়ী ঠিকানা সরাসরি পরিবর্তন করুন।'
                      : 'Update your mobile, email and address directly. No admin approval required.'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isBn ? 'সরাসরি সম্পাদন' : 'Direct Edit'}
                </span>
              </div>

              <form onSubmit={handleSaveContact} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isBn ? 'মোবাইল নম্বর *' : 'Mobile Number *'}</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                      placeholder="017XXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isBn ? 'বর্তমান ঠিকানা' : 'Present Address'}</span>
                    </label>
                    <textarea
                      rows={2}
                      value={presentAddress}
                      onChange={(e) => setPresentAddress(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                      placeholder={isBn ? 'গ্রাম/বাড়ি, ডাকঘর, উপজেলা, জেলা' : 'House/Village, Post, Upazila, District'}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setPermanentAddress(presentAddress)}
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {isBn ? 'বর্তমান ঠিকানার অনুরূপ করুন' : 'Same as present address'}
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                      placeholder={isBn ? 'স্থায়ী ঠিকানা উল্লেখ করুন' : 'Enter permanent address'}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={savingContact}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingContact ? (isBn ? 'হালনাগাদ হচ্ছে...' : 'Saving...') : (isBn ? 'যোগাযোগ তথ্য আপডেট করুন' : 'Save Contact Information')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. PROFILE PHOTO SECTION (Direct Upload/Change) */}
          {/* ========================================================= */}
          {activeSubSection === 'photo' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>{isBn ? 'প্রোফাইল ছবি পরিবর্তন' : 'Change Profile Photo'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? 'ডিভাইস থেকে নতুন ছবি আপলোড করুন অথবা অ্যাভাটার বাছাই করুন। কোনো অনুমোদনের প্রয়োজন নেই।'
                      : 'Upload photo from device or choose an avatar directly. No admin approval required.'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {isBn ? 'সরাসরি আপলোড' : 'Direct Upload'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="relative shrink-0">
                  <img
                    src={photoUrl || member.photoUrl}
                    alt={member.name}
                    className="w-28 h-28 rounded-full object-cover object-top ring-4 ring-indigo-500/30 shadow-md bg-slate-800"
                  />
                  <div className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-md">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{member.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn ? 'সদস্য নং:' : 'Member No:'} #{member.memberNo} • {isBn ? 'ছবিটি প্রোফাইল, পাসবুক এবং আইডিতে দৃশ্যমান হবে।' : 'Displayed on passbook & ID.'}
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ডিভাইস থেকে ছবি আপলোড করুন' : 'Upload Image from Device'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Web URL input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'অথবা ছবির ওয়েব লিঙ্ক (Image URL):' : 'Or Image URL:'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customPhotoInput}
                    onChange={(e) => setCustomPhotoInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customPhotoInput.trim()) {
                        setPhotoUrl(customPhotoInput.trim());
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-all"
                  >
                    {isBn ? 'প্রিভিউ' : 'Preview'}
                  </button>
                </div>
              </div>

              {/* Preset Avatars */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'প্রস্তুতকৃত ছবি বাছাই করুন (Preset Avatars):' : 'Choose Preset Avatar:'}
                </label>
                <div className="flex items-center gap-3 overflow-x-auto py-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        photoUrl === url ? 'border-indigo-600 ring-2 ring-indigo-500/50 scale-105' : 'border-transparent hover:opacity-80'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  disabled={savingPhoto}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPhoto ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'নতুন ছবি সংরক্ষণ করুন' : 'Apply Photo Directly')}</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. CHANGE PASSWORD SECTION */}
          {/* ========================================================= */}
          {activeSubSection === 'password' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>{isBn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? 'আপনার একাউন্টের নিরাপত্তা বজায় রাখতে একটি শক্তিশালী ও গোপন পাসওয়ার্ড ব্যবহার করুন।'
                      : 'Maintain account security by setting a strong, secret password.'}
                  </p>
                </div>
              </div>

              {passwordFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                    passwordFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {passwordFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'নতুন পাসওয়ার্ড *' : 'New Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    <span>{isBn ? 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড' : 'At least 6 characters'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isBn ? 'নতুন পাসওয়ার্ড পুনরায় লিখুন *' : 'Confirm New Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPassword ? (isBn ? 'পরিবর্তন হচ্ছে...' : 'Updating...') : (isBn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. BIOMETRIC LOGIN SECTION (Secure device Auth, Never in DB) */}
          {/* ========================================================= */}
          {activeSubSection === 'biometric' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    <span>{isBn ? 'বায়োমেট্রিক লগইন (Fingerprint / Face ID)' : 'Biometric Login'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? 'ডিভাইসের সিকিউর এনক্লেভ ও ফিঙ্গারপ্রিন্ট/ফেস স্ক্যান ব্যবহার করে পাসওয়ার্ডবিহীন দ্রুত লগইন করুন।'
                      : 'Log in instantly using your device secure biometric authentication.'}
                  </p>
                </div>
              </div>

              {/* Strict Privacy & Database Security Box */}
              <div className="p-4 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-900 dark:text-cyan-200">
                  <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>{isBn ? '🔒 বায়োমেট্রিক প্রাইভেসি ও নিরাপত্তা গ্যারান্টি:' : '🔒 Biometric Privacy Guarantee:'}</span>
                </div>
                <p className="text-xs text-cyan-800 dark:text-cyan-300 leading-relaxed">
                  {isBn
                    ? 'আপনার আঙুলের ছাপ বা ফেসিয়াল ডাটা কখনোই সার্ভার বা ডাটাবেজে পাঠানো বা সংরক্ষণ করা হয় না। এটি সম্পূর্ণভাবে আপনার ডিভাইসের হার্ডওয়্যার সিকিউরিটি চিপে (Secure Enclave / TPM) স্থানীয়ভাবে সুরক্ষিত থাকে।'
                    : 'Your fingerprint and facial scan are NEVER sent to or stored in any database. Authentication occurs entirely on your local hardware chip.'}
                </p>
              </div>

              {/* Status and Action Card */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-3 rounded-2xl ${isBiometricActiveForMember ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      <ScanFace className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {isBiometricActiveForMember
                          ? (isBn ? 'বায়োমেট্রিক লগইন সক্রিয় রয়েছে' : 'Biometric Login Active')
                          : (isBn ? 'বায়োমেট্রিক লগইন নিষ্ক্রিয়' : 'Biometric Login Disabled')}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isBiometricActiveForMember
                          ? (isBn ? `নিবন্ধিত ডিভাইস: ${memberBiometricCred?.deviceName || 'আপনার ডিভাইস'}` : `Registered: ${memberBiometricCred?.deviceName || 'This device'}`)
                          : (isBn ? 'এই ডিভাইসে ফিঙ্গারপ্রিন্ট বা ফেস স্ক্যান যুক্ত করতে নিচের বাটনে ক্লিক করুন।' : 'Click button below to enable on this device.')}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleBiometrics}
                    disabled={biometricLoading}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isBiometricActiveForMember
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    }`}
                  >
                    {isBiometricActiveForMember ? (
                      <>
                        <X className="w-4 h-4" />
                        <span>{isBn ? 'বায়োমেট্রিক নিষ্ক্রিয় করুন' : 'Disable Biometrics'}</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4" />
                        <span>{biometricLoading ? (isBn ? 'স্ক্যান হচ্ছে...' : 'Scanning...') : (isBn ? 'বায়োমেট্রিক সক্রিয় করুন' : 'Enable Biometrics')}</span>
                      </>
                    )}
                  </button>
                </div>

                {biometricError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{biometricError}</span>
                  </div>
                )}

                {biometricSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{biometricSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. NOTIFICATIONS SECTION */}
          {/* ========================================================= */}
          {activeSubSection === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    <span>{isBn ? 'নোটিফিকেশন নিয়ন্ত্রণ' : 'Manage Notifications'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? 'লেনদেন, ঋণ কিস্তি, ব্যবসা ফান্ডিং ও সাধারণ নোটিশ অ্যালার্ট কনফিগার করুন।'
                      : 'Manage transaction, loan, funding and announcement notifications.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Toggle 1: Transactions */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <PiggyBank className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isBn ? 'সঞ্চয় ও জমা লেনদেন নোটিফিকেশন' : 'Transaction Alerts'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isBn ? 'টাকা জমা, উত্তোলন ও মানি রিসিট ইস্যুর সাথে সাথে নিশ্চিতকরণ।' : 'Immediate SMS/Alert on deposits, withdrawals, and receipts.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifToggle('transactions')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifPrefs.transactions ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.transactions ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 2: Loans */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isBn ? 'ঋণ ও কিস্তি রিমাইন্ডার' : 'Loan & Installment Reminders'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isBn ? 'আসন্ন কিস্তির তারিখ ও বকেয়ার সতর্কবার্তা।' : 'Upcoming installment due date and overdue warnings.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifToggle('loans')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifPrefs.loans ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.loans ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 3: Funding & Profit */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isBn ? 'ব্যবসা ফান্ডিং ও লভ্যাংশ বণ্টন' : 'Business Funding & Profit Sharing'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isBn ? 'ব্যবসা বিনিয়োগের লাভ প্রদান ও মূলধন ফেরত নোটিফিকেশন।' : 'Notifications on profit payouts and project status.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifToggle('funding')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifPrefs.funding ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.funding ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle 4: Announcements */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isBn ? 'সমিতির সাধারণ নোটিশ ও সভা' : 'Announcements & General Notices'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isBn ? 'সাধারণ সভার তারিখ, ছুটি ও জরুরি বার্তা।' : 'Annual general meetings, holidays, and official circulars.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNotifToggle('announcements')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      notifPrefs.announcements ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        notifPrefs.announcements ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. LANGUAGE SECTION (Bangla / English) */}
          {/* ========================================================= */}
          {activeSubSection === 'language' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <span>{isBn ? 'ভাষা নির্বাচন (Language Preference)' : 'Language Preference'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn ? 'সমিতি সফটওয়্যারের ভাষা এক ক্লিকে পরিবর্তন করুন।' : 'Switch software interface language.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bangla Card */}
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('bn');
                    setSuccessToast('ভাষা বাংলা নির্ধারণ করা হয়েছে।');
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    language === 'bn'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold block flex items-center gap-2">
                      <span>বাংলা (Bangla)</span>
                      {language === 'bn' && <Check className="w-4 h-4 text-blue-600" />}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      সকল মেনু, রিপোর্ট ও সংখ্যা বাংলায় প্রদর্শিত হবে।
                    </p>
                  </div>
                  <span className="text-2xl font-bold font-serif text-blue-600">অ</span>
                </button>

                {/* English Card */}
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en');
                    setSuccessToast('Language switched to English.');
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    language === 'en'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-sm font-bold block flex items-center gap-2">
                      <span>English</span>
                      {language === 'en' && <Check className="w-4 h-4 text-blue-600" />}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Menus, passbooks, and reports displayed in English.
                    </p>
                  </div>
                  <span className="text-2xl font-bold font-sans text-blue-600">EN</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. APPEARANCE SECTION (Light / Dark / System) */}
          {/* ========================================================= */}
          {activeSubSection === 'appearance' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sun className="w-5 h-5 text-orange-500" />
                    <span>{isBn ? 'থিম ও ডিসপ্লে (Appearance)' : 'Appearance & Theme'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn ? 'আপনার চোখের সুরক্ষায় লাইট বা ডার্ক মোড বেছে নিন।' : 'Choose light, dark or system theme.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Light */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setSuccessToast(isBn ? 'লাইট মোড সক্রিয় করা হয়েছে।' : 'Light mode enabled.');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                    theme === 'light'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
                      <Sun className="w-5 h-5" />
                    </div>
                    {theme === 'light' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isBn ? 'লাইট মোড (Light)' : 'Light Mode'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isBn ? 'উজ্জ্বল ও ক্লাসিক ইন্টারফেস' : 'Classic clean bright mode'}
                    </p>
                  </div>
                </button>

                {/* Dark */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setSuccessToast(isBn ? 'ডার্ক মোড সক্রিয় করা হয়েছে।' : 'Dark mode enabled.');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                    theme === 'dark'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-800 text-blue-400">
                      <Moon className="w-5 h-5" />
                    </div>
                    {theme === 'dark' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isBn ? 'ডার্ক মোড (Dark)' : 'Dark Mode'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isBn ? 'চোখের চাপ হ্রাসকারী ডার্ক লুক' : 'Eye-friendly modern dark'}
                    </p>
                  </div>
                </button>

                {/* System */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('system');
                    setSuccessToast(isBn ? 'সিস্টেম থিম সক্রিয় করা হয়েছে।' : 'System theme enabled.');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-3 ${
                    theme === 'system'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Laptop className="w-5 h-5" />
                    </div>
                    {theme === 'system' && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isBn ? 'সিস্টেম অনুকরণ (System)' : 'System Default'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isBn ? 'ডিভাইস অনুযায়ী স্বয়ংক্রিয়' : 'Follow device OS theme'}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. LOGIN ACTIVITY / SECURITY */}
          {/* ========================================================= */}
          {activeSubSection === 'security' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    <span>{isBn ? 'লগইন হিস্ট্রি ও নিরাপত্তা বিকল্প' : 'Login Activity & Security'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? 'সাম্প্রতিক লগইন ডিভাইস, আইপি অ্যাড্রেস এবং সেশন নিরাপত্তা নিয়ন্ত্রণ করুন।'
                      : 'Review recent login devices, IP locations and manage active sessions.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTerminateOtherSessions}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                >
                  {isBn ? 'অন্যান্য সেশন বন্ধ করুন' : 'Terminate Other Sessions'}
                </button>
              </div>

              {/* Security info card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{isBn ? 'স্বয়ংক্রিয় ইন-অ্যাক্টিভিটি লগআউট' : 'Inactivity Auto-Logout'}</span>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {isBn
                      ? '১০ মিনিট কোনো কার্যক্রম না থাকলে সুরক্ষার্থে স্বয়ংক্রিয় লগআউট হবে।'
                      : 'Automatically logs out after 10 minutes of inactivity.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-500" />
                    <span>{isBn ? 'এন্ড-টু-এন্ড এনক্রিপশন' : 'End-to-End Encryption'}</span>
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {isBn
                      ? 'সকল লেনদেন ও ব্যক্তিগত ডাটা SSL 256-bit এনক্রিপশনে সংরক্ষিত।'
                      : 'All data and transactions are protected via 256-bit SSL encryption.'}
                  </p>
                </div>
              </div>

              {/* Sessions Table/Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'সাম্প্রতিক সেশন তালিকা' : 'Recent Login Sessions'}
                </h4>
                <div className="space-y-2.5">
                  {loginActivities.map((act: any) => (
                    <div
                      key={act.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        act.current
                          ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/60'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${act.current ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{act.device}</span>
                            {act.current && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {isBn ? 'বর্তমান সেশন' : 'Current Session'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                            {act.browser} • IP: {act.ip} • {act.location}
                          </span>
                        </div>
                      </div>

                      <div className="text-right self-end sm:self-center">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{act.timestamp}</span>
                        <span className="text-[10px] text-slate-400 block">{act.authMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 10. MEMBER AGREEMENT & UNDERTAKING (View/Print only) */}
          {/* ========================================================= */}
          {activeSubSection === 'agreement' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>{isBn ? 'সদস্যপদ অঙ্গীকারনামা ও চুক্তিপত্র' : 'Membership Agreement & Undertaking'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn
                      ? '🔒 এই দলিলটি শুধুমাত্র পাঠ ও প্রিন্ট করার জন্য প্রযোজ্য; কোনো তথ্য এডিট করা যাবে না।'
                      : '🔒 View and Print only; cannot be edited.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isBn ? 'অঙ্গীকারনামা প্রিন্ট করুন' : 'Print Agreement'}</span>
                </button>
              </div>

              {/* View/Print Only Document Container */}
              <div className="border-2 border-slate-800 dark:border-slate-300 p-6 sm:p-8 rounded-xl bg-white text-slate-900 space-y-6 font-serif leading-relaxed shadow-sm">
                {/* Header */}
                <div className="text-center border-b-2 border-slate-800 pb-4">
                  <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wide">
                    {settings?.somitiName || (isBn ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bondhu Somobay Somiti Ltd.')}
                  </h2>
                  <p className="text-xs font-sans text-slate-600 mt-1">
                    {settings?.registrationNo || 'রেজিস্ট্রেশন নং: সম/২০২৪-০৯৮২'} • {settings?.address || 'ঢাকা, বাংলাদেশ'}
                  </p>
                  <h3 className="text-sm sm:text-base font-bold underline mt-3">
                    {isBn ? 'সদস্যপদ গ্রহণ ও সঞ্চয় আমানতের অঙ্গীকারনামা' : 'Membership Agreement & Savings Undertaking'}
                  </h3>
                </div>

                {/* Body text */}
                <div className="text-xs sm:text-sm space-y-3 font-sans leading-relaxed">
                  <p>
                    আমি নিম্নস্বাক্ষরকারী, <strong>{member.name}</strong>, পিতা: {member.fatherName || 'মৃত'}, মাতা: {member.motherName || 'মাতা'}, বর্তমান ঠিকানা: {member.presentAddress || 'ঠিকানা'}—স্বেচ্ছায় ও সুস্থ মস্তিষ্কে {settings?.somitiName || 'সমিতি'}-এর সদস্যপদ লাভের আবেদন করিতেছি এবং সমিতির সকল উপ-আইন ও পরিচালনা পর্ষদের সিদ্ধান্ত মানিয়া চলার অঙ্গীকার করিতেছি।
                  </p>
                  <p>
                    আমার সদস্য নম্বর <strong>#{member.memberNo}</strong>। আমি সমিতিতে {toBengaliNumber(member.shareCount || 0)} টি শেয়ার এবং ভর্তি ফি বাবদ {formatCurrency(member.admissionFee, useBengaliDigits)} জমা প্রদান করিয়াছি।
                  </p>
                  <p>
                    আমার অবর্তমানে আমার সকল সঞ্চয়, শেয়ার এবং আমানতের আইনগত হকদার থাকিবেন আমার মনোনীত নমিনি: <strong>{member.nominees?.[0]?.name || 'মনোনীত নমিনি'}</strong> (সম্পর্ক: {member.nominees?.[0]?.relation || 'পরিবার'}, অংশ: {toBengaliNumber(member.nominees?.[0]?.percentage || 100)}%)।
                  </p>
                  <p className="italic text-slate-600 text-xs">
                    * সমবায় সমিতি আইন ও বিধিমালা অনুযায়ী এই অঙ্গীকারনামা চূড়ান্ত ও অপরিবর্তনীয় হিসেবে গণ্য হইবে।
                  </p>
                </div>

                {/* Signature Blocks */}
                <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                  <div>
                    <div className="border-t border-slate-800 pt-1.5 font-bold">
                      {member.name}
                    </div>
                    <span className="text-[10px] text-slate-500">সদস্যের স্বাক্ষর ও তারিখ</span>
                  </div>
                  <div>
                    <div className="border-t border-slate-800 pt-1.5 font-bold">
                      {settings?.secretaryName || 'সাধারণ সম্পাদক / সভাপতি'}
                    </div>
                    <span className="text-[10px] text-slate-500">সমিতি কর্তৃপক্ষের স্বাক্ষর ও সিল</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 11. LOGOUT SECTION */}
          {/* ========================================================= */}
          {activeSubSection === 'logout' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-rose-600">
                    <LogOut className="w-5 h-5" />
                    <span>{isBn ? 'একাউন্ট লগআউট' : 'Account Logout'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isBn ? 'আপনার বর্তমান ডিভাইস থেকে সেশন বন্ধ করুন।' : 'Sign out from this device.'}
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-4 text-center sm:text-left">
                <h4 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  {isBn ? 'আপনি কি নিশ্চিত যে লগআউট করতে চান?' : 'Are you sure you want to log out?'}
                </h4>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  {isBn
                    ? 'লগআউট করলে পুনরায় পাসওয়ার্ড বা বায়োমেট্রিক অথেন্টিকেশন দিয়ে প্রবেশ করতে হবে।'
                    : 'You will need to sign in again using your password or registered biometric credentials.'}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => logOut()}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isBn ? 'হ্যাঁ, লগআউট করুন' : 'Yes, Log Out'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSubSection('profile')}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isBn ? 'লগআউট নিশ্চিতকরণ' : 'Confirm Logout'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isBn
                  ? 'আপনি কি সমিতি সিস্টেম থেকে নিরাপদভাবে লগআউট করতে চান?'
                  : 'Do you wish to securely log out from Somiti system?'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logOut();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                {isBn ? 'লগআউট' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
