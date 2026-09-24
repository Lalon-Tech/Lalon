import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ShieldCheck, ArrowRight, Clock, Fingerprint, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSomiti } from '../../context/SomitiContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useBiometricAuth } from '../../hooks/useBiometricAuth';

interface LoginPageProps {}

const REMEMBERED_LOGIN_ID_KEY = 'somiti_remembered_login_id';

const getInitialLoginId = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(REMEMBERED_LOGIN_ID_KEY) || '';
  } catch {
    return '';
  }
};

export const LoginPage: React.FC<LoginPageProps> = () => {
  const { language, t } = useLanguage();
  const { setActiveTab, setSelectedMemberId, settings } = useSomiti();
  const { 
    signIn, 
    signUp, 
    signInWithGoogle, 
    signInAsDemo, 
    signInWithBiometricProfile,
    resetPassword, 
    error, 
    clearError,
    wasAutoLoggedOut,
    clearAutoLoggedOut
  } = useAuth();
  
  const {
    isSupported: isBiometricSupported,
    isEnrolled: isBiometricEnrolled,
    lastEnrolledUser,
    authenticateWithBiometrics,
    registerBiometrics,
    loading: biometricLoading,
    clearError: clearBiometricError,
  } = useBiometricAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  // Auto-fill previously remembered Login ID across Mobile, Tablet, and Desktop/Web
  const [email, setEmail] = useState<string>(getInitialLoginId);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [enableBiometricsOnLogin, setEnableBiometricsOnLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Persists or updates the remembered Login ID (Email or User ID)
  const rememberLoginId = (id: string) => {
    if (!id || !id.trim()) return;
    try {
      localStorage.setItem(REMEMBERED_LOGIN_ID_KEY, id.trim());
    } catch (err) {
      console.warn('Failed to save remembered login ID:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError('');
    setSuccessMsg('');

    if (mode === 'forgot') {
      if (!email) return;
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccessMsg(language === 'bn' ? 'পাসওয়ার্ড রিসেট লিংক আপনার ইমেইলে পাঠানো হয়েছে!' : 'Password reset link sent to your email!');
      } catch {
        // error in context
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup') {
      if (!email.trim() || !password || !confirmPassword) {
        setValidationError(language === 'bn' ? 'অনুগ্রহ করে সকল ফিল্ড পূরণ করুন।' : 'Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError(language === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না! উভয় স্থানে একই পাসওয়ার্ড লিখুন।' : 'Passwords do not match! Please enter the same password in both fields.');
        return;
      }
      if (password.length < 6) {
        setValidationError(language === 'bn' ? 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
        return;
      }

      setLoading(true);
      try {
        await signUp(email.trim(), password);
        rememberLoginId(email.trim());
        setSuccessMsg(language === 'bn' ? 'নিবন্ধন সফল হয়েছে! অ্যাকাউন্টটি প্রশাসনিক অনুমোদনের অপেক্ষায় রয়েছে।' : 'Registration submitted! Your account is pending administrative approval.');
      } catch {
        // error in context
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) return;

    setLoading(true);
    try {
      if (mode === 'signin') {
        const cleanLoginId = email.trim();
        // Remember the Login ID across mobile, tablet, and desktop (replaces previously saved ID)
        rememberLoginId(cleanLoginId);

        await signIn(cleanLoginId, password);
        // Always open Home/Dashboard upon login
        setActiveTab('dashboard');
        setSelectedMemberId(null);
        setSuccessMsg(language === 'bn' ? 'সফলভাবে সাইন-ইন সম্পন্ন হয়েছে!' : 'Successfully signed in!');

        // If user opted to enable biometric on this device and device supports it
        if (enableBiometricsOnLogin && isBiometricSupported && !isBiometricEnrolled) {
          try {
            await registerBiometrics({
              uid: 'user_' + Date.now(),
              email: cleanLoginId.includes('@') ? cleanLoginId : `${cleanLoginId.toLowerCase()}@somiti.local`,
              displayName: cleanLoginId.split('@')[0],
              photoURL: null,
            });
          } catch (bioErr) {
            console.warn('Biometric auto-registration notice:', bioErr);
          }
        }
      }
    } catch {
      // error in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setSuccessMsg('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      setActiveTab('dashboard');
      setSelectedMemberId(null);
      setSuccessMsg(language === 'bn' ? 'Google একাউন্ট দিয়ে সফলভাবে লগইন হয়েছে!' : 'Logged in with Google successfully!');
    } catch {
      // error in context
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickPresetLogin = (presetEmail: string, presetRole: string) => {
    clearError();
    clearBiometricError();
    setSuccessMsg('');
    rememberLoginId(presetEmail);
    signInAsDemo(presetRole);
    setActiveTab('dashboard');
    setSelectedMemberId(null);
  };

  const handleBiometricLogin = async () => {
    clearError();
    clearBiometricError();
    setValidationError('');
    setSuccessMsg('');

    if (!isBiometricSupported) {
      setValidationError(
        language === 'bn'
          ? 'আপনার ব্রাউজার বা ডিভাইসে ওয়েব বায়োমেট্রিক অথেন্টিকেশন (Fingerprint/Face ID) সমর্থিত নয়।'
          : 'Web Biometric Authentication (Fingerprint/Face ID) is not supported on this browser or device.'
      );
      return;
    }

    if (!isBiometricEnrolled) {
      setValidationError(
        language === 'bn'
          ? 'এই ডিভাইসে এখনো বায়োমেট্রিক সংরক্ষিত নেই। পাসওয়ার্ড দিয়ে লগইন করার সময় "ফিঙ্গারপ্রিন্ট সক্রিয় রাখুন" চেক করুন।'
          : 'No biometric credentials registered on this device yet. Please sign in with password first and check "Enable Fingerprint".'
      );
      return;
    }

    try {
      const res = await authenticateWithBiometrics();
      if (res.success && res.user) {
        if (res.user.email) {
          rememberLoginId(res.user.email);
        }
        signInWithBiometricProfile(res.user);
        // Always open Home/Dashboard upon login
        setActiveTab('dashboard');
        setSelectedMemberId(null);
        setSuccessMsg(
          language === 'bn'
            ? `বায়োমেট্রিক যাচাই সম্পন্ন হয়েছে! স্বাগতম ${res.user.displayName || res.user.email}`
            : `Biometric authentication verified! Welcome ${res.user.displayName || res.user.email}`
        );
      } else if (res.error) {
        setValidationError(res.error);
      }
    } catch (err: any) {
      console.warn('Biometric login exception:', err);
      setValidationError(
        err?.message || (language === 'bn' ? 'বায়োমেট্রিক যাচাইকরণ ব্যর্থ হয়েছে।' : 'Biometric verification failed.')
      );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0c142b] sm:bg-[#070d1e] flex flex-col items-center justify-center p-0 sm:p-6 text-slate-100 font-sans relative overflow-x-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-64 sm:w-80 h-64 sm:h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top right language switch on desktop */}
      <div className="hidden sm:block absolute top-5 right-5 z-20">
        <LanguageSwitcher variant="segmented" darkTheme={true} />
      </div>

      {/* Main Container - full edge-to-edge on mobile, sleek centered card on tablet & desktop */}
      <div className="w-full sm:max-w-[400px] min-h-screen sm:min-h-0 bg-[#0c142b] border-0 sm:border sm:border-slate-800/80 rounded-none sm:rounded-3xl px-4 py-4 sm:p-8 shadow-none sm:shadow-2xl relative z-10 mx-auto flex flex-col justify-center">
        
        {/* Mobile top bar with Language Switcher inside header */}
        <div className="flex sm:hidden items-center justify-end w-full mb-3 pt-1">
          <LanguageSwitcher variant="segmented" darkTheme={true} />
        </div>

        {/* Brand header with official round Somiti logo */}
        <div className="text-center mb-5 sm:mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white p-1 ring-3 sm:ring-4 ring-emerald-500/40 shadow-xl shadow-emerald-950/50 mb-2 sm:mb-3 mx-auto overflow-hidden">
            <img 
              src={
                settings?.logoUrl && settings.logoUrl !== '/logo.svg' && settings.logoUrl !== '/logo-horizontal.svg'
                  ? settings.logoUrl
                  : '/icon.svg'
              } 
              alt={settings?.somitiName || (language === 'bn' ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bondhu Samabay Somiti Ltd.')}
              className="w-full h-full object-contain rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white leading-tight">
            {settings?.somitiName || (language === 'bn' ? 'বন্ধু সমবায় সমিতি লিমিটেড' : 'Bondhu Samabay Somiti Ltd.')}
          </h1>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-[9px] sm:text-[10px] text-emerald-400 font-extrabold tracking-wider uppercase bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md shadow-2xs">
              UNITY • GROWTH • TRUST
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-1">
            {language === 'bn' ? 'ঐক্য • সমৃদ্ধি • বিশ্বাস' : 'Cooperative Society'}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-300/80 mt-1.5 sm:mt-2 font-light">
            {mode === 'signin' 
              ? (language === 'bn' ? 'ডিজিটাল একাউন্টে সাইন ইন করুন' : 'Sign in to your digital account')
              : mode === 'signup' 
              ? (language === 'bn' ? 'নতুন সদস্য হিসেবে নিবন্ধন করুন' : 'Register as a new member')
              : (language === 'bn' ? 'পাসওয়ার্ড পুনরুদ্ধার করুন' : 'Recover your account password')}
          </p>
        </div>

        {/* Auto Logout Notification (10 minutes inactivity) */}
        {wasAutoLoggedOut && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-3.5 bg-amber-950/70 border border-amber-500/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-200 animate-in fade-in">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              {language === 'bn' 
                ? '১০ মিনিট কোনো কার্যকলাপ না থাকায় আপনার সেশনটি স্বয়ংক্রিয়ভাবে লগআউট হয়েছে। আপনার অ্যাকাউন্ট নিরাপত্তার স্বার্থে অনুগ্রহ করে পুনরায় লগইন করুন।' 
                : 'Your session was automatically logged out after 10 minutes of inactivity. For your security, please sign in again.'}
            </div>
            <button 
              type="button" 
              onClick={clearAutoLoggedOut}
              className="text-amber-400 hover:text-amber-200 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
              title="Close"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Notification */}
        {(validationError || error) && (
          <div className="mb-3 sm:mb-4 p-3 sm:p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl space-y-2 text-xs text-rose-300 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{validationError || error}</div>
            </div>
            {mode === 'signin' && (
              <div className="pt-2 border-t border-rose-800/40 flex items-center justify-between">
                <span className="text-[11px] text-rose-200/80">
                  {language === 'bn' ? 'একাউন্ট তৈরি করা নেই?' : 'Don\'t have an account?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    clearError();
                    setValidationError('');
                  }}
                  className="px-2.5 py-1 bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer border border-cyan-400/30"
                >
                  {language === 'bn' ? 'নতুন একাউন্ট খুলুন (Sign Up)' : 'Sign Up Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Notification */}
        {successMsg && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* One-Tap Biometric Sign In Card for Enrolled Devices (Mobile, Tablet, Touch ID/Windows Hello) */}
        {mode === 'signin' && isBiometricSupported && isBiometricEnrolled && (
          <button
            type="button"
            id="btn-quick-biometric-banner"
            onClick={handleBiometricLogin}
            disabled={biometricLoading || loading || googleLoading}
            className="w-full mb-3 sm:mb-4 py-2.5 px-3.5 bg-gradient-to-r from-cyan-950/80 via-[#0e1a38] to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-500/50 rounded-2xl flex items-center justify-between text-xs text-cyan-200 transition-all cursor-pointer group shadow-lg active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shadow-xs shrink-0">
                {biometricLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                ) : (
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-cyan-300 text-xs flex items-center gap-1.5 truncate">
                  <span>{language === 'bn' ? 'ফিঙ্গারপ্রিন্ট / বায়োমেট্রিক লগইন' : 'Biometric / Fingerprint Login'}</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {lastEnrolledUser?.displayName || lastEnrolledUser?.email || (language === 'bn' ? 'এক ক্লিকে নিরাপদ প্রবেশ' : 'One-tap secure sign in')}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-lg border border-cyan-400/30 group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors shrink-0">
              {language === 'bn' ? 'লগইন' : 'Sign In'}
            </span>
          </button>
        )}

        {/* Form elements identical to user screenshot */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* EMAIL ADDRESS OR USER UID */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-300 uppercase mb-1 sm:mb-1.5">
              {mode === 'signin' 
                ? (language === 'bn' ? 'ইমেইল অথবা ইউজার ইউআইডি (BS-####)' : 'EMAIL OR USER UID (e.g. BS-1001)')
                : (language === 'bn' ? 'ইমেইল ঠিকানা' : 'EMAIL ADDRESS')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={mode === 'signin' ? 'text' : 'email'}
                required
                autoComplete="username"
                placeholder={mode === 'signin' ? (language === 'bn' ? 'name@example.com অথবা BS-1001' : 'name@example.com or BS-1001') : 'name@example.com'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError('');
                }}
                className="w-full bg-[#131d36] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
              />
            </div>
            {mode === 'signin' && (
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
                {language === 'bn' ? 'ইমেইল (name@example.com) অথবা ইউআইডি (যেমন: BS-1001) দিয়ে লগইন করুন' : 'Log in using your Email or User UID (e.g. BS-1001)'}
              </p>
            )}
          </div>

          {/* PASSWORD */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                  PASSWORD
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      clearError();
                      setValidationError('');
                    }}
                    className="text-[10px] sm:text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {language === 'bn' ? 'Forgot Password?' : 'Forgot Password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="w-full bg-[#131d36] border border-slate-700/80 rounded-xl pl-10 pr-11 py-2.5 sm:py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  aria-label={showPassword ? (language === 'bn' ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (language === 'bn' ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
                  title={showPassword ? (language === 'bn' ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (language === 'bn' ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>
          )}

          {/* CONFIRM PASSWORD for signup */}
          {mode === 'signup' && (
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-300 uppercase">
                  {language === 'bn' ? 'কনফার্ম পাসওয়ার্ড (CONFIRM PASSWORD)' : 'CONFIRM PASSWORD'}
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="w-full bg-[#131d36] border border-slate-700/80 rounded-xl pl-10 pr-11 py-2.5 sm:py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  aria-label={showConfirmPassword ? (language === 'bn' ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (language === 'bn' ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
                  title={showConfirmPassword ? (language === 'bn' ? 'পাসওয়ার্ড লুকান' : 'Hide password') : (language === 'bn' ? 'পাসওয়ার্ড দেখুন' : 'Show password')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>
          )}

          {/* Options: Remember Login ID & Biometric opt-in */}
          {mode === 'signin' && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="page-remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#131d36] border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-400"
                />
                <label htmlFor="page-remember" className="text-xs text-slate-400 cursor-pointer select-none">
                  {language === 'bn' ? 'লগইন আইডি মনে রাখুন (Remember Login ID)' : 'Remember Login ID'}
                </label>
              </div>

              {/* Enable Biometrics option when device/browser supports it */}
              {isBiometricSupported && !isBiometricEnrolled && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="page-enable-biometrics"
                    checked={enableBiometricsOnLogin}
                    onChange={(e) => setEnableBiometricsOnLogin(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#131d36] border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-400"
                  />
                  <label htmlFor="page-enable-biometrics" className="text-xs text-slate-300 cursor-pointer select-none flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-400 inline shrink-0" />
                    <span>{language === 'bn' ? 'পরবর্তী লগইনের জন্য ফিঙ্গারপ্রিন্ট সক্রিয় রাখুন' : 'Enable Fingerprint for next login'}</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Sign In Button with Small Biometric Fingerprint Button beside it */}
          <div className="flex items-stretch gap-2 sm:gap-2.5 mt-2">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className={`${mode === 'signin' && isBiometricSupported ? 'flex-1' : 'w-full'} py-3 sm:py-3.5 px-4 bg-cyan-400 hover:bg-cyan-300 active:scale-[0.99] text-slate-950 rounded-xl sm:rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{language === 'bn' ? 'অনুগ্রহ করে অপেক্ষা করুন...' : 'Please wait...'}</span>
                </>
              ) : mode === 'signin' ? (
                <span>Sign In</span>
              ) : mode === 'signup' ? (
                <span>Sign Up</span>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            {mode === 'signin' && isBiometricSupported && (
              <button
                type="button"
                id="btn-biometric-icon-signin"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || loading || googleLoading}
                title={language === 'bn' ? 'বায়োমেট্রিক দিয়ে লগইন (ফিঙ্গারপ্রিন্ট / ফেস আইডি)' : 'Sign In with Biometrics (Fingerprint / Face ID)'}
                aria-label="Sign In with Biometrics"
                className="w-12 sm:w-14 shrink-0 bg-[#131d36] hover:bg-[#1b2b4f] active:scale-95 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-all cursor-pointer disabled:opacity-50 group"
              >
                {biometricLoading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-cyan-400" />
                ) : (
                  <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                )}
              </button>
            )}
          </div>
        </form>

        {/* OR Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="relative flex items-center justify-center my-3 sm:my-4">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-[#0c142b] px-3 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                OR
              </span>
              <div className="border-t border-slate-800 w-full"></div>
            </div>

            {/* Dark Google Pill Button [ Continue with Google ] */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-2.5 sm:py-3 px-4 bg-[#131d36] hover:bg-[#192644] border border-slate-700/90 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </>
        )}

        {/* Footer switchers */}
        <div className="mt-4 sm:mt-5 text-center text-xs text-slate-400">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearError();
                  setSuccessMsg('');
                }}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer ml-1"
              >
                Sign up
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setSuccessMsg('');
                }}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer ml-1"
              >
                Sign in
              </button>
            </p>
          ) : (
            <p>
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setSuccessMsg('');
                }}
                className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </p>
          )}
        </div>

        {/* Optional Demo preview button / Quick role login */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800/80">
          <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 text-center mb-2">
            {language === 'bn' ? 'এক ক্লিকে সরাসরি প্রবেশ করুন:' : 'One-Click Quick Login:'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPresetLogin('admin@bondhusomiti.com', 'Super Admin')}
              className="py-2 px-2 sm:px-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
            >
              👑 {language === 'bn' ? 'সুপার এডমিন' : 'Super Admin'}
            </button>
            <button
              type="button"
              onClick={() => handleQuickPresetLogin('manager@bondhusomiti.com', 'Manager')}
              className="py-2 px-2 sm:px-2.5 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-95"
            >
              👔 {language === 'bn' ? 'ম্যানেজার' : 'Manager'}
            </button>
          </div>
        </div>
        {/* Security badge footer on mobile */}
        <div className="mt-4 flex sm:hidden items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center pb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>Firebase Secured Authentication • 256-bit Encryption</span>
        </div>
      </div>

      {/* Security badge footer on desktop */}
      <div className="hidden sm:flex mt-6 items-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-cyan-400" />
        <span>Firebase Secured Authentication • 256-bit Encryption</span>
      </div>
    </div>
  );
};

