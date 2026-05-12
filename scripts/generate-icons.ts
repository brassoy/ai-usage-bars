// Resize the source icon at assets/icon-source.png down to the four PNG
// sizes Chrome wants (16, 32, 48, 128) and write them to public/icons/.
// Uses a simple area-average box filter — perfect for large downscaling
// ratios like ours (1254 → 128) without pulling a native image library.

import { PNG } from 'pngjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SOURCE = resolve(root, 'assets', 'icon-source.png');
const OUT_DIR = resolve(root, 'public', 'icons');
const SIZES = [16, 32, 48, 128] as const;

function loadPng(file: string): PNG {
  return PNG.sync.read(readFileSync(file));
}

function downscale(src: PNG, dstW: number, dstH: number): PNG {
  const dst = new PNG({ width: dstW, height: dstH });
  const sx = src.width / dstW;
  const sy = src.height / dstH;

  for (let y = 0; y < dstH; y++) {
    const sy0 = Math.floor(y * sy);
    const sy1 = Math.max(sy0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < dstW; x++) {
      const sx0 = Math.floor(x * sx);
      const sx1 = Math.max(sx0 + 1, Math.floor((x + 1) * sx));

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      for (let yy = sy0; yy < sy1 && yy < src.height; yy++) {
        for (let xx = sx0; xx < sx1 && xx < src.width; xx++) {
          const i = (yy * src.width + xx) * 4;
          r += src.data[i]!;
          g += src.data[i + 1]!;
          b += src.data[i + 2]!;
          a += src.data[i + 3]!;
          count++;
        }
      }

      const di = (y * dstW + x) * 4;
      dst.data[di] = Math.round(r / count);
      dst.data[di + 1] = Math.round(g / count);
      dst.data[di + 2] = Math.round(b / count);
      dst.data[di + 3] = Math.round(a / count);
    }
  }
  return dst;
}

function main() {
  const src = loadPng(SOURCE);
  console.log(`source: ${src.width}×${src.height}`);
  mkdirSync(OUT_DIR, { recursive: true });
  for (const size of SIZES) {
    const out = downscale(src, size, size);
    const buf = PNG.sync.write(out);
    const file = resolve(OUT_DIR, `icon-${size}.png`);
    writeFileSync(file, buf);
    console.log(`wrote ${file} (${buf.length} bytes)`);
  }
}

main();
