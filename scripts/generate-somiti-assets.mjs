import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');

// 1. Full Logo SVG (Emblem + "বন্ধু সমবায় সমিতি" + "UNITY. GROWTH. TRUST")
const fullLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 620" width="600" height="620">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@600;700;800&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap');
      .somiti-title {
        font-family: 'Hind Siliguri', 'Bangla', sans-serif;
        font-weight: 800;
        font-size: 38px;
        fill: #16244f;
      }
      .somiti-sub {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        font-size: 19px;
        letter-spacing: 5px;
        fill: #22355e;
      }
    </style>
    <filter id="subtle-drop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#16244f" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Group: Circular Emblem (Centered at x=300, y=210) -->
  <g transform="translate(0, 0)" filter="url(#subtle-drop)">
    <!-- Outer Ring Base Layer: Deep Navy Arc -->
    <!-- Arc from top (near 300,55) counter-clockwise through left, bottom, to right-bottom -->
    <path d="M 280 62 
             A 152 152 0 1 0 445 235 
             L 430 231
             A 136 136 0 1 1 285 78
             Z" 
          fill="#1b2a59" />

    <!-- Outer Ring Green Arc (Top-Right section from top to right) -->
    <path d="M 320 62 
             A 152 152 0 0 1 454 195 
             L 439 199 
             A 136 136 0 0 0 315 78 
             Z" 
          fill="#3ba844" />

    <!-- Outer Nodes (Community Member Circles) -->
    <!-- Top Node (Navy) -->
    <circle cx="300" cy="58" r="23" fill="#ffffff" />
    <circle cx="300" cy="58" r="19" fill="#1b2a59" />

    <!-- Left Node (Navy) -->
    <circle cx="148" cy="210" r="23" fill="#ffffff" />
    <circle cx="148" cy="210" r="19" fill="#1b2a59" />

    <!-- Right Node (Vibrant Green) -->
    <circle cx="452" cy="210" r="23" fill="#ffffff" />
    <circle cx="452" cy="210" r="19" fill="#3ba844" />

    <!-- Inner Cooperative Figures & Curved Arms -->
    <!-- Left Navy Figure / Arm & Cuff -->
    <path d="M 276 96 
             C 210 102 165 142 160 210
             C 158 245 174 278 200 300
             C 214 312 232 320 252 320
             C 246 304 246 290 252 278
             C 230 270 208 250 204 224
             C 200 190 226 150 270 135
             C 285 130 292 118 276 96
             Z" 
          fill="#1b2a59" />

    <!-- Right Green Figure / Arm & Cuff -->
    <path d="M 324 96 
             C 390 102 435 142 440 210
             C 442 245 426 278 400 300
             C 386 312 368 320 348 320
             C 354 304 354 290 348 278
             C 370 270 392 250 396 224
             C 400 190 374 150 330 135
             C 315 130 308 118 324 96
             Z" 
          fill="#3ba844" />

    <!-- Center Cooperative Handshake -->
    <!-- Navy Hand (Left side wrapping around) -->
    <path d="M 230 248 
             C 255 240 285 242 296 254
             C 300 258 304 266 302 276
             C 298 290 286 300 270 304
             C 255 308 240 295 236 280
             Z" 
          fill="#1b2a59" />

    <!-- Handshake Fingers (Navy clasping) -->
    <!-- Finger 1 -->
    <rect x="256" y="296" width="13" height="22" rx="6.5" fill="#1b2a59" transform="rotate(-15 262 307)" stroke="#ffffff" stroke-width="2.5" />
    <!-- Finger 2 -->
    <rect x="274" y="304" width="13" height="22" rx="6.5" fill="#1b2a59" transform="rotate(-5 280 315)" stroke="#ffffff" stroke-width="2.5" />
    <!-- Finger 3 -->
    <rect x="293" y="305" width="13" height="22" rx="6.5" fill="#1b2a59" transform="rotate(10 299 316)" stroke="#ffffff" stroke-width="2.5" />
    <!-- Finger 4 -->
    <rect x="312" y="298" width="13" height="20" rx="6.5" fill="#1b2a59" transform="rotate(25 318 308)" stroke="#ffffff" stroke-width="2.5" />

    <!-- Green Hand & Fingers (Right side grasping) -->
    <path d="M 370 248 
             C 345 240 315 242 304 254
             C 300 258 296 266 298 276
             C 302 290 314 300 330 304
             C 345 308 360 295 364 280
             Z" 
          fill="#3ba844" />

    <!-- Thumb clasp in center -->
    <path d="M 284 254 
             C 292 246 308 246 316 254 
             C 324 262 318 274 300 284 
             C 282 274 276 262 284 254 Z" 
          fill="#1b2a59" stroke="#ffffff" stroke-width="3" />

    <!-- The 3-Leaf Growth Sprout (Seedling) -->
    <!-- Central Upright Leaf -->
    <path d="M 300 244 
             C 288 200 274 165 300 134 
             C 326 165 312 200 300 244 Z" 
          fill="#3ba844" />
    <!-- Central Leaf Vein -->
    <path d="M 300 240 L 300 144" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />

    <!-- Left Leaf -->
    <path d="M 294 226 
             C 268 220 236 195 244 168 
             C 268 168 288 198 296 220 Z" 
          fill="#43b04c" />
    <!-- Left Leaf Vein -->
    <path d="M 292 222 C 280 210 264 195 250 176" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />

    <!-- Right Leaf -->
    <path d="M 306 226 
             C 332 220 364 195 356 168 
             C 332 168 312 198 304 220 Z" 
          fill="#43b04c" />
    <!-- Right Leaf Vein -->
    <path d="M 308 222 C 320 210 336 195 350 176" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Typography -->
  <!-- Bengali Title: বন্ধু সমবায় সমিতি লিমিটেড -->
  <text x="300" y="475" text-anchor="middle" class="somiti-title">বন্ধু সমবায় সমিতি লিমিটেড</text>

  <!-- English Subtitle: UNITY • GROWTH • TRUST -->
  <text x="300" y="525" text-anchor="middle" class="somiti-sub">UNITY • GROWTH • TRUST</text>
