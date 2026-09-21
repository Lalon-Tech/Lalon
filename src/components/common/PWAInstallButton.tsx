import React from 'react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'modal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = () => {
  // Install app option and popup completely disabled as requested by user
  return null;
};
