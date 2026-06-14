import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { readFileSync } from 'node:fs';

const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');
const manifest = JSON.parse(readFileSync(path.resolve(__dirname, 'manifest.json'), 'utf-8'));
const SLUG: string = manifest.slug;
const UMD_NAME = `TemantanTemplate_${SLUG.replace(/-/g, '')}`;

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, SCRIPTS_DIR, '');
  const version = process.env.VITE_DEPLOY_VERSION ?? manifest.version;
  const cdnVersionedBase = `${env.VITE_CDN_BASE_URL}/templates/${SLUG}/v${version}`;

  return {
    plugins: [react(), tailwindcss()],
    envDir: SCRIPTS_DIR,
    define: {
      'import.meta.env.VITE_CDN_BASE_URL': JSON.stringify(cdnVersionedBase),
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '~': path.resolve(__dirname, 'src'),
      },
    },
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
  };
});
