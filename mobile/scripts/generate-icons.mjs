// Generates app icons, splash, and store graphics from the Micaiah brand mark.
// Usage (from mobile/):  npm i --no-save sharp && node scripts/generate-icons.mjs
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const images = path.join(root, 'assets/images');
const store = path.join(root, 'store/graphics');
mkdirSync(store, { recursive: true });

// Flame + cross mark from the website logo (viewBox 0 0 108 108).
const MARK = `
  <path d="M53.76 21s12.6 13.65 11.76 25.62c-.84 8.4-5.88 11.76-5.88 11.76 2.52-8.4-2.1-15.54-5.88-19.74-3.78 4.2-8.4 11.34-5.88 19.74 0 0-5.04-3.36-5.88-11.76-.84-11.97 11.76-25.62 11.76-25.62zm0 17.64s5.04 7.56 4.2 13.44c-1.26 5.04-4.2 8.82-4.2 8.82s-2.94-3.78-4.2-8.82c-.84-5.88 4.2-13.44 4.2-13.44z"/>
  <path d="M56.28 63.42c0-1.39-1.13-2.52-2.52-2.52s-2.52 1.13-2.52 2.52v18.06c0 1.39 1.13 2.52 2.52 2.52s2.52-1.13 2.52-2.52V63.42z"/>
  <path d="M60.9 68.04H46.62c-1.39 0-2.52 1.13-2.52 2.52s1.13 2.52 2.52 2.52H60.9c1.39 0 2.52-1.13 2.52-2.52s-1.13-2.52-2.52-2.52z"/>`;

const GRADIENT = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2f2c78"/>
      <stop offset="0.55" stop-color="#4c55b6"/>
      <stop offset="1" stop-color="#8c95fb"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.5">
      <stop offset="0" stop-color="#e8d5a3" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#e8d5a3" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

/** The mark centred in a size×size canvas, scaled so it spans `scale` of the canvas height. */
function markSvg({ size, scale, color, background }) {
  const markHeight = 63; // mark spans y 21..84 in the 108 viewBox
  const k = (size * scale) / markHeight;
  const tx = size / 2 - 53.76 * k;
  const ty = size / 2 - 52.5 * k;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${GRADIENT}
    ${background ? `<rect width="${size}" height="${size}" fill="url(#bg)"/><rect width="${size}" height="${size}" fill="url(#glow)"/>` : ''}
    <g fill="${color}" transform="translate(${tx} ${ty}) scale(${k})">${MARK}</g>
  </svg>`;
}

async function render(svg, file, { flatten = false } = {}) {
  let img = sharp(Buffer.from(svg)).png();
  if (flatten) img = img.flatten({ background: '#3d3a8c' }); // App Store icons must not contain alpha
  await img.toFile(file);
  console.log('wrote', path.relative(root, file));
}

await render(markSvg({ size: 1024, scale: 0.6, color: '#ffffff', background: true }), path.join(images, 'icon.png'), {
  flatten: true,
});
// Android adaptive icon: keep the mark inside the 66% safe zone.
await render(markSvg({ size: 1024, scale: 0.42, color: '#ffffff' }), path.join(images, 'android-icon-foreground.png'));
await render(markSvg({ size: 1024, scale: 0.42, color: '#ffffff' }), path.join(images, 'android-icon-monochrome.png'));
await render(markSvg({ size: 512, scale: 0.8, color: '#3d3a8c' }), path.join(images, 'splash-icon.png'));
await render(markSvg({ size: 96, scale: 0.8, color: '#ffffff' }), path.join(images, 'notification-icon.png'));
await render(markSvg({ size: 196, scale: 0.6, color: '#ffffff', background: true }), path.join(images, 'favicon.png'));

// Google Play feature graphic (1024×500).
const feature = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  ${GRADIENT}
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glow)"/>
  <g fill="#ffffff" transform="translate(${170 - 53.76 * 4.6} ${250 - 52.5 * 4.6}) scale(4.6)">${MARK}</g>
  <text x="330" y="215" font-family="serif" font-size="76" fill="#ffffff">Micaiah AI</text>
  <text x="332" y="285" font-family="sans-serif" font-size="34" fill="#e8d5a3">Speak. Reflect. Receive Scripture.</text>
  <text x="332" y="335" font-family="sans-serif" font-size="24" fill="#dde1ff">A private, Scripture-based spiritual companion</text>
</svg>`;
await render(feature, path.join(store, 'play-feature-graphic.png'), { flatten: true });
await render(markSvg({ size: 512, scale: 0.6, color: '#ffffff', background: true }), path.join(store, 'play-icon-512.png'), {
  flatten: true,
});
