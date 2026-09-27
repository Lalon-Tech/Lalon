import React, { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';
import { AppDownloadModal } from './AppDownloadModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'compact';
  className?: string;
  onOpenModal?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'compact', 
  className = '',
  onOpenModal
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    if (onOpenModal) {
      onOpenModal();
      return;
    }
    // If native prompt is ready, try to invoke it, otherwise open informative download modal
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${className}`}
          title={isBn ? 'অ্যাপ ডাউনলোড ও ইনস্টল করুন' : 'Download & Install App'}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">{isBn ? 'অ্যাপ ডাউনলোড' : 'Download App'}</span>
          <span className="md:hidden">{isBn ? 'অ্যাপ' : 'App'}</span>
        </button>

        <AppDownloadModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{isBn ? 'অ্যাপ ডাউনলোড করুন' : 'Download App'}</span>
      </button>

      <AppDownloadModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};
