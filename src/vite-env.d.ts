/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUE_CLIENT_ID?: string
  readonly VITE_HUE_APP_ID?: string
  readonly VITE_WORKER_URL?: string
  readonly VITE_CF_ANALYTICS_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
