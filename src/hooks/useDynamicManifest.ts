import { useEffect } from 'react';
import { useSomiti } from '../context/SomitiContext';

/**
 * Dynamically updates the browser favicon, apple-touch-icon, and
 * the web application manifest with the current Somiti logo.
 * When the user updates the logo in Settings, this updates the runtime manifest
 * so browsers that support dynamic Web Manifest updates can refresh the installed icon.
 */
export function useDynamicManifest() {
  const { settings } = useSomiti();

  useEffect(() => {
    const currentLogo = settings?.logoUrl || '/icon.svg';
    const somitiName = settings?.somitiName || 'বন্ধু সমবায় সমিতি লিমিটেড';
    const shortName = settings?.somitiName?.split(' ')?.[0] || 'বন্ধু সমিতি';

    // 1. Update Favicon and Apple Touch Icon in DOM
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel~="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    updateLinkTag('icon', currentLogo);
    updateLinkTag('apple-touch-icon', currentLogo);

    // 2. Dynamically generate and inject Manifest Blob if custom logo exists
    try {
      const dynamicManifest = {
        id: '/',
        name: `${somitiName} - সফটওয়্যার`,
        short_name: shortName,
        description: `${somitiName} - সঞ্চয়, ঋণ, কিস্তি এবং আর্থিক হিসাব ব্যবস্থাপনা`,
        theme_color: '#1b2a59',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: currentLogo,
            sizes: '192x192 512x512',
            type: currentLogo.endsWith('.svg') || currentLogo.startsWith('data:image/svg') 
              ? 'image/svg+xml' 
              : 'image/png',
            purpose: 'any maskable'
          }
        ]
      };

      const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
        type: 'application/manifest+json'
      });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      // Find or create dynamic manifest link
      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;

      return () => {
        URL.revokeObjectURL(manifestUrl);
      };
    } catch (e) {
      console.warn('Could not inject dynamic manifest:', e);
    }
  }, [settings?.logoUrl, settings?.somitiName]);
}
