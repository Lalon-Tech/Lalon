import React, { useState } from 'react';
import { 
  History, 
  X, 
  Search, 
  Filter, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  User,
  ArrowRight
} from 'lucide-react';
import { AuditLog } from '../../types';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatBengaliDate, toBengaliNumber } from '../../utils/bengaliUtils';

interface LoanAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoanAuditModal: React.FC<LoanAuditModalProps> = ({ isOpen, onClose }) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { auditLogs, useBengaliDigits } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  if (!isOpen) return null;

  // Filter audit logs for loan entity type
  const loanLogs = auditLogs.filter(l => l.entityType === 'loan');

  const filteredLogs = loanLogs.filter(log => {
    const matchesSearch = 
      log.entityTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Edit3 className="w-3 h-3" />
            <span>{isBn ? 'সংশোধন' : 'Update'}</span>
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3" />
            <span>{isBn ? 'স্থায়ী ডিলিট' : 'Delete'}</span>
          </span>
        );
      case 'reversal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3" />
            <span>{isBn ? 'রিভার্সাল' : 'Reversal'}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <ShieldCheck className="w-3 h-3" />
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-xl">
              <History className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isBn ? 'ঋণ হিসাব অডিট ট্রেইল ও অ্যাক্টিভিটি হিস্ট্রি' : 'Loan Audit Trail & Activity Logs'}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md">
                  {filteredLogs.length} {isBn ? 'টি রেকর্ড' : 'entries'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {isBn 
                  ? 'ঋণ হিসাব তৈরি, সংশোধন, রিভার্সাল ও ডিলিট সংক্রান্ত সকল প্রাতিষ্ঠানিক অডিট তথ্য' 
                  : 'Complete history of all modifications, recalculations, reversals and deletions'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isBn ? 'ঋণ নম্বর, সদস্য বা বিবরণ দিয়ে খুঁজুন...' : 'Search by loan no, member, or notes...'}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">{isBn ? 'সকল অ্যাকশন' : 'All Actions'}</option>
              <option value="update">{isBn ? 'শুধুমাত্র সংশোধন' : 'Updates Only'}</option>
              <option value="reversal">{isBn ? 'শুধুমাত্র রিভার্সাল' : 'Reversals Only'}</option>
              <option value="delete">{isBn ? 'শুধুমাত্র ডিলিট' : 'Deletions Only'}</option>
            </select>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">
                {isBn ? 'কোনো অডিট লগ পাওয়া যায়নি' : 'No audit records found'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isBn ? 'ঋণ হিসাবে যেকোনো পরিবর্তন বা ডিলিটের পর এখানে বিস্তারিত রেকর্ড থাকবে।' : 'Any edits, recalculations, or deletions will be permanently tracked here.'}
              </p>
            </div>
          ) : (
            filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-xs text-slate-900">
                      {log.entityTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatBengaliDate(log.date)} {log.time}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{log.performedBy} ({log.userRole || 'admin'})</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {log.details}
                </p>

                {/* Field Changes Diff View if available */}
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(log.changes).map(([field, diff]: [string, any]) => (
                      <div key={field} className="bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200/60 flex items-center justify-between">
                        <span className="text-slate-500 font-mono text-[10px]">{field}:</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-rose-600 line-through">{String(diff?.old ?? '—')}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-emerald-700">{String(diff?.new ?? '—')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
