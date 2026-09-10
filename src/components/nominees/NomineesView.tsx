import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  FileSpreadsheet, 
  Users, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Eye, 
  Percent,
  Calendar,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSomiti } from '../../context/SomitiContext';
import { useLanguage } from '../../context/LanguageContext';
import { toBengaliNumber } from '../../utils/bengaliUtils';

export const NomineesView: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const { 
    members, 
    useBengaliDigits, 
    setSelectedMemberId,
    setActiveTab 
  } = useSomiti();

  const [searchTerm, setSearchTerm] = useState('');

  // Collect all nominees flattened with member info
  const allNomineeRecords = members.flatMap(member => {
    const list = member.nominees || [];
    return list.map((nominee, idx) => ({
      ...nominee,
      uniqueId: `${member.id}-nom-${idx}`,
      memberId: member.id,
      memberName: member.name,
      memberNo: member.memberNo,
      memberPhone: member.phone,
      memberPhoto: member.photoUrl,
    }));
  });

  const filteredNominees = allNomineeRecords.filter(item => {
    const q = (searchTerm || '').toLowerCase();
    return (
      (item.name ?? '').toLowerCase().includes(q) ||
      (item.relation ?? '').toLowerCase().includes(q) ||
      (item.phone ?? '').includes(searchTerm) ||
      (item.nid ?? '').includes(searchTerm) ||
      (item.memberName ?? '').toLowerCase().includes(q) ||
      (item.memberNo ?? '').toLowerCase().includes(q)
    );
  });

  const displayCount = (num: number) => (isBn || useBengaliDigits ? toBengaliNumber(num) : num.toString());

  const exportToExcel = () => {
    const dataToExport = filteredNominees.map(n => ({
      [isBn ? 'নমিনির নাম' : 'Nominee Name']: n.name,
      [isBn ? 'সম্পর্ক' : 'Relation']: n.relation,
      [isBn ? 'অংশ/শতকরা (%)' : 'Percentage (%)']: `${n.percentage}%`,
      [isBn ? 'মোবাইল' : 'Phone']: n.phone || '',
      [isBn ? 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন' : 'NID / Birth Certificate']: n.nid || '',
      [isBn ? 'সদস্যের নাম' : 'Member Name']: n.memberName,
      [isBn ? 'সদস্য নং' : 'Member No']: n.memberNo,
      [isBn ? 'অভিভাবক (যদি থাকে)' : 'Guardian (if minor)']: n.guardianName || 'N/A',
      [isBn ? 'ঠিকানা' : 'Address']: n.address || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, isBn ? 'নমিনি তালিকা' : 'Nominee List');
    XLSX.writeFile(wb, `bondhu_nominees_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleViewMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setActiveTab('members');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'মোট নিবন্ধিত নমিনি' : 'Total Registered Nominees'}</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {displayCount(allNomineeRecords.length)} {isBn ? 'জন' : 'Nominees'}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? `সমিতির ${displayCount(members.length)} জন সদস্যের আইনগত ওয়ারিশ` : `Legal heirs of ${displayCount(members.length)} members`}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'নমিনিযুক্ত সদস্য' : 'Members with Nominees'}</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {displayCount(members.filter(m => (m.nominees || []).length > 0).length)} {isBn ? 'জন' : 'Members'}
          </div>
          <span className="text-xs text-emerald-600 font-medium">
            {Math.round((members.filter(m => (m.nominees || []).length > 0).length / (members.length || 1)) * 100)}% {isBn ? 'কভারেজ' : 'Coverage'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'নাবালক নমিনি' : 'Minor Nominees'}</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {displayCount(allNomineeRecords.filter(n => !!n.guardianName).length)} {isBn ? 'জন' : 'Minors'}
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'আইনগত অভিভাবক নিযুক্ত' : 'Legal Guardians Assigned'}
          </span>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">{isBn ? 'শতকরা শেয়ার বণ্টন' : 'Share Allocations'}</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            ১০০%
          </div>
          <span className="text-xs text-slate-400">
            {isBn ? 'ওয়ারিশ দাবিদার নির্ধারিত' : 'Legal Succession Claim'}
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={isBn ? "নমিনি খুঁজুন (নাম, সম্পর্ক, ফোন, NID, সদস্য নং)..." : "Search nominee (Name, relation, phone, NID, A/C)..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? 'এক্সেল ডাউনলোড' : 'Excel Export'}</span>
          </button>
        </div>
      </div>

      {/* Nominees Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{isBn ? 'নমিনির তথ্য' : 'Nominee Info'}</th>
                <th className="py-3 px-4">{isBn ? 'সম্পর্ক ও শতকরা অংশ' : 'Relation & Share'}</th>
                <th className="py-3 px-4">{isBn ? 'যোগাযোগ ও NID' : 'Contact & NID'}</th>
                <th className="py-3 px-4">{isBn ? 'সংযুক্ত মূল সদস্য' : 'Linked Member'}</th>
                <th className="py-3 px-4 text-right">{isBn ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredNominees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p>{isBn ? 'কোনো নমিনির তথ্য পাওয়া যায়নি।' : 'No nominee records found.'}</p>
                  </td>
                </tr>
              ) : (
                filteredNominees.map((nominee) => (
                  <tr key={nominee.uniqueId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nominee Info with photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={nominee.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={nominee.name}
                          className="w-10 h-10 rounded-full object-cover object-top border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-800">
                            {nominee.name}
                          </div>
                          {nominee.guardianName && (
                            <span className="text-[11px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                              {isBn ? `নাবালক (অভিভাবক: ${nominee.guardianName})` : `Minor (Guardian: ${nominee.guardianName})`}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Relation & Percentage */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{nominee.relation}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {displayCount(nominee.percentage)}%
                        </span>
                      </div>
                    </td>

                    {/* Contact & NID */}
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-700 font-medium">
                        {nominee.phone || (isBn ? 'মোবাইল উল্লেখ নেই' : 'No Phone')}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        NID: {nominee.nid || 'N/A'}
                      </div>
                    </td>

                    {/* Linked Member */}
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => handleViewMember(nominee.memberId)}
                        className="flex items-center gap-2.5 cursor-pointer group"
                      >
                        <img
                          src={nominee.memberPhoto}
                          alt={nominee.memberName}
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-xs text-slate-800 group-hover:text-blue-600 transition-colors block">
                            {nominee.memberName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {nominee.memberNo}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewMember(nominee.memberId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title={isBn ? "সদস্য প্রোফাইল ও নমিনি দেখুন" : "View Member Profile & Nominee"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isBn ? 'প্রোফাইল' : 'Profile'}</span>
                      </button>
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
