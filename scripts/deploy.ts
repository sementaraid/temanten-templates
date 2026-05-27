/**
 * Interactive deploy CLI for Temanten templates.
 *
 * Interactive (local):
 *   pnpm deploy
 *
 * Non-interactive (CI / scripted):
 *   pnpm deploy --slug jogja-1 --version 1.0.1 --yes
 */
import dotenv from 'dotenv';
import { select, input, confirm } from '@inquirer/prompts';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, resolve, extname, relative } from 'node:path';
import { parseArgs } from 'node:util';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env') });

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

async function invalidateCdn(slug: string, version: string): Promise<void> {
  const distributionId = process.env.VITE_CDN_DISTRIBUTION_ID;
  if (!distributionId) {
    console.log('\nSkipping CloudFront invalidation (VITE_CDN_DISTRIBUTION_ID not set).');
    return;
  }

  const cf = new CloudFrontClient({ region: process.env.AWS_DEFAULT_REGION ?? 'us-east-1' });
  await cf.send(
    new CreateInvalidationCommand({
      DistributionId: process.env.VITE_CDN_DISTRIBUTION_ID!,
      InvalidationBatch: {
        CallerReference: `fix-fonts-cors-${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: ['/templates/*'],  // wipe everything
        },
      },
    }),
  );
  console.log(`  ✓ Invalidated`);
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

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(fullPath));
    else results.push(fullPath);
  }
  return results;
}

function getContentType(filePath: string): string {
  const types: Record<string, string> = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
  };
  return types[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
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
  const cdnBaseUrl = requireEnv('VITE_CDN_BASE_URL');
  const cdnPrefix = `templates/${slug}/v${version}`;
  const bundleUrl = `${cdnBaseUrl}/${cdnPrefix}/bundle.umd.js`;
  const cssUrl = `${cdnBaseUrl}/${cdnPrefix}/style.css`;

  console.log('');
  console.log('  Template :', `${template.manifest.name} (${slug}@${version})`);
  console.log('  Bundle   :', bundleUrl);
  console.log('  Registry :', requireEnv('VITE_REGISTRY_URL'));
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
  process.env.VITE_DEPLOY_VERSION = version as string;
  execSync(`pnpm --filter "@temanten/template-${slug}" build`, {
    stdio: 'inherit',
    cwd: ROOT,
  });

  // ── Upload ─────────────────────────────────────────────────────────────────
  const bucket = requireEnv('VITE_CDN_BUCKET');
  const s3 = buildS3Client();

  const templateDir = join(TEMPLATES_DIR, slug as string);
  const distDir = join(templateDir, 'dist');
  const allFiles = existsSync(distDir) ? walkDir(distDir) : [];

  console.log(`\nUploading ${allFiles.length} files to s3://${bucket}/${cdnPrefix}/`);

  for (const filePath of allFiles) {
    const relPath = relative(distDir, filePath);
    const s3Key = `${cdnPrefix}/${relPath}`;
    await s3Put(s3, bucket, s3Key, readFileSync(filePath), getContentType(filePath), 'public, max-age=31536000, immutable');
    console.log(`  ✓ ${relPath}`);
  }

  // ── Update registry ────────────────────────────────────────────────────────
  console.log('\nUpdating registry.json on CDN...');

  const registry = await fetchRegistry(s3, bucket);
  const entry: Manifest = { ...template.manifest, version: version as string, bundleUrl, cssUrl };
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

  // ── CloudFront invalidation ────────────────────────────────────────────────
  console.log('\nInvalidating CloudFront cache...');
  await invalidateCdn(slug as string, version as string);

  console.log(`\n✓ Done. ${bundleUrl}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
