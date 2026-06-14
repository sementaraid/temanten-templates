import chalk from 'chalk';
import { select, input, confirm } from '@inquirer/prompts';
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve, relative } from 'node:path';
import { CATEGORIES, type Category, DEFAULT_VERSION, TEMPLATE_PEER_DEPS, TEMPLATE_DEPS, TEMPLATE_DEV_DEPS } from '../constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const BASE_DIR = resolve(__dirname, '../base');

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.html', '.css', '.json', '.md', '.txt', '.js']);

function isTextFile(filePath: string): boolean {
  const base = filePath.split('/').pop() ?? '';
  if (base === '.gitignore') return true;
  const ext = base.includes('.') ? `.${base.split('.').pop()}` : '';
  return TEXT_EXTENSIONS.has(ext);
}

function writeFile(filePath: string, content: string | Buffer) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
  console.log(chalk.green('  ✓') + ' ' + chalk.dim(filePath.replace(ROOT + '/', '')));
}

function substitute(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

function copyBaseFiles(templateDir: string, vars: Record<string, string>) {
  const allFiles: string[] = [];
  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else allFiles.push(fullPath);
    }
  }
  walk(BASE_DIR);

  for (const srcPath of allFiles) {
    const destPath = join(templateDir, relative(BASE_DIR, srcPath));
    if (isTextFile(srcPath)) {
      writeFile(destPath, substitute(readFileSync(srcPath, 'utf-8'), vars));
    } else {
      writeFile(destPath, readFileSync(srcPath));
    }
  }
}

export async function runCreate(opts: {
  slug?: string;
  name?: string;
  description?: string;
  category?: string;
  tags?: string;
  version?: string;
  yes?: boolean;
}) {
  // Slug
  let slug = opts.slug;
  if (!slug) {
    slug = await input({
      message: 'Template slug (e.g. bandung-1):',
      validate: (v) => /^[a-z0-9-]+$/.test(v) ? true : 'Use lowercase letters, numbers, and hyphens only',
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

  // Name
  const name = opts.name ?? await input({ message: 'Display name:', validate: (v) => v.trim() !== '' || 'Required' });

  // Description
  const description = opts.description ?? await input({ message: 'Short description:', validate: (v) => v.trim() !== '' || 'Required' });

  // Category
  let category = opts.category as Category | undefined;
  if (!category || !CATEGORIES.includes(category as Category)) {
    category = await select({ message: 'Category:', choices: CATEGORIES.map((c) => ({ name: c, value: c })) });
  }

  // Tags
  const tags = opts.tags
    ? opts.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : (await input({ message: 'Tags (comma-separated, optional):' })).split(',').map((t) => t.trim()).filter(Boolean);

  // Version
  const version = opts.version ?? await input({ message: 'Initial version:', default: DEFAULT_VERSION });

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

  console.log(chalk.bold('\nGenerating files…\n'));

  // Resolve SDK URL from sibling package
  const sdkPkg = JSON.parse(readFileSync(resolve(ROOT, '../temanten-sdk/package.json'), 'utf-8'));
  const sdkVersion: string = sdkPkg.version;
  const sdkUrl = `https://github.com/sementaraid/temanten-sdk/releases/download/v${sdkVersion}/temanten-sdk-${sdkVersion}.tgz`;

  // Dynamic files (not in base/)
  writeFile(
    join(templateDir, 'manifest.json'),
    JSON.stringify({ slug, name, description, category, tags, version }, null, 2) + '\n',
  );

  writeFile(
    join(templateDir, 'package.json'),
    JSON.stringify(
      {
        name: `@temanten/template-${slug}`,
        version,
        private: false,
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        peerDependencies: TEMPLATE_PEER_DEPS,
        dependencies: { '@temanten/sdk': sdkUrl, ...TEMPLATE_DEPS },
        devDependencies: TEMPLATE_DEV_DEPS,
      },
      null,
      2,
    ) + '\n',
  );

  // Static files copied from scripts/base/
  copyBaseFiles(templateDir, { SLUG: slug });

  console.log(chalk.green.bold(`\n✓ Template '${slug}' created.\n`));
  console.log('Next steps:');
  console.log(chalk.dim(`  cd templates/${slug}`));
  console.log(chalk.dim('  pnpm install'));
  console.log(chalk.dim('  pnpm temanten dev --slug ' + slug));
  console.log('');
}
