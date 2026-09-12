import React, { useState } from 'react';
import { Clock, ShieldAlert, CheckCircle, RefreshCw, LogOut, Mail, UserCheck, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSomiti } from '../../context/SomitiContext';

export const PendingApprovalView: React.FC = () => {
  const { user, logOut } = useAuth();
  const { currentUser, language } = useSomiti();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const emailDisplay = currentUser?.email || user?.email || 'N/A';
  const registrationDate = currentUser?.createdAt 
    ? new Date(currentUser.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'সম্প্রতি';

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-[#0d162d]/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/20 text-center space-y-6">
        
        {/* Status Icon Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-md">
            !
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>{language === 'bn' ? 'অ্যাকাউন্ট অনুমোদন অপেক্ষমাণ' : 'Account Pending Approval'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {language === 'bn' ? 'প্রশাসনিক অনুমোদনের অপেক্ষায় রয়েছে' : 'Awaiting Administrative Approval'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            {language === 'bn' 
              ? 'আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। তবে আর্থিক তথ্যের নিরাপত্তা নিশ্চিত করতে অ্যাডমিন কর্তৃক যাচাই ও সদস্য প্রোফাইল লিংক করার পর ড্যাশবোর্ড উন্মুক্ত করা হবে।'
              : 'Your registration was successful. For security, an administrator must review your account, link your member profile, and approve access before you can view financial records.'}
          </p>
        </div>

        {/* Account Summary Card */}
        <div className="bg-[#131d38] border border-slate-700/60 rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              {language === 'bn' ? 'নিবন্ধিত ইমেইল:' : 'Registered Email:'}
            </span>
            <span className="font-semibold text-slate-200">{emailDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              {language === 'bn' ? 'নির্ধারিত রোল:' : 'Default Role:'}
            </span>
            <span className="font-semibold text-cyan-300 px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/40">
              {language === 'bn' ? 'সদস্য (Member)' : 'Member'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {language === 'bn' ? 'নিবন্ধন তারিখ:' : 'Registration Date:'}
            </span>
            <span className="font-semibold text-slate-300">{registrationDate}</span>
          </div>
        </div>

        {/* 3-Step Approval Process Indicator */}
        <div className="bg-[#111930] rounded-2xl p-4 border border-slate-800 text-left space-y-3">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {language === 'bn' ? 'অনুমোদন প্রক্রিয়া ধাপসমূহ' : 'Approval Workflow Steps'}
          </h4>
          
          <div className="space-y-3 text-xs">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-200">
                  {language === 'bn' ? '১. নতুন অ্যাকাউন্ট নিবন্ধন' : '1. Account Registration'}
                </p>
                <p className="text-[11px] text-emerald-400/90">
                  {language === 'bn' ? 'সফলভাবে সম্পন্ন হয়েছে' : 'Completed successfully'}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-200">
                  {language === 'bn' ? '২. অ্যাডমিন পর্যালোচনা ও সদস্য প্রোফাইল লিংক' : '2. Profile Link & UID Assignment'}
                </p>
                <p className="text-[11px] text-amber-400/90">
                  {language === 'bn' ? 'অ্যাডমিন ড্যাশবোর্ডে নোটিফিকেশন পাঠানো হয়েছে, প্রক্রিয়াধীন' : 'Under admin review in progress'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 opacity-60">
              <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-300">
                  {language === 'bn' ? '৩. ড্যাশবোর্ড ও আর্থিক ডেটা অ্যাক্সেস' : '3. Member Dashboard Access'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {language === 'bn' ? 'অ্যাডমিন অনুমোদনের পর উন্মুক্ত হবে' : 'Unlocked automatically after approval'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:flex-1 py-3 px-4 bg-cyan-500 hover:bg-cyan-400 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{language === 'bn' ? 'অনুমোদন অবস্থা চেক করুন' : 'Refresh Status'}</span>
          </button>

          <button
            onClick={() => logOut()}
            className="w-full sm:w-auto py-3 px-5 bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-700/50 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{language === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
          </button>
        </div>

        {/* Footer Support Info */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>{language === 'bn' ? 'জরুরি প্রয়োজনে সমিতির অ্যাডমিনের সাথে যোগাযোগ করুন' : 'Contact Somiti admin for expedited review'}</span>
        </div>

      </div>
    </div>
  );
};
