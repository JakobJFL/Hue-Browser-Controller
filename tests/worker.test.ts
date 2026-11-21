import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import worker, {
  CLIP_PATH_RE,
  extractBearerToken,
  isOriginAllowed,
  readBoundedBody,
  type Env,
} from '../worker/src/index.ts'

const ENV: Env = {
  ALLOWED_ORIGINS: 'https://jakobjfl.github.io, http://localhost:5173/',
  HUE_CLIENT_ID: 'test-client-id',
  HUE_CLIENT_SECRET: 'test-client-secret',
}

const ORIGIN = 'https://jakobjfl.github.io'
const BASE = 'https://proxy.example.workers.dev'

describe('Cloudflare Worker security & validation', () => {
  it('rejects empty or unconfigured origins and allows configured origins', () => {
    const allowed = ['https://jakobjfl.github.io', 'http://localhost:5173']
    assert.equal(isOriginAllowed('', allowed), false)
    assert.equal(isOriginAllowed(ORIGIN, []), false)
    assert.equal(isOriginAllowed('https://evil.example.com', allowed), false)
    assert.equal(isOriginAllowed(ORIGIN, allowed), true)
    assert.equal(isOriginAllowed('http://localhost:5173/', allowed), true)
  })

  it('returns 403 when Origin header is missing or disallowed', async () => {
    const noOrigin = new Request(`${BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'abc' }),
    })
    const res1 = await worker.fetch(noOrigin, ENV)
    assert.equal(res1.status, 403)
    assert.equal(res1.headers.get('Access-Control-Allow-Origin'), null)

    const badOrigin = new Request(`${BASE}/auth/token`, {
      method: 'POST',
      headers: { Origin: 'https://attacker.example.com', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'abc' }),
    })
    const res2 = await worker.fetch(badOrigin, ENV)
    assert.equal(res2.status, 403)
    assert.equal(res2.headers.get('Access-Control-Allow-Origin'), null)
  })

  it('handles OPTIONS preflight with security headers for allowed origins', async () => {
    const req = new Request(`${BASE}/api/clip/v2/resource`, {
      method: 'OPTIONS',
      headers: { Origin: ORIGIN },
    })
    const res = await worker.fetch(req, ENV)
    assert.equal(res.status, 204)
    assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN)
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff')
    assert.equal(res.headers.get('X-Frame-Options'), 'DENY')
    assert.equal(res.headers.get('Cache-Control'), 'no-store')
  })

  it('enforces Content-Type: application/json and plain object JSON payloads', async () => {
    const wrongCt = new Request(`${BASE}/auth/token`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'text/plain' },
      body: JSON.stringify({ code: 'abc' }),
    })
    assert.equal((await worker.fetch(wrongCt, ENV)).status, 415)

    const arrayBody = new Request(`${BASE}/auth/token`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json' },
      body: JSON.stringify(['not-an-object']),
    })
    assert.equal((await worker.fetch(arrayBody, ENV)).status, 400)
  })

  it('aborts streaming bodies exceeding max byte limit without Content-Length', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(600))
        controller.enqueue(new Uint8Array(600))
        controller.close()
      },
    })
    const req = new Request(`${BASE}/auth/token`, {
      method: 'POST',
      body: stream,
      // @ts-expect-error Node fetch requires duplex: 'half' for ReadableStream request bodies
      duplex: 'half',
    })
    await assert.rejects(() => readBoundedBody(req, 1000), /Request payload too large/)
  })

  it('strictly validates CLIP v2 paths and auth headers', async () => {
    assert.equal(CLIP_PATH_RE.test('/api/clip/v2/resource'), true)
    assert.equal(CLIP_PATH_RE.test('/api/clip/v2/resource/light/abc-123'), true)
    assert.equal(CLIP_PATH_RE.test('/api/clip/v2/resource/bridge/abc-123'), false)
    assert.equal(CLIP_PATH_RE.test('/api/clip/v2/resource/../0/config'), false)

    assert.equal(extractBearerToken('Bearer valid_token-123.xyz'), 'valid_token-123.xyz')
    assert.equal(extractBearerToken('Basic abc'), null)
    assert.equal(extractBearerToken('Bearer token with spaces'), null)

    const badAuthReq = new Request(`${BASE}/api/clip/v2/resource`, {
      method: 'GET',
      headers: {
        Origin: ORIGIN,
        Authorization: 'Bearer good_token',
        'hue-application-key': 'bad key!',
      },
    })
    assert.equal((await worker.fetch(badAuthReq, ENV)).status, 401)
  })

  it('wraps non-JSON upstream errors as JSON and omits generateclientkey', async () => {
    const originalFetch = globalThis.fetch
    const bodies: string[] = []
    try {
      globalThis.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (typeof init?.body === 'string') bodies.push(init.body)
        if (url.endsWith('/route/api/0/config')) return new Response('[{}]', { status: 200 })
        if (url.endsWith('/route/api')) {
          return new Response('[{"success":{"username":"valid_app_key_123"}}]', { status: 200 })
        }
        return new Response('<html>502</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        })
      }

      const pairRes = await worker.fetch(
        new Request(`${BASE}/auth/pair`, {
          method: 'POST',
          headers: { Origin: ORIGIN, Authorization: 'Bearer test_access_token' },
        }),
        ENV
      )
      assert.equal(pairRes.status, 200)
      assert.equal(bodies.some((b) => b.includes('generateclientkey')), false)

      const clipRes = await worker.fetch(
        new Request(`${BASE}/api/clip/v2/resource`, {
          method: 'GET',
          headers: {
            Origin: ORIGIN,
            Authorization: 'Bearer test_access_token',
            'hue-application-key': 'valid_app_key_123',
          },
        }),
        ENV
      )
      assert.equal(clipRes.status, 502)
      assert.equal(clipRes.headers.get('Content-Type'), 'application/json; charset=utf-8')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