</svg>
`;

// 1b. Horizontal Full Logo SVG (Compact, wide aspect ratio for headers and sidebars)
const horizontalLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" width="520" height="120">
  <defs>
    <filter id="h-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#16244f" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Left: Emblem Scaled at (60, 60) -->
  <g transform="translate(60, 60) scale(0.32) translate(-300, -210)" filter="url(#h-shadow)">
    <!-- Outer Ring Base Layer: Deep Navy Arc -->
    <path d="M 280 62 A 152 152 0 1 0 445 235 L 430 231 A 136 136 0 1 1 285 78 Z" fill="#1b2a59" />
    <!-- Outer Ring Green Arc -->
    <path d="M 320 62 A 152 152 0 0 1 454 195 L 439 199 A 136 136 0 0 0 315 78 Z" fill="#3ba844" />

    <!-- Nodes -->
    <circle cx="300" cy="58" r="23" fill="#ffffff" />
    <circle cx="300" cy="58" r="19" fill="#1b2a59" />
    <circle cx="148" cy="210" r="23" fill="#ffffff" />
    <circle cx="148" cy="210" r="19" fill="#1b2a59" />
    <circle cx="452" cy="210" r="23" fill="#ffffff" />
    <circle cx="452" cy="210" r="19" fill="#3ba844" />

    <!-- Arms -->
    <path d="M 276 96 C 210 102 165 142 160 210 C 158 245 174 278 200 300 C 214 312 232 320 252 320 C 246 304 246 290 252 278 C 230 270 208 250 204 224 C 200 190 226 150 270 135 C 285 130 292 118 276 96 Z" fill="#1b2a59" />
    <path d="M 324 96 C 390 102 435 142 440 210 C 442 245 426 278 400 300 C 386 312 368 320 348 320 C 354 304 354 290 348 278 C 370 270 392 250 396 224 C 400 190 374 150 330 135 C 315 130 308 118 324 96 Z" fill="#3ba844" />

    <!-- Handshake -->
    <path d="M 230 248 C 255 240 285 242 296 254 C 300 258 304 266 302 276 C 298 290 286 300 270 304 C 255 308 240 295 236 280 Z" fill="#1b2a59" />
    <rect x="256" y="296" width="13" height="22" rx="6.5" fill="#1b2a59" transform="rotate(-15 262 307)" stroke="#ffffff" stroke-width="2.5" />
    <rect x="274" y="304" width="13" height="22" rx="6.5" fill="#1b2a59" transform="rotate(-5 280 315)" stroke="#ffffff" stroke-width="2.5" />
    <rect x="293" y="305" width="13" height="22" rx="6.5" fill="#1b2a59" transform="rotate(10 299 316)" stroke="#ffffff" stroke-width="2.5" />
    <rect x="312" y="298" width="13" height="20" rx="6.5" fill="#1b2a59" transform="rotate(25 318 308)" stroke="#ffffff" stroke-width="2.5" />
    <path d="M 370 248 C 345 240 315 242 304 254 C 300 258 296 266 298 276 C 302 290 314 300 330 304 C 345 308 360 295 364 280 Z" fill="#3ba844" />
    <path d="M 284 254 C 292 246 308 246 316 254 C 324 262 318 274 300 284 C 282 274 276 262 284 254 Z" fill="#1b2a59" stroke="#ffffff" stroke-width="3" />

    <!-- Sprout -->
    <path d="M 300 244 C 288 200 274 165 300 134 C 326 165 312 200 300 244 Z" fill="#3ba844" />
    <path d="M 300 240 L 300 144" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
    <path d="M 294 226 C 268 220 236 195 244 168 C 268 168 288 198 296 220 Z" fill="#43b04c" />
    <path d="M 292 222 C 280 210 264 195 250 176" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 306 226 C 332 220 364 195 356 168 C 332 168 312 198 304 220 Z" fill="#43b04c" />
    <path d="M 308 222 C 320 210 336 195 350 176" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" />
  </g>

  <!-- Right: Crisp Full Typography -->
  <text x="130" y="52" font-family="'Hind Siliguri', 'Bangla', sans-serif" font-weight="800" font-size="28" fill="#16244f">বন্ধু সমবায় সমিতি লিমিটেড</text>
  <text x="132" y="80" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="12.5" letter-spacing="3.5" fill="#22355e">UNITY • GROWTH • TRUST</text>
  <text x="132" y="100" font-family="'Hind Siliguri', 'Bangla', sans-serif" font-weight="600" font-size="11" fill="#2d9437">রেজিস্টার্ড সমবায় আর্থিক ব্যবস্থাপনা</text>
</svg>
`;

