/**
 * Utility to generate production-ready PWA and mobile app icons (192x192, 512x512, maskable)
 * directly from any user-uploaded image, matching their custom scale and offset.
 */

export interface RenderIconOptions {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  isMaskable?: boolean;
}

export function renderAppIconCanvas(
  img: HTMLImageElement,
  size: number,
  options: RenderIconOptions = {}
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  const scale = options.scale ?? 1;
  const offsetX = options.offsetX ?? 0;
  const offsetY = options.offsetY ?? 0;
  const isMaskable = Boolean(options.isMaskable);

  if (isMaskable) {
    // Maskable icons require a solid background and ~20% safe zone padding for Android circular/squircle masks
    ctx.fillStyle = '#1b2a59';
    ctx.fillRect(0, 0, size, size);

    const safeSize = size * 0.78;
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.translate((offsetX * size) / 100, (offsetY * size) / 100);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -safeSize / 2, -safeSize / 2, safeSize, safeSize);
    ctx.restore();
  } else {
    // Standard icon: clean background
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.translate((offsetX * size) / 100, (offsetY * size) / 100);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return img.src;
  }
}

export async function generateAppIconPackage(
  logoUrl: string,
  options: { scale?: number; offsetX?: number; offsetY?: number } = {}
): Promise<{ icon192: string; icon512: string; iconMaskable: string; appleIcon: string } | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loaded = await new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = logoUrl;
    });

    if (!loaded) return null;

    const icon192 = renderAppIconCanvas(img, 192, { ...options, isMaskable: false });
    const icon512 = renderAppIconCanvas(img, 512, { ...options, isMaskable: false });
    const iconMaskable = renderAppIconCanvas(img, 512, { ...options, isMaskable: true });
    const appleIcon = renderAppIconCanvas(img, 180, { ...options, isMaskable: false });

    return { icon192, icon512, iconMaskable, appleIcon };
  } catch (err) {
    console.warn('Failed to generate icon package:', err);
    return null;
  }
}

export async function syncLogoAssetsToServer(
  logoUrl: string,
  options: { scale?: number; offsetX?: number; offsetY?: number } = {}
): Promise<boolean> {
  try {
    const icons = await generateAppIconPackage(logoUrl, options);
    if (!icons) return false;

    const res = await fetch('/api/save-logo-assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(icons),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function downloadDataUrlFile(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
