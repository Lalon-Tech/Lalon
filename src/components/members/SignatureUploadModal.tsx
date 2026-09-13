import React, { useState, useRef } from 'react';
import { Upload, X, Check, FileSignature, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { removeSignatureBackground } from '../../utils/signatureUtils';
import { useLanguage } from '../../context/LanguageContext';
import { Member } from '../../types';

interface SignatureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onSaveSignature: (cleanedDataUrl: string) => Promise<void>;
}

export const SignatureUploadModal: React.FC<SignatureUploadModalProps> = ({
  isOpen,
  onClose,
  member,
  onSaveSignature
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string>('');
  const [cleanedSignature, setCleanedSignature] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !member) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = async (file: File) => {
    setErrorMsg('');
    if (!file.type.startsWith('image/')) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে একটি ছবি ফাইল (JPG, PNG) নির্বাচন করুন।' : 'Please select a valid image file.');
      return;
    }

    setRawFile(file);
    setIsProcessing(true);

    try {
      // 1. Create original preview
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        setOriginalPreview(dataUrl);

        // 2. Automatically remove paper background
        try {
          const transparentPng = await removeSignatureBackground(file);
          setCleanedSignature(transparentPng);
        } catch (err) {
          console.error('Failed to remove background:', err);
          setCleanedSignature(dataUrl); // Fallback to original if processing fails
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setErrorMsg(isBn ? 'স্বাক্ষর ফাইল লোড করতে সমস্যা হয়েছে।' : 'Failed to load signature file.');
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleSave = async () => {
    if (!cleanedSignature) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে প্রথমে স্বাক্ষর আপলোড করুন।' : 'Please upload a signature first.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await onSaveSignature(cleanedSignature);
      onClose();
      // Reset
      setRawFile(null);
      setOriginalPreview('');
      setCleanedSignature('');
    } catch (err: any) {
      setErrorMsg(err?.message || (isBn ? 'স্বাক্ষর সংরক্ষণ করতে সমস্যা হয়েছে।' : 'Failed to save signature.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in-50 zoom-in-95 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileSignature className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {isBn ? 'নমুনা স্বাক্ষর আপলোড / Specimen Signature' : 'Upload Specimen Signature'}
              </h3>
              <p className="text-xs text-indigo-200">
                {member.name} • {member.memberNo}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/70 transition-all rounded-2xl p-6 text-center cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              {isBn 
                ? 'স্বাক্ষরের ছবি নির্বাচন করতে ক্লিক করুন অথবা টেনে এনে ড্রপ করুন' 
                : 'Click to upload signature photo or drag & drop'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {isBn 
                ? 'সাদা কাগজে কলম দিয়ে করা স্বাক্ষরের ছবি বা স্ক্যান কপি আপলোড করুন (JPG, PNG)' 
                : 'Upload photo of signature on white paper (JPG, PNG)'}
            </p>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center gap-3 text-amber-800 text-xs font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>{isBn ? 'স্বাক্ষরের পটভূমি স্বয়ংক্রিয়ভাবে অপসারণ করা হচ্ছে...' : 'Automatically removing paper background...'}</span>
            </div>
          )}

          {/* Cleaned Signature Result Preview */}
          {cleanedSignature && !isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {isBn ? 'স্বচ্ছ পটভূমিসহ চূড়ান্ত নমুনা স্বাক্ষর:' : 'Clean Transparent Signature Preview:'}
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                  {isBn ? 'পটভূমি অপসারিত (Transparent PNG)' : 'Background Removed'}
                </span>
              </div>

              {/* Checkerboard transparency background */}
              <div 
                className="p-5 rounded-xl border border-slate-300 flex items-center justify-center min-h-[100px] shadow-inner"
                style={{
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px), radial-gradient(#cbd5e1 1px, #f8fafc 1px)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 8px 8px'
                }}
              >
                <img 
                  src={cleanedSignature} 
                  alt="Processed Transparent Signature" 
                  className="max-h-24 max-w-full object-contain filter drop-shadow-sm" 
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center">
                {isBn 
                  ? 'কাগজের ছায়া ও পটভূমি মুক্ত হওয়ায় চুক্তিপত্র, সনদ ও রসিদে এই স্বাক্ষর স্বচ্ছভাবে প্রিন্ট হবে।' 
                  : 'Paper background and shadows removed. Will print cleanly on agreements and certificates.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isBn ? 'বাতিল' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!cleanedSignature || isSaving || isProcessing}
            className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isBn ? 'স্বাক্ষর সংরক্ষণ করুন' : 'Save Transparent Signature'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
