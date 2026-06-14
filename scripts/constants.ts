export const CATEGORIES = ['ELEGANT', 'MODERN', 'RUSTIC', 'MINIMALIST', 'TRADITIONAL'] as const;
export type Category = (typeof CATEGORIES)[number];

export const DEFAULT_VERSION = '1.0.0';

/** Peer dependencies injected into every generated template package.json */
export const TEMPLATE_PEER_DEPS = {
  motion: '^12.0.0',
  react: '^19.0.0',
  'react-dom': '^19.0.0',
};

/** Runtime dependencies injected into every generated template package.json */
export const TEMPLATE_DEPS = {
  'class-variance-authority': '^0.7.1',
  clsx: '^2.1.1',
  'tailwind-merge': '^3.4.0',
};

/** Dev dependencies injected into every generated template package.json */
export const TEMPLATE_DEV_DEPS = {
  '@tailwindcss/vite': '^4.1.18',
  '@types/react': '^19.0.0',
  '@types/react-dom': '^19.0.0',
  '@vitejs/plugin-react-swc': '^4.0.0',
  motion: '^12.23.26',
  react: '^19.2.0',
  'react-dom': '^19.2.0',
  tailwindcss: '^4.1.18',
  'tw-animate-css': '^1.4.0',
  typescript: '~5.9.3',
  vite: '^7.0.0',
};

