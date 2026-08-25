import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Search, 
  FileSpreadsheet, 
  Calendar,
  Wallet,
  Building,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { PaymentMethod } from '../../types';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const IncomeExpenseView: React.FC = () => {
  const { 
    incomeExpenses, 
    bankAccounts, 
    addIncomeExpense, 
    useBengaliDigits 
  } = useSomiti();

  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('অফিস ভাড়া');
  const [amount, setAmount] = useState<number>(5000);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredEntries = incomeExpenses.filter((item) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (item.title ?? '').toLowerCase().includes(q) ||
      (item.category ?? '').toLowerCase().includes(q) ||
      ((item.description ?? '').toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (activeTab === 'income') return item.type === 'income';
    if (activeTab === 'expense') return item.type === 'expense';
    return true;
  });

  const totalIncome = incomeExpenses.filter(i => i.type === 'income').reduce((s, i) => s + i.amount, 0);
  const totalExpense = incomeExpenses.filter(i => i.type === 'expense').reduce((s, i) => s + i.amount, 0);
  const netSurplus = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    addIncomeExpense({
      type,
      category,
      title: description || category,
      amount: Number(amount),
      paymentMethod,
      bankAccountId: paymentMethod === 'bank' ? bankAccountId : undefined,
      description: description.trim(),
      date,
    });

    setShowModal(false);
  };

  const exportExcel = () => {
    const data = filteredEntries.map(item => ({
      'ভাউচার নং': item.voucherNo,
      'তারিখ': item.date,
      'ধরন': item.type === 'income' ? 'আয়' : 'ব্যয়',
      'খাত / ক্যাটাগরি': item.category,
      'বিবরণ': item.description || item.title,
      'পরিমাণ (৳)': item.amount,
      'মাধ্যম': item.paymentMethod,
      'এন্ট্রি কারী': item.recordedBy,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'আয় ব্যয় হিসাব');
    XLSX.writeFile(wb, `income_expense_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">মোট প্রাতিষ্ঠানিক আয়</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalIncome, useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">ভর্তি ফি, মুনাফা, ফরম বিক্রি ইত্যাদি</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">মোট পরিচালন ব্যয় (খরচ)</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            {formatCurrency(totalExpense, useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">ভাড়া, বেতন, বিদ্যুৎ, স্টেশনারি ইত্যাদি</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">নিট উদ্বৃত্ত / লাভ (Surplus)</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className={`text-2xl font-bold ${netSurplus >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
            {formatCurrency(netSurplus, useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">চলতি অর্থবছরের নিট স্থিতি</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="খাত বা বিবরণ খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md transition-all ${activeTab === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              সকল এন্ট্রি
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1 rounded-md transition-all ${activeTab === 'income' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              শুধুমাত্র আয়
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1 rounded-md transition-all ${activeTab === 'expense' ? 'bg-white text-rose-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              শুধুমাত্র খরচ
            </button>
          </div>

          <button
            onClick={exportExcel}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>এক্সেল</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন আয় / ব্যয় এন্ট্রি</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">ভাউচার নং</th>
                <th className="py-3 px-4">খাত / ক্যাটাগরি</th>
                <th className="py-3 px-4">বিবরণ / শিরোনাম</th>
                <th className="py-3 px-4">মাধ্যম</th>
                <th className="py-3 px-4 text-right">আয়ের পরিমাণ (৳)</th>
                <th className="py-3 px-4 text-right">খরচের পরিমাণ (৳)</th>
                <th className="py-3 px-4">এন্ট্রি কারী</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    কোনো আয় বা খরচের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      {formatBengaliDate(item.date, false)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {item.voucherNo}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {item.description || item.title}
                    </td>
                    <td className="py-3 px-4 uppercase font-medium text-slate-500">
                      {item.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                      {item.type === 'income' ? formatCurrency(item.amount, useBengaliDigits) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">
                      {item.type === 'expense' ? formatCurrency(item.amount, useBengaliDigits) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.recordedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Income / Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">নতুন আয় / ব্যয় ভাউচার এন্ট্রি</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setType('income'); setCategory('ভর্তি ফি ও ফরম বিক্রি'); }}
                  className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${
                    type === 'income' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  + আয় এন্ট্রি (Income)
                </button>
                <button
                  type="button"
                  onClick={() => { setType('expense'); setCategory('অফিস পরিচালনা ব্যয়'); }}
                  className={`py-2.5 rounded-lg text-xs font-bold border transition-all ${
                    type === 'expense' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  - ব্যয় / খরচ (Expense)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    খাত / ক্যাটাগরি
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {type === 'income' ? (
                      <>
                        <option value="ভর্তি ফি ও ফরম বিক্রি">ভর্তি ফি ও ফরম বিক্রি</option>
                        <option value="ঋণের সার্ভিস চার্জ">ঋণের সার্ভিস চার্জ</option>
                        <option value="বিলম্ব ফি ও জরিমানা">বিলম্ব ফি ও জরিমানা</option>
                        <option value="ব্যাংক লভ্যাংশ">ব্যাংক লভ্যাংশ</option>
                        <option value="বিবিধ আয়">বিবিধ আয়</option>
                      </>
                    ) : (
                      <>
                        <option value="অফিস ভাড়া">অফিস ভাড়া</option>
                        <option value="কর্মকর্তা কর্মচারীদের বেতন">কর্মকর্তা কর্মচারীদের বেতন</option>
                        <option value="বিদ্যুৎ ও ইউটিলিটি বিল">বিদ্যুৎ ও ইউটিলিটি বিল</option>
                        <option value="মুদ্রণ ও স্টেশনারি">মুদ্রণ ও স্টেশনারি</option>
                        <option value="আপ্যায়ন খরচ">আপ্যায়ন খরচ</option>
                        <option value="যাতায়াত ও ফিল্ড খরচ">যাতায়াত ও ফিল্ড খরচ</option>
                        <option value="অডিট ও আইনি খরচ">অডিট ও আইনি খরচ</option>
                        <option value="বিবিধ খরচ">বিবিধ খরচ</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    টাকার পরিমাণ (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিবরণ / শিরোনাম
                </label>
                <input
                  type="text"
                  placeholder="যেমন: চলতি মাসের অফিস বিদ্যুৎ বিল পরিশোধ"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    লেনদেনের মাধ্যম
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="cash">ক্যাশ ইন হ্যান্ড (Cash)</option>
                    <option value="bank">ব্যাংক (Bank)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    তারিখ
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-md hover:bg-slate-800"
                >
                  ভাউচার যুক্ত করুন ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
