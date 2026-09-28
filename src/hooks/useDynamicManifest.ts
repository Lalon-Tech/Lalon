import { useEffect } from 'react';
import { useSomiti } from '../context/SomitiContext';
import { renderAppIconCanvas } from '../utils/appIconGenerator';

/**
 * Dynamically updates the browser favicon, apple-touch-icon, and
 * the web application manifest with the current Somiti logo and selected shape (Circle, Rounded, Square).
 * It renders high-resolution PNG icons (192x192, 512x512, and 512x512 maskable)
 * directly from the current logo taking into account user custom logo adjustments and shape.
 */
export function useDynamicManifest() {
  const { settings } = useSomiti();

  useEffect(() => {
    let isCancelled = false;
    let createdBlobUrl: string | null = null;

    const currentLogo = settings?.logoUrl || '/logo.png';
    const scale = settings?.logoScale ?? 1.0;
    const offsetX = settings?.logoOffsetX ?? 0;
    const offsetY = settings?.logoOffsetY ?? 0;
    const shape = settings?.logoShape ?? 'circle';
    const bgColor = settings?.logoBgColor || '#ffffff';
    const padding = settings?.logoPadding ?? 0;

    // Helper to update DOM link tags
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel~="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    const processIcons = async () => {
      const v = Date.now();
      let icon192 = `/pwa-192x192.png?v=${v}`;
      let appleIcon = `/apple-touch-icon.png?v=${v}`;

      // If user uploaded a custom dynamic image (e.g. data URL or custom path), generate on canvas
      if (currentLogo && currentLogo.startsWith('data:')) {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const imageLoaded = new Promise<boolean>((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });

        img.src = currentLogo;
        const loaded = await imageLoaded;
        if (isCancelled) return;

        if (loaded) {
          try {
            icon192 = renderAppIconCanvas(img, 192, { scale, offsetX, offsetY, shape, bgColor, padding, isMaskable: false });
            appleIcon = renderAppIconCanvas(img, 180, { scale, offsetX, offsetY, shape, bgColor, padding, isApple: true, isMaskable: false });
          } catch {
            icon192 = `/pwa-192x192.png?v=${v}`;
            appleIcon = `/apple-touch-icon.png?v=${v}`;
          }
        }
      }

      if (isCancelled) return;

      // 1. Update Favicon & Apple Touch Icon in DOM
      updateLinkTag('icon', icon192);
      updateLinkTag('apple-touch-icon', appleIcon);

      // 2. Ensure real static manifest is used (never blob: URLs which fail Chrome WebAPK installation)
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = `/manifest.webmanifest?v=3`;
    };

    processIcons();

    return () => {
      isCancelled = true;
    };
  }, [
    settings?.logoUrl, 
    settings?.somitiName, 
    settings?.logoScale, 
    settings?.logoOffsetX, 
    settings?.logoOffsetY,
    settings?.logoShape,
    settings?.logoPadding,
    settings?.logoBgColor
  ]);
}
