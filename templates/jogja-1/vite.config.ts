import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { Plugin } from 'vite';

const SLUG = 'jogja-1';
const UMD_NAME = `TemantanTemplate_${SLUG.replace(/-/g, '')}`;

// Rewrites absolute /fonts/ paths to relative ./fonts/ in the built style.css so
// fonts resolve correctly when the CSS is served from the CDN (not the host origin).
const rewriteCssFontUrls = (): Plugin => ({
  name: 'rewrite-css-font-urls',
  apply: 'build',
  closeBundle() {
    const cssPath = path.resolve(__dirname, 'dist/style.css');
    if (!existsSync(cssPath)) return;
    const css = readFileSync(cssPath, 'utf-8');
    const rewritten = css.replace(/url\(\/fonts\//g, 'url(./fonts/');
    writeFileSync(cssPath, rewritten);
  },
});

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss(), rewriteCssFontUrls()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '~': path.resolve(__dirname, 'src'),
    },
  },
  // Dev mode: renders the template inside a real TemantenProvider from the SDK
  root: command === 'serve' ? 'dev' : undefined,
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.tsx'),
      name: UMD_NAME,
      formats: ['umd'],
      fileName: () => 'bundle.umd.js',
    },
    rollupOptions: {
      // These are provided by the host app at runtime via window globals.
      // @temanten/sdk resolves to window.TemantenSDK (set by the host before
      // injecting the template bundle), so context is shared with the host.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'motion/react', '@temanten/sdk'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
          'motion/react': 'MotionReact',
          '@temanten/sdk': 'TemantenSDK',
        },
        assetFileNames: (info) => (info.name?.endsWith('.css') ? 'style.css' : (info.name ?? '')),
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
}));
