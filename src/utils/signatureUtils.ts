/**
 * Signature Background Removal Utility
 * Automatically removes paper background/tint from photographed or scanned signatures,
 * leaving pure ink strokes with a clean transparent background as a PNG Data URL.
 */

export async function removeSignatureBackground(fileOrDataUrl: File | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        // Sample paper background color from the four corners
        let sumR = 0, sumG = 0, sumB = 0, sampleCount = 0;
        const cornerSize = Math.max(2, Math.min(15, Math.floor(canvas.width / 10), Math.floor(canvas.height / 10)));
        
        const sampleBox = (startX: number, startY: number) => {
          for (let y = startY; y < startY + cornerSize && y < canvas.height; y++) {
            for (let x = startX; x < startX + cornerSize && x < canvas.width; x++) {
              const idx = (y * canvas.width + x) * 4;
              sumR += d[idx];
              sumG += d[idx + 1];
              sumB += d[idx + 2];
              sampleCount++;
            }
          }
        };

        sampleBox(0, 0); // top-left
        sampleBox(canvas.width - cornerSize, 0); // top-right
        sampleBox(0, canvas.height - cornerSize); // bottom-left
        sampleBox(canvas.width - cornerSize, canvas.height - cornerSize); // bottom-right

        const bgR = sampleCount > 0 ? sumR / sampleCount : 255;
        const bgG = sampleCount > 0 ? sumG / sampleCount : 255;
        const bgB = sampleCount > 0 ? sumB / sampleCount : 255;
        const bgLuminance = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

        // Dynamic thresholds based on sampled paper tone
        const highCutoff = Math.max(185, bgLuminance - 18);
        const lowCutoff = Math.min(135, bgLuminance - 65);

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Color distance to background paper color
          const distToBg = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

          if (lum >= highCutoff || distToBg < 28) {
            // Paper background -> completely transparent
            d[i + 3] = 0;
          } else if (lum <= lowCutoff) {
            // Dark ink stroke -> completely opaque
            d[i + 3] = 255;
            // Slightly boost contrast of ink
            d[i] = Math.max(0, r - 30);
            d[i + 1] = Math.max(0, g - 30);
            d[i + 2] = Math.max(0, b - 30);
          } else {
            // Smooth anti-aliased gradient on pen stroke edges
            const alphaRatio = (highCutoff - lum) / (highCutoff - lowCutoff);
            d[i + 3] = Math.min(255, Math.max(0, Math.round(alphaRatio * 255)));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(err);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
