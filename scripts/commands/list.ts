import chalk from 'chalk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readTemplates } from '../lib/templates.js';

const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'templates');

export async function runList(_opts: Record<string, unknown>): Promise<void> {
  const templates = readTemplates(TEMPLATES_DIR);

  if (templates.length === 0) {
    console.log(chalk.yellow('No templates found in templates/'));
    return;
  }

  const COL = {
    slug: 12,
    name: 22,
    category: 14,
    version: 9,
    deployed: 9,
  };

  const header = [
    chalk.bold('SLUG').padEnd(COL.slug),
    chalk.bold('NAME').padEnd(COL.name),
    chalk.bold('CATEGORY').padEnd(COL.category),
    chalk.bold('VERSION').padEnd(COL.version),
    chalk.bold('DEPLOYED'),
  ].join('  ');

  const divider = '─'.repeat(
    COL.slug + COL.name + COL.category + COL.version + COL.deployed + 8,
  );

  console.log('');
  console.log(header);
  console.log(chalk.dim(divider));

  for (const { slug, manifest } of templates) {
    const deployed = manifest.bundleUrl
      ? chalk.green('✓ yes')
      : chalk.dim('─ no');

    const row = [
      chalk.cyan(slug.padEnd(COL.slug)),
      manifest.name.padEnd(COL.name),
      chalk.dim(manifest.category.padEnd(COL.category)),
      manifest.version.padEnd(COL.version),
      deployed,
    ].join('  ');

    console.log(row);
  }

  console.log('');
  console.log(
    chalk.dim(`${templates.length} template(s) — run `),
    chalk.bold('pnpm temanten deploy --slug <slug>'),
    chalk.dim('to deploy'),
  );
  console.log('');
}
