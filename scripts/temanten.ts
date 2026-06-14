/**
 * Temanten unified CLI
 *
 * Usage:
 *   pnpm temanten dev                              # interactive: pick a template and run dev server
 *   pnpm temanten dev --slug jogja-1              # direct
 *
 *   pnpm temanten build                            # interactive: pick a template and build
 *   pnpm temanten build --slug jogja-1
 *
 *   pnpm temanten deploy                           # interactive: build + upload + invalidate CDN
 *   pnpm temanten deploy --slug jogja-1 --version 1.0.1 --yes
 *
 *   pnpm temanten create                           # scaffold a new template
 *   pnpm temanten create --slug bandung-1 --name "Bandung Klasik" --yes
 */

import { Command } from 'commander';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CATEGORIES } from './constants.js';
import { runDev } from './commands/dev.js';
import { runBuild } from './commands/build.js';
import { runDeploy } from './commands/deploy.js';
import { runCreate } from './commands/create.js';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

function bail(err: unknown): never {
  console.error(chalk.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
}

const program = new Command()
  .name('temanten')
  .description('Temanten template CLI')
  .version('1.0.0');

program
  .command('dev')
  .description('Run a template in dev mode')
  .option('--slug <slug>', 'Template slug')
  .action((opts) => runDev(opts).catch(bail));

program
  .command('build')
  .description('Build a template')
  .option('--slug <slug>', 'Template slug')
  .action((opts) => runBuild(opts).catch(bail));

program
  .command('deploy')
  .description('Build, upload, and register a template')
  .option('--slug <slug>', 'Template slug')
  .option('--version <version>', 'Version to deploy')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action((opts) => runDeploy(opts).catch(bail));

program
  .command('create')
  .description('Scaffold a new template')
  .option('--slug <slug>', 'Template slug')
  .option('--name <name>', 'Display name')
  .option('--description <desc>', 'Short description')
  .option('--category <category>', `Category: ${CATEGORIES.join(' | ')}`)
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--version <version>', 'Initial version')
  .option('-y, --yes', 'Skip confirmation prompt')
  .action((opts) => runCreate(opts).catch(bail));

program.parse();
