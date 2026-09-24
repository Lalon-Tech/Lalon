import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, AlertCircle, CheckCircle2, Flame, Loader2, Fingerprint, Trash2, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSomiti } from '../../context/SomitiContext';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REMEMBERED_LOGIN_ID_KEY = 'somiti_remembered_login_id';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  useModalScrollLock(isOpen);
  const { user, signIn, signUp, logOut, signInWithBiometricProfile, error, clearError } = useAuth();
  const { settings, setActiveTab, setSelectedMemberId } = useSomiti();
  
  const {
    isSupported: isBiometricSupported,
    isEnrolled: isBiometricEnrolled,
    enrolledCredentials,
    registerBiometrics,
    authenticateWithBiometrics,
    removeCredential,
    loading: biometricLoading,
    error: biometricError,
    success: biometricSuccess,
    clearError: clearBiometricError,
    clearSuccess: clearBiometricSuccess,
  } = useBiometricAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>(() => {
    try {
      return localStorage.getItem(REMEMBERED_LOGIN_ID_KEY) || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentDeviceCredential = user
    ? enrolledCredentials.find((c) => c.user.uid === user.uid || c.user.email === user.email)
    : null;

  const rememberLoginId = (id: string) => {
    if (!id || !id.trim()) return;
    try {
      localStorage.setItem(REMEMBERED_LOGIN_ID_KEY, id.trim());
    } catch (err) {
      console.warn('Failed to save remembered login ID in modal:', err);
    }
  };

  const handleEnrollBiometrics = async () => {
    if (!user) return;
    clearBiometricError();
    clearBiometricSuccess();
    await registerBiometrics({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
    });
  };

  const handleBiometricModalLogin = async () => {
    clearError();
    clearBiometricError();
    setValidationError('');
    setSuccessMsg('');

    try {
      const res = await authenticateWithBiometrics();
      if (res.success && res.user) {
        if (res.user.email) {
          rememberLoginId(res.user.email);
        }
        signInWithBiometricProfile(res.user);
        setActiveTab('dashboard');
        setSelectedMemberId(null);
        setSuccessMsg(`বায়োমেট্রিক সফলভাবে যাচাই হয়েছে! স্বাগতম ${res.user.displayName || res.user.email}`);
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.warn('Biometric modal login error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    setSuccessMsg('');

    if (!email || !password) {
      return;
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        setValidationError('কনফার্ম পাসওয়ার্ড প্রদান করুন।');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('পাসওয়ার্ড দুটি মিলছে না! উভয় ফিল্ডে একই পাসওয়ার্ড দিন।');
        return;
      }
      if (password.length < 6) {
        setValidationError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        return;
      }
    }

    setLoading(true);
    try {
      const cleanLoginId = email.trim();
      rememberLoginId(cleanLoginId);

      if (mode === 'signin') {
        await signIn(cleanLoginId, password);
        setActiveTab('dashboard');
        setSelectedMemberId(null);
        setSuccessMsg('সফলভাবে লগইন হয়েছে!');
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        await signUp(cleanLoginId, password);
        setActiveTab('dashboard');
        setSelectedMemberId(null);
        setSuccessMsg('নিবন্ধন সম্পন্ন হয়েছে! অ্যাকাউন্টটি প্রশাসনিক অনুমোদনের অপেক্ষায় রয়েছে।');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      // Error is set in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 flex min-h-full items-center justify-center animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md my-auto flex flex-col max-h-[min(92vh,calc(100dvh-2rem))] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-5 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 ring-2 ring-emerald-400/60 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <img 
                src={
                  settings?.logoUrl && settings.logoUrl !== '/logo.svg' && settings.logoUrl !== '/logo-horizontal.svg'
                    ? settings.logoUrl
                    : '/icon.svg'
                } 
                alt="বন্ধু সমিতি" 
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                {user ? 'ইউজার একাউন্ট প্রোফাইল' : mode === 'signin' ? 'Firebase লগইন' : 'নতুন একাউন্ট নিবন্ধন'}
              </h2>
              <p className="text-xs text-blue-100/90">
                {user ? 'বর্তমানে সংযুক্ত আছেন' : (settings?.somitiName || 'বন্ধু সমবায় সমিতি একাউন্টে প্রবেশ করুন')}
              </p>
            </div>
          </div>

          {/* Toggle Tabs (Only if not logged in) */}
          {!user && (
            <div className="flex mt-4 p-1 bg-black/20 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setSuccessMsg('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>লগইন (Sign In)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearError();
                  setSuccessMsg('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-blue-800 shadow-sm'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>নিবন্ধন (Sign Up)</span>
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {user ? (
            /* Logged in state */
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center font-bold text-2xl border-4 border-emerald-50">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {user.displayName || 'সম্মানিত ইউজার'}
                </h3>
                <p className="text-xs text-slate-500">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Firebase Authentication সংযুক্ত</span>
                </div>
              </div>

              {/* Device Biometrics Management (WebAuthn) */}
              {isBiometricSupported && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          ডিভাইস বায়োমেট্রিক (WebAuthn)
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ফিঙ্গারপ্রিন্ট বা ফেস স্ক্যান দিয়ে পাসওয়ার্ডহীন দ্রুত লগইন
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentDeviceCredential
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {currentDeviceCredential ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </div>

                  {biometricSuccess && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span>{biometricSuccess}</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearBiometricSuccess}
                        className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {biometricError && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-medium flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span>{biometricError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearBiometricError}
                        className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {currentDeviceCredential ? (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                      <span className="text-slate-600 truncate max-w-[200px]">
                        {currentDeviceCredential.deviceName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCredential(currentDeviceCredential.id)}
                        className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>মুছে ফেলুন</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnrollBiometrics}
                      disabled={biometricLoading}
                      className="w-full mt-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                    >
                      {biometricLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>বায়োমেট্রিক স্ক্যানার সক্রিয় হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-3.5 h-3.5" />
                          <span>এই ডিভাইসে ফিঙ্গারপ্রিন্ট যুক্ত করুন</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-2 justify-center">
                <button
                  onClick={async () => {
                    await logOut();
                    onClose();
                  }}
                  className="px-5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-rose-200"
                >
                  লগআউট করুন
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ঠিক আছে
                </button>
              </div>
            </div>
          ) : (
            /* Form state (Sign in / Sign up) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {(validationError || error) && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">{validationError || error}</div>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>{successMsg}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {mode === 'signin' ? 'ইমেইল অথবা ইউজার ইউআইডি (BS-####)' : 'ইমেইল এড্রেস'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={mode === 'signin' ? 'text' : 'email'}
                    required
                    placeholder={mode === 'signin' ? 'example@mail.com অথবা BS-1001' : 'example@mail.com'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setValidationError('');
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পাসওয়ার্ড <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setValidationError('');
                    }}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কনফার্ম পাসওয়ার্ড <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setValidationError('');
                      }}
                      className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none text-slate-800 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title={showConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>প্রক্রিয়াধীন...</span>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>লগইন করুন</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>একাউন্ট তৈরি করুন</span>
                  </>
                )}
              </button>

              {/* Biometric Instant Login Option */}
              {mode === 'signin' && isBiometricSupported && isBiometricEnrolled && (
                <div className="pt-2">
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      অথবা
                    </span>
                    <div className="border-t border-slate-200 w-full"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBiometricModalLogin}
                    disabled={biometricLoading || loading}
                    className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {biometricLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>বায়োমেট্রিক স্ক্যান হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 text-emerald-600" />
                        <span>ডিভাইস ফিঙ্গারপ্রিন্ট / ফেস আইডি দিয়ে লগইন</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
