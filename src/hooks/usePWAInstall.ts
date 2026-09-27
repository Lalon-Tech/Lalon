import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Global cached prompt to prevent losing the event if it fired before hook mounted
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
let globalIsInstalled = false;

if (typeof window !== 'undefined') {
  // Capture standalone display mode immediately
  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  ) {
    globalIsInstalled = true;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa-deferred-prompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    globalIsInstalled = true;
    globalDeferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed-success'));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(() => globalIsInstalled);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone || globalIsInstalled);

    // Detect user platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    const handlePromptReady = () => {
      setDeferredPrompt(globalDeferredPrompt);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-deferred-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pwa-installed-success', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-deferred-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pwa-installed-success', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    if (!promptToUse) {
      return false;
    }
    try {
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        globalIsInstalled = true;
        globalDeferredPrompt = null;
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.warn('PWA install prompt error:', err);
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: Boolean(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    install,
    deferredPrompt: deferredPrompt || globalDeferredPrompt
  };
}

