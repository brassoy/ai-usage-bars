// Produce a Chrome Web Store-ready zip from dist/.
//
// Reads version from package.json and writes
// releases/usage-extension-vX.Y.Z.zip with manifest.json at the root.

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dist = resolve(root, 'dist');
const releases = resolve(root, 'releases');

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  version: string;
};
const version = pkg.version;

// Sanity: dist must exist and contain a manifest
try {
  statSync(resolve(dist, 'manifest.json'));
} catch {
  console.error('✗ dist/manifest.json not found — run `npm run build` first');
  process.exit(1);
}

mkdirSync(releases, { recursive: true });
const out = resolve(releases, `usage-extension-v${version}.zip`);
try {
  rmSync(out);
} catch {}

// zip the CONTENTS of dist/, not dist/ itself — Chrome wants manifest.json
// at the archive root.
execFileSync('zip', ['-r', '-q', out, '.'], { cwd: dist, stdio: 'inherit' });

const size = statSync(out).size;
console.log(`✓ ${out}`);
console.log(`  ${(size / 1024).toFixed(1)} KB`);
