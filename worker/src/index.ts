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

export class HttpError extends Error {
  status: number
  constructor(message: string, status = 500) {
    super(message)
    this.status = status
  }
}

const HUE_BASE = 'https://api.meethue.com'
export const MAX_BODY_BYTES = 16_384
const UPSTREAM_TIMEOUT_MS = 12_000
export const CLIP_PATH_RE = /^\/api\/clip\/v2\/resource(?:\/(light|grouped_light|scene)\/[a-zA-Z0-9-]+)?$/
const BEARER_TOKEN_RE = /^Bearer\s+([\x21-\x7e]{1,4096})$/i
const APP_KEY_RE = /^[A-Za-z0-9._-]{1,128}$/

export function parseAllowedOrigins(env: Env): string[] {
  return (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean)
}

export function isOriginAllowed(origin: string, allowed: string[]): boolean {
  const normalized = origin.trim().replace(/\/+$/, '')
  if (!normalized || allowed.length === 0) return false
  if (allowed.includes('*')) return true
  return allowed.includes(normalized)
}

function getCorsHeaders(request: Request, allowed: string[]): Record<string, string> {
  const rawOrigin = request.headers.get('Origin') || ''
  const normalizedOrigin = rawOrigin.trim().replace(/\/+$/, '')
  const allowOrigin =
    normalizedOrigin && allowed.includes('*')
      ? '*'
      : normalizedOrigin && allowed.includes(normalizedOrigin)
        ? rawOrigin.trim()
        : ''

  return {
    ...(allowOrigin ? { 'Access-Control-Allow-Origin': allowOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, hue-application-key',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, cors: Record<string, string>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  })

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = BEARER_TOKEN_RE.exec(authHeader.trim())
  return match?.[1] ?? null
}

function requireJsonContentType(request: Request): void {
  const ct = request.headers.get('Content-Type') || ''
  if (!/^application\/json\b/i.test(ct.trim())) {
    throw new HttpError('Content-Type must be application/json', 415)
  }
}

export async function readBoundedBody(request: Request, maxBytes = MAX_BODY_BYTES): Promise<string> {
  const rawLength = request.headers.get('Content-Length')
  if (rawLength !== null) {
    const contentLength = Number(rawLength)
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      throw new HttpError('Invalid Content-Length header', 400)
    }
    if (contentLength > maxBytes) {
      throw new HttpError('Request payload too large', 413)
    }
  }

  if (!request.body) return ''

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) {
      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {})
        throw new HttpError('Request payload too large', 413)
      }
      chunks.push(value)
    }
  }

  const merged = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(merged)
}

export async function parseJsonObjectBody<T extends Record<string, unknown>>(
  request: Request
): Promise<T> {
  requireJsonContentType(request)
  const raw = await readBoundedBody(request)
  if (!raw.trim()) {
    throw new HttpError('Empty JSON request body', 400)
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new HttpError('Invalid JSON request body', 400)
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new HttpError('JSON request body must be an object', 400)
  }
  return parsed as T
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
    const status = linkRes.status === 401 || linkRes.status === 403 ? linkRes.status : 502
    throw new HttpError(`Virtual link-button failed (${linkRes.status}).`, status)
  }

  const regRes = await fetch(`${HUE_BASE}/route/api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ devicetype: 'open_hue_controller#browser' }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  const regData = (await regRes.json().catch(() => null)) as HueBridgeRegisterEntry[] | null
  if (!regRes.ok || !Array.isArray(regData)) {
    const status = regRes.status === 401 || regRes.status === 403 ? regRes.status : 502
    throw new HttpError(`Bridge registration request failed (${regRes.status}).`, status)
  }

  const username = regData[0]?.success?.username
  if (typeof username !== 'string' || !APP_KEY_RE.test(username)) {
    const rawDesc = regData[0]?.error?.description
    const desc = typeof rawDesc === 'string' && rawDesc ? rawDesc.slice(0, 200) : 'No application key returned'
    throw new HttpError(`Bridge registration failed: ${desc}`, 502)
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
  if (!res.ok || typeof data.access_token !== 'string' || !data.access_token) {
    const status = res.status >= 400 && res.status < 500 ? res.status : 502
    throw new HttpError(
      data.error_description || data.error || `OAuth failed (${res.status})`,
      status
    )
  }
  return data
}

export interface WorkerHandler<E = Env> {
  fetch(request: Request, env: E): Promise<Response>
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
        const { code } = await parseJsonObjectBody<{ code?: unknown }>(request)
        if (typeof code !== 'string' || !code.trim() || code.length > 2048) {
          return json({ error: 'Missing or invalid authorization code' }, 400, cors)
        }

        const tokens = await requestOAuthToken({ code: code.trim(), grant_type: 'authorization_code' }, env)
        let application_key: string | null = null
        let pairing_warning: string | null = null
        try {
          application_key = await pairBridge(tokens.access_token)
        } catch (e) {
          pairing_warning = e instanceof Error ? e.message : 'Automatic bridge pairing failed'
        }
        return json({ ...tokens, application_key, pairing_warning }, 200, cors)
      }

      if (url.pathname === '/auth/refresh' && request.method === 'POST') {
        const { refresh_token } = await parseJsonObjectBody<{ refresh_token?: unknown }>(request)
        if (typeof refresh_token !== 'string' || !refresh_token.trim() || refresh_token.length > 4096) {
          return json({ error: 'Missing or invalid refresh_token' }, 400, cors)
        }

        const tokens = await requestOAuthToken(
          { refresh_token: refresh_token.trim(), grant_type: 'refresh_token' },
          env
        )
        return json(tokens, 200, cors)
      }

      if (url.pathname === '/auth/pair' && request.method === 'POST') {
        const token = extractBearerToken(request.headers.get('Authorization'))
        if (!token) return json({ error: 'Missing or invalid Bearer token' }, 401, cors)

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

        const token = extractBearerToken(request.headers.get('Authorization'))
        const appKey = (request.headers.get('hue-application-key') || '').trim()
        if (!token || !APP_KEY_RE.test(appKey)) {
          return json({ error: 'Missing or invalid authentication headers' }, 401, cors)
        }

        const targetUrl = `${HUE_BASE}/route${url.pathname.slice(4)}`
        const headers = new Headers()
        headers.set('Authorization', `Bearer ${token}`)
        headers.set('hue-application-key', appKey)

        let bodyText: string | undefined
        if (request.method === 'PUT') {
          const payload = await parseJsonObjectBody<Record<string, unknown>>(request)
          bodyText = JSON.stringify(payload)
          headers.set('Content-Type', 'application/json')
        }

        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: bodyText,
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        })

        const upstreamText = await upstream.text()
        let responseBody = upstreamText
        try {
          JSON.parse(upstreamText)
        } catch {
          responseBody = JSON.stringify({
            error: upstream.ok
              ? 'Invalid JSON response from Philips Hue'
              : `Philips Hue upstream error (${upstream.status})`,
          })
        }

        return new Response(responseBody, {
          status: upstream.status,
          headers: {
            ...cors,
            'Content-Type': 'application/json; charset=utf-8',
          },
        })
      }

      return json({ error: 'Not found' }, 404, cors)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        return json({ error: 'Upstream Philips Hue request timed out' }, 504, cors)
      }
      if (err instanceof HttpError) {
        return json({ error: err.message }, err.status, cors)
      }
      return json({ error: 'Internal Worker Error' }, 500, cors)
    }
  },
} satisfies WorkerHandler<Env>

