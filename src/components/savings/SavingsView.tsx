import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  PlusCircle, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Search, 
  ArrowDownRight,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const SavingsView: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    savingsSchemes, 
    members, 
    useBengaliDigits, 
    addSavingsScheme, 
    setShowQuickDepositModal,
    setSelectedMemberId,
    activeTab: contextActiveTab
  } = useSomiti();

  const [activeTab, setActiveTab] = useState<'all' | 'dps' | 'fdr' | 'general'>(() => {
    if (contextActiveTab === 'savings_dps') return 'dps';
    if (contextActiveTab === 'savings_fdr') return 'fdr';
    return 'all';
  });

  useEffect(() => {
    if (contextActiveTab === 'savings_dps') setActiveTab('dps');
    else if (contextActiveTab === 'savings_fdr') setActiveTab('fdr');
    else if (contextActiveTab === 'savings' || contextActiveTab === 'savings_ledger') setActiveTab('all');
  }, [contextActiveTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewSchemeModal, setShowNewSchemeModal] = useState(false);

  // New Scheme Form State
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [type, setType] = useState<'dps' | 'fdr'>('dps');
  const [schemeName, setSchemeName] = useState(() => isBn ? '৫ বছর মেয়াদি বিশেষ ডিপিএস' : '5-Year Special DPS Scheme');
  const [monthlyInstallment, setMonthlyInstallment] = useState(2000);
  const [principalAmount, setPrincipalAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(10);
  const [durationMonths, setDurationMonths] = useState(60);

  useEffect(() => {
    if (type === 'dps') {
      setSchemeName(isBn ? '৫ বছর মেয়াদি বিশেষ ডিপিএস' : '5-Year Special DPS Scheme');
    } else {
      setSchemeName(isBn ? '৫ বছর মেয়াদি বিশেষ এফডিআর' : '5-Year Fixed Deposit (FDR)');
    }
  }, [type, isBn]);

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  const filteredSchemes = savingsSchemes.filter((s) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (s.memberName ?? '').toLowerCase().includes(q) ||
      (s.memberNo ?? '').toLowerCase().includes(q) ||
      (s.accountNo ?? '').toLowerCase().includes(q) ||
      (s.schemeName ?? '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (activeTab === 'dps') return s.type === 'dps';
    if (activeTab === 'fdr') return s.type === 'fdr';
    if (activeTab === 'general') return s.type === 'general';
    return true;
  });

  const totalDpsDeposits = savingsSchemes
    .filter(s => s.type === 'dps')
    .reduce((sum, s) => sum + s.totalDeposited, 0);

  const totalFdrDeposits = savingsSchemes
    .filter(s => s.type === 'fdr')
    .reduce((sum, s) => sum + s.totalDeposited, 0);

  const totalAccruedProfit = savingsSchemes.reduce((sum, s) => sum + s.profitAccrued, 0);

  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      alert(isBn ? 'সদস্য নির্বাচন করুন।' : 'Please select a member.');
      return;
    }

    addSavingsScheme({
      memberId,
      type,
      schemeName: schemeName.trim(),
      monthlyInstallment: type === 'dps' ? Number(monthlyInstallment) : undefined,
      principalAmount: type === 'fdr' ? Number(principalAmount) : undefined,
      interestRate: Number(interestRate),
      durationMonths: Number(durationMonths),
    });

    setShowNewSchemeModal(false);
  };

  const exportExcel = () => {
    const data = filteredSchemes.map(s => ({
      [isBn ? 'হিসাব নং' : 'Account No']: s.accountNo,
      [isBn ? 'সদস্য নাম' : 'Member Name']: s.memberName,
      [isBn ? 'সদস্য নং' : 'Member No']: s.memberNo,
      [isBn ? 'স্কিম নাম' : 'Scheme Name']: s.schemeName,
      [isBn ? 'ধরন' : 'Type']: s.type === 'dps' ? (isBn ? 'ডিপিএস' : 'DPS') : s.type === 'fdr' ? (isBn ? 'এফডিআর' : 'FDR') : (isBn ? 'সাধারণ' : 'General'),
      [isBn ? 'মোট জমা (৳)' : 'Total Deposited (৳)']: s.totalDeposited,
      [isBn ? 'অর্জিত লাভ (৳)' : 'Profit Accrued (৳)']: s.profitAccrued,
      [isBn ? 'মুনাফার হার' : 'Interest Rate']: `${s.interestRate}%`,
      [isBn ? 'শুরুর তারিখ' : 'Start Date']: s.startDate,
      [isBn ? 'মেয়াদ পূর্ণ' : 'Maturity Date']: s.maturityDate,
      [isBn ? 'অবস্থা' : 'Status']: s.status === 'running' ? (isBn ? 'চলমান' : 'Running') : (isBn ? 'মেয়াদোত্তীর্ণ' : 'Matured'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'সঞ্চয় স্কিম হিসাব' : 'Savings Schemes');
    XLSX.writeFile(wb, `savings_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? 'মোট ডিপিএস সঞ্চয়' : 'Total DPS Savings'}
          </span>
          <div className="text-2xl font-bold text-blue-700">
            {formatCurrency(totalDpsDeposits, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? `চলমান ডিপিএস: ${displayCount(savingsSchemes.filter(s => s.type === 'dps').length)} টি` : `Active DPS: ${displayCount(savingsSchemes.filter(s => s.type === 'dps').length)}`}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? '৫ বছর মেয়াদি / FDR স্থিতি' : '5-Year / FDR Balance'}
          </span>
          <div className="text-2xl font-bold text-purple-700">
            {formatCurrency(totalFdrDeposits, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? `মোট এফডিআর: ${displayCount(savingsSchemes.filter(s => s.type === 'fdr').length)} টি` : `Total FDR: ${displayCount(savingsSchemes.filter(s => s.type === 'fdr').length)}`}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? 'প্রদেয় সঞ্চয় মুনাফা' : 'Accrued Savings Profit'}
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalAccruedProfit, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'সদস্যদের অর্জিত মোট লাভ' : 'Total profit accrued by members'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? 'মোট সক্রিয় স্কিম' : 'Total Active Schemes'}
          </span>
          <div className="text-2xl font-bold text-slate-800">
            {displayCount(savingsSchemes.length)} {isBn ? 'টি' : 'Schemes'}
          </div>
          <span className="text-xs text-emerald-600 font-medium">
            {isBn ? 'নিয়মিত কিস্তি জমা হচ্ছে' : 'Active deposits received'}
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isBn ? "হিসাব নং, সদস্যের নাম বা স্কিম খুঁজুন..." : "Search A/C no, member name or scheme..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* Tabs */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'all' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              {isBn ? `সকল (${displayCount(savingsSchemes.length)})` : `All (${displayCount(savingsSchemes.length)})`}
            </button>
            <button
              onClick={() => setActiveTab('dps')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'dps' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              {isBn ? 'মাসিক ডিপিএস' : 'Monthly DPS'}
            </button>
            <button
              onClick={() => setActiveTab('fdr')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${activeTab === 'fdr' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              {isBn ? '৫ বছর মেয়াদি / FDR' : '5-Year / FDR'}
            </button>
          </div>

          <button
            onClick={exportExcel}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'এক্সেল' : 'Excel'}</span>
          </button>

          <button
            onClick={() => setShowNewSchemeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isBn ? 'নতুন সঞ্চয় / ডিপিএস স্কিম খুলুন' : 'Open New Savings/DPS Scheme'}</span>
          </button>
        </div>
      </div>

      {/* Schemes Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{isBn ? 'হিসাব নং ও স্কিম নাম' : 'A/C No & Scheme'}</th>
                <th className="py-3 px-4">{isBn ? 'সদস্য তথ্য' : 'Member Info'}</th>
                <th className="py-3 px-4">{isBn ? 'ধরন' : 'Type'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'মোট জমাকৃত আমানত' : 'Total Deposited'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অর্জিত মুনাফা' : 'Accrued Profit'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'মুনাফার হার' : 'Interest Rate'}</th>
                <th className="py-3 px-4">{isBn ? 'মেয়াদ পূর্ণতার তারিখ' : 'Maturity Date'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchemes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {isBn ? 'কোনো সঞ্চয় স্কিম হিসাব পাওয়া যায়নি।' : 'No savings scheme accounts found.'}
                  </td>
                </tr>
              ) : (
                filteredSchemes.map((scheme) => (
                  <tr key={scheme.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                        {scheme.accountNo}
                      </span>
                      <div className="font-bold text-slate-800 mt-1">{scheme.schemeName}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div 
                        onClick={() => setSelectedMemberId(scheme.memberId)} 
                        className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer"
                      >
                        {scheme.memberName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{scheme.memberNo}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        scheme.type === 'dps'
                          ? 'bg-blue-100 text-blue-800'
                          : scheme.type === 'fdr'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {scheme.type === 'dps' ? (isBn ? 'মাসিক ডিপিএস' : 'Monthly DPS') : scheme.type === 'fdr' ? (isBn ? '৫ বছর মেয়াদি FDR' : '5-Year FDR') : (isBn ? 'সাধারণ' : 'General')}
                      </span>
                      {scheme.monthlyInstallment && (
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {isBn ? `কিস্তি: ${formatCurrency(scheme.monthlyInstallment, isBn && useBengaliDigits)}/মাস` : `Inst: ${formatCurrency(scheme.monthlyInstallment, isBn && useBengaliDigits)}/mo`}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                      {formatCurrency(scheme.totalDeposited, isBn && useBengaliDigits)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-blue-700 text-sm">
                      {formatCurrency(scheme.profitAccrued, isBn && useBengaliDigits)}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {displayCount(scheme.interestRate)}%
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-600">
                      {formatBengaliDate(scheme.maturityDate, isBn)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setShowQuickDepositModal(true)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-bold transition-colors cursor-pointer"
                      >
                        {isBn ? '+ কিস্তি জমা' : '+ Deposit'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Scheme Modal */}
      {showNewSchemeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">
                {isBn ? 'নতুন সঞ্চয় / ডিপিএস স্কিম চালু করুন' : 'Open New Savings / DPS Scheme'}
              </h3>
              <button onClick={() => setShowNewSchemeModal(false)} className="text-blue-200 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScheme} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'সদস্য নির্বাচন করুন' : 'Select Member'} <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberNo} - {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'স্কিমের ধরন' : 'Scheme Type'}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'dps' | 'fdr')}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="dps">{isBn ? 'মাসিক ডিপিএস (DPS)' : 'Monthly DPS'}</option>
                    <option value="fdr">{isBn ? '৫ বছর মেয়াদি / FDR' : '5-Year / FDR'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'মেয়াদ (মাস)' : 'Duration (Months)'}
                  </label>
                  <select
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value={12}>{isBn ? '১ বছর (১২ মাস)' : '1 Year (12 Months)'}</option>
                    <option value={24}>{isBn ? '২ বছর (২৪ মাস)' : '2 Years (24 Months)'}</option>
                    <option value={36}>{isBn ? '৩ বছর (৩৬ মাস)' : '3 Years (36 Months)'}</option>
                    <option value={60}>{isBn ? '৫ বছর (৬০ মাস)' : '5 Years (60 Months)'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'স্কিমের নাম' : 'Scheme Name'}
                </label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {type === 'dps' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'মাসিক কিস্তির পরিমাণ (৳)' : 'Monthly Installment (৳)'}
                    </label>
                    <input
                      type="number"
                      min={500}
                      value={monthlyInstallment}
                      onChange={(e) => setMonthlyInstallment(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isBn ? 'এককালীন মূল আমানত (৳)' : 'Principal Deposit (৳)'}
                    </label>
                    <input
                      type="number"
                      min={10000}
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-bold text-purple-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? 'বার্ষিক মুনাফার হার (%)' : 'Annual Profit Rate (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewSchemeModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-800 cursor-pointer"
                >
                  {isBn ? 'স্কিম হিসাব খুলুন ✓' : 'Open Scheme Account ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
