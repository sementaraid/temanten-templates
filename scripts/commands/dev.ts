import chalk from 'chalk';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readTemplates, pickTemplate } from '../lib/templates.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TEMPLATES_DIR = join(ROOT, 'templates');

export async function runDev(opts: { slug?: string }) {
  const templates = readTemplates(TEMPLATES_DIR);
  if (!templates.length) {
    console.error(chalk.red('No templates found. Run `pnpm temanten create` first.'));
    process.exit(1);
  }

  const { slug } = await pickTemplate(templates, opts.slug, 'Which template do you want to run?');

  console.log(chalk.bold(`\nStarting dev server for ${chalk.cyan(slug)}…\n`));
  execSync(`pnpm --filter "@temanten/template-${slug}" dev`, { stdio: 'inherit', cwd: ROOT });
}
