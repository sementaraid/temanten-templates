/**
 * Scaffold a new Temanten template.
 *
 * Interactive (local):
 *   pnpm create-template
 *
 * Non-interactive (CI / scripted):
 *   pnpm create-template --slug bandung-1 --name "Bandung Klasik" --description "..." --category ELEGANT --tags "floral,classic" --yes
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { select, input, confirm } from '@inquirer/prompts';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import {
  CATEGORIES,
  type Category,
  DEFAULT_VERSION,
  MAIN_CSS,
  TEMPLATE_PEER_DEPS,
  TEMPLATE_DEPS,
  TEMPLATE_DEV_DEPS,
} from './constants';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(ROOT, 'templates');

const sdkPkg = JSON.parse(readFileSync(resolve(ROOT, '../temanten-sdk/package.json'), 'utf-8'));
const SDK_VERSION: string = sdkPkg.version;
const SDK_URL = `https://github.com/sementaraid/temanten-sdk/releases/download/v${SDK_VERSION}/temanten-sdk-${SDK_VERSION}.tgz`;

interface TemplateConfig {
  slug: string;
  name: string;
  description: string;
  category: Category;
  tags: string[];
  version: string;
}

// ── File writer ───────────────────────────────────────────────────────────────

function write(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
  console.log(chalk.green('  ✓') + ' ' + chalk.dim(filePath.replace(ROOT + '/', '')));
}

// ── File generators ───────────────────────────────────────────────────────────

function generateFiles(templateDir: string, cfg: TemplateConfig) {
  const { slug, name, description, category, tags, version } = cfg;

  write(
    join(templateDir, 'manifest.json'),
    JSON.stringify({ slug, name, description, category, tags, version }, null, 2) + '\n',
  );

  write(
    join(templateDir, 'package.json'),
    JSON.stringify(
      {
        name: `@temanten/template-${slug}`,
        version,
        private: false,
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        peerDependencies: TEMPLATE_PEER_DEPS,
        dependencies: { '@temanten/sdk': SDK_URL, ...TEMPLATE_DEPS },
        devDependencies: TEMPLATE_DEV_DEPS,
      },
      null,
      2,
    ) + '\n',
  );

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

  write(join(templateDir, '.gitignore'), 'node_modules\ndist\n');

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

  write(
    join(templateDir, 'src/lib/asset.ts'),
    `const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL || '';

export const assetUrl = (path: string): string => \`\${CDN_BASE}\${path}\`;
`,
  );

  write(
    join(templateDir, 'src/lib/utils.ts'),
    `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,
  );

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

  write(
    join(templateDir, 'src/styles/font.css'),
    `/* Add Tailwind v4 @theme font variables here, e.g.:
@theme {
  --font-my-font: 'My Font', sans-serif;
}
*/
`,
  );

  write(join(templateDir, 'src/styles/main.css'), MAIN_CSS);

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

// ── CLI ───────────────────────────────────────────────────────────────────────

const program = new Command()
  .name('create-template')
  .description('Scaffold a new Temanten template')
  .option('--slug <slug>', 'Template slug (e.g. bandung-1)')
  .option('--name <name>', 'Display name')
  .option('--description <desc>', 'Short description')
  .option('--category <category>', `Category: ${CATEGORIES.join(' | ')}`)
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--version <version>', 'Initial version', DEFAULT_VERSION)
  .option('-y, --yes', 'Skip confirmation prompt')
  .parse();

const opts = program.opts<{
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  version: string;
  yes?: boolean;
}>();

async function main() {
  // ── Slug ───────────────────────────────────────────────────────────────────
  let slug = opts.slug;
  if (!slug) {
    slug = await input({
      message: 'Template slug (e.g. bandung-1):',
      validate: (v) =>
        /^[a-z0-9-]+$/.test(v) ? true : 'Use lowercase letters, numbers, and hyphens only',
    });
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    console.error(chalk.red(`Invalid slug '${slug}': use lowercase letters, numbers, and hyphens only`));
    process.exit(1);
  }

  const templateDir = join(TEMPLATES_DIR, slug);
  if (existsSync(templateDir)) {
    console.error(chalk.red(`Template '${slug}' already exists at ${templateDir}`));
    process.exit(1);
  }

  // ── Name ───────────────────────────────────────────────────────────────────
  let name = opts.name;
  if (!name) {
    name = await input({ message: 'Display name:', validate: (v) => v.trim() !== '' || 'Required' });
  }

  // ── Description ────────────────────────────────────────────────────────────
  let description = opts.description;
  if (!description) {
    description = await input({
      message: 'Short description:',
      validate: (v) => v.trim() !== '' || 'Required',
    });
  }

  // ── Category ───────────────────────────────────────────────────────────────
  let category = opts.category as Category | undefined;
  if (!category || !CATEGORIES.includes(category as Category)) {
    category = await select({
      message: 'Category:',
      choices: CATEGORIES.map((c) => ({ name: c, value: c })),
    });
  }

  // ── Tags ───────────────────────────────────────────────────────────────────
  let tags: string[];
  if (opts.tags) {
    tags = opts.tags.split(',').map((t) => t.trim()).filter(Boolean);
  } else {
    const raw = await input({ message: 'Tags (comma-separated, optional):' });
    tags = raw.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // ── Version ────────────────────────────────────────────────────────────────
  let version = opts.version;
  if (!opts.version || opts.version === DEFAULT_VERSION) {
    version = await input({ message: 'Initial version:', default: DEFAULT_VERSION });
  }

  // ── Summary & confirmation ─────────────────────────────────────────────────
  console.log('');
  console.log(chalk.bold('  Summary'));
  console.log(`  ${chalk.dim('Slug')}        : ${chalk.cyan(slug)}`);
  console.log(`  ${chalk.dim('Name')}        : ${name}`);
  console.log(`  ${chalk.dim('Description')} : ${description}`);
  console.log(`  ${chalk.dim('Category')}    : ${category}`);
  console.log(`  ${chalk.dim('Tags')}        : ${tags.join(', ') || chalk.dim('(none)')}`);
  console.log(`  ${chalk.dim('Version')}     : ${version}`);
  console.log(`  ${chalk.dim('Directory')}   : ${chalk.dim(templateDir)}`);
  console.log('');

  if (!opts.yes) {
    const ok = await confirm({ message: 'Create this template?' });
    if (!ok) {
      console.log(chalk.yellow('Cancelled.'));
      process.exit(0);
    }
  }

  // ── Generate ───────────────────────────────────────────────────────────────
  console.log(chalk.bold('\nGenerating files…\n'));

  generateFiles(templateDir, {
    slug,
    name: name!,
    description: description!,
    category: category as Category,
    tags,
    version,
  });

  console.log(chalk.green.bold(`\n✓ Template '${slug}' created.\n`));
  console.log('Next steps:');
  console.log(chalk.dim(`  cd templates/${slug}`));
  console.log(chalk.dim('  pnpm install'));
  console.log(chalk.dim('  pnpm dev'));
  console.log('');
}

main().catch((err) => {
  console.error(chalk.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
