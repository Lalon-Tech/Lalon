/**
 * Utility functions for handling image uploads, resizing, and base64 conversions.
 */

export const resizeImageFileToBase64 = (
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if valid image
    if (!file.type.startsWith('image/')) {
      reject(new Error('দয়া করে একটি ছবি (Image) ফাইল নির্বাচন করুন।'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Draw on canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => {
        reject(new Error('ছবি লোড করতে সমস্যা হয়েছে।'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = (err) => {
      reject(new Error('ফাইল পড়তে সমস্যা হয়েছে।'));
    };

    reader.readAsDataURL(file);
  });
};
