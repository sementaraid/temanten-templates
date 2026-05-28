/**
 * Scaffold a new Temanten template.
 *
 * Interactive (local):
 *   pnpm create-template
 *
 * Non-interactive (CI / scripted):
 *   pnpm create-template --slug bandung-1 --name "Bandung Klasik" --description "..." --category ELEGANT --tags "floral,classic" --yes
 */
import { select, input, confirm } from '@inquirer/prompts';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(ROOT, 'templates');

const sdkPkg = JSON.parse(readFileSync(resolve(ROOT, '../temanten-sdk/package.json'), 'utf-8'));
const SDK_VERSION: string = sdkPkg.version;
const SDK_URL = `https://github.com/sementaraid/temanten-sdk/releases/download/v${SDK_VERSION}/temanten-sdk-${SDK_VERSION}.tgz`;

const CATEGORIES = ['ELEGANT', 'MODERN', 'RUSTIC', 'MINIMALIST', 'TRADITIONAL'] as const;
type Category = (typeof CATEGORIES)[number];

interface TemplateConfig {
  slug: string;
  name: string;
  description: string;
  category: Category;
  tags: string[];
  version: string;
}

// ── File writers ──────────────────────────────────────────────────────────────

function write(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
  console.log(`  ✓ ${filePath.replace(ROOT + '/', '')}`);
}

