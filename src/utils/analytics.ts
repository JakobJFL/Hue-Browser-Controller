const CF_BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js'
const VALID_CF_TOKEN_RE = /^[a-f0-9-]{16,64}$/i

export function isValidCfAnalyticsToken(rawToken: string | undefined): boolean {
  const token = (rawToken || '').trim()
  return VALID_CF_TOKEN_RE.test(token)
}

export function shouldLoadAnalytics(
  rawToken: string | undefined,
  hostname: string | undefined
): boolean {
  if (!isValidCfAnalyticsToken(rawToken)) return false
  const host = (hostname || '').toLowerCase()
  if (!host || host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
    return false
  }
  return true
}

export function initCloudflareAnalytics(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const metaEnv: Partial<ImportMetaEnv> =
    (import.meta as ImportMeta & { env?: Partial<ImportMetaEnv> }).env ?? {}
  const token = (metaEnv.VITE_CF_ANALYTICS_TOKEN || '').trim()

  if (!shouldLoadAnalytics(token, window.location?.hostname)) return
  if (document.querySelector(`script[src="${CF_BEACON_SRC}"]`)) return

  const script = document.createElement('script')
  script.defer = true
  script.src = CF_BEACON_SRC
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }))
  document.head.appendChild(script)
}
