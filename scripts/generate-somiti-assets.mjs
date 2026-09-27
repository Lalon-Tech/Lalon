import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');

// Segment Bengali into unicode grapheme clusters
const segmenter = new Intl.Segmenter('bn', { granularity: 'grapheme' });
const bnText = 'বন্ধু সমবায় সমিতি লিমিটেড';
const bnGraphemes = Array.from(segmenter.segment(bnText)).map(s => s.segment);

const cx = 300, cy = 300;
const rBn = 196;
const bnStart = -66, bnEnd = 66;
const bnStep = (bnEnd - bnStart) / (bnGraphemes.length - 1);

const bnCurved = bnGraphemes.map((g, i) => {
  if (g.trim() === '') return '';
  const angle = bnStart + i * bnStep;
  return `<text x="${cx}" y="${cy - rBn}" font-family="'Hind Siliguri', 'Bangla', sans-serif" font-size="26.5" font-weight="800" fill="#f8fafc" text-anchor="middle" transform="rotate(${angle}, ${cx}, ${cy})">${g}</text>`;
}).join('\n    ');

// 16 points for outer ornate star frame
const numPoints = 16;
let outerFacets = '';
for (let i = 0; i < numPoints; i++) {
  const a1 = (i * 360 / numPoints) * Math.PI / 180;
  const a2 = ((i + 1) * 360 / numPoints) * Math.PI / 180;
  const aMid = (a1 + a2) / 2;

  const px = (cx + 282 * Math.cos(a1)).toFixed(1);
  const py = (cy + 282 * Math.sin(a1)).toFixed(1);
  const vx = (cx + 252 * Math.cos(aMid)).toFixed(1);
  const vy = (cy + 252 * Math.sin(aMid)).toFixed(1);
  const pNextX = (cx + 282 * Math.cos(a2)).toFixed(1);
  const pNextY = (cy + 282 * Math.sin(a2)).toFixed(1);

  outerFacets += `
    <path d="M ${px} ${py} L ${vx} ${vy} L ${pNextX} ${pNextY}" fill="none" stroke="url(#silver-bevel)" stroke-width="3" stroke-linejoin="round" />
    <polygon points="${px},${py} ${vx},${vy} ${(cx + 265 * Math.cos(a1)).toFixed(1)},${(cy + 265 * Math.sin(a1)).toFixed(1)}" fill="url(#silver-bevel)" />
    <polygon points="${vx},${vy} ${pNextX},${pNextY} ${(cx + 265 * Math.cos(a2)).toFixed(1)},${(cy + 265 * Math.sin(a2)).toFixed(1)}" fill="url(#teal-facet)" stroke="#94a3b8" stroke-width="1" />
    <circle cx="${px}" cy="${py}" r="3" fill="#ffffff" stroke="#475569" stroke-width="1" />
  `;
}