function generateFiles(templateDir: string, cfg: TemplateConfig) {
  const { slug, name, description, category, tags, version } = cfg;

  // ── manifest.json ──────────────────────────────────────────────────────────
  write(
    join(templateDir, 'manifest.json'),
    JSON.stringify({ slug, name, description, category, tags, version }, null, 2) + '\n',
  );

  // ── package.json ───────────────────────────────────────────────────────────
  write(
    join(templateDir, 'package.json'),
    JSON.stringify(
      {
        name: `@temanten/template-${slug}`,
        version,
        private: false,
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        peerDependencies: { motion: '^12.0.0', react: '^19.0.0', 'react-dom': '^19.0.0' },
        dependencies: {
          '@temanten/sdk': SDK_URL,
          'class-variance-authority': '^0.7.1',
          clsx: '^2.1.1',
          'tailwind-merge': '^3.4.0',
        },
        devDependencies: {
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
        },
      },
      null,
      2,
    ) + '\n',
  );

  // ── tsconfig.json ──────────────────────────────────────────────────────────
  write(
    join(templateDir, 'tsconfig.json'),
    JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: { paths: { '@/*': ['./src/*'], '~/*': ['./src/*'] } },
        include: ['src', 'dev'],
      },
      null,
      2,
    ) + '\n',
  );

  // ── .gitignore ─────────────────────────────────────────────────────────────
  write(join(templateDir, '.gitignore'), 'node_modules\ndist\n');

  // ── vite.config.ts ─────────────────────────────────────────────────────────
  // This file is identical for every template — SLUG is derived from manifest.json.
  write(
    join(templateDir, 'vite.config.ts'),
    `import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { readFileSync } from 'node:fs';

const SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');
const manifest = JSON.parse(readFileSync(path.resolve(__dirname, 'manifest.json'), 'utf-8'));
const SLUG: string = manifest.slug;
const UMD_NAME = \`TemantanTemplate_\${SLUG.replace(/-/g, '')}\`;

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, SCRIPTS_DIR, '');
  const version = process.env.VITE_DEPLOY_VERSION ?? manifest.version;
  const cdnVersionedBase = \`\${env.VITE_CDN_BASE_URL}/templates/\${SLUG}/v\${version}\`;

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
`,
  );

  // ── src/index.tsx ──────────────────────────────────────────────────────────
  // Identical for every template — sections come from section-config.ts.
  write(
    join(templateDir, 'src/index.tsx'),
    `import { WindowFrame } from '@temanten/sdk';
import { TEMPLATE_SECTIONS } from './section-config';
import { loadFonts } from './lib/fonts';
import './styles/main.css';

loadFonts();

export { manifest } from './manifest';

export const TemplatePage = () => (
  <WindowFrame>
    {TEMPLATE_SECTIONS.map(({ id, Component }) => (
      <Component key={id} />
    ))}
  </WindowFrame>
);
`,
  );

  // ── src/manifest.ts ────────────────────────────────────────────────────────
  // Reads from manifest.json — no duplication, no fields to update manually.
  write(
    join(templateDir, 'src/manifest.ts'),
    `import type { TemplateManifest } from '@temanten/sdk';
import data from '../manifest.json';

export const manifest: TemplateManifest = {
  slug: data.slug,
  name: data.name,
  description: data.description,
  category: data.category as TemplateManifest['category'],
  tags: data.tags,
};
`,
  );

  // ── src/section-config.ts ──────────────────────────────────────────────────
  write(
    join(templateDir, 'src/section-config.ts'),
    `import type { ComponentType } from 'react';

export type TemplateSectionEntry = {
  id: string;
  Component: ComponentType;
};

// Register your template sections here. Each Component is rendered
// in order inside <WindowFrame>. Import from src/containers/.
export const TEMPLATE_SECTIONS: TemplateSectionEntry[] = [];
`,
  );

  // ── src/environment.d.ts ───────────────────────────────────────────────────
  write(
    join(templateDir, 'src/environment.d.ts'),
    `/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CDN_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`,
  );

  // ── src/lib/asset.ts ───────────────────────────────────────────────────────
  write(
    join(templateDir, 'src/lib/asset.ts'),
    `const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL || '';

export const assetUrl = (path: string): string => \`\${CDN_BASE}\${path}\`;
`,
  );

  // ── src/lib/utils.ts ───────────────────────────────────────────────────────
  write(
    join(templateDir, 'src/lib/utils.ts'),
    `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
  );

  // ── src/lib/fonts.ts ───────────────────────────────────────────────────────
  // Starter: replace with real FontFace loader calls for your template's fonts.
  write(
    join(templateDir, 'src/lib/fonts.ts'),
    `import { assetUrl } from './asset';

function loadFont(
  family: string,
  file: string,
  descriptors?: FontFaceDescriptors,
): Promise<void> {
  const url = assetUrl('/fonts/' + file);
  const face = new FontFace(family, \`url("\${url}") format("truetype")\`, {
    display: 'swap',
    ...descriptors,
  });
  return face.load().then((f) => { document.fonts.add(f); });
}

export function loadFonts(): Promise<void> {
  const fonts: Promise<void>[] = [
    // loadFont('My Font', 'my-font/MyFont-Regular.ttf'),
  ];
  return Promise.allSettled(fonts).then(() => {});
}
`,
  );

  // ── src/styles/font.css ────────────────────────────────────────────────────
  write(
    join(templateDir, 'src/styles/font.css'),
    `/* Add Tailwind v4 @theme font variables here, e.g.:
@theme {
  --font-my-font: 'My Font', sans-serif;
}
*/
`,
  );

  // ── src/styles/main.css ────────────────────────────────────────────────────
  write(join(templateDir, 'src/styles/main.css'), MAIN_CSS);

  // ── dev/index.html ─────────────────────────────────────────────────────────
  write(
    join(templateDir, 'dev/index.html'),
    `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${slug} — Template Dev</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
`,
  );

  // ── dev/main.tsx ───────────────────────────────────────────────────────────
  write(
    join(templateDir, 'dev/main.tsx'),
    `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TemantenProvider } from '@temanten/sdk';
import { TemplatePage } from '../src/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TemantenProvider mode="demo">
      <TemplatePage />
    </TemantenProvider>
  </StrictMode>
);
`,
  );
}

// ── Shared base CSS (identical for all templates) ─────────────────────────────
const MAIN_CSS = `@import 'tailwindcss';
@import 'tw-animate-css';
@import './font.css';

@source "../";
@source "../../dev";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

/* Scoped to .temanten-template so these tokens don't bleed into the host app */
.temanten-template {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark .temanten-template {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }

  html {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  ::-webkit-scrollbar {
    display: none;
  }
}
`;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { values: rawArgs } = parseArgs({
    args: process.argv.slice(2),
    options: {
      slug: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      category: { type: 'string' },
      tags: { type: 'string' },
      version: { type: 'string' },
      yes: { type: 'boolean', short: 'y', default: false },
    },
    strict: false,
  });
  const args = rawArgs as {
    slug?: string;
    name?: string;
    description?: string;
    category?: string;
    tags?: string;
    version?: string;
    yes?: boolean;
  };

  // ── Slug ───────────────────────────────────────────────────────────────────
  let slug = args.slug;
  if (!slug) {
    slug = await input({
      message: 'Template slug (e.g. bandung-1):',
      validate: (v) =>
        /^[a-z0-9-]+$/.test(v) ? true : 'Use lowercase letters, numbers, and hyphens only',
    });
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error(`Invalid slug '${slug}': use lowercase letters, numbers, and hyphens only`);
    process.exit(1);
  }

  const templateDir = join(TEMPLATES_DIR, slug as string);
  if (existsSync(templateDir)) {
    console.error(`Template '${slug}' already exists at ${templateDir}`);
    process.exit(1);
  }

  // ── Name ───────────────────────────────────────────────────────────────────
  let name = args.name;
  if (!name) {
    name = await input({ message: 'Display name:', validate: (v) => v.trim() !== '' || 'Required' });
  }

  // ── Description ────────────────────────────────────────────────────────────
  let description = args.description;
  if (!description) {
    description = await input({
      message: 'Short description:',
      validate: (v) => v.trim() !== '' || 'Required',
    });
  }

  // ── Category ───────────────────────────────────────────────────────────────
  let category = args.category as Category | undefined;
  if (!category || !CATEGORIES.includes(category as Category)) {
    category = await select({
      message: 'Category:',
      choices: CATEGORIES.map((c) => ({ name: c, value: c })),
    });
  }

  // ── Tags ───────────────────────────────────────────────────────────────────
  let tags: string[] = [];
  if (args.tags) {
    tags = args.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
  } else {
    const raw = await input({ message: 'Tags (comma-separated, optional):' });
    tags = raw.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // ── Version ────────────────────────────────────────────────────────────────
  let version = args.version;
  if (!version) {
    version = await input({ message: 'Initial version:', default: '1.0.0' });
  }

  // ── Summary & confirmation ─────────────────────────────────────────────────
  console.log('');
  console.log('  Slug        :', slug);
  console.log('  Name        :', name);
  console.log('  Description :', description);
  console.log('  Category    :', category);
  console.log('  Tags        :', tags.join(', ') || '(none)');
  console.log('  Version     :', version);
  console.log('  Directory   :', templateDir);
  console.log('');

  if (!args.yes) {
    const ok = await confirm({ message: 'Create this template?' });
    if (!ok) {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  console.log('\nGenerating files...\n');

  generateFiles(templateDir, {
    slug: slug as string,
    name: name as string,
    description: description as string,
    category: category as Category,
    tags,
    version: version as string,
  });

  console.log(`
✓ Template '${slug}' created.

Next steps:
  cd templates/${slug}
  pnpm install
  pnpm dev
`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
