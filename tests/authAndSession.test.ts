import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { HUE_CONFIG } from '../src/config.ts'
import { useHue } from '../src/composables/useHue.ts'
import {
  AuthExpiredError,
  fetchAllResources,
  handleOAuthCallbackIfPresent,
  loadStoredSession,
  saveSession,
} from '../src/services/hueApi.ts'

class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

const localStore = new MemoryStorage()
const sessionStore = new MemoryStorage()

Object.defineProperty(globalThis, 'localStorage', { value: localStore, configurable: true })
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStore, configurable: true })
Object.defineProperty(globalThis, 'document', {
  value: { title: 'Open Hue Controller' },
  configurable: true,
})

function setMockLocation(href: string): void {
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { href },
      history: {
        replaceState(_data: unknown, _unused: string, nextUrl?: string | URL | null) {
          if (nextUrl) {
            const base = new URL(href)
            ;(globalThis.window.location as { href: string }).href = new URL(
              String(nextUrl),
              base.origin
            ).href
          }
        },
      },
    },
    configurable: true,
  })
}

describe('hueApi & useHue session security and reliability', () => {
  beforeEach(() => {
    localStore.clear()
    sessionStore.clear()
    HUE_CONFIG.clientId = 'test-client-id'
    HUE_CONFIG.workerUrl = 'https://proxy.example.workers.dev'
    setMockLocation('https://jakobjfl.github.io/Hue-Browser-Controller/')
  })

  it('validates stored session JSON strictly against malformed types', () => {
    localStore.setItem('open_hue_session_v2', JSON.stringify(['invalid']))
    assert.equal(loadStoredSession(), null)

    localStore.setItem('open_hue_session_v2', JSON.stringify({ access_token: 12345 }))
    assert.equal(loadStoredSession(), null)

    localStore.setItem('open_hue_session_v2', JSON.stringify({ access_token: '   ' }))
    assert.equal(loadStoredSession(), null)

    saveSession({
      access_token: 'tok_1',
      refresh_token: 'ref_1',
      application_key: 'app_1',
      expires_at: 123456789,
    })
    assert.deepEqual(loadStoredSession(), {
      access_token: 'tok_1',
      refresh_token: 'ref_1',
      application_key: 'app_1',
      expires_at: 123456789,
    })
  })

  it('rejects OAuth callback on CSRF state mismatch and scrubs code from URL', async () => {
    sessionStore.setItem('open_hue_oauth_state', 'expected-state-123')
    setMockLocation(
      'https://jakobjfl.github.io/Hue-Browser-Controller/?code=secret_code&state=wrong-state'
    )

    await assert.rejects(() => handleOAuthCallbackIfPresent(), /state verification failed/i)
    assert.equal(window.location.href, 'https://jakobjfl.github.io/Hue-Browser-Controller/')
    assert.equal(sessionStore.getItem('open_hue_oauth_state'), null)
  })

  it('preserves stored session across transient 503 startup failures during bootstrap()', async () => {
    const originalFetch = globalThis.fetch
    try {
      saveSession({
        access_token: 'valid_token',
        refresh_token: 'valid_refresh',
        application_key: 'valid_app_key',
        expires_at: Date.now() + 3600_000,
      })

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })

      const hue = useHue()
      await hue.bootstrap()

      assert.equal(hue.authMode.value, 'authenticated')
      assert.match(hue.errorMessage.value, /Service temporarily unavailable/)
      assert.notEqual(loadStoredSession(), null)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('clears session and transitions to logged_out when refresh token is rejected with 401', async () => {
    const originalFetch = globalThis.fetch
    try {
      saveSession({
        access_token: 'expired_token',
        refresh_token: 'revoked_refresh',
        application_key: 'valid_app_key',
        expires_at: Date.now() - 1000,
      })

      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'invalid_grant' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })

      await assert.rejects(() => fetchAllResources(), AuthExpiredError)
      assert.equal(loadStoredSession(), null)

      saveSession({
        access_token: 'expired_token',
        refresh_token: 'revoked_refresh',
        application_key: 'valid_app_key',
        expires_at: Date.now() - 1000,
      })

      const hue = useHue()
      await hue.bootstrap()
      assert.equal(hue.authMode.value, 'logged_out')
      assert.equal(loadStoredSession(), null)
      assert.match(hue.errorMessage.value, /expired/i)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
