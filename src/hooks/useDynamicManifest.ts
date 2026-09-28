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
    const somitiName = settings?.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড';
    const shortName = settings?.somitiName?.split(' ')?.[0] || 'বন্ধু সমিতি';
    const scale = settings?.logoScale ?? 1.97;
    const offsetX = settings?.logoOffsetX ?? 3;
    const offsetY = settings?.logoOffsetY ?? -12;
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
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const imageLoaded = new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });

      img.src = currentLogo;
      const loaded = await imageLoaded;
      if (isCancelled) return;

      let icon192 = '/pwa-192x192.png';
      let icon512 = '/pwa-512x512.png';
      let iconMaskable = '/pwa-maskable-512x512.png';
      let appleIcon = '/apple-touch-icon.png';

      if (loaded) {
        try {
          icon192 = renderAppIconCanvas(img, 192, { scale, offsetX, offsetY, shape, bgColor, padding, isMaskable: false });
          icon512 = renderAppIconCanvas(img, 512, { scale, offsetX, offsetY, shape, bgColor, padding, isMaskable: false });
          iconMaskable = renderAppIconCanvas(img, 512, { scale, offsetX, offsetY, shape, bgColor, padding, isMaskable: true });
          appleIcon = renderAppIconCanvas(img, 180, { scale, offsetX, offsetY, shape, bgColor, padding, isMaskable: false });
        } catch {
          // Fallback to static URLs if canvas export fails
        }
      }

      if (isCancelled) return;

      // 1. Update Favicon & Apple Touch Icon in DOM
      updateLinkTag('icon', icon192);
      updateLinkTag('apple-touch-icon', appleIcon);

      // 2. Build full PWA Manifest conforming to Chrome, Android WebAPK, and PWABuilder standards
      try {
        const dynamicManifest = {
          id: '/',
          name: `${somitiName} - সফটওয়্যার`,
          short_name: shortName,
          description: `${somitiName} - সঞ্চয়, ঋণ, কিস্তি এবং আর্থিক হিসাব ব্যবস্থাপনা`,
          theme_color: '#1b2a59',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: icon192,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: icon512,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: iconMaskable,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        };

        const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
          type: 'application/manifest+json'
        });
        createdBlobUrl = URL.createObjectURL(manifestBlob);

        let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
        if (!manifestLink) {
          manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          document.head.appendChild(manifestLink);
        }
        manifestLink.href = createdBlobUrl;
      } catch (e) {
        console.warn('Could not inject dynamic manifest:', e);
      }
    };

    processIcons();

    return () => {
      isCancelled = true;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
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
