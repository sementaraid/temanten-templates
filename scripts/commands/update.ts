import chalk from 'chalk';
import { input, confirm } from '@inquirer/prompts';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { readTemplates } from '../lib/templates.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TEMPLATES_DIR = join(ROOT, 'templates');

export async function runUpdate(opts: {
  slug?: string;
  version?: string;
  yes?: boolean;
}) {
  const sdkVersion =
    opts.version ??
    (await input({
      message: 'SDK version to pin (e.g. 1.0.0):',
      validate: (v) => /^\d+\.\d+\.\d+/.test(v.trim()) || 'Enter a valid semver version',
    }));

  const sdkUrl = `git+ssh://git@github.com/sementaraid/temanten-sdk.git#v${sdkVersion.trim()}`;

  const allTemplates = readTemplates(TEMPLATES_DIR);
  if (!allTemplates.length) {
    console.error(chalk.red('No templates found.'));
    process.exit(1);
  }

  const targets = opts.slug
    ? allTemplates.filter((t) => t.slug === opts.slug)
    : allTemplates;

  if (!targets.length) {
    console.error(chalk.red(`Template '${opts.slug}' not found.`));
    process.exit(1);
  }

  console.log('');
  console.log(chalk.bold('  SDK update'));
  console.log(`  ${chalk.dim('Version')}   : ${chalk.yellow(`v${sdkVersion}`)}`);
  console.log(`  ${chalk.dim('Reference')} : ${chalk.dim(sdkUrl)}`);
  console.log(`  ${chalk.dim('Templates')} : ${targets.map((t) => chalk.cyan(t.slug)).join(', ')}`);
  console.log('');

  if (!opts.yes) {
    const ok = await confirm({ message: `Update @temanten/sdk in ${targets.length} template(s) and run pnpm install?` });
    if (!ok) {
      console.log(chalk.yellow('Cancelled.'));
      process.exit(0);
    }
  }

  console.log('');

  for (const { slug } of targets) {
    const pkgPath = join(TEMPLATES_DIR, slug, 'package.json');
    if (!existsSync(pkgPath)) {
      console.log(chalk.yellow(`  ⚠ Skipping ${slug}: package.json not found`));
      continue;
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const prev = pkg.dependencies?.['@temanten/sdk'] ?? '(none)';

    if (!pkg.dependencies) pkg.dependencies = {};
    pkg.dependencies['@temanten/sdk'] = sdkUrl;

    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(
      chalk.green('  ✓') + ' ' + chalk.cyan(slug) +
      '  ' + chalk.dim(prev) + chalk.dim(' → ') + chalk.yellow(sdkUrl),
    );
  }

  console.log('');
  console.log(chalk.dim('  Running pnpm install --force at workspace root…'));
  execSync('pnpm install --force', { cwd: ROOT, stdio: 'inherit' });

  console.log('');
  console.log(chalk.green.bold('✓ Done.\n'));
}
