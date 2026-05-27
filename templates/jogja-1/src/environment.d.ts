/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CDN_BASE_URL: string;
  readonly VITE_CDN_BUCKET: string;
  readonly VITE_REGISTRY_URL: string;
  readonly VITE_AWS_ACCESS_KEY_ID: string;
  readonly VITE_AWS_SECRET_ACCESS_KEY: string;
  /** Leave blank for AWS S3; set for Cloudflare R2 */
  readonly VITE_AWS_ENDPOINT_URL?: string;
  readonly VITE_AWS_DEFAULT_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
