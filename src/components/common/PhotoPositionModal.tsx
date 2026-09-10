import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Check, 
  Move, 
  User, 
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { cropAndPositionImage, loadImage } from '../../utils/imageUtils';

interface PhotoPositionModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
  title?: string;
}

export const PhotoPositionModal: React.FC<PhotoPositionModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  title = 'ছবি পজিশনিং ও ক্রপ (Photo Positioning & Quality)',
}) => {
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [imgNaturalSize, setImgNaturalSize] = useState<{ width: number; height: number }>({ width: 400, height: 400 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const VIEWPORT_SIZE = 280; // Size of square preview frame in pixels

  // Load natural dimensions & apply smart head/face focus on mount
  useEffect(() => {
    if (!imageSrc) return;

    let isMounted = true;
    loadImage(imageSrc).then((img) => {
      if (!isMounted) return;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setImgNaturalSize({ width: w, height: h });

      // If portrait photo (height > width), automatically apply head focus so head isn't cut off!
      if (h > w) {
        const baseScale = VIEWPORT_SIZE / w;
        const drawH = h * baseScale;
        // Shift down slightly so top/head is clearly visible inside viewport
        const initialPanY = Math.min(60, (drawH - VIEWPORT_SIZE) * 0.35);
        setPanY(initialPanY);
      } else {
        setPanY(0);
      }
      setPanX(0);
      setZoom(1.0);
    }).catch(() => {
      // Fallback
    });

    return () => {
      isMounted = false;
    };
  }, [imageSrc]);

  if (!isOpen || !imageSrc) return null;

  // Calculate base scale to cover viewport
  const baseScale = Math.max(VIEWPORT_SIZE / imgNaturalSize.width, VIEWPORT_SIZE / imgNaturalSize.height);
  const currentScale = baseScale * zoom;
  const drawWidth = imgNaturalSize.width * currentScale;
  const drawHeight = imgNaturalSize.height * currentScale;

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Allow generous bounds so user can position freely
    setPanX(Math.max(-250, Math.min(250, newX)));
    setPanY(Math.max(-250, Math.min(250, newY)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    setPanX(Math.max(-250, Math.min(250, newX)));
    setPanY(Math.max(-250, Math.min(250, newY)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Quick Preset Actions
  const handleHeadFocusPreset = () => {
    setZoom(1.1);
    setPanX(0);
    if (imgNaturalSize.height > imgNaturalSize.width) {
      const drawH = imgNaturalSize.height * (VIEWPORT_SIZE / imgNaturalSize.width) * 1.1;
      setPanY(Math.min(80, (drawH - VIEWPORT_SIZE) * 0.4));
    } else {
      setPanY(25);
    }
  };

  const handleCenterPreset = () => {
    setPanX(0);
    setPanY(0);
  };

  const handleResetPreset = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
  };

  // Generate high-resolution cropped base64 output
  const handleApply = async () => {
    try {
      setIsProcessing(true);
      // Map viewport panX/panY to high-res 800x800 output canvas
      const outputScale = 800 / VIEWPORT_SIZE;
      const finalCropped = await cropAndPositionImage({
        src: imageSrc,
        zoom,
        panX: panX * outputScale,
        panY: panY * outputScale,
        outputSize: 800,
        quality: 0.92,
      });

      onSave(finalCropped);
      onClose();
    } catch (err: any) {
      alert(err.message || 'ছবি প্রসেস করতে ব্যর্থ হয়েছে');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600/30 rounded-lg text-blue-400">
              <Move className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">
                মাথা যাতে কেটে না যায় সেজন্য ড্র্যাগ করে পজিশন ঠিক করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Viewport Frame with Touch/Mouse Drag */}
          <div className="flex flex-col items-center">
            <div
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
              className={`relative overflow-hidden rounded-2xl bg-slate-900 border-2 shadow-inner select-none cursor-grab active:cursor-grabbing ${
                isDragging ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-slate-300'
              }`}
            >
              {/* Render Image with Pan & Zoom */}
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  width: `${drawWidth}px`,
                  height: `${drawHeight}px`,
                  left: `calc(50% + ${panX}px)`,
                  top: `calc(50% + ${panY}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute max-w-none pointer-events-none transition-none will-change-transform"
              />

              {/* Passport Photo Circular Guide Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Circular Mask Outline */}
                <div 
                  className="w-[230px] h-[230px] rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] flex items-center justify-center"
                >
                  {/* Subtle Rule-of-Thirds Grid */}
                  <div className="w-full h-full rounded-full grid grid-cols-3 grid-rows-3 border border-white/20">
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-b border-white/15"></div>
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-r border-b border-white/15"></div>
                    <div className="border-b border-white/15"></div>
                  </div>
                </div>
              </div>

              {/* Overlay Guidance Pill */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-xs">
                <Move className="w-3 h-3 text-blue-400 animate-pulse" />
                <span>ছবি টেনে পজিশন করুন (Drag to Pan)</span>
              </div>

              {/* Quality Badge */}
              <div className="absolute bottom-2 right-2 bg-emerald-950/80 backdrop-blur-xs border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>HD 800x800px ক্লিয়ার</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2 text-center">
              গোল ফ্রেমের মধ্যে মাথা ও মুখমণ্ডল সুন্দরভাবে রেখে পজিশন করুন
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-700 block">
              দ্রুত পজিশন প্রিসেট (১-ক্লিক ফোকাস):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleHeadFocusPreset}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer hover:shadow-xs active:scale-98"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>মাথা/মুখ ফোকাস</span>
              </button>

              <button
                type="button"
                onClick={handleCenterPreset}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer hover:shadow-xs active:scale-98"
              >
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                <span>মাঝামাঝি</span>
              </button>

              <button
                type="button"
                onClick={handleResetPreset}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer hover:shadow-xs active:scale-98"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>রিসেট</span>
              </button>
            </div>
          </div>

          {/* Adjustment Sliders & Steppers */}
          <div className="space-y-3.5">
            {/* Zoom Control Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                  <span>জুম ইন / আউট (Zoom):</span>
                </span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                  {zoom.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.max(1.0, +(prev - 0.1).toFixed(2)))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  title="জুম কমান"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setZoom((prev) => Math.min(3.0, +(prev + 0.1).toFixed(2)))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                  title="জুম বাড়ান"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Vertical Pan (মাথা / উচ্চতা পজিশন) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                  <span>মাথা / উচ্চতা পজিশন (Vertical Pan):</span>
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {panY > 0 ? `+${Math.round(panY)}px (নিচে)` : `${Math.round(panY)}px (উপরে)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPanY((prev) => Math.max(-250, prev - 15))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  title="উপরে তুলুন"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  <span>উপরে</span>
                </button>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="5"
                  value={panY}
                  onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setPanY((prev) => Math.min(200, prev + 15))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  title="নিচে নামান"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>নিচে</span>
                </button>
              </div>
            </div>

            {/* Horizontal Pan (ডানে-বামে পজিশন) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                  <span>ডানে - বামে পজিশন (Horizontal Pan):</span>
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {panX > 0 ? `+${Math.round(panX)}px (ডানে)` : `${Math.round(panX)}px (বামে)`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPanX((prev) => Math.max(-200, prev - 15))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  title="বামে সরান"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>বামে</span>
                </button>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  step="5"
                  value={panX}
                  onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                  className="flex-1 accent-teal-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setPanX((prev) => Math.min(200, prev + 15))}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  title="ডানে সরান"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>ডানে</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
          >
            {isProcessing ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>প্রসেস হচ্ছে...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>পজিশন সংরক্ষণ করুন ✓</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
