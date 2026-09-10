import React, { useState, useRef } from 'react';
import { Camera, Upload, Link, Check, RefreshCw, X, Image as ImageIcon, Move, Sliders, Sparkles } from 'lucide-react';
import { resizeImageFileToBase64, readFileAsDataUrl } from '../../utils/imageUtils';
import { PhotoPositionModal } from './PhotoPositionModal';

interface PhotoUploadFieldProps {
  label: string;
  value: string;
  onChange: (photoUrl: string) => void;
  presetAvatars?: string[];
  helperText?: string;
}

const DEFAULT_SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=85',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=85',
];

export const PhotoUploadField: React.FC<PhotoUploadFieldProps> = ({
  label,
  value,
  onChange,
  presetAvatars = DEFAULT_SAMPLE_AVATARS,
  helperText = 'ডিভাইস থেকে ছবি আপলোড করুন অথবা নিচের স্যাম্পল ছবি নির্বাচন করুন',
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPositionModal, setShowPositionModal] = useState<boolean>(false);
  const [rawImageForPosition, setRawImageForPosition] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Read raw file as Data URL first
      const rawDataUrl = await readFileAsDataUrl(file);
      setRawImageForPosition(rawDataUrl);

      // Also create an immediate high-res top-anchored fallback in case they close modal
      const highResDefault = await resizeImageFileToBase64(file, 800, 800, 0.92);
      onChange(highResDefault);

      // Open interactive positioning editor immediately so user can adjust the head & framing
      setShowPositionModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleOpenCurrentPositioner = () => {
    const currentSrc = value || presetAvatars[0];
    if (currentSrc) {
      setRawImageForPosition(currentSrc);
      setShowPositionModal(true);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              activeMode === 'upload' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ছবি আপলোড
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('presets')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              activeMode === 'presets' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            নমুনা ছবি
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('url')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              activeMode === 'url' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ওয়েব লিংক
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        {/* Preview image and Position button */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 mx-auto sm:mx-0">
          <div className="relative group shrink-0">
            <img
              src={value || presetAvatars[0]}
              alt="Preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-xs bg-white"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              title="নতুন ছবি আপলোড করুন"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Position & Crop Button */}
          <button
            type="button"
            onClick={handleOpenCurrentPositioner}
            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold shadow-2xs hover:border-blue-400 transition-all cursor-pointer active:scale-95"
            title="মাথা যাতে কেটে না যায় তার জন্য পজিশন ও জুম অ্যাডজাস্ট করুন"
          >
            <Move className="w-3 h-3 text-blue-600" />
            <span>পজিশন ঠিক করুন</span>
          </button>
        </div>

        {/* Dynamic upload controller */}
        <div className="flex-1 w-full space-y-2">
          {activeMode === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>
                  {isLoading ? 'ছবি প্রসেস হচ্ছে...' : 'ছবি নির্বাচন করতে ক্লিক করুন বা ড্র্যাগ করুন'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Sparkles className="w-3 h-3" />
                  HD ক্লিয়ার কোয়ালিটি
                </span>
                <span>•</span>
                <span>স্বয়ংক্রিয় পজিশনিং ও ক্রপ সাপোর্ট</span>
              </div>
            </div>
          )}

          {activeMode === 'presets' && (
            <div>
              <p className="text-[11px] text-slate-500 mb-1.5 font-medium">নিচের যেকোনো একটি নির্বাচন করুন:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange(url)}
                    className={`relative rounded-full p-0.5 transition-all cursor-pointer ${
                      value === url
                        ? 'ring-2 ring-blue-600 scale-105 shadow-xs'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Avatar ${idx + 1}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'url' && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                যুক্ত করুন
              </button>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
        <span>{helperText}</span>
        <span className="text-blue-600 font-medium">✨ মাথা কাটার হাত থেকে রক্ষা পেতে "পজিশন ঠিক করুন" ব্যবহার করুন</span>
      </div>

      {/* Interactive Photo Positioning & HD Crop Modal */}
      {showPositionModal && rawImageForPosition && (
        <PhotoPositionModal
          isOpen={showPositionModal}
          imageSrc={rawImageForPosition}
          onClose={() => setShowPositionModal(false)}
          onSave={(croppedDataUrl) => {
            onChange(croppedDataUrl);
            setShowPositionModal(false);
          }}
          title={label ? `${label} - পজিশনিং ও ক্রপ` : 'ছবি পজিশনিং ও ক্রপ'}
        />
      )}
    </div>
  );
};