// 2. Square Emblem Icon SVG (For App Icon, Favicon, PWA 192x192, 512x512)
const squareIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="icon-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#16244f" flood-opacity="0.18"/>
    </filter>
  </defs>

  <!-- Clean rounded background container with subtle white-to-slate gradient -->
  <rect width="512" height="512" rx="112" fill="#ffffff" />

  <!-- Centered Emblem Scaled and Positioned perfectly within 512x512 -->
  <g transform="translate(10, 20) scale(0.97)" filter="url(#icon-shadow)">
    <!-- Outer Ring Base Layer: Deep Navy Arc -->
    <path d="M 233 72 
             A 180 180 0 1 0 428 277 
             L 410 272
             A 162 162 0 1 1 239 90
             Z" 
          fill="#1b2a59" />

    <!-- Outer Ring Green Arc (Top-Right section from top to right) -->
    <path d="M 280 72 
             A 180 180 0 0 1 438 230 
             L 420 235 
             A 162 162 0 0 0 274 90 
             Z" 
          fill="#3ba844" />

    <!-- Outer Nodes (Community Member Circles) -->
    <!-- Top Node (Navy) -->
    <circle cx="256" cy="68" r="26" fill="#ffffff" />
    <circle cx="256" cy="68" r="22" fill="#1b2a59" />

    <!-- Left Node (Navy) -->
    <circle cx="76" cy="248" r="26" fill="#ffffff" />
    <circle cx="76" cy="248" r="22" fill="#1b2a59" />

    <!-- Right Node (Vibrant Green) -->
    <circle cx="436" cy="248" r="26" fill="#ffffff" />
    <circle cx="436" cy="248" r="22" fill="#3ba844" />

    <!-- Left Navy Figure / Arm & Shoulder -->
    <path d="M 228 112 
             C 150 118 96 166 90 248
             C 88 290 106 328 138 354
             C 154 368 176 378 200 378
             C 192 358 192 342 200 328
             C 174 318 148 294 142 264
             C 138 222 168 174 220 158
             C 238 152 246 138 228 112
             Z" 
          fill="#1b2a59" />

    <!-- Right Green Figure / Arm & Shoulder -->
    <path d="M 284 112 
             C 362 118 416 166 422 248
             C 424 290 406 328 374 354
             C 358 368 336 378 312 378
             C 320 358 320 342 312 328
             C 338 318 364 294 370 264
             C 374 222 344 174 292 158
             C 274 152 266 138 284 112
             Z" 
          fill="#3ba844" />

    <!-- Center Cooperative Handshake -->
    <!-- Navy Hand (Left side wrapping around) -->
    <path d="M 172 294 
             C 202 284 238 286 252 300
             C 256 305 260 315 258 326
             C 254 343 240 355 220 360
             C 202 365 184 350 180 332
             Z" 
          fill="#1b2a59" />

    <!-- Handshake Fingers (Navy clasping) -->
    <rect x="204" y="350" width="16" height="26" rx="8" fill="#1b2a59" transform="rotate(-15 212 363)" stroke="#ffffff" stroke-width="3" />
    <rect x="225" y="360" width="16" height="26" rx="8" fill="#1b2a59" transform="rotate(-5 233 373)" stroke="#ffffff" stroke-width="3" />
    <rect x="248" y="361" width="16" height="26" rx="8" fill="#1b2a59" transform="rotate(10 256 374)" stroke="#ffffff" stroke-width="3" />
    <rect x="270" y="352" width="16" height="24" rx="8" fill="#1b2a59" transform="rotate(25 278 364)" stroke="#ffffff" stroke-width="3" />

    <!-- Green Hand (Right side grasping) -->
    <path d="M 340 294 
             C 310 284 274 286 260 300
             C 256 305 252 315 254 326
             C 258 343 272 355 292 360
             C 310 365 328 350 332 332
             Z" 
          fill="#3ba844" />

    <!-- Thumb Clasp in Center -->
    <path d="M 236 300 
             C 246 290 266 290 276 300 
             C 286 310 278 324 256 336 
             C 234 324 226 310 236 300 Z" 
          fill="#1b2a59" stroke="#ffffff" stroke-width="3.5" />

    <!-- The 3-Leaf Growth Sprout (Seedling) -->
    <!-- Central Upright Leaf -->
    <path d="M 256 288 
             C 242 236 225 194 256 156 
             C 287 194 270 236 256 288 Z" 
          fill="#3ba844" />
    <path d="M 256 284 L 256 168" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />

    <!-- Left Leaf -->
    <path d="M 248 266 
             C 218 258 180 228 190 196 
             C 218 196 242 232 252 258 Z" 
          fill="#43b04c" />
    <path d="M 246 262 C 232 248 214 230 198 206" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />

    <!-- Right Leaf -->
    <path d="M 264 266 
             C 294 258 332 228 322 196 
             C 294 196 270 232 260 258 Z" 
          fill="#43b04c" />
    <path d="M 266 262 C 280 248 298 230 314 206" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
  </g>
