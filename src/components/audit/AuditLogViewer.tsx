import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatBengaliDate, toBengaliNumber } from '../../utils/bengaliUtils';
import { AuditLog } from '../../types';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, useBengaliDigits } = useSomiti();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return (auditLogs || []).filter(log => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = 
          (log.details || '').toLowerCase().includes(q) ||
          (log.performedBy || '').toLowerCase().includes(q) ||
          (log.entityId || '').toLowerCase().includes(q) ||
          (log.action || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Entity
      if (entityFilter !== 'all') {
        const type = log.entityType || log.entity;
        if (type !== entityFilter) return false;
      }

      // Action
      if (actionFilter !== 'all') {
        if (log.action !== actionFilter) return false;
      }

      return true;
    });
  }, [auditLogs, searchTerm, entityFilter, actionFilter]);

  const handleExportExcel = () => {
    const data = filteredLogs.map((l, idx) => ({
      [isBn ? 'ক্রমিক' : 'SL']: idx + 1,
      [isBn ? 'তারিখ' : 'Date']: l.date,
      [isBn ? 'সময়' : 'Time']: l.time,
      [isBn ? 'কর্মকর্তা' : 'User']: l.performedBy,
      [isBn ? 'অ্যাকশন' : 'Action']: l.action,
      [isBn ? 'মডিউল' : 'Entity']: l.entityType || l.entity || 'General',
      [isBn ? 'আইডি' : 'ID']: l.entityId,
      [isBn ? 'বিবরণ' : 'Details']: l.details
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'অডিট লগ' : 'Audit Logs');
    XLSX.writeFile(wb, `System_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">তৈরি (Create)</span>;
      case 'update':
        return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">পরিবর্তন (Update)</span>;
      case 'delete':
        return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">মুছে ফেলা (Delete)</span>;
      case 'reversal':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">রিভার্সাল (Reversal)</span>;
      case 'approve':
        return <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[10px] font-bold">অনুমোদন (Approve)</span>;
      case 'reject':
        return <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">বাতিল (Reject)</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">{action}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {isBn ? 'সিস্টেম অ্যাক্টিভিটি ও অডিট লগ' : 'System Activity & Audit Logs'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBn 
                  ? 'সফটওয়্যারের সকল গুরুত্বপূর্ণ পরিবর্তন, অনুমোদন, রিভার্সাল ও এন্ট্রির পূর্ণাঙ্গ লগ ট্রেইল।' 
                  : 'Tamper-evident audit trail of actions, approvals, reversals and data changes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'লগ এক্সেল ডাউনলোড' : 'Export Logs'}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'অনুসন্ধান' : 'Search Details / User'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isBn ? 'কর্মকর্তা, আইডি বা বিবরণ...' : 'User, ID, details...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'মডিউল / খাত' : 'Module / Entity'}
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isBn ? 'সকল মডিউল' : 'All Modules'}</option>
              <option value="member">{isBn ? 'সদস্য ব্যবস্থাপনা' : 'Members'}</option>
              <option value="loan">{isBn ? 'ঋণ ও কিস্তি' : 'Loans'}</option>
              <option value="transaction">{isBn ? 'লেনদেন ও জমা' : 'Transactions'}</option>
              <option value="savings">{isBn ? 'সঞ্চয় স্কিম' : 'Savings'}</option>
              <option value="voucher">{isBn ? 'ভাউচার হিসাব' : 'Vouchers'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {isBn ? 'অ্যাকশন ধরন' : 'Action Type'}
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{isBn ? 'সকল অ্যাকশন' : 'All Actions'}</option>
              <option value="create">{isBn ? 'নতুন তৈরি' : 'Create'}</option>
              <option value="update">{isBn ? 'পরিবর্তন/হালনাগাদ' : 'Update'}</option>
              <option value="delete">{isBn ? 'মুছে ফেলা' : 'Delete'}</option>
              <option value="reversal">{isBn ? 'রিভার্সাল/ফেরত' : 'Reversal'}</option>
              <option value="approve">{isBn ? 'অনুমোদন' : 'Approve'}</option>
              <option value="reject">{isBn ? 'বাতিল' : 'Reject'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">{isBn ? 'নং' : 'SL'}</th>
                <th className="py-3 px-4 w-36">{isBn ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                <th className="py-3 px-4 w-36">{isBn ? 'কর্মকর্তা' : 'User / Officer'}</th>
                <th className="py-3 px-4 w-28 text-center">{isBn ? 'অ্যাকশন' : 'Action'}</th>
                <th className="py-3 px-4 w-28">{isBn ? 'মডিউল' : 'Entity'}</th>
                <th className="py-3 px-4">{isBn ? 'পরিবর্তন ও বিবরণ' : 'Activity Details'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {isBn ? 'কোনো অডিট লগ পাওয়া যায়নি।' : 'No audit logs match your filter.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 100).map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 text-xs font-semibold">{log.date}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{log.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{log.performedBy || 'System Admin'}</span>
                      </div>
                      {log.userRole && (
                        <span className="text-[10px] text-slate-500 block">{log.userRole}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase">
                        {log.entityType || log.entity || 'System'}
                      </span>
                      {log.entityId && (
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-[120px]">
                          #{log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {log.details}
                      </p>
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
