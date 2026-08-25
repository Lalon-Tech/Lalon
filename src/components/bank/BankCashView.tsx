import React, { useState } from 'react';
import { 
  Building2, 
  Wallet, 
  ArrowRightLeft, 
  PlusCircle, 
  CreditCard, 
  Calendar,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useSomiti } from '../../context/SomitiContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const BankCashView: React.FC = () => {
  const { 
    bankAccounts, 
    cashInHand, 
    transactions, 
    useBengaliDigits,
    addBankAccount 
  } = useSomiti();

  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('বন্ধু সমবায় সমিতি লিমিটেড');
  const [branchName, setBranchName] = useState('');
  const [initialBalance, setInitialBalance] = useState<number>(50000);

  const totalBankBalance = bankAccounts.reduce((s, b) => s + b.balance, 0);
  const totalLiquidity = cashInHand + totalBankBalance;

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) return;

    addBankAccount({
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      branchName: branchName.trim() || 'উত্তরা শাখা',
      balance: Number(initialBalance) || 0,
      accountType: 'current',
    });

    setShowAddBankModal(false);
    setBankName('');
    setAccountNumber('');
  };

  const bankTransactions = transactions.filter(t => t.paymentMethod === 'bank');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">ক্যাশ ইন হ্যান্ড (অফিস ভল্ট)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(cashInHand, useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">দৈনন্দিন লেনদেনের নগদ টাকা</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">ব্যাংক হিসাবের মোট স্থিতি</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(totalBankBalance, useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">{toBengaliNumber(bankAccounts.length)} টি সক্রিয় ব্যাংক অ্যাকাউন্ট</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">সর্বমোট তরল তহবিল (Total Fund)</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-900">
            {formatCurrency(totalLiquidity, useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">ক্যাশ + সকল ব্যাংক ব্যালেন্স</span>
        </div>
      </div>

      {/* Bank Accounts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            সমিতির রেজিস্টার্ড ব্যাংক হিসাবসমূহ
          </h3>
          <button
            onClick={() => setShowAddBankModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন ব্যাংক অ্যাকাউন্ট যোগ</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">{account.bankName}</h4>
                  <p className="text-xs text-slate-500">{account.branchName} • {account.accountType === 'current' ? 'চলতি হিসাব' : 'সঞ্চয়ী হিসাব'}</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 font-mono text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-sans">হিসাব নম্বর:</span>
                <span className="font-bold text-slate-800 text-sm tracking-wider">{account.accountNumber}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">বর্তমান ব্যালেন্স:</span>
                <span className="font-bold text-blue-700 text-base">
                  {formatCurrency(account.balance, useBengaliDigits)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bank Transactions Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            ব্যাংকের মাধ্যমে সম্পাদিত সাম্প্রতিক লেনদেন
          </h4>
          <span className="text-xs text-slate-500">মোট {toBengaliNumber(bankTransactions.length)} টি ব্যাংক ভাউচার</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">তারিখ</th>
                <th className="py-2.5 px-4">ভাউচার নং</th>
                <th className="py-2.5 px-4">সদস্য / খাত</th>
                <th className="py-2.5 px-4">বিবরণ</th>
                <th className="py-2.5 px-4 text-right">জমা (৳)</th>
                <th className="py-2.5 px-4 text-right">উত্তোলন (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    ব্যাংকের মাধ্যমে কোনো লেনদেন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                bankTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-medium">{formatBengaliDate(tx.date, false)}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{tx.voucherNo}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{tx.memberName || 'সমিতি ফান্ড'}</td>
                    <td className="py-2.5 px-4 text-slate-500">{tx.notes || tx.type}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                      {['deposit', 'dps_deposit', 'fdr_deposit', 'loan_installment', 'admission_fee', 'income'].includes(tx.type)
                        ? formatCurrency(tx.amount, useBengaliDigits)
                        : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                      {['withdraw', 'loan_disbursed', 'expense'].includes(tx.type)
                        ? formatCurrency(tx.amount, useBengaliDigits)
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">নতুন ব্যাংক অ্যাকাউন্ট যোগ করুন</h3>
              <button onClick={() => setShowAddBankModal(false)} className="text-blue-200 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddBank} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ব্যাংকের নাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ইসলামী ব্যাংক বাংলাদেশ লিমিটেড"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  হিসাব নম্বর (Account No) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: 2050123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শাখা (Branch)
                  </label>
                  <input
                    type="text"
                    placeholder="উত্তরা শাখা"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    প্রারম্ভিক ব্যালেন্স (৳)
                  </label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-800"
                >
                  অ্যাকাউন্ট যোগ করুন ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
