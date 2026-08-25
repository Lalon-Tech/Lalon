import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

export const translations: Record<string, { bn: string; en: string }> = {
  // Navigation & Menus
  dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  dashboard_overview: { bn: 'ড্যাশবোর্ড ওভারভিউ', en: 'Dashboard Overview' },
  members: { bn: 'সদস্য ও গ্রাহক', en: 'Members & Clients' },
  members_list: { bn: 'সকল সদস্যের তালিকা', en: 'All Members List' },
  members_add: { bn: 'নতুন সদস্য ভর্তি ফরম', en: 'New Member Registration' },
  members_id_cards: { bn: 'সদস্য আইডি কার্ড প্রিন্ট', en: 'Member ID Cards' },
  savings: { bn: 'সঞ্চয় ও ডিপিএস/এফডিআর', en: 'Savings & DPS/FDR' },
  savings_general: { bn: 'সাধারণ সঞ্চয় হিসাব', en: 'General Savings' },
  savings_dps: { bn: 'ডিপিএস (মাসিক সঞ্চয়)', en: 'DPS (Monthly Scheme)' },
  savings_fdr: { bn: 'এফডিআর (স্থায়ী আমানত)', en: 'FDR (Fixed Deposit)' },
  savings_interest: { bn: 'মুনাফা বণ্টন ও হিসাব', en: 'Profit Calculation' },
  loans: { bn: 'ঋণ ও কিস্তি আদায়', en: 'Loans & Installments' },
  loans_active: { bn: 'চলমান ঋণ তালিকা', en: 'Active Loans List' },
  loans_disburse: { bn: 'নতুন ঋণ প্রদান', en: 'Disburse New Loan' },
  loans_kisti: { bn: 'আজকের কিস্তি সংগ্রহ', en: 'Today Installments' },
  loans_defaulters: { bn: 'খেলাপি ও বকেয়া ঋণ', en: 'Overdue & Defaulters' },
  transactions: { bn: 'দৈনিক ক্যাশ ও লেনদেন', en: 'Daily Cash & Ledger' },
  transactions_ledger: { bn: 'দৈনিক জাবেদা / লেজার', en: 'Daily Journal / Ledger' },
  transactions_receipts: { bn: 'টাকা জমার মানি রিসিট', en: 'Money Receipts' },
  finance: { bn: 'আয় ও ব্যয় (ভাউচার)', en: 'Income & Expense' },
  bank: { bn: 'ব্যাংক ও ক্যাশ ভল্ট', en: 'Bank & Cash Vault' },
  reports: { bn: 'রিপোর্ট ও স্টেটমেন্ট', en: 'Reports & Statements' },
  excel: { bn: 'এক্সেল ব্যাকআপ/ইমপোর্ট', en: 'Excel Backup/Import' },
  settings: { bn: 'সমিতি সেটিংস ও রোলস', en: 'Settings & Roles' },

  // Header & Controls
  somiti_name: { bn: 'বন্ধু সমিতি লিমিটেড', en: 'Bondhu Somiti Ltd.' },
  quick_kisti: { bn: 'দ্রুত কিস্তি জমা', en: 'Quick Installment' },
  search_placeholder: { bn: 'সদস্য খুঁজুন (নাম/হিসাব/মোবাইল)...', en: 'Search member (Name/A/C/Phone)...' },
  add_new: { bn: 'যোগ করুন', en: 'Add New' },
  language_label: { bn: 'ভাষা', en: 'Language' },
  bangla: { bn: 'বাংলা', en: 'Bangla' },
  english: { bn: 'English', en: 'English' },
  google_signin: { bn: 'Google লগইন', en: 'Google Sign In' },
  email_signin: { bn: 'ইমেইল লগইন', en: 'Email Sign In' },
  login_signup: { bn: 'লগইন / সাইন-আপ', en: 'Sign In / Sign Up' },
  logout: { bn: 'লগআউট', en: 'Logout' },
  online_system: { bn: 'অনলাইন সিস্টেম', en: 'Online System' },

  // Login Page
  signin_title: { bn: 'সাইন ইন করুন', en: 'Sign In' },
  signup_title: { bn: 'নতুন একাউন্ট খুলুন', en: 'Create Account' },
  forgot_password: { bn: 'পাসওয়ার্ড ভুলে গেছেন?', en: 'Forgot Password?' },
  email_address: { bn: 'ইমেইল এড্রেস', en: 'EMAIL ADDRESS' },
  password: { bn: 'পাসওয়ার্ড', en: 'PASSWORD' },
  full_name: { bn: 'পুরো নাম', en: 'FULL NAME' },
  remember_me: { bn: '৩০ দিনের জন্য মনে রাখুন', en: 'Remember me for 30 days' },
  continue_with_google: { bn: 'Google দিয়ে প্রবেশ করুন', en: 'Continue with Google' },
  demo_bypass: { bn: 'ডেমো মোডে সরাসরি প্রবেশ করুন', en: 'Enter directly in Demo Mode' },
  or: { bn: 'অথবা', en: 'OR' }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('bondhu_language');
    return (saved === 'en' || saved === 'bn') ? (saved as Language) : 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bondhu_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key]) {
      return translations[key][language] || fallback || key;
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
