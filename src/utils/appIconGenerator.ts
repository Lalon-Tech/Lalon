/**
 * Utility to generate production-ready PWA and mobile app icons (192x192, 512x512, maskable, apple-touch)
 * directly from any user-uploaded image, matching their custom scale, offset, shape, and aspect ratio.
 */

export interface RenderIconOptions {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
  shape?: 'circle' | 'rounded' | 'square';
  bgColor?: string;
  padding?: number;
  isMaskable?: boolean;
  isApple?: boolean;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
  const shape = options.shape ?? 'circle';
  const bgColor = options.bgColor || '#ffffff';
  const paddingPercent = Math.max(0, Math.min(30, options.padding ?? 0));
  const isMaskable = Boolean(options.isMaskable);
  const isApple = Boolean(options.isApple);

  // Calculate natural aspect ratio to match CSS object-contain
  const imgW = img.naturalWidth || img.width || 1;
  const imgH = img.naturalHeight || img.height || 1;
  const imgAspect = imgW / imgH;

  if (isMaskable) {
    // Fill full canvas with background color for maskable icons
    ctx.fillStyle = bgColor && bgColor !== 'transparent' ? bgColor : '#ffffff';
    ctx.fillRect(0, 0, size, size);

    if (shape === 'circle') {
      // Circle fills 96% of the canvas (radius = size * 0.48) to maximize visibility and avoid tiny zoomed-out look
      const safeRadius = Math.floor(size * 0.48);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, safeRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = bgColor && bgColor !== 'transparent' ? bgColor : '#ffffff';
      ctx.fill();
      ctx.clip();

      const drawSize = (safeRadius * 2) * (1 - paddingPercent / 100);
      let baseW = drawSize;
      let baseH = drawSize;
      if (imgAspect >= 1) {
        baseH = drawSize / imgAspect;
      } else {
        baseW = drawSize * imgAspect;
      }

      ctx.translate(size / 2, size / 2);
      ctx.translate((offsetX * size) / 100, (offsetY * size) / 100);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();

      // Border ring
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, safeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.lineWidth = Math.max(2, size * 0.012);
      ctx.stroke();
    } else {
      const safeSize = size * 0.90 * (1 - paddingPercent / 100);
      let baseW = safeSize;
      let baseH = safeSize;
      if (imgAspect >= 1) {
        baseH = safeSize / imgAspect;
      } else {
        baseW = safeSize * imgAspect;
      }

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.translate((offsetX * size) / 100, (offsetY * size) / 100);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();
    }
  } else {
    // Standard icon (purpose: "any"): 100% transparent outside circle so Chrome and mobile launchers display a true floating circle
    if (isApple) {
      // iOS Safari does not support alpha channel in apple-touch-icon (turns black)
      ctx.fillStyle = bgColor && bgColor !== 'transparent' ? bgColor : '#ffffff';
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.clearRect(0, 0, size, size);
    }

    if (shape === 'circle') {
      const radius = Math.floor(size / 2) - 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      ctx.closePath();
      if (bgColor && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fill();
      ctx.clip();

      const drawSize = size * (1 - paddingPercent / 100);
      let baseW = drawSize;
      let baseH = drawSize;
      if (imgAspect >= 1) {
        baseH = drawSize / imgAspect;
      } else {
        baseW = drawSize * imgAspect;
      }

      ctx.translate(size / 2, size / 2);
      ctx.translate((offsetX * size) / 100, (offsetY * size) / 100);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();

      // Sleek vibrant circular border ring
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.lineWidth = Math.max(2, size * 0.012);
      ctx.stroke();
    } else if (shape === 'rounded') {
      const cornerRadius = size * 0.22;
      const pad = size * 0.02;
      const w = size - pad * 2;
      ctx.save();
      drawRoundedRectPath(ctx, pad, pad, w, w, cornerRadius);
      if (bgColor && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fill();
      ctx.clip();

      const drawSize = size * (1 - paddingPercent / 100);
      let baseW = drawSize;
      let baseH = drawSize;
      if (imgAspect >= 1) {
        baseH = drawSize / imgAspect;
      } else {
        baseW = drawSize * imgAspect;
      }

      ctx.translate(size / 2, size / 2);
      ctx.translate((offsetX * size) / 100, (offsetY * size) / 100);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();

      // Rounded border
      ctx.save();
      drawRoundedRectPath(ctx, pad, pad, w, w, cornerRadius);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = Math.max(2, size * 0.014);
      ctx.stroke();
      ctx.restore();
    } else {
      // Square
      if (bgColor && bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
      }
      const drawSize = size * (1 - paddingPercent / 100);
      let baseW = drawSize;
      let baseH = drawSize;
      if (imgAspect >= 1) {
        baseH = drawSize / imgAspect;
      } else {
        baseW = drawSize * imgAspect;
      }

      ctx.save();
      ctx.translate(size / 2, size / 2);
      ctx.translate((offsetX * size) / 100, (offsetY * size) / 100);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      ctx.restore();
    }
  }

  try {
    return canvas.toDataURL('image/png');
  } catch {
    return img.src;
  }
}

export async function generateAppIconPackage(
  logoUrl: string,
  options: { 
    scale?: number; 
    offsetX?: number; 
    offsetY?: number; 
    shape?: 'circle' | 'rounded' | 'square';
    bgColor?: string;
    padding?: number;
  } = {}
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
    const appleIcon = renderAppIconCanvas(img, 180, { ...options, isMaskable: false, isApple: true });

    return { icon192, icon512, iconMaskable, appleIcon };
  } catch (err) {
    console.warn('Failed to generate icon package:', err);
    return null;
  }
}

export async function syncLogoAssetsToServer(
  logoUrl: string,
  options: { 
    scale?: number; 
    offsetX?: number; 
    offsetY?: number; 
    shape?: 'circle' | 'rounded' | 'square';
    bgColor?: string;
    padding?: number;
  } = {}
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
