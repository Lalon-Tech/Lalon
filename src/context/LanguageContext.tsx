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
  all_members: { bn: 'সকল সদস্য', en: 'All Members' },
  new_member: { bn: 'নতুন সদস্য ভর্তি', en: 'New Member Registration' },
  active_members: { bn: 'সক্রিয় সদস্য', en: 'Active Members' },
  member_profile: { bn: 'সদস্যের প্রোফাইল', en: 'Member Profile' },
  members_list: { bn: 'সকল সদস্যের তালিকা', en: 'All Members List' },
  members_add: { bn: 'নতুন সদস্য ভর্তি ফরম', en: 'New Member Registration' },
  members_id_cards: { bn: 'সদস্য আইডি কার্ড প্রিন্ট', en: 'Member ID Cards' },
  
  // Transactions & Submenus
  transactions: { bn: 'লেনদেন ও কিস্তি', en: 'Transactions & Kisti' },
  tx_deposit: { bn: 'টাকা জমা', en: 'Deposit Money' },
  tx_withdraw: { bn: 'টাকা উত্তোলন', en: 'Withdraw Money' },
  tx_loan: { bn: 'ঋণ বিতরণ', en: 'Disburse Loan' },
  tx_kisti: { bn: 'ঋণের কিস্তি আদায়', en: 'Collect Loan Installment' },
  transactions_ledger: { bn: 'দৈনিক জাবেদা / লেজার', en: 'Daily Journal / Ledger' },
  transactions_receipts: { bn: 'টাকা জমার মানি রিসিট', en: 'Money Receipts' },

  // Savings & Submenus
  savings: { bn: 'সঞ্চয় ও ডিপিএস/এফডিআর', en: 'Savings & DPS/FDR' },
  savings_all: { bn: 'সকল সঞ্চয় ও ডিপিএস', en: 'All Savings & DPS' },
  savings_dps: { bn: 'ডিপিএস (মাসিক সঞ্চয়)', en: 'DPS (Monthly Scheme)' },
  savings_fdr: { bn: '৫ বছর মেয়াদি / FDR', en: '5-Year / FDR' },
  savings_general: { bn: 'সাধারণ সঞ্চয় হিসাব', en: 'General Savings' },
  savings_interest: { bn: 'মুনাফা বণ্টন ও হিসাব', en: 'Profit Calculation' },

  // Loans & Submenus
  loans: { bn: 'ঋণ ও কিস্তি আদায়', en: 'Loans & Installments' },
  loans_all: { bn: 'সকল চলমান ঋণ', en: 'All Active Loans' },
  loans_active: { bn: 'চলমান ঋণ তালিকা', en: 'Active Loans List' },
  loans_disburse: { bn: 'নতুন ঋণ প্রদান', en: 'Disburse New Loan' },
  loans_kisti: { bn: 'আজকের কিস্তি সংগ্রহ', en: 'Today Installments' },
  loans_defaulters: { bn: 'খেলাপি ও বকেয়া ঋণ', en: 'Overdue & Defaulters' },

  // Accounts, Bank & Reports
  finance: { bn: 'আয় ও ব্যয় (ভাউচার)', en: 'Income & Expense' },
  accounts: { bn: 'আয়-ব্যয় ও ভাউচার', en: 'Income-Expense & Vouchers' },
  bank: { bn: 'ব্যাংক ও ক্যাশ ভল্ট', en: 'Bank & Cash Vault' },
  reports: { bn: 'রিপোর্ট ও স্টেটমেন্ট', en: 'Reports & Statements' },
  reports_daily: { bn: 'দৈনিক লেনদেন রিপোর্ট', en: 'Daily Transaction Report' },
  reports_monthly: { bn: 'মাসিক আর্থিক বিবরণী', en: 'Monthly Financial Statement' },
  reports_dividend: { bn: 'লভ্যাংশ বণ্টন রিপোর্ট', en: 'Dividend Distribution Report' },
  reports_shares: { bn: 'শেয়ার সমর্পণ ও সমাপ্তি রেজিস্টার', en: 'Share Surrender & Closure Register' },
  excel: { bn: 'এক্সেল ব্যাকআপ/ইমপোর্ট', en: 'Excel Backup/Import' },
  settings: { bn: 'সমিতি সেটিংস ও রোলস', en: 'Settings & Roles' },
  users_roles: { bn: 'অফিস স্টাফ ও ইউজার', en: 'Staff & User Management' },

  // Common UI Actions & Labels
  somiti_name: { bn: 'বন্ধু সমিতি লিমিটেড', en: 'Bondhu Somiti Ltd.' },
  quick_kisti: { bn: 'দ্রুত কিস্তি জমা', en: 'Quick Installment' },
  search_placeholder: { bn: 'গ্রাহক অনুসন্ধান (নাম, সদস্য নং বা মোবাইল)...', en: 'Search client (Name, Member No or Phone)...' },
  search_member: { bn: 'সদস্য খুঁজুন...', en: 'Search member...' },
  add_new: { bn: 'যোগ করুন', en: 'Add New' },
  quick_actions: { bn: 'দ্রুত অ্যাকশন', en: 'Quick Actions' },
  new_member_admission: { bn: 'নতুন সদস্য ভর্তি', en: 'New Member Registration' },
  deposit_money_voucher: { bn: 'টাকা জমা (সঞ্চয় / ডিপিএস)', en: 'Deposit Money (DPS / Savings)' },
  withdraw_money_voucher: { bn: 'টাকা উত্তোলন ভাউচার', en: 'Withdraw Money Voucher' },
  collect_kisti_voucher: { bn: 'ঋণের কিস্তি আদায় (Kisti)', en: 'Collect Loan Installment' },
  approve_new_loan: { bn: 'নতুন ঋণ অনুমোদন', en: 'New Loan Approval' },
  new_voucher_entry: { bn: 'নতুন আয়-ব্যয় ভাউচার', en: 'New Income/Expense Voucher' },
  excel_export: { bn: 'এক্সেল', en: 'Excel' },
  print: { bn: 'প্রিন্ট', en: 'Print' },
  filter: { bn: 'ফিল্টার', en: 'Filter' },
  all: { bn: 'সকল', en: 'All' },
  active: { bn: 'সক্রিয়', en: 'Active' },
  inactive: { bn: 'নিষ্ক্রিয়', en: 'Inactive' },
  cleared: { bn: 'পরিশোধিত', en: 'Cleared' },
  running: { bn: 'চলমান', en: 'Running' },
  matured: { bn: 'মেয়াদোত্তীর্ণ', en: 'Matured' },
  action: { bn: 'অ্যাকশন', en: 'Action' },
  status: { bn: 'অবস্থা', en: 'Status' },
  date: { bn: 'তারিখ', en: 'Date' },
  voucher_no: { bn: 'ভাউচার নং', en: 'Voucher No' },
  amount: { bn: 'পরিমাণ (৳)', en: 'Amount (৳)' },
  category: { bn: 'খাত / ক্যাটাগরি', en: 'Category' },
  description: { bn: 'বিবরণ / শিরোনাম', en: 'Description / Title' },
  payment_method: { bn: 'মাধ্যম', en: 'Method' },
  recorded_by: { bn: 'এন্ট্রি কারী', en: 'Recorded By' },
  save: { bn: 'সংরক্ষণ করুন', en: 'Save' },
  cancel: { bn: 'বাতিল', en: 'Cancel' },
  confirm: { bn: 'নিশ্চিত করুন', en: 'Confirm' },
  delete: { bn: 'মুছুন', en: 'Delete' },
  edit: { bn: 'সম্পাদনা', en: 'Edit' },
  details: { bn: 'বিস্তারিত', en: 'Details' },
  overview: { bn: 'ওভারভিউ', en: 'Overview' },
  live_dashboard: { bn: 'লাইভ ড্যাশবোর্ড', en: 'Live Dashboard' },
  todays_date: { bn: 'আজকের তারিখ:', en: "Today's Date:" },
  available_balance: { bn: 'উপলব্ধ ব্যালেন্স (ক্যাশ + ব্যাংক)', en: 'Available Balance (Cash + Bank)' },
  total_capital: { bn: 'সমিতির ব্যবসার মোট মূলধন', en: 'Total Business Capital' },
  active_clients: { bn: 'সক্রিয় গ্রাহক / সদস্য', en: 'Active Clients / Members' },
  total_clients_badge: { bn: 'মোট গ্রাহক:', en: 'Total Clients:' },
  sms_credits: { bn: 'SMS ক্রেডিট', en: 'SMS Credits' },
  sms_gateway_active: { bn: 'বাংলালিংক/টেলটক SMS গেটওয়ে সংযুক্ত', en: 'SMS Gateway Connected' },
  quick_service_system: { bn: 'দ্রুত কালেকশন ও সেবা সিস্টেম', en: 'Quick Collection & Service System' },
  quick_deposit_title: { bn: 'দ্রুত টাকা জমা', en: 'Quick Deposit' },
  quick_deposit_sub: { bn: 'সঞ্চয় / ডিপিএস / শেয়ার', en: 'Savings / DPS / Share' },
  quick_kisti_title: { bn: 'ঋণের কিস্তি আদায়', en: 'Collect Kisti' },
  quick_kisti_sub: { bn: 'দৈনিক / সাপ্তাহিক কিস্তি', en: 'Daily / Weekly Installment' },
  quick_withdraw_title: { bn: 'টাকা উত্তোলন', en: 'Withdraw Money' },
  quick_withdraw_sub: { bn: 'সঞ্চয় বা ডিপিএস উত্তোলন', en: 'Savings or DPS Withdrawal' },
  quick_loan_title: { bn: 'নতুন ঋণ প্রদান', en: 'Disburse New Loan' },
  quick_loan_sub: { bn: 'সহজ শর্তে ঋণ বিতরণ', en: 'Disburse Fast Loan' },
  todays_summary: { bn: 'আজকের হিসাবের সারাংশ (Live Ledger)', en: "Today's Ledger Summary (Live)" },
  todays_collections: { bn: 'আজকের সর্বমোট আদায়', en: "Today's Total Collection" },
  todays_withdrawals: { bn: 'আজকের সর্বমোট প্রদান', en: "Today's Total Withdrawal" },
  todays_net_flow: { bn: 'আজকের নিট ক্যাশ ফ্লো', en: "Today's Net Cash Flow" },
  recent_transactions: { bn: 'সাম্প্রতিক লেনদেনের তালিকা', en: 'Recent Transactions List' },
  view_all_transactions: { bn: 'সকল লেনদেন দেখুন', en: 'View All Transactions' },
  no_transactions_today: { bn: 'আজকে কোনো লেনদেন হয়নি', en: 'No transactions recorded today' },

  // Language & Auth
  language_label: { bn: 'ভাষা', en: 'Language' },
  bangla: { bn: 'বাংলা', en: 'Bangla' },
  english: { bn: 'English', en: 'English' },
  google_signin: { bn: 'Google লগইন', en: 'Google Sign In' },
  email_signin: { bn: 'ইমেইল লগইন', en: 'Email Sign In' },
  login_signup: { bn: 'লগইন / সাইন-আপ', en: 'Sign In / Sign Up' },
  logout: { bn: 'লগআউট', en: 'Logout' },
  online_system: { bn: 'অনলাইন সিস্টেম', en: 'Online System' },
  profile_security: { bn: 'প্রোফাইল ও নিরাপত্তা', en: 'Profile & Security' },
  your_profile: { bn: 'আপনার প্রোফাইল', en: 'Your Profile' },
  menu_open: { bn: 'মেনু খুলুন', en: 'Open Menu' },
  search_results: { bn: 'অনুসন্ধানের ফলাফল', en: 'Search Results' },

  // Bank & Cash
  cash_in_hand: { bn: 'ক্যাশ ইন হ্যান্ড (অফিস ভল্ট)', en: 'Cash in Hand (Office Vault)' },
  cash_in_hand_sub: { bn: 'দৈনন্দিন লেনদেনের নগদ টাকা', en: 'Daily transaction cash reserve' },
  total_bank_balance: { bn: 'ব্যাংক হিসাবের মোট স্থিতি', en: 'Total Bank Balance' },
  total_bank_sub: { bn: 'টি সক্রিয় ব্যাংক অ্যাকাউন্ট', en: 'Active bank accounts' },
  total_liquidity: { bn: 'সর্বমোট তরল তহবিল (Total Fund)', en: 'Total Liquid Fund' },
  total_liquidity_sub: { bn: 'ক্যাশ + সকল ব্যাংক ব্যালেন্স', en: 'Cash + All Bank Balances' },
  bank_accounts_title: { bn: 'সমিতির রেজিস্টার্ড ব্যাংক হিসাবসমূহ', en: 'Registered Bank Accounts' },
  add_bank_account: { bn: 'নতুন ব্যাংক অ্যাকাউন্ট যোগ', en: 'Add New Bank Account' },
  current_account: { bn: 'চলতি হিসাব', en: 'Current Account' },
  savings_account: { bn: 'সঞ্চয়ী হিসাব', en: 'Savings Account' },
  account_number_label: { bn: 'হিসাব নম্বর:', en: 'Account Number:' },
  current_balance_label: { bn: 'বর্তমান ব্যালেন্স:', en: 'Current Balance:' },
  bank_tx_title: { bn: 'ব্যাংকের মাধ্যমে সম্পাদিত সাম্প্রতিক লেনদেন', en: 'Recent Bank Transactions' },
  total_bank_vouchers: { bn: 'টি ব্যাংক ভাউচার', en: 'Bank Vouchers' },

  // Income & Expense
  total_income: { bn: 'মোট প্রাতিষ্ঠানিক আয়', en: 'Total Institutional Income' },
  total_income_sub: { bn: 'ভর্তি ফি, মুনাফা, ফরম বিক্রি ইত্যাদি', en: 'Admission fees, profit, form sales etc.' },
  total_expense: { bn: 'মোট পরিচালন ব্যয় (খরচ)', en: 'Total Operating Expense' },
  total_expense_sub: { bn: 'ভাড়া, বেতন, বিদ্যুৎ, স্টেশনারি ইত্যাদি', en: 'Rent, salary, electricity, stationery etc.' },
  net_surplus: { bn: 'নিট উদ্বৃত্ত / লাভ (Surplus)', en: 'Net Surplus / Profit' },
  net_surplus_sub: { bn: 'চলতি অর্থবছরের নিট স্থিতি', en: 'Current fiscal year net surplus' },
  search_category_desc: { bn: 'খাত বা বিবরণ খুঁজুন...', en: 'Search category or description...' },
  all_entries: { bn: 'সকল এন্ট্রি', en: 'All Entries' },
  income_only: { bn: 'শুধুমাত্র আয়', en: 'Income Only' },
  expense_only: { bn: 'শুধুমাত্র ব্যয় (খরচ)', en: 'Expense Only' },
  new_income_expense_entry: { bn: 'নতুন আয় / ব্যয় এন্ট্রি', en: 'New Income / Expense Entry' },
  income_amount: { bn: 'আয়ের পরিমাণ (৳)', en: 'Income Amount (৳)' },
  expense_amount: { bn: 'খরচের পরিমাণ (৳)', en: 'Expense Amount (৳)' },
  no_records_found: { bn: 'কোনো আয় বা খরচের রেকর্ড পাওয়া যায়নি।', en: 'No income or expense records found.' },

  // Loans Page
  total_loans_disbursed: { bn: 'সর্বমোট ঋণ বিতরণ', en: 'Total Loans Disbursed' },
  outstanding_balance: { bn: 'মাঠে বকেয়া পাওনা', en: 'Outstanding Balance' },
  total_repaid_installments: { bn: 'মোট কিস্তি আদায়', en: 'Total Repaid Installments' },
  recovery_rate: { bn: 'ঋণ পরিশোধের হার', en: 'Recovery Rate' },
  search_loans_placeholder: { bn: 'ঋণ নং, সদস্যের নাম বা উদ্দেশ্য খুঁজুন...', en: 'Search loan no, member name or purpose...' },
  loan_account_no: { bn: 'ঋণ হিসাব নং', en: 'Loan A/C No' },
  member_name: { bn: 'সদস্য নাম', en: 'Member Name' },
  member_no: { bn: 'সদস্য নং', en: 'Member No' },
  loan_purpose: { bn: 'উদ্দেশ্য', en: 'Purpose' },
  principal_loan_taka: { bn: 'মূল ঋণ (৳)', en: 'Principal (৳)' },
  total_payable_taka: { bn: 'সুদসহ মোট প্রদেয় (৳)', en: 'Total Payable (৳)' },
  total_repaid_taka: { bn: 'মোট আদায় (৳)', en: 'Total Repaid (৳)' },
  outstanding_taka: { bn: 'অবশিষ্ট বকেয়া (৳)', en: 'Outstanding (৳)' },
  installment_count: { bn: 'কিস্তি সংখ্যা', en: 'Installments' },
  disbursement_date: { bn: 'বিতরণের তারিখ', en: 'Disbursement Date' },
  give_new_loan_btn: { bn: 'নতুন ঋণ মঞ্জুর করুন', en: 'Disburse New Loan' },

  // Savings Page
  total_dps_savings: { bn: 'মোট ডিপিএস সঞ্চয়', en: 'Total DPS Savings' },
  fdr_balance: { bn: '৫ বছর মেয়াদি / FDR স্থিতি', en: '5-Year / FDR Balance' },
  accrued_savings_profit: { bn: 'প্রদেয় সঞ্চয় মুনাফা', en: 'Accrued Savings Profit' },
  total_active_schemes: { bn: 'মোট সক্রিয় স্কিম', en: 'Total Active Schemes' },
  search_savings_placeholder: { bn: 'হিসাব নং, সদস্যের নাম বা স্কিম খুঁজুন...', en: 'Search A/C no, member name or scheme...' },
  open_new_scheme_btn: { bn: 'নতুন সঞ্চয় / ডিপিএস স্কিম খুলুন', en: 'Open New Savings/DPS Scheme' },
  ac_and_scheme: { bn: 'হিসাব নং ও স্কিম নাম', en: 'A/C No & Scheme' },
  member_info: { bn: 'সদস্য তথ্য', en: 'Member Info' },
  type_label: { bn: 'ধরন', en: 'Type' },
  total_deposited_label: { bn: 'মোট জমাকৃত আমানত', en: 'Total Deposited' },
  accrued_profit_label: { bn: 'অর্জিত মুনাফা', en: 'Accrued Profit' },
  interest_rate_label: { bn: 'মুনাফার হার', en: 'Interest Rate' },
  maturity_date_label: { bn: 'মেয়াদ পূর্ণতার তারিখ', en: 'Maturity Date' },

  // Reports
  daily_report: { bn: 'দৈনিক রিপোর্ট (Daily)', en: 'Daily Report' },
  monthly_report: { bn: 'মাসিক রিপোর্ট (Monthly)', en: 'Monthly Report' },
  member_report: { bn: 'সদস্য রিপোর্ট (Member)', en: 'Member Report' },
  income_expense_report: { bn: 'আয়-ব্যয় রিপোর্ট', en: 'Income-Expense Report' },
  dividend_calc_report: { bn: '💰 লভ্যাংশ বণ্টন ক্যালকুলেটর', en: '💰 Dividend Calculator' },
  yearly_report: { bn: 'বার্ষিক আর্থিক প্রতিবেদন', en: 'Annual Financial Report' },
  closed_shares_report: { bn: 'শেয়ার সমর্পণ/ক্লোজার রেজিস্টার', en: 'Share Surrender/Closure Register' },

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
