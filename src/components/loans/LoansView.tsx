import React, { useState } from 'react';
import { 
  CreditCard, 
  Coins, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Calendar,
  FileSignature
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';

export const LoansView: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    loans, 
    useBengaliDigits, 
    setShowQuickLoanModal, 
    setShowQuickKistiModal, 
    setSelectedMemberId,
    payLoanInstallment 
  } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cleared'>('all');

  const filteredLoans = loans.filter((l) => {
    const q = (searchTerm || '').toLowerCase();
    const matchesSearch = 
      (l.loanNo ?? '').toLowerCase().includes(q) ||
      (l.memberName ?? '').toLowerCase().includes(q) ||
      (l.memberNo ?? '').toLowerCase().includes(q) ||
      (l.purpose ?? '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return l.status === 'active';
    if (statusFilter === 'cleared') return l.status === 'cleared';
    return true;
  });

  const totalPrincipalDisbursed = loans.reduce((s, l) => s + l.principalAmount, 0);
  const totalLoanRepaid = loans.reduce((s, l) => s + l.paidAmount, 0);
  const totalOutstanding = loans.reduce((s, l) => s + (l.status === 'active' ? l.remainingAmount : 0), 0);
  const totalActiveLoansCount = loans.filter(l => l.status === 'active').length;

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  const exportExcel = () => {
    const data = filteredLoans.map(l => ({
      [isBn ? 'ঋণ হিসাব নং' : 'Loan A/C No']: l.loanNo,
      [isBn ? 'সদস্য নাম' : 'Member Name']: l.memberName,
      [isBn ? 'সদস্য নং' : 'Member No']: l.memberNo,
      [isBn ? 'উদ্দেশ্য' : 'Purpose']: l.purpose,
      [isBn ? 'মূল ঋণ (৳)' : 'Principal (৳)']: l.principalAmount,
      [isBn ? 'সুদসহ মোট প্রদেয় (৳)' : 'Total Payable (৳)']: l.totalAmount,
      [isBn ? 'মোট আদায় (৳)' : 'Total Repaid (৳)']: l.paidAmount,
      [isBn ? 'অবশিষ্ট বকেয়া (৳)' : 'Outstanding (৳)']: l.remainingAmount,
      [isBn ? 'কিস্তি সংখ্যা' : 'Installment']: `${l.paidInstallmentsCount}/${l.totalInstallments}`,
      [isBn ? 'বিতরণের তারিখ' : 'Disbursement Date']: l.disbursedDate,
      [isBn ? 'অবস্থা' : 'Status']: l.status === 'active' ? (isBn ? 'চলমান' : 'Active') : (isBn ? 'পরিশোধিত' : 'Cleared'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'ঋণ হিসাব তালিকা' : 'Loans List');
    XLSX.writeFile(wb, `loans_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const recoveryPercentage = Math.round((totalLoanRepaid / (loans.reduce((s, l) => s + l.totalAmount, 0) || 1)) * 100);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? 'সর্বমোট ঋণ বিতরণ' : 'Total Loans Disbursed'}
          </span>
          <div className="text-2xl font-bold text-indigo-700">
            {formatCurrency(totalPrincipalDisbursed, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? `মোট ${displayCount(loans.length)} টি ঋণ বিতরণ` : `Total ${displayCount(loans.length)} Loans`}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? 'মাঠে বকেয়া পাওনা' : 'Outstanding Balance'}
          </span>
          <div className="text-2xl font-bold text-rose-600">
            {formatCurrency(totalOutstanding, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? `চলমান ঋণ: ${displayCount(totalActiveLoansCount)} টি` : `Active Loans: ${displayCount(totalActiveLoansCount)}`}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? 'মোট কিস্তি আদায়' : 'Total Repaid Installments'}
          </span>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(totalLoanRepaid, isBn && useBengaliDigits)}
          </div>
          <span className="text-xs text-emerald-600 font-medium">
            {isBn ? 'নিয়মিত আদায় হচ্ছে' : 'Regular Collections'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block mb-1">
            {isBn ? 'ঋণ পরিশোধের হার' : 'Recovery Rate'}
          </span>
          <div className="text-2xl font-bold text-slate-800">
            {totalPrincipalDisbursed > 0 
              ? `${displayCount(recoveryPercentage)}%`
              : (isBn ? '০%' : '0%')}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'রিকভারি পারফরম্যান্স' : 'Recovery Performance'}
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
              placeholder={isBn ? "ঋণ নং, সদস্যের নাম বা উদ্দেশ্য খুঁজুন..." : "Search loan no, member name or purpose..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              {isBn ? `সকল (${displayCount(loans.length)})` : `All (${displayCount(loans.length)})`}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'active' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              {isBn ? `চলমান (${displayCount(totalActiveLoansCount)})` : `Active (${displayCount(totalActiveLoansCount)})`}
            </button>
            <button
              onClick={() => setStatusFilter('cleared')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${statusFilter === 'cleared' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-600'}`}
            >
              {isBn ? `পরিশোধিত (${displayCount(loans.filter(l => l.status === 'cleared').length)})` : `Cleared (${displayCount(loans.filter(l => l.status === 'cleared').length)})`}
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
            onClick={() => setShowQuickKistiModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>{isBn ? 'কিস্তি আদায়' : 'Collect Kisti'}</span>
          </button>

          <button
            onClick={() => setShowQuickLoanModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isBn ? 'নতুন ঋণ বিতরণ' : 'Disburse Loan'}</span>
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{isBn ? 'ঋণ নং ও উদ্দেশ্য' : 'Loan No & Purpose'}</th>
                <th className="py-3 px-4">{isBn ? 'সদস্য তথ্য' : 'Member Info'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'মূল ঋণ' : 'Principal'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'মোট প্রদেয়' : 'Total Payable'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'মোট আদায়' : 'Total Paid'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অবশিষ্ট বকেয়া' : 'Remaining'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'কিস্তি প্রগ্রেস' : 'Progress'}</th>
                <th className="py-3 px-4 text-center">{isBn ? 'অবস্থা' : 'Status'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {isBn ? 'কোনো ঋণ রেকর্ড পাওয়া যায়নি।' : 'No loan records found.'}
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-200">
                        {loan.loanNo}
                      </span>
                      <div className="font-bold text-slate-800 mt-1">{loan.purpose}</div>
                      <span className="text-[10px] text-slate-400 block">
                        {isBn ? `বিতরণ: ${formatBengaliDate(loan.disbursedDate, isBn)}` : `Disbursed: ${formatBengaliDate(loan.disbursedDate, isBn)}`}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div 
                        onClick={() => setSelectedMemberId(loan.memberId)}
                        className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer"
                      >
                        {loan.memberName}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{loan.memberNo}</span>
                      {loan.guarantorName && (
                        <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                          {isBn ? `জামিনদার: ${loan.guarantorName}` : `Guarantor: ${loan.guarantorName}`}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-800 text-sm">
                      {formatCurrency(loan.principalAmount, isBn && useBengaliDigits)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-indigo-900 text-sm">
                      {formatCurrency(loan.totalAmount, isBn && useBengaliDigits)}
                      <span className="block text-[10px] text-slate-400">
                        {isBn ? `লাভ: ${formatCurrency(loan.interestAmount, isBn && useBengaliDigits)}` : `Interest: ${formatCurrency(loan.interestAmount, isBn && useBengaliDigits)}`}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-700 text-sm">
                      {formatCurrency(loan.paidAmount, isBn && useBengaliDigits)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-rose-600 text-sm">
                      {formatCurrency(loan.remainingAmount, isBn && useBengaliDigits)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-slate-700 text-xs">
                        {displayCount(loan.paidInstallmentsCount)} / {displayCount(loan.totalInstallments)}
                      </div>
                      <div className="w-20 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full" 
                          style={{ width: `${(loan.paidInstallmentsCount / (loan.totalInstallments || 1)) * 100}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        loan.status === 'cleared'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {loan.status === 'cleared' ? (isBn ? 'পরিশোধিত ✓' : 'Cleared ✓') : (isBn ? 'চলমান কিস্তি' : 'Active')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {loan.status === 'active' && (
                          <button
                            onClick={() => setShowQuickKistiModal(true)}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                          >
                            {isBn ? 'কিস্তি আদায়' : 'Collect'}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedMemberId(loan.memberId)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                          title={isBn ? "বিস্তারিত শিডিউল দেখুন" : "View Details & Schedule"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