</svg>
`;

async function run() {
  console.log('Writing vector files...');
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), fullLogoSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'logo-horizontal.svg'), horizontalLogoSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), squareIconSvg.trim());

  console.log('Rendering high resolution PNGs with sharp...');

  // 1. Full Logo PNG (600x620)
  await sharp(Buffer.from(fullLogoSvg))
    .resize(600, 620)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // 1b. Horizontal Full Logo PNG (520x120)
  await sharp(Buffer.from(horizontalLogoSvg))
    .resize(1040, 240)
    .png()
    .toFile(path.join(publicDir, 'logo-horizontal.png'));

  // 2. Square PWA 192x192
  await sharp(Buffer.from(squareIconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 3. Square PWA 512x512
  await sharp(Buffer.from(squareIconSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 4. Apple Touch Icon 180x180
  await sharp(Buffer.from(squareIconSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 5. Maskable 512x512 (with extra safe-area padding for circular crop)
  const maskableSvg = squareIconSvg.replace(
    '<g transform="translate(10, 20) scale(0.97)"',
    '<g transform="translate(56, 56) scale(0.78)"'
  );
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 6. Favicon 32x32 PNG and copy to favicon.ico
  const favBuffer = await sharp(Buffer.from(squareIconSvg))
    .resize(48, 48)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), favBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favBuffer);

  console.log('All Somiti logo and icon assets successfully generated!');
}

run().catch(console.error);
