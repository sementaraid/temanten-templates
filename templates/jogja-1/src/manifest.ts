import type { TemplateManifest } from '@temanten/sdk';
import data from '../manifest.json';

export const manifest: TemplateManifest = {
  slug: data.slug,
  name: data.name,
  description: data.description,
  category: data.category as TemplateManifest['category'],
  tags: data.tags,
};
