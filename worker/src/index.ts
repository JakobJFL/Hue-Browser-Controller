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

function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || ''
  const allowed = (env.ALLOWED_ORIGINS || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const allowOrigin = allowed.includes('*')
    ? '*'
    : allowed.includes(origin)
      ? origin
      : allowed[0] || ''

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, hue-application-key',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const json = (body: unknown, status: number, cors: Record<string, string>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

async function pairBridge(accessToken: string): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  const linkRes = await fetch(`${HUE_BASE}/route/api/0/config`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ linkbutton: true }),
  })
  if (!linkRes.ok) {
    throw new Error(`Virtual link-button failed (${linkRes.status}): ${await linkRes.text()}`)
  }

  const regRes = await fetch(`${HUE_BASE}/route/api`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ devicetype: 'open_hue_controller#browser', generateclientkey: true }),
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
    const cors = getCorsHeaders(request, env)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)

    try {
      if (url.pathname === '/auth/token' && request.method === 'POST') {
        const { code } = (await request.json()) as { code?: string }
        if (!code) return json({ error: 'Missing authorization code' }, 400, cors)

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
        const { refresh_token } = (await request.json()) as { refresh_token?: string }
        if (!refresh_token) return json({ error: 'Missing refresh_token' }, 400, cors)

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
        const targetUrl = `${HUE_BASE}/route${url.pathname.slice(4)}${url.search}`
        const headers = new Headers()
        const auth = request.headers.get('Authorization')
        const appKey = request.headers.get('hue-application-key')
        if (auth) headers.set('Authorization', auth)
        if (appKey) headers.set('hue-application-key', appKey)

        const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
        if (hasBody) headers.set('Content-Type', 'application/json')

        const upstream = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: hasBody ? await request.text() : undefined,
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
      const status = err instanceof HttpError ? err.status : 500
      const message = err instanceof Error ? err.message : 'Internal Worker Error'
      return json({ error: message }, status, cors)
    }
  },
} satisfies ExportedHandler<Env>

