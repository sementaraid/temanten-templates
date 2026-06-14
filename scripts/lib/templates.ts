import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface Manifest {
  slug: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  bundleUrl?: string;
  cssUrl?: string;
}

export function readTemplates(templatesDir: string): Array<{ slug: string; manifest: Manifest }> {
  if (!existsSync(templatesDir)) return [];
  return readdirSync(templatesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const manifest: Manifest = JSON.parse(
        readFileSync(join(templatesDir, d.name, 'manifest.json'), 'utf-8'),
      );
      return { slug: d.name, manifest };
    });
}

export async function pickTemplate(
  templates: Array<{ slug: string; manifest: Manifest }>,
  slugArg: string | undefined,
  message: string,
): Promise<{ slug: string; manifest: Manifest }> {
  if (slugArg) {
    const found = templates.find((t) => t.slug === slugArg);
    if (!found) {
      console.error(chalk.red(`Template '${slugArg}' not found.`));
      process.exit(1);
    }
    return found;
  }
  const slug = await select({
    message,
    choices: templates.map((t) => ({
      name: `${chalk.cyan(t.slug)}  ${chalk.dim(t.manifest.name)}`,
      value: t.slug,
      description: t.manifest.description,
    })),
  });
  return templates.find((t) => t.slug === slug)!;
}
