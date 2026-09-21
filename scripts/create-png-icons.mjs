import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, isMaskable = false) {
  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Base gradient: Emerald #047857 to Deep Teal #0d9488
      const t = (x + y) / (width + height);
      let r = Math.round(4 + t * (13 - 4));
      let g = Math.round(120 + t * (148 - 120));
      let b = Math.round(87 + t * (136 - 87));
      let a = 255;

      // Rounded corners if not maskable
      if (!isMaskable) {
        const cornerR = width * 0.22;
        const cornerDistX = Math.max(0, Math.abs(dx) - (width / 2 - cornerR));
        const cornerDistY = Math.max(0, Math.abs(dy) - (height / 2 - cornerR));
        if (cornerDistX > 0 && cornerDistY > 0) {
          const cornerDist = Math.sqrt(cornerDistX * cornerDistX + cornerDistY * cornerDistY);
          if (cornerDist > cornerR) {
            a = 0;
          } else if (cornerDist > cornerR - 1.5) {
            a = Math.round(255 * (cornerR - cornerDist) / 1.5);
          }
        }
      }

      if (a > 0) {
        // Subtle concentric circle pattern
        const ring1 = Math.abs(dist - width * 0.41);
        const ring2 = Math.abs(dist - width * 0.34);
        if (ring1 < 2) {
          r = Math.min(255, r + 40);
          g = Math.min(255, g + 40);
          b = Math.min(255, b + 40);
        } else if (ring2 < 1.5) {
          r = Math.min(255, r + 25);
          g = Math.min(255, g + 25);
          b = Math.min(255, b + 25);
        }

        // Center emblem shield
        const sy = (y - height * 0.2) / (height * 0.6); // 0 to 1
        const sx = Math.abs(x - cx) / (width * 0.5);   // 0 to 1
        if (sy >= 0 && sy <= 1 && sx <= 0.55) {
          // Shield contour
          const shieldWidthAtY = sy < 0.3 ? 0.52 : (0.52 * (1 - Math.pow((sy - 0.3) / 0.7, 1.4)));
          if (sx <= shieldWidthAtY) {
            // Inside shield
            const isBorder = sx > shieldWidthAtY - 0.04 || sy < 0.04;
            if (isBorder) {
              r = 255; g = 255; b = 255; // White border
            } else {
              // Inner shield teal
              r = 15; g = 118; b = 110;
              
              // Gold coin in upper center
              const coinDx = x - cx;
              const coinDy = y - (height * 0.42);
              const coinDist = Math.sqrt(coinDx * coinDx + coinDy * coinDy);
              const coinR = width * 0.09;
              if (coinDist <= coinR) {
                if (coinDist >= coinR - 2) {
                  r = 254; g = 243; b = 199; // White-gold edge
                } else {
                  r = 245; g = 158; b = 11; // Gold coin
                }
              }

              // Hands / prosperity leaf in lower center
              const leafDy = y - (height * 0.58);
              const leafDx = Math.abs(x - cx);
              if (leafDy >= 0 && leafDy <= height * 0.14 && leafDx <= width * 0.16) {
                if (leafDx <= width * 0.08) {
                  r = 255; g = 255; b = 255;
                } else {
                  r = 52; g = 211; b = 153; // Mint green
                }
              }
            }
          }
        }
      }

      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }

  return encodePng(width, height, rgba);
}

// Minimal standard PNG encoder with zlib
function encodePng(width, height, rgba) {
  // Raw scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    scanlines[rowOffset] = 0; // Filter: None
    rgba.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines, { level: 9 });

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression method
  ihdr[11] = 0; // Filter method
  ihdr[12] = 0; // Interlace method

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(calculateCrc(body), 0);

  return Buffer.concat([len, body, crc]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');

// Generate 192x192
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));

// Generate 512x512
console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));

// Generate 512x512 maskable (no rounded corner clipping, full-bleed)
console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));

// Generate apple-touch-icon 180x180
console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));

console.log('All PWA icons generated successfully in public/');
