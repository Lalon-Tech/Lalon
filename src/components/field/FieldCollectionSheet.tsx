import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare, 
  Share2, 
  ExternalLink,
  ArrowRight,
  PlusCircle,
  Coins,
  DollarSign,
  Filter,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  formatCurrency, 
  formatBengaliDate, 
  toBengaliNumber 
} from '../../utils/bengaliUtils';
import { Member, Loan, SavingsScheme } from '../../types';

export const FieldCollectionSheet: React.FC = () => {
  const { 
    members, 
    loans, 
    savingsSchemes, 
    transactions, 
    users, 
    settings, 
    useBengaliDigits,
    setSelectedMemberId,
    setShowQuickDepositModal,
    setShowQuickKistiModal,
    setActiveTab
  } = useSomiti();

  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedCollector, setSelectedCollector] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'collected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);

  // Active non-deleted members
  const activeMembers = useMemo(() => {
    return members.filter(m => m.status === 'active' && !m.isDeleted);
  }, [members]);

  // Approved active loans
  const activeLoans = useMemo(() => {
    return loans.filter(l => l.status === 'active' || l.status === 'approved');
  }, [loans]);

  // Running DPS/FDR savings schemes
  const runningSavingsSchemes = useMemo(() => {
    return savingsSchemes.filter(s => s.status === 'running');
  }, [savingsSchemes]);

  // Transactions completed on the selected date
  const dateTransactions = useMemo(() => {
    return transactions.filter(t => t.date === selectedDate && t.status === 'completed');
  }, [transactions, selectedDate]);

  // Build expected collection row for each member
  const collectionRows = useMemo(() => {
    return activeMembers.map((member) => {
      // 1. Expected regular general savings (e.g. standard monthly share or nominal amount)
      const expectedGeneralSavings = 200; // Standard nominal collection

      // 2. Expected DPS installments for this member
      const memberDPS = runningSavingsSchemes.filter(s => s.memberId === member.id && s.type === 'dps');
      const expectedDPS = memberDPS.reduce((sum, s) => sum + (s.monthlyAmount || 0), 0);

      // 3. Expected active loan installment
      const memberLoan = activeLoans.find(l => l.memberId === member.id);
      const expectedLoanKisti = memberLoan ? memberLoan.installmentAmount : 0;
      const loanNo = memberLoan ? memberLoan.loanNo : null;

      // Total expected from this member today
      const totalExpected = expectedGeneralSavings + expectedDPS + expectedLoanKisti;

      // Check transactions made by this member on selected date
      const memberTx = dateTransactions.filter(t => t.memberId === member.id || t.memberNo === member.memberNo);
      const collectedAmount = memberTx.reduce((sum, t) => sum + t.amount, 0);

      const isCollected = collectedAmount >= (totalExpected > 0 ? totalExpected * 0.5 : 100);

      return {
        member,
        expectedGeneralSavings,
        expectedDPS,
        expectedLoanKisti,
        loanNo,
        totalExpected,
        collectedAmount,
        isCollected,
        txCount: memberTx.length
      };
    });
  }, [activeMembers, runningSavingsSchemes, activeLoans, dateTransactions]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return collectionRows.filter(row => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = 
          row.member.name.toLowerCase().includes(q) ||
          (row.member.phone && row.member.phone.includes(q)) ||
          row.member.memberNo.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Status
      if (statusFilter === 'due' && row.isCollected) return false;
      if (statusFilter === 'collected' && !row.isCollected) return false;

      // Collector filter
      if (selectedCollector !== 'all' && row.member.assignedCollectorId !== selectedCollector) {
        return false;
      }

      return true;
    });
  }, [collectionRows, searchTerm, statusFilter, selectedCollector]);

  // Totals
  const totalTargetAmount = filteredRows.reduce((sum, r) => sum + r.totalExpected, 0);
  const totalCollectedAmount = filteredRows.reduce((sum, r) => sum + r.collectedAmount, 0);
  const totalDueAmount = Math.max(0, totalTargetAmount - totalCollectedAmount);
  const collectedCount = filteredRows.filter(r => r.isCollected).length;
  const dueCount = filteredRows.length - collectedCount;

  // Generate WhatsApp Message text for due reminder
  const getWhatsAppMessage = (row: typeof collectionRows[0]) => {
    const somitiName = settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড';
    const amountStr = (row.totalExpected || 500).toLocaleString('en-IN');
    return `সম্মানিত গ্রাহক ${row.member.name} (সদস্য নং: ${row.member.memberNo}), 
${somitiName}-এ আপনার আজকের নির্ধারিত কিস্তি ও সঞ্চয় বাবদ মোট ৳${amountStr}/- পরিশোধ করার জন্য বিনীত অনুরোধ করা হচ্ছে।

ধন্যবাদান্তে,
${somitiName}`;
  };

  const handleSendWhatsApp = (row: typeof collectionRows[0]) => {
    const text = getWhatsAppMessage(row);
    let phone = (row.member.phone || '').trim().replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '88' + phone;
    } else if (!phone.startsWith('880')) {
      phone = '880' + phone;
    }
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSendSMS = (row: typeof collectionRows[0]) => {
    const text = getWhatsAppMessage(row);
    const phone = row.member.phone || '';
    const url = `sms:${phone}?body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const handleCopyMessage = async (row: typeof collectionRows[0]) => {
    const text = getWhatsAppMessage(row);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsg(row.member.id);
      setTimeout(() => setCopiedMsg(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleQuickCollect = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowQuickDepositModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const exportData = filteredRows.map((row, idx) => ({
      [isBn ? 'ক্রমিক' : 'SL']: idx + 1,
      [isBn ? 'সদস্য নং' : 'Member ID']: row.member.memberNo,
      [isBn ? 'সদস্যের নাম' : 'Member Name']: row.member.name,
      [isBn ? 'মোবাইল' : 'Phone']: row.member.phone,
      [isBn ? 'ঠিকানা' : 'Address']: row.member.presentAddress || '',
      [isBn ? 'সঞ্চয় কিস্তি (৳)' : 'Savings Due (৳)']: row.expectedGeneralSavings,
      [isBn ? 'ডিপিএস কিস্তি (৳)' : 'DPS Due (৳)']: row.expectedDPS,
      [isBn ? 'ঋণের কিস্তি (৳)' : 'Loan Kisti (৳)']: row.expectedLoanKisti,
      [isBn ? 'ঋণ নং' : 'Loan No']: row.loanNo || 'N/A',
      [isBn ? 'মোট প্রত্যাশিত (৳)' : 'Total Expected (৳)']: row.totalExpected,
      [isBn ? 'আজকের আদায় (৳)' : 'Collected (৳)']: row.collectedAmount,
      [isBn ? 'স্থিতি' : 'Status']: row.isCollected ? 'আদায়কৃত' : 'বকেয়া'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'কালেকশন শিট' : 'Field Sheet');
    XLSX.writeFile(wb, `Daily_Collection_Sheet_${selectedDate}.xlsx`);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls (Hidden in print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                <ClipboardList className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {isBn ? 'মাঠপর্যায়ের দৈনিক কালেকশন শিট' : 'Daily Field Collection Sheet'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isBn 
                ? 'মাঠকর্মীদের জন্য দৈনিক সঞ্চয় ও ঋণের কিস্তি আদায় তালিকা, হোয়াটসঅ্যাপ তাগাদা ও প্রিন্ট উপযোগী শিট।' 
                : 'Daily field collection roster, WhatsApp due reminders, and printable collection sheet.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>{isBn ? 'শিট প্রিন্ট' : 'Print Sheet'}</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'এক্সেল' : 'Excel'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'তারিখ নির্বাচন' : 'Collection Date'}
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'আদায় স্থিতি' : 'Collection Status'}
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isBn ? 'সকল' : 'All'} ({filteredRows.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('due')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'due' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isBn ? 'বকেয়া' : 'Due'} ({dueCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('collected')}
                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'collected' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {isBn ? 'আদায়কৃত' : 'Paid'} ({collectedCount})
              </button>
            </div>
          </div>

          {/* Collector / Officer Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'কালেক্টর / কর্মকর্তা' : 'Field Collector'}
            </label>
            <select
              value={selectedCollector}
              onChange={(e) => setSelectedCollector(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isBn ? 'সকল কর্মকর্তা' : 'All Field Staff'}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.roleTitle})</option>
              ))}
            </select>
          </div>

          {/* Search Member */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'সদস্য অনুসন্ধান' : 'Search Member'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isBn ? 'নাম, ফোন বা সদস্য আইডি...' : 'Name, phone or ID...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl">
            <span className="text-[11px] font-semibold text-blue-700 block">{isBn ? 'মোট প্রত্যাশিত পাওনা' : 'Expected Target'}</span>
            <span className="text-base sm:text-lg font-bold text-blue-900 mt-0.5 block">
              {formatCurrency(totalTargetAmount, isBn && useBengaliDigits)}
            </span>
            <span className="text-[10px] text-blue-600 mt-0.5 block">{filteredRows.length} জন সদস্য</span>
          </div>

          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <span className="text-[11px] font-semibold text-emerald-700 block">{isBn ? 'আজকের মোট আদায়' : 'Total Collected'}</span>
            <span className="text-base sm:text-lg font-bold text-emerald-900 mt-0.5 block">
              {formatCurrency(totalCollectedAmount, isBn && useBengaliDigits)}
            </span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">{collectedCount} জন আদায়কৃত</span>
          </div>

          <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
            <span className="text-[11px] font-semibold text-rose-700 block">{isBn ? 'অবশিষ্ট বকেয়া' : 'Remaining Due'}</span>
            <span className="text-base sm:text-lg font-bold text-rose-900 mt-0.5 block">
              {formatCurrency(totalDueAmount, isBn && useBengaliDigits)}
            </span>
            <span className="text-[10px] text-rose-600 mt-0.5 block">{dueCount} জন বকেয়া</span>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl">
            <span className="text-[11px] font-semibold text-amber-700 block">{isBn ? 'আদায় শতকরা হার' : 'Collection Rate'}</span>
            <span className="text-base sm:text-lg font-bold text-amber-900 mt-0.5 block">
              {totalTargetAmount > 0 ? Math.round((totalCollectedAmount / totalTargetAmount) * 100) : 0}%
            </span>
            <span className="text-[10px] text-amber-600 mt-0.5 block">
              {isBn ? `${formatBengaliDate(selectedDate, false)} তারিখের শিট` : `Sheet for ${selectedDate}`}
            </span>
          </div>
        </div>
      </div>

      {/* Printable Sheet Area */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden printable-area">
        {/* Printable Header (Visible on print & on screen) */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="text-center space-y-1">
            <h1 className="text-lg sm:text-xl font-black text-slate-900">{settings.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড'}</h1>
            <p className="text-xs text-slate-600">{settings.address || 'ঢাকা, বাংলাদেশ'} • রেজি: {settings.registrationNo || 'REG-2024-889'}</p>
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-bold mt-1">
              {isBn ? 'দৈনিক ফিল্ড কালেকশন শিট (Daily Collection Sheet)' : 'Daily Field Collection Sheet'}
            </div>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {isBn ? 'তারিখ: ' : 'Date: '}{formatBengaliDate(selectedDate, false)}
            </p>
          </div>
        </div>

        {/* Collection Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[780px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-12">{isBn ? 'নং' : 'SL'}</th>
                <th className="py-3 px-3">{isBn ? 'সদস্যের তথ্য' : 'Member Details'}</th>
                <th className="py-3 px-3">{isBn ? 'মোবাইল নম্বর' : 'Phone'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'সঞ্চয়' : 'Savings'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ডিপিএস' : 'DPS'}</th>
                <th className="py-3 px-3 text-right">{isBn ? 'ঋণের কিস্তি' : 'Loan Kisti'}</th>
                <th className="py-3 px-3 text-right font-black">{isBn ? 'মোট পাওনা' : 'Total Due'}</th>
                <th className="py-3 px-3 text-center">{isBn ? 'আদায় স্থিতি' : 'Status'}</th>
                <th className="py-3 px-3 text-center print-only">{isBn ? 'গ্রাহকের স্বাক্ষর' : 'Signature'}</th>
                <th className="py-3 px-3 text-right no-print">{isBn ? 'অ্যাকশন ও তাগাদা' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    {isBn ? 'কোনো সদস্য তথ্য পাওয়া যায়নি।' : 'No members found for this filter.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Member Details */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{row.member.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {row.member.memberNo}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {row.member.presentAddress || 'গ্রাম: এলাকা'}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {row.member.phone || 'N/A'}
                    </td>

                    {/* Expected General Savings */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {row.expectedGeneralSavings > 0 ? `৳${row.expectedGeneralSavings}` : '-'}
                    </td>

                    {/* Expected DPS */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {row.expectedDPS > 0 ? `৳${row.expectedDPS}` : '-'}
                    </td>

                    {/* Expected Loan Installment */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {row.expectedLoanKisti > 0 ? (
                        <div>
                          <span className="font-bold text-slate-900">৳{row.expectedLoanKisti}</span>
                          {row.loanNo && <span className="block text-[9px] text-slate-400">#{row.loanNo}</span>}
                        </div>
                      ) : '-'}
                    </td>

                    {/* Total Expected Due */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      ৳{row.totalExpected.toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {row.isCollected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isBn ? 'আদায়কৃত' : 'Paid'} (৳{row.collectedAmount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>{isBn ? 'বকেয়া' : 'Due'}</span>
                        </span>
                      )}
                    </td>

                    {/* Signature Column for Printed Paper */}
                    <td className="py-2.5 px-3 text-center print-only border-l border-slate-300 w-28">
                      <div className="h-6 border-b border-dashed border-slate-400"></div>
                    </td>

                    {/* Quick Actions (Screen Only) */}
                    <td className="py-2.5 px-3 text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Reminder Button */}
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(row)}
                          title={isBn ? 'হোয়াটসঅ্যাপে কিস্তির তাগাদা পাঠান' : 'Send WhatsApp Reminder'}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Native SMS Button */}
                        <button
                          type="button"
                          onClick={() => handleSendSMS(row)}
                          title={isBn ? 'SMS তাগাদা পাঠান' : 'Send SMS Reminder'}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy Text Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(row)}
                          title={isBn ? 'তাগাদা মেসেজ কপি করুন' : 'Copy Message'}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          {copiedMsg === row.member.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        </button>

                        {/* Quick Collect Entry */}
                        <button
                          type="button"
                          onClick={() => handleQuickCollect(row.member.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <Coins className="w-3 h-3" />
                          <span>{isBn ? 'আদায়' : 'Collect'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total Row */}
            {filteredRows.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-left">
                    {isBn ? `মোট সর্বমোট (${filteredRows.length} জন সদস্য)` : `Grand Total (${filteredRows.length} Members)`}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    ৳{filteredRows.reduce((s, r) => s + r.expectedGeneralSavings, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    ৳{filteredRows.reduce((s, r) => s + r.expectedDPS, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    ৳{filteredRows.reduce((s, r) => s + r.expectedLoanKisti, 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-sm text-blue-900">
                    ৳{totalTargetAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-800">
                    আদায়: ৳{totalCollectedAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 print-only"></td>
                  <td className="py-3 px-3 no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Printed Footer Signatures */}
        <div className="print-only p-8 mt-12 grid grid-cols-3 gap-8 text-center text-xs text-slate-800">
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">মাঠকর্মীর স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">সংগ্রহকারী কর্মকর্তা</span>
          </div>
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">ক্যাশিয়ারের স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">জমা গ্রহণকারী</span>
          </div>
          <div>
            <div className="border-t border-slate-900 pt-1 font-bold">ম্যানেজার / সম্পাদকের স্বাক্ষর</div>
            <span className="text-[10px] text-slate-500">অনুমোদনকারী কর্মকর্তা</span>
          </div>
        </div>
      </div>
    </div>
  );
};
