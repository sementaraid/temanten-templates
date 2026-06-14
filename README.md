# temanten-templates

Monorepo for Temanten wedding invitation templates. Each template is an independently built React component published as a UMD bundle to S3/CloudFront and consumed by the Temanten app via the CDN registry.

## Repository structure

```
temanten-templates/
├── templates/            # one directory per template
│   └── jogja-1/
│       ├── manifest.json # template metadata
│       ├── src/          # React source
│       ├── dev/          # dev entry point (index.html)
│       ├── public/       # static assets (fonts, images)
│       └── vite.config.ts
├── scripts/
│   ├── temanten.ts       # unified CLI entry point
│   ├── commands/         # dev | build | deploy | create | list
│   ├── lib/              # s3, templates helpers
│   ├── base/             # scaffold files copied into new templates
│   ├── .env              # production env (gitignored)
│   └── .env.dev          # dev env (gitignored)
└── package.json
```

## Prerequisites

- Node.js ≥ 18
- pnpm
- AWS credentials with S3 and CloudFront access (configured in env files)

## Setup

```bash
pnpm install
```

### Environment files

The CLI reads environment variables from files inside `scripts/`. Two environments are supported:

| File | Purpose |
|---|---|
| `scripts/.env` | Production — `temanten` bucket, production CloudFront |
| `scripts/.env.dev` | Development — `temanten-dev` bucket, dev CloudFront |

Both files are gitignored. Copy and fill in `scripts/.env.dev` before deploying to the dev bucket:

```bash
# scripts/.env.dev
VITE_CDN_BUCKET=temanten-dev
VITE_CDN_BASE_URL=https://<dev-cloudfront-domain>
VITE_REGISTRY_URL=https://<dev-cloudfront-domain>/templates/registry.json
VITE_CDN_DISTRIBUTION_ID=<dev-distribution-id>

AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_DEFAULT_REGION=ap-southeast-1
```

## CLI reference

All commands are run via:

```bash
pnpm temanten <command> [options]
```

### `dev` — run a template locally

```bash
pnpm temanten dev
pnpm temanten dev --slug jogja-1
```

Starts the Vite dev server for the selected template. Assets are served locally; `assetUrl()` resolves to `/` in dev mode so no S3 access is required.

---

### `build` — build a template bundle

```bash
pnpm temanten build
pnpm temanten build --slug jogja-1
```

Produces `templates/<slug>/dist/bundle.umd.js` and `style.css`. The UMD global is named `TemantanTemplate_<slug>` (e.g. `TemantanTemplate_jogja1`).

---

### `deploy` — build, upload, and register a template

```bash
# deploy to dev bucket (for templates still in development)
pnpm temanten deploy --slug jogja-1 --env dev

# deploy to production bucket (released templates)
pnpm temanten deploy --slug jogja-1
pnpm temanten deploy --slug jogja-1 --version 1.2.0 --yes
```

| Option | Default | Description |
|---|---|---|
| `--slug` | interactive | Template slug |
| `--version` | from `manifest.json` | Semver version to deploy |
| `--env` | `prod` | Target environment: `dev` or `prod` |
| `--yes` / `-y` | false | Skip confirmation prompt |

What the deploy command does:
1. Loads `scripts/.env.dev` or `scripts/.env` depending on `--env`
2. Runs `vite build` with `VITE_DEPLOY_VERSION` injected
3. Uploads `dist/` to `s3://<bucket>/templates/<slug>/v<version>/`
4. Updates `templates/registry.json` in the bucket
5. Invalidates the CloudFront distribution

**Cache policy:** dev deploys use `no-cache`; prod deploys use `immutable` (one-year TTL).

> **Dev vs prod separation** — dev templates live in `temanten-dev` with their own `registry.json`. The Temanten app reads from whichever registry URL is configured in its environment, so dev templates never appear in production and vice versa.

---

### `create` — scaffold a new template

```bash
pnpm temanten create
pnpm temanten create --slug bandung-1 --name "Bandung Klasik" --yes
```

| Option | Description |
|---|---|
| `--slug` | Lowercase letters, numbers, hyphens (e.g. `bandung-1`) |
| `--name` | Display name shown in the app |
| `--description` | Short description |
| `--category` | `ELEGANT` \| `MODERN` \| `RUSTIC` \| `MINIMALIST` \| `TRADITIONAL` |
| `--tags` | Comma-separated tags |
| `--version` | Initial version (default: `1.0.0`) |
| `--yes` | Skip confirmation |

Copies `scripts/base/` into `templates/<slug>/`, substitutes `{{SLUG}}` placeholders, and writes `manifest.json` and `package.json`.

After scaffolding:

```bash
pnpm install
pnpm temanten dev --slug <slug>
```

---

### `list` — list local templates

```bash
pnpm temanten list
```

Prints a table of all templates in `templates/` with their slug, name, category, version, and whether a `bundleUrl` is present in the manifest (indicating a previous deploy).

---

## Template anatomy

```
templates/<slug>/
├── manifest.json          # slug, name, description, category, tags, version
├── package.json           # @temanten/template-<slug>
├── vite.config.ts         # inherited from scripts/base/
├── tsconfig.json
├── src/
│   ├── index.tsx          # registers the template and exports TemplatePage
│   ├── manifest.ts        # re-exports manifest.json as typed TemplateManifest
│   ├── section-config.ts  # ordered list of section components
│   ├── containers/        # one component per section (e.g. Hero, Gallery)
│   └── hooks/             # template-specific hooks
├── dev/
│   └── index.html         # dev entry point (loads TemantanSDK from CDN)
└── public/
    └── fonts/             # local font files (referenced via assetUrl())
```

### Asset URLs

Use `assetUrl()` from `@/lib/asset` for all static assets:

```ts
import { assetUrl } from '@/lib/asset';

// dev → '/fonts/my-font.ttf'
// prod → 'https://<cdn>/templates/jogja-1/v1.0.0/fonts/my-font.ttf'
const url = assetUrl('/fonts/my-font.ttf');
```

### Sections

Register sections in `src/section-config.ts`:

```ts
import { Hero } from './containers/hero';
import { Gallery } from './containers/gallery';

export const TEMPLATE_SECTIONS: TemplateSectionEntry[] = [
  { id: 'hero', Component: Hero },
  { id: 'gallery', Component: Gallery },
];
```

### Invitation data

Access the invitation data and UI state via the SDK store:

```ts
import { useTemantenStore } from '@temanten/sdk';

export function Hero() {
  const { invitation, ui } = useTemantenStore();
  const { bride, groom, ceremony } = invitation.data;
  // ...
}
```

## Development workflow

```
create → dev → build → deploy --env dev → (review) → deploy --env prod
```

1. `pnpm temanten create --slug <slug>` — scaffold the template
2. `pnpm temanten dev --slug <slug>` — iterate locally
3. `pnpm temanten deploy --slug <slug> --env dev` — publish to dev bucket for preview
4. `pnpm temanten deploy --slug <slug>` — release to production