// 1. Official Bondhu Somiti Metallic Circular Badge SVG (Transparent outside r=284)
const officialBadgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@700;800&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap');
    </style>
    <!-- Metallic Silver Gradients -->
    <linearGradient id="silver-bevel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="25%" stop-color="#cbd5e1" />
      <stop offset="50%" stop-color="#64748b" />
      <stop offset="75%" stop-color="#e2e8f0" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>

    <linearGradient id="silver-bright" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#cbd5e1" />
      <stop offset="50%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>

    <!-- Deep Midnight Teal/Navy Radial Gradient -->
    <radialGradient id="teal-medallion" cx="45%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#112a42" />
      <stop offset="65%" stop-color="#0a1a2b" />
      <stop offset="100%" stop-color="#06111d" />
    </radialGradient>

    <!-- Facet Teal Gradient -->
    <linearGradient id="teal-facet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14535c" />
      <stop offset="50%" stop-color="#0d373d" />
      <stop offset="100%" stop-color="#082428" />
    </linearGradient>

    <!-- Emerald Plaque Gradient -->
    <linearGradient id="green-plaque" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#188063" />
      <stop offset="40%" stop-color="#12654e" />
      <stop offset="100%" stop-color="#0a3f30" />
    </linearGradient>

    <!-- Cyan/Silver Trend Arrow Gradient -->
    <linearGradient id="arrow-metal" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0ea5e9" />
      <stop offset="45%" stop-color="#38bdf8" />
      <stop offset="75%" stop-color="#f0f9ff" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>

    <filter id="badge-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#020617" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Clean Circular Badge (Outside r=284 is 100% transparent) -->
  <g filter="url(#badge-glow)">
    <!-- 1. Outer 16-Point Faceted Metallic Border -->
    <circle cx="300" cy="300" r="252" fill="#0d373d" />
    ${outerFacets}

    <!-- 2. Concentric Silver Chrome Rings -->
    <circle cx="300" cy="300" r="244" fill="none" stroke="url(#silver-bevel)" stroke-width="4.5" />
    <circle cx="300" cy="300" r="238" fill="none" stroke="#071927" stroke-width="2.5" />
    <circle cx="300" cy="300" r="234" fill="none" stroke="url(#silver-bright)" stroke-width="3" />

    <!-- 3. Medallion Interior Disc -->
    <circle cx="300" cy="300" r="232" fill="url(#teal-medallion)" />
    <circle cx="300" cy="300" r="228" fill="none" stroke="#1e3a5f" stroke-width="1.5" opacity="0.6" />

    <!-- 4. Upper Bengali Curved Typography -->
    ${bnCurved}

    <!-- 5. Upper-Center Emblem: Ring of 4 Clasped Hands + Growth Trend Arrow -->
    <g transform="translate(300, 206)">
      <!-- Outer silver circle frame of the inner emblem -->
      <circle cx="0" cy="0" r="48" fill="#081726" stroke="url(#silver-bevel)" stroke-width="3" />
      <circle cx="0" cy="0" r="44" fill="none" stroke="#16324a" stroke-width="1.5" />

      <!-- Ring of 4 Interlocking Cooperative Hands (Silver Metallic) -->
      <!-- Top Hand & Arm (Clockwise to right) -->
      <path d="M -18 -32 C -8 -40 14 -40 26 -28 C 30 -24 30 -16 24 -12 C 16 -8 8 -14 0 -18 C -10 -22 -14 -28 -18 -32 Z" fill="url(#silver-bright)" stroke="#475569" stroke-width="1" />
      <!-- Right Hand & Arm (Clockwise to bottom) -->
      <path d="M 32 -18 C 40 -8 40 14 28 26 C 24 30 16 30 12 24 C 8 16 14 8 18 0 C 22 -10 28 -14 32 -18 Z" fill="url(#silver-bevel)" stroke="#475569" stroke-width="1" />
      <!-- Bottom Hand & Arm (Clockwise to left) -->
      <path d="M 18 32 C 8 40 -14 40 -26 28 C -30 24 -30 16 -24 12 C -16 8 -8 14 0 18 C 10 22 14 28 18 32 Z" fill="url(#silver-bright)" stroke="#475569" stroke-width="1" />
      <!-- Left Hand & Arm (Clockwise to top) -->
      <path d="M -32 18 C -40 8 -40 -14 -28 -26 C -24 -30 -16 -30 -12 -24 C -8 -16 -14 -8 -18 0 C -22 10 -28 14 -32 18 Z" fill="url(#silver-bevel)" stroke="#475569" stroke-width="1" />

      <!-- Inner wrist & finger clasps -->
      <circle cx="0" cy="0" r="26" fill="none" stroke="url(#silver-bevel)" stroke-width="2" />

      <!-- Upward Growth Trend Arrow (Cyan/Silver metallic zigzag surging to top-right) -->
      <!-- Glow under arrow -->
      <path d="M -26 20 L -10 -4 L 2 6 L 24 -24" fill="none" stroke="#0369a1" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
      <!-- Arrow shaft -->
      <path d="M -26 20 L -10 -4 L 2 6 L 24 -24" fill="none" stroke="url(#arrow-metal)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Arrowhead at (24, -24) pointing top-right -->
      <polygon points="24,-24 10,-24 15,-18 7,-10 15,-6 19,-14 24,-10" fill="url(#arrow-metal)" stroke="#ffffff" stroke-width="1" />
    </g>

    <!-- 6. Green Plaque / Banner (UNITY • GROWTH • TRUST) -->
    <g transform="translate(300, 345)">
      <!-- Outer Plaque Shadow -->
      <rect x="-184" y="-26" width="368" height="52" rx="16" fill="#020617" opacity="0.4" />
      <!-- Plaque Body -->
      <rect x="-182" y="-25" width="364" height="50" rx="15" fill="url(#green-plaque)" stroke="url(#silver-bevel)" stroke-width="3.5" />
      <!-- Inner Gloss Rim -->
      <rect x="-179" y="-22" width="358" height="22" rx="12" fill="#ffffff" opacity="0.12" />

      <!-- Text: UNITY • GROWTH • TRUST -->
      <text x="0" y="7" font-family="'Plus Jakarta Sans', sans-serif" font-size="18.5" font-weight="800" letter-spacing="3.5" fill="#ffffff" text-anchor="middle">
        UNITY <tspan fill="#6ee7b7">•</tspan> GROWTH <tspan fill="#6ee7b7">•</tspan> TRUST
      </text>
    </g>

    <!-- 7. Subtitle: Cooperative Society -->
    <text x="300" y="406" font-family="'Plus Jakarta Sans', sans-serif" font-size="17.5" font-weight="600" letter-spacing="1.8" fill="#cbd5e1" text-anchor="middle">
      Cooperative Society
    </text>

    <!-- 8. Lower Concentric Silver Arcs -->
    <path d="M 175 442 A 195 195 0 0 0 425 442" fill="none" stroke="url(#silver-bevel)" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 205 458 A 185 185 0 0 0 395 458" fill="none" stroke="url(#silver-bright)" stroke-width="1.8" stroke-linecap="round" />
    <path d="M 245 474 A 175 175 0 0 0 355 474" fill="none" stroke="url(#silver-bevel)" stroke-width="1.2" stroke-linecap="round" />
  </g>
</svg>
`;

// 2. Square / App Icon SVG (512x512)
const squareIconSvg = officialBadgeSvg
  .replace('viewBox="0 0 600 600" width="600" height="600"', 'viewBox="0 0 600 600" width="512" height="512"');

// 3. Horizontal Full Logo SVG (Compact, wide aspect ratio for letterheads & headers)
const horizontalLogoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 120" width="580" height="120">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@600;700;800&amp;family=Plus+Jakarta+Sans:wght@700;800&amp;display=swap');
    </style>
    <filter id="h-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#020617" flood-opacity="0.2"/>
    </filter>
  </defs>

  <!-- Left: Official Metallic Circular Badge Scaled at (60, 60) -->
  <g transform="translate(60, 60) scale(0.185) translate(-300, -300)" filter="url(#h-shadow)">
    <!-- Badge Content Included Directly -->
    ${officialBadgeSvg.slice(officialBadgeSvg.indexOf('<g filter="url(#badge-glow)">'), officialBadgeSvg.lastIndexOf('</svg>'))}
  </g>

  <!-- Right: Crisp Full Typography -->
  <text x="135" y="48" font-family="'Hind Siliguri', 'Bangla', sans-serif" font-weight="800" font-size="26" fill="#0f172a">বন্ধু সমবায় সমিতি লিমিটেড</text>
  <!-- Mini Green Badge Plaque for Motto -->
  <g transform="translate(135, 62)">
    <rect x="0" y="0" width="220" height="24" rx="6" fill="#0d5240" stroke="#94a3b8" stroke-width="1" />
    <text x="110" y="16.5" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="10.5" letter-spacing="2" fill="#ffffff" text-anchor="middle">
      UNITY • GROWTH • TRUST
    </text>
  </g>
  <text x="135" y="104" font-family="'Hind Siliguri', 'Bangla', sans-serif" font-weight="600" font-size="12" fill="#059669">রেজিস্টার্ড সমবায় আর্থিক ব্যবস্থাপনা • Cooperative Society</text>
</svg>
`;

async function run() {
  console.log('Writing vector files with transparent background outside circular badge...');
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), officialBadgeSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'logo-horizontal.svg'), horizontalLogoSvg.trim());
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), squareIconSvg.trim());

  console.log('Rendering high resolution PNGs with sharp (alpha transparency outside circular badge)...');

  // 1. Full Circular Logo PNG (600x600)
  await sharp(Buffer.from(officialBadgeSvg))
    .resize(600, 600)
    .png()
    .toFile(path.join(publicDir, 'logo.png'));

  // 1b. Horizontal Full Logo PNG (1160x240)
  await sharp(Buffer.from(horizontalLogoSvg))
    .resize(1160, 240)
    .png()
    .toFile(path.join(publicDir, 'logo-horizontal.png'));

  // 2. Square PWA 192x192
  await sharp(Buffer.from(officialBadgeSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 3. Square PWA 512x512
  await sharp(Buffer.from(officialBadgeSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 4. Apple Touch Icon 180x180
  await sharp(Buffer.from(officialBadgeSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 5. Maskable 512x512 (with safe-area padding for Android adaptive circular crop)
  const maskableSvg = officialBadgeSvg.replace(
    '<g filter="url(#badge-glow)">',
    '<g transform="translate(60, 60) scale(0.80)" filter="url(#badge-glow)">'
  );
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  // 6. Favicon 48x48 PNG and copy to favicon.ico
  const favBuffer = await sharp(Buffer.from(officialBadgeSvg))
    .resize(48, 48)
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), favBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favBuffer);

  console.log('All official circular Bondhu Somiti logo and icon assets successfully generated!');
}

run().catch(console.error);
