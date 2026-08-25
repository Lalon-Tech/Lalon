import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  ArrowRight,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';
import confetti from 'canvas-confetti';
import { useSomiti } from '../../context/SomitiContext';
import { Member } from '../../types';
import { toBengaliNumber } from '../../utils/bengaliUtils';

export const ExcelImportView: React.FC = () => {
  const { addMember, setActiveTab } = useSomiti();
  const [parsedMembers, setParsedMembers] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData = XLSX.utils.sheet_to_json(ws);

        const formatted = rawData.map((row: any, idx: number) => ({
          name: row['নাম'] || row['Name'] || `সদস্য ${idx + 1}`,
          nameEn: row['ইংরেজি নাম'] || row['NameEn'] || '',
          phone: String(row['মোবাইল'] || row['Phone'] || '01700000000'),
          nid: String(row['NID'] || row['জাতীয় পরিচয়পত্র'] || `1990${idx}123456`),
          occupation: row['পেশা'] || row['Occupation'] || 'ব্যবসায়ী',
          shareCount: Number(row['শেয়ার'] || row['Shares'] || 20),
          shareValue: Number(row['শেয়ার মূল্য'] || row['ShareValue'] || 2000),
          generalSavingsBalance: Number(row['সাধারণ সঞ্চয়'] || row['Savings'] || 1000),
          presentAddress: row['ঠিকানা'] || row['Address'] || 'ঢাকা',
        }));

        setParsedMembers(formatted);
      } catch (err) {
        alert('এক্সেল ফাইল প্রসেস করতে সমস্যা হয়েছে। অনুগ্রহ করে সঠিক ফরম্যাটের ফাইল নির্বাচন করুন।');
      }
    };

    reader.readAsBinaryString(file);
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        'নাম': 'মোঃ সাইদুর রহমান',
        'ইংরেজি নাম': 'MD SAYDUR RAHMAN',
        'মোবাইল': '01711223344',
        'জাতীয় পরিচয়পত্র': '19922695544332211',
        'পেশা': 'ফার্মেসি ব্যবসায়ী',
        'শেয়ার': 50,
        'শেয়ার মূল্য': 5000,
        'সাধারণ সঞ্চয়': 3000,
        'ঠিকানা': 'বাড়ি #১২, রোড #০৫, সেক্টর #০৩, উত্তরা, ঢাকা',
      },
      {
        'নাম': 'শারমিন জাহান সুমি',
        'ইংরেজি নাম': 'SHARMIN JAHAN SUMI',
        'মোবাইল': '01822334455',
        'জাতীয় পরিচয়পত্র': '19952697788990011',
        'পেশা': 'শিক্ষিকা',
        'শেয়ার': 30,
        'শেয়ার মূল্য': 3000,
        'সাধারণ সঞ্চয়': 2500,
        'ঠিকানা': 'মিরপুর-১০, ঢাকা',
      },
      {
        'নাম': 'আব্দুল করিম পাটোয়ারী',
        'ইংরেজি নাম': 'ABDUL KARIM PATWARY',
        'মোবাইল': '01933445566',
        'জাতীয় পরিচয়পত্র': '19882691122334455',
        'পেশা': 'আমদানি-রপ্তানি ব্যবসায়ী',
        'শেয়ার': 100,
        'শেয়ার মূল্য': 10000,
        'সাধারণ সঞ্চয়': 5000,
        'ঠিকানা': 'মতিঝিল বা/এ, ঢাকা',
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'নমুনা সদস্য তালিকা');
    XLSX.writeFile(wb, 'sample_bondhu_members_template.xlsx');
  };

  const handleImportAll = () => {
    if (parsedMembers.length === 0) return;

    setIsProcessing(true);
    let count = 0;

    parsedMembers.forEach((item) => {
      addMember({
        name: item.name,
        nameEn: item.nameEn,
        phone: item.phone,
        nid: item.nid,
        dob: '1995-01-01',
        gender: 'male',
        fatherName: 'তথ্য নেই',
        motherName: 'তথ্য নেই',
        presentAddress: item.presentAddress,
        permanentAddress: item.presentAddress,
        occupation: item.occupation,
        monthlyIncome: 30000,
        joiningDate: new Date().toISOString().split('T')[0],
        status: 'active',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        shareCount: item.shareCount,
        shareValue: item.shareValue,
        admissionFee: 500,
        nominees: [],
      });
      count++;
    });

    setIsProcessing(false);
    setSuccessCount(count);

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (_) {}
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                এক্সেলে সংরক্ষিত পুরাতন সদস্য ডাটাবেজ ইমপোর্ট (Excel Import)
              </h2>
              <p className="text-xs text-slate-500">
                এক ক্লিকে সকল সদস্যের নাম, ফোন, NID, শেয়ার ও সঞ্চয় হিসাব ডাটাবেজে অন্তর্ভুক্ত করুন
              </p>
            </div>
          </div>

          <button
            onClick={downloadSampleExcel}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors w-fit shrink-0"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>নমুনা এক্সেল টেমপ্লেট ডাউনলোড</span>
          </button>
        </div>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl p-8 text-center transition-all cursor-pointer relative">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200">
              <UploadCloud className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">
              এক্সেল ফাইল এখানে ড্র্যাগ করুন অথবা ক্লিক করে সিলেক্ট করুন
            </h4>
            <p className="text-xs text-slate-500">
              সমর্থিত ফাইল ফরম্যাট: .xlsx, .xls, .csv
            </p>
            {fileName && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                <FileCheck className="w-4 h-4" />
                <span>নির্বাচিত ফাইল: {fileName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successCount !== null && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <div>
              <h4 className="font-bold text-emerald-900 text-sm">
                অভিনন্দন! মোট {toBengaliNumber(successCount)} জন সদস্য সফলভাবে ডাটাবেজে যুক্ত হয়েছে।
              </h4>
              <p className="text-xs text-emerald-700">
                সকল সদস্যকে সদস্য তালিকায় দেখতে নিচে ক্লিক করুন।
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('members')}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <span>সদস্য তালিকা দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Preview Table */}
      {parsedMembers.length > 0 && successCount === null && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              এক্সেল থেকে প্রাপ্ত সদস্য প্রাকদর্শন ({toBengaliNumber(parsedMembers.length)} জন)
            </h3>
            <button
              onClick={handleImportAll}
              disabled={isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Database className="w-4 h-4" />
              <span>{isProcessing ? 'ডাটাবেজে সেভ হচ্ছে...' : 'সকল ডাটা সেভ করুন ✓'}</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">নাম (বাংলা ও ইংরেজি)</th>
                  <th className="py-2.5 px-3">মোবাইল</th>
                  <th className="py-2.5 px-3">জাতীয় পরিচয়পত্র</th>
                  <th className="py-2.5 px-3">পেশা</th>
                  <th className="py-2.5 px-3 text-center">শেয়ার</th>
                  <th className="py-2.5 px-3 text-right">শেয়ার মূল্য</th>
                  <th className="py-2.5 px-3">ঠিকানা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedMembers.map((m, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {m.name}
                      {m.nameEn && <span className="block text-[10px] text-slate-400 font-normal">{m.nameEn}</span>}
                    </td>
                    <td className="py-2 px-3">{m.phone}</td>
                    <td className="py-2 px-3 font-mono">{m.nid}</td>
                    <td className="py-2 px-3">{m.occupation}</td>
                    <td className="py-2 px-3 text-center font-bold">{toBengaliNumber(m.shareCount)}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">৳ {m.shareValue}</td>
                    <td className="py-2 px-3 truncate max-w-xs">{m.presentAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
