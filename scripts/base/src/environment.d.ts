/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CDN_BASE_URL: string;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
