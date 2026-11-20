export interface HueConfig {
  readonly clientId: string
  readonly appId: string
  readonly workerUrl: string
  readonly authorizeUrl: string
}

export const HUE_CONFIG: HueConfig = {
  clientId: (import.meta.env.VITE_HUE_CLIENT_ID || '').trim(),
  appId: (import.meta.env.VITE_HUE_APP_ID || 'open-hue-controller').trim(),
  workerUrl: (import.meta.env.VITE_WORKER_URL || '').trim().replace(/\/+$/, ''),
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
