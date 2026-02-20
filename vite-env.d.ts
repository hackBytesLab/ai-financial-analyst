/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETLIFY_SITE_URL?: string;
  readonly VITE_NETLIFY_IDENTITY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
