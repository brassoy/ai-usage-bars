// Generate static PNG icons at 16, 32, 48, 128 px.
// Drawn to match the dynamic toolbar icon (two stacked rounded bars) so
// users see consistent branding in the Chrome Web Store, the extensions
// page, and the toolbar before any data has been fetched.
//
// Output: public/icons/icon-{16,32,48,128}.png

import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'icons');
const SIZES = [16, 32, 48, 128] as const;

type RGBA = [number, number, number, number];

const BG: RGBA = [25, 25, 27, 255];
const ACCENT: RGBA = [124, 109, 245, 255]; // matches popup --accent
const TRACK: RGBA = [58, 58, 63, 255];
const FILL_TOP: RGBA = [63, 185, 80, 255]; // green, the "happy path" usage state
const FILL_BOTTOM: RGBA = [210, 153, 34, 255]; // amber, indicates higher usage

function setPx(png: PNG, x: number, y: number, color: RGBA) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const i = (y * png.width + x) * 4;
  png.data[i] = color[0];
  png.data[i + 1] = color[1];
  png.data[i + 2] = color[2];
  png.data[i + 3] = color[3];
}

function fillRoundedRect(
  png: PNG,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: RGBA,
) {
  const radius = Math.min(r, w / 2, h / 2);
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      // Distance to nearest corner — anti-aliased rounded clip
      let dx = 0;
      let dy = 0;
      if (px < x + radius) dx = x + radius - px;
      else if (px > x + w - 1 - radius) dx = px - (x + w - 1 - radius);
      if (py < y + radius) dy = y + radius - py;
      else if (py > y + h - 1 - radius) dy = py - (y + h - 1 - radius);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        // Anti-alias the border for non-tiny icons
        const alpha = Math.max(0, Math.min(1, radius + 0.5 - dist));
        if (alpha >= 0.99) {
          setPx(png, px, py, color);
        } else if (alpha > 0) {
          const c: RGBA = [color[0], color[1], color[2], Math.round(color[3] * alpha)];
          // Blend over current pixel
          const i = (py * png.width + px) * 4;
          const ba = png.data[i + 3] ?? 0;
          const fa = c[3] / 255;
          const oa = fa + (ba / 255) * (1 - fa);
          if (oa <= 0) continue;
          const blend = (sc: number, dc: number) =>
            Math.round((sc * fa + dc * (1 - fa)) / (oa || 1));
          png.data[i] = blend(c[0], png.data[i] ?? 0);
          png.data[i + 1] = blend(c[1], png.data[i + 1] ?? 0);
          png.data[i + 2] = blend(c[2], png.data[i + 2] ?? 0);
          png.data[i + 3] = Math.round(oa * 255);
        }
      }
    }
  }
}

function drawIcon(size: number): PNG {
  const png = new PNG({ width: size, height: size });

  // Outer rounded square (background card)
  const outerRadius = Math.max(2, Math.round(size * 0.18));
  const margin = Math.max(1, Math.round(size * 0.06));
  fillRoundedRect(png, margin, margin, size - margin * 2, size - margin * 2, outerRadius, BG);

  // Two bars
  const innerMargin = Math.max(2, Math.round(size * 0.18));
  const barHeight = Math.max(2, Math.round(size * 0.18));
  const barGap = Math.max(1, Math.round(size * 0.08));
  const barRadius = Math.max(1, Math.round(barHeight / 2));
  const barX = innerMargin;
  const barW = size - innerMargin * 2;
  const totalH = barHeight * 2 + barGap;
  const startY = Math.round((size - totalH) / 2);

  // Top bar (session): track, then ~55% fill
  fillRoundedRect(png, barX, startY, barW, barHeight, barRadius, TRACK);
  const topFillW = Math.max(2, Math.round(barW * 0.55));
  fillRoundedRect(png, barX, startY, topFillW, barHeight, barRadius, FILL_TOP);

  // Bottom bar (weekly): track, then ~30% fill (amber to suggest the warning palette exists)
  const by = startY + barHeight + barGap;
  fillRoundedRect(png, barX, by, barW, barHeight, barRadius, TRACK);
  const botFillW = Math.max(2, Math.round(barW * 0.3));
  fillRoundedRect(png, barX, by, botFillW, barHeight, barRadius, FILL_BOTTOM);

  // Tiny accent dot for visual identity on 48/128 icons
  if (size >= 48) {
    const dotR = Math.max(2, Math.round(size * 0.04));
    const dotX = size - innerMargin - dotR;
    const dotY = innerMargin + dotR;
    fillRoundedRect(png, dotX - dotR, dotY - dotR, dotR * 2, dotR * 2, dotR, ACCENT);
  }

  return png;
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const size of SIZES) {
    const png = drawIcon(size);
    const buf = PNG.sync.write(png);
    const file = resolve(OUT_DIR, `icon-${size}.png`);
    writeFileSync(file, buf);
    console.log(`wrote ${file} (${buf.length} bytes)`);
  }
}

main();
