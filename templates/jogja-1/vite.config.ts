import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const SLUG = 'jogja-1';
const UMD_NAME = `TemantanTemplate_${SLUG.replace(/-/g, '')}`;

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '~': path.resolve(__dirname, 'src'),
    },
  },
  // Dev mode: renders the template inside a real TemantenProvider from the SDK
  root: command === 'serve' ? 'dev' : undefined,
  publicDir: path.resolve(__dirname, 'public'),
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
