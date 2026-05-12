import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = resolve(__dirname);
const distDir = resolve(root, 'dist');

const manifest = {
  manifest_version: 3,
  name: '__MSG_extension_name__',
  version: '0.3.1',
  description: '__MSG_extension_description__',
  default_locale: 'en',
  permissions: ['storage', 'alarms'],
  host_permissions: ['https://claude.ai/*'],
  background: {
    service_worker: 'background/service-worker.js',
    type: 'module',
  },
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_title: '__MSG_extension_name__',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
  },
  options_ui: {
    page: 'options.html',
    open_in_tab: false,
  },
};

export default defineConfig({
  root,
  publicDir: resolve(root, 'public'),
  build: {
    outDir: distDir,
    emptyOutDir: true,
    target: 'es2022',
    modulePreload: false,
    rollupOptions: {
      input: {
        popup: resolve(root, 'popup.html'),
        options: resolve(root, 'options.html'),
        'background/service-worker': resolve(root, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  plugins: [
    {
      name: 'emit-manifest',
      closeBundle() {
        mkdirSync(distDir, { recursive: true });
        writeFileSync(
          resolve(distDir, 'manifest.json'),
          JSON.stringify(manifest, null, 2),
        );
      },
    },
  ],
});
