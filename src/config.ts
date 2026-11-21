export interface HueConfig {
  clientId: string
  appId: string
  workerUrl: string
  authorizeUrl: string
}

const metaEnv: Partial<ImportMetaEnv> =
  (import.meta as ImportMeta & { env?: Partial<ImportMetaEnv> }).env ?? {}

export const HUE_CONFIG: HueConfig = {
  clientId: (metaEnv.VITE_HUE_CLIENT_ID || '').trim(),
  appId: (metaEnv.VITE_HUE_APP_ID || 'open-hue-controller').trim(),
  workerUrl: (metaEnv.VITE_WORKER_URL || '').trim().replace(/\/+$/, ''),
  authorizeUrl: 'https://api.meethue.com/v2/oauth2/authorize',
}

export function isOAuthConfigured(): boolean {
  return Boolean(
    HUE_CONFIG.clientId &&
      HUE_CONFIG.clientId !== 'your_hue_client_id_here' &&
      HUE_CONFIG.workerUrl &&
      !HUE_CONFIG.workerUrl.includes('your-subdomain.workers.dev')
  )
}
