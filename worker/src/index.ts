export interface Env {
  ALLOWED_ORIGINS?: string
  HUE_CLIENT_ID?: string
  HUE_CLIENT_SECRET?: string
}

interface HueOAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  error?: string
  error_description?: string
}

interface HueBridgeRegisterEntry {
  success?: { username?: string }
  error?: { description?: string }
}

class HttpError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

const HUE_BASE = 'https://api.meethue.com'
const MAX_BODY_BYTES = 16_384
const UPSTREAM_TIMEOUT_MS = 12_000
const CLIP_PATH_RE = /^\/api\/clip\/v2\/resource(?:\/(light|grouped_light|scene)\/[a-zA-Z0-9-]+)?$/

function parseAllowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isOriginAllowed(origin: string, allowed: string[]): boolean {
  if (!origin) return true
  if (allowed.includes('*')) return true
  return allowed.includes(origin)
}

function getCorsHeaders(request: Request, allowed: string[]): Record<string, string> {
  const origin = request.headers.get('Origin') || ''
  const allowOrigin = allowed.includes('*')
    ? '*'
    : allowed.includes(origin)
      ? origin
      : ''

  return {
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, hue-application-key',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, cors: Record<string, string>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

async function readBoundedBody(request: Request): Promise<string> {
  const contentLength = Number(request.headers.get('Content-Length') || '0')
  if (contentLength > MAX_BODY_BYTES) {
    throw new HttpError('Request payload too large', 413)
  }
  const text = await request.text()
  if (text.length > MAX_BODY_BYTES) {
    throw new HttpError('Request payload too large', 413)
  }
  return text
}

async function parseJsonBody<T>(request: Request): Promise<T> {
  const raw = await readBoundedBody(request)
  try {
    return JSON.parse(raw) as T
  } catch {
    throw new HttpError('Invalid JSON request body', 400)
  }
}

async function pairBridge(accessToken: string): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  const linkRes = await fetch(`${HUE_BASE}/route/api/0/config`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ linkbutton: true }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  if (!linkRes.ok) {
    throw new Error(`Virtual link-button failed (${linkRes.status}): ${await linkRes.text()}`)
  }

  const regRes = await fetch(`${HUE_BASE}/route/api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ devicetype: 'open_hue_controller#browser', generateclientkey: true }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  const regData = (await regRes.json()) as HueBridgeRegisterEntry[]
  const username = Array.isArray(regData) ? regData[0]?.success?.username : undefined
  if (!username) {
    const desc = (Array.isArray(regData) && regData[0]?.error?.description) || JSON.stringify(regData)
    throw new Error(`Bridge registration failed: ${desc}`)
  }
  return username
}

async function requestOAuthToken(
  params: Record<string, string>,
  env: Env
): Promise<HueOAuthTokenResponse> {
  if (!env.HUE_CLIENT_ID || !env.HUE_CLIENT_SECRET) {
    throw new HttpError('Worker missing HUE_CLIENT_ID or HUE_CLIENT_SECRET secrets.', 500)
  }
  const basic = btoa(`${env.HUE_CLIENT_ID}:${env.HUE_CLIENT_SECRET}`)
  const res = await fetch(`${HUE_BASE}/v2/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  const data = (await res.json().catch(() => ({}))) as HueOAuthTokenResponse
  if (!res.ok) {
    throw new HttpError(
      data.error_description || data.error || `OAuth failed (${res.status})`,
      res.status
    )
  }
  return data
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigins = parseAllowedOrigins(env)
    const cors = getCorsHeaders(request, allowedOrigins)
    const origin = request.headers.get('Origin') || ''

    if (!isOriginAllowed(origin, allowedOrigins)) {
      return json({ error: 'Origin not allowed' }, 403, cors)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    try {
      if (url.pathname === '/auth/token' && request.method === 'POST') {
        const { code } = await parseJsonBody<{ code?: string }>(request)
        if (!code || typeof code !== 'string') {
          return json({ error: 'Missing authorization code' }, 400, cors)
        }

        const tokens = await requestOAuthToken({ code, grant_type: 'authorization_code' }, env)
        let application_key: string | null = null
        let pairing_warning: string | null = null
        try {
          application_key = await pairBridge(tokens.access_token)
        } catch (e) {
          pairing_warning = e instanceof Error ? e.message : String(e)
        }
        return json({ ...tokens, application_key, pairing_warning }, 200, cors)
      }

      if (url.pathname === '/auth/refresh' && request.method === 'POST') {
        const { refresh_token } = await parseJsonBody<{ refresh_token?: string }>(request)
        if (!refresh_token || typeof refresh_token !== 'string') {
          return json({ error: 'Missing refresh_token' }, 400, cors)
        }

        const tokens = await requestOAuthToken(
          { refresh_token, grant_type: 'refresh_token' },
          env
        )
        return json(tokens, 200, cors)
      }

      if (url.pathname === '/auth/pair' && request.method === 'POST') {
        const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
        if (!token) return json({ error: 'Missing Bearer token' }, 401, cors)

        const application_key = await pairBridge(token)
        return json({ application_key }, 200, cors)
      }

      if (url.pathname.startsWith('/api/clip/v2/resource')) {
        if (request.method !== 'GET' && request.method !== 'PUT') {
          return json({ error: 'Method not allowed' }, 405, cors)
        }
        if (!CLIP_PATH_RE.test(url.pathname) || url.search) {
          return json({ error: 'Invalid CLIP v2 resource path' }, 400, cors)
        }
        if (request.method === 'PUT' && url.pathname === '/api/clip/v2/resource') {
          return json({ error: 'Resource ID required for PUT' }, 400, cors)
        }

        const targetUrl = `${HUE_BASE}/route${url.pathname.slice(4)}`
        const headers = new Headers()
        const auth = request.headers.get('Authorization')
        const appKey = request.headers.get('hue-application-key')
        if (!auth || !appKey) {
          return json({ error: 'Missing authentication headers' }, 401, cors)
        }
        headers.set('Authorization', auth)
        headers.set('hue-application-key', appKey)

        const hasBody = request.method === 'PUT'
        const bodyText = hasBody ? await readBoundedBody(request) : undefined
        if (hasBody) headers.set('Content-Type', 'application/json')

        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: bodyText,
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        })

        return new Response(await upstream.text(), {
          status: upstream.status,
          headers: {
            ...cors,
            'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
          },
        })
      }

      return json({ error: 'Not found' }, 404, cors)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        return json({ error: 'Upstream Philips Hue request timed out' }, 504, cors)
      }
      const status = err instanceof HttpError ? err.status : 500
      const message = err instanceof Error ? err.message : 'Internal Worker Error'
      return json({ error: message }, status, cors)
    }
  },
} satisfies ExportedHandler<Env>

