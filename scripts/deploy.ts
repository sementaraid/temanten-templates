/**
 * Interactive deploy CLI for Temanten templates.
 *
 * Interactive (local):
 *   pnpm deploy
 *
 * Non-interactive (CI / scripted):
 *   pnpm deploy --slug jogja-1 --version 1.0.1 --yes
 */
import 'dotenv/config';
import { select, input, confirm } from '@inquirer/prompts';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATES_DIR = join(ROOT, 'templates');

interface Manifest {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  bundleUrl?: string;
  cssUrl?: string;
}

function readAvailableTemplates() {
  return readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const manifestPath = join(TEMPLATES_DIR, d.name, 'manifest.json');
      const manifest: Manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      return { slug: d.name, manifest };
    });
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function buildS3Client(): S3Client {
  const endpointUrl = process.env.AWS_ENDPOINT_URL;
  return new S3Client({
    region: process.env.AWS_DEFAULT_REGION ?? 'auto',
    ...(endpointUrl ? { endpoint: endpointUrl } : {}),
    credentials: {
      accessKeyId: requireEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: requireEnv('AWS_SECRET_ACCESS_KEY'),
    },
  });
}

async function s3Put(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType: string,
  cacheControl: string,
) {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
}

async function fetchRegistry(client: S3Client, bucket: string): Promise<Manifest[]> {
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: 'templates/registry.json' }),
    );
    const body = await res.Body?.transformToString();
    return JSON.parse(body ?? '[]');
  } catch {
    return [];
  }
}

async function main() {
  const { values: args } = parseArgs({
    args: process.argv.slice(2),
    options: {
      slug: { type: 'string' },
      version: { type: 'string' },
      yes: { type: 'boolean', short: 'y', default: false },
    },
    strict: false,
  });

  const templates = readAvailableTemplates();
  if (templates.length === 0) {
    console.error('No templates found in templates/');
    process.exit(1);
  }

  // ── Template selection ─────────────────────────────────────────────────────
  let slug = args.slug;
  if (!slug) {
    slug = await select({
      message: 'Which template do you want to deploy?',
      choices: templates.map((t) => ({
        name: `${t.manifest.name}  (${t.slug})`,
        value: t.slug,
        description: t.manifest.description,
      })),
    });
  }

  const template = templates.find((t) => t.slug === slug);
  if (!template) {
    console.error(`Template '${slug}' not found in templates/`);
    process.exit(1);
  }

  // ── Version ────────────────────────────────────────────────────────────────
  let version = args.version;
  if (!version) {
    version = await input({
      message: 'Version to deploy:',
      default: template.manifest.version,
    });
  }

  // ── Summary & confirmation ─────────────────────────────────────────────────
  const cdnBaseUrl = requireEnv('CDN_BASE_URL');
  const cdnPrefix = `templates/${slug}/v${version}`;
  const bundleUrl = `${cdnBaseUrl}/${cdnPrefix}/bundle.umd.js`;
  const cssUrl = `${cdnBaseUrl}/${cdnPrefix}/style.css`;

  console.log('');
  console.log('  Template :', `${template.manifest.name} (${slug}@${version})`);
  console.log('  Bundle   :', bundleUrl);
  console.log('  Registry :', requireEnv('REGISTRY_URL'));
  console.log('');

  if (!args.yes) {
    const ok = await confirm({ message: 'Proceed with build and deploy?' });
    if (!ok) {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  console.log(`\nBuilding @temanten/template-${slug}...`);
  execSync(`pnpm --filter "@temanten/template-${slug}" build`, {
    stdio: 'inherit',
    cwd: ROOT,
  });

  // ── Upload ─────────────────────────────────────────────────────────────────
  const bucket = requireEnv('CDN_BUCKET');
  const s3 = buildS3Client();

  const templateDir = join(TEMPLATES_DIR, slug);
  const bundlePath = join(templateDir, 'dist', 'bundle.umd.js');
  const cssPath = join(templateDir, 'dist', 'style.css');

  console.log(`\nUploading to s3://${bucket}/${cdnPrefix}/`);

  await s3Put(
    s3,
    bucket,
    `${cdnPrefix}/bundle.umd.js`,
    readFileSync(bundlePath),
    'application/javascript',
    'public, max-age=31536000, immutable',
  );

  if (existsSync(cssPath)) {
    await s3Put(
      s3,
      bucket,
      `${cdnPrefix}/style.css`,
      readFileSync(cssPath),
      'text/css',
      'public, max-age=31536000, immutable',
    );
  }

  // ── Update registry ────────────────────────────────────────────────────────
  console.log('\nUpdating registry.json on CDN...');

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

  console.log(`\n✓ Done. ${bundleUrl}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
