import chalk from 'chalk';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import type { Manifest } from './templates.js';

export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

export function buildS3Client(): S3Client {
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

export async function s3Put(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer | string,
  contentType: string,
  cacheControl: string,
) {
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }),
  );
}

export async function fetchRegistry(client: S3Client, bucket: string): Promise<Manifest[]> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: 'templates/registry.json' }));
    return JSON.parse((await res.Body?.transformToString()) ?? '[]');
  } catch {
    return [];
  }
}

export function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkDir(fullPath));
    else results.push(fullPath);
  }
  return results;
}

export function getContentType(filePath: string): string {
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

export async function invalidateCdn(slug: string, version: string) {
  const distributionId = process.env.VITE_CDN_DISTRIBUTION_ID;
  if (!distributionId) {
    console.log(chalk.dim('\nSkipping CloudFront invalidation (VITE_CDN_DISTRIBUTION_ID not set).'));
    return;
  }
  const prefix = `/templates/${slug}/v${version}`;
  const paths = [`${prefix}/bundle.umd.js`, `${prefix}/style.css`, `${prefix}/fonts/*`];
  const cf = new CloudFrontClient({ region: process.env.AWS_DEFAULT_REGION ?? 'us-east-1' });
  await cf.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `${slug}-v${version}-${Date.now()}`,
        Paths: { Quantity: paths.length, Items: paths },
      },
    }),
  );
  console.log(chalk.green(`  ✓ Invalidated CDN: ${paths.join(', ')}`));
}
