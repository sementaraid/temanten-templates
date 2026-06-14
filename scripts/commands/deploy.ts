import chalk from 'chalk';
import { input, confirm } from '@inquirer/prompts';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';
import dotenv from 'dotenv';
import { readTemplates, pickTemplate, type Manifest } from '../lib/templates.js';
import {
  requireEnv,
  buildS3Client,
  s3Put,
  fetchRegistry,
  walkDir,
  getContentType,
  invalidateCdn,
} from '../lib/s3.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const SCRIPTS_DIR = join(ROOT, 'scripts');

type DeployEnv = 'dev' | 'prod';

function loadEnv(env: DeployEnv): void {
  const envFile = env === 'dev' ? '.env.dev' : '.env';
  const envPath = join(SCRIPTS_DIR, envFile);
  if (!existsSync(envPath)) {
    throw new Error(`Env file not found: ${envPath}`);
  }
  dotenv.config({ path: envPath, override: true });
}

export async function runDeploy(opts: { slug?: string; version?: string; env?: string; yes?: boolean }) {
  const deployEnv: DeployEnv = opts.env === 'dev' ? 'dev' : 'prod';
  loadEnv(deployEnv);
  const templates = readTemplates(TEMPLATES_DIR);
  if (!templates.length) {
    console.error(chalk.red('No templates found. Run `pnpm temanten create` first.'));
    process.exit(1);
  }

  const template = await pickTemplate(templates, opts.slug, 'Which template do you want to deploy?');
  const { slug } = template;

  const version =
    opts.version ??
    (await input({ message: 'Version to deploy:', default: template.manifest.version }));

  const cdnBaseUrl = requireEnv('VITE_CDN_BASE_URL');
  const cdnPrefix = `templates/${slug}/v${version}`;
  const bundleUrl = `${cdnBaseUrl}/${cdnPrefix}/bundle.umd.js`;
  const cssUrl = `${cdnBaseUrl}/${cdnPrefix}/style.css`;

  const envLabel = deployEnv === 'dev' ? chalk.yellow('dev') : chalk.green('prod');
  console.log('');
  console.log(`  ${chalk.dim('Env')}      : ${envLabel}`);
  console.log(`  ${chalk.dim('Template')} : ${chalk.cyan(slug)} @ ${chalk.yellow(version)}`);
  console.log(`  ${chalk.dim('Bundle')}   : ${bundleUrl}`);
  console.log(`  ${chalk.dim('Registry')} : ${requireEnv('VITE_REGISTRY_URL')}`);
  console.log('');

  if (!opts.yes) {
    const ok = await confirm({ message: 'Proceed with build and deploy?' });
    if (!ok) {
      console.log(chalk.yellow('Cancelled.'));
      process.exit(0);
    }
  }

  // Build
  console.log(chalk.bold(`\nBuilding ${chalk.cyan(slug)}…`));
  process.env.VITE_DEPLOY_VERSION = version;
  execSync(`pnpm --filter "@temanten/template-${slug}" build`, { stdio: 'inherit', cwd: ROOT });

  // Upload
  const bucket = requireEnv('VITE_CDN_BUCKET');
  const s3 = buildS3Client();
  const distDir = join(TEMPLATES_DIR, slug, 'dist');
  const allFiles = existsSync(distDir) ? walkDir(distDir) : [];

  const cacheControl = deployEnv === 'dev' ? 'no-cache' : 'public, max-age=31536000, immutable';
  console.log(chalk.bold(`\nUploading ${allFiles.length} file(s) to s3://${bucket}/${cdnPrefix}/`));
  for (const filePath of allFiles) {
    const relPath = relative(distDir, filePath);
    await s3Put(
      s3,
      bucket,
      `${cdnPrefix}/${relPath}`,
      readFileSync(filePath),
      getContentType(filePath),
      cacheControl,
    );
    console.log(chalk.green('  ✓') + ' ' + chalk.dim(relPath));
  }

  // Registry
  console.log(chalk.bold('\nUpdating registry.json…'));
  const registry = await fetchRegistry(s3, bucket);
  const entry: Manifest = { ...template.manifest, version, bundleUrl, cssUrl };
  const idx = registry.findIndex((t) => t.slug === slug);
  if (idx >= 0) registry[idx] = entry;
  else registry.push(entry);
  await s3Put(
    s3,
    bucket,
    'templates/registry.json',
    Buffer.from(JSON.stringify(registry, null, 2)),
    'application/json',
    'no-cache',
  );
  console.log(chalk.green('  ✓ registry.json updated'));

  // CDN invalidation
  console.log(chalk.bold('\nInvalidating CloudFront cache…'));
  await invalidateCdn(slug, version);

  console.log(chalk.green.bold(`\n✓ Deployed ${slug}@${version}`));
  console.log(chalk.dim(`  ${bundleUrl}\n`));
}
