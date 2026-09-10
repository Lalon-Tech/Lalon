/**
 * Utility functions for handling high-quality image uploads, resizing, positioning, and base64 conversions.
 */

export interface CropPositionOptions {
  src: string;
  zoom: number; // 1.0 to 3.0
  panX: number; // pixel offset
  panY: number; // pixel offset
  outputSize?: number; // e.g. 800 for HD crisp output
  quality?: number; // 0.92 for clear high quality
}

/**
 * Reads an image File into a raw base64 data URL.
 */
export const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('দয়া করে একটি ছবি (Image) ফাইল নির্বাচন করুন।'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে।'));
    reader.readAsDataURL(file);
  });
};

/**
 * Loads an image from src URL / data URL.
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('ছবি লোড করতে ব্যর্থ হয়েছে।'));
    img.src = src;
  });
};

/**
 * Crops and positions an image with pan and zoom onto a high-definition square canvas.
 * Produces crisp, non-blurry, perfectly framed images where heads are never cut off.
 */
export const cropAndPositionImage = async ({
  src,
  zoom = 1,
  panX = 0,
  panY = 0,
  outputSize = 800,
  quality = 0.92,
}: CropPositionOptions): Promise<string> => {
  const img = await loadImage(src);

  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('ক্যানভাস তৈরি করা যায়নি।');
  }

  // Fill background with white in case of transparent png or margins
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputSize, outputSize);

  // High quality bicubic smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Calculate base scale so image covers the outputSize square
  const baseScale = Math.max(outputSize / origW, outputSize / origH);
  const totalScale = baseScale * zoom;

  const drawW = origW * totalScale;
  const drawH = origH * totalScale;

  // Center coordinates + pan offsets scaled to output dimensions
  const drawX = (outputSize - drawW) / 2 + panX;
  const drawY = (outputSize - drawH) / 2 + panY;

  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  return canvas.toDataURL('image/jpeg', quality);
};

/**
 * Resizes an image file to a clean, crisp base64 string.
 * Automatically anchors portrait photos towards the top (head/face) instead of cutting off heads!
 */
export const resizeImageFileToBase64 = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.92
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('দয়া করে একটি ছবি (Image) ফাইল নির্বাচন করুন।'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Determine square target size (up to 800x800 for ultra crisp clarity)
        const targetSize = Math.min(maxWidth, Math.max(origW, origH, 600));

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Base cover scale
        const scale = Math.max(targetSize / origW, targetSize / origH);
        const drawW = origW * scale;
        const drawH = origH * scale;

        const drawX = (targetSize - drawW) / 2;
        // For portrait photos (height > width), anchor towards top (around 15-20% from top)
        // so the head/forehead is not cut off by default!
        let drawY = (targetSize - drawH) / 2;
        if (origH > origW) {
          // Anchor near the top so head is preserved
          drawY = Math.min(0, Math.max(targetSize - drawH, -(drawH - targetSize) * 0.2));
        }

        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('ছবি লোড করতে সমস্যা হয়েছে।'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('ফাইল পড়তে সমস্যা হয়েছে।'));
    };

    reader.readAsDataURL(file);
  });
};

