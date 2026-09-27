import { useEffect } from 'react';
import { useSomiti } from '../context/SomitiContext';

/**
 * Dynamically updates the browser favicon, apple-touch-icon, and
 * the web application manifest with the current Somiti logo.
 * It renders high-resolution PNG icons (192x192, 512x512, and 512x512 maskable)
 * directly from the current logo taking into account user custom logo adjustments.
 * This guarantees that Chrome, Android WebAPK Builder, and PWABuilder receive
 * the exact current logo as the installed application's icon.
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

    // Render an image into an offscreen canvas with transformations and safe margins
    const renderIconCanvas = (
      img: HTMLImageElement, 
      size: number, 
      isMaskable: boolean
    ): string => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return currentLogo;

      if (isMaskable) {
        // Maskable icon requires solid background and ~15% safe padding
        ctx.fillStyle = '#1b2a59';
        ctx.fillRect(0, 0, size, size);

        const safeSize = size * 0.78;
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.translate(offsetX * (size / 100), offsetY * (size / 100));
        ctx.scale(scale, scale);
        ctx.drawImage(img, -safeSize / 2, -safeSize / 2, safeSize, safeSize);
        ctx.restore();
      } else {
        // Standard icon ('any' purpose): can have transparent background
        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.translate(size / 2, size / 2);
        ctx.translate(offsetX * (size / 100), offsetY * (size / 100));
        ctx.scale(scale, scale);
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      try {
        return canvas.toDataURL('image/png');
      } catch {
        return currentLogo;
      }
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
          icon192 = renderIconCanvas(img, 192, false);
          icon512 = renderIconCanvas(img, 512, false);
          iconMaskable = renderIconCanvas(img, 512, true);
          appleIcon = renderIconCanvas(img, 180, false);
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
    settings?.logoOffsetY
  ]);
}
