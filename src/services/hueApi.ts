import { HUE_CONFIG, isOAuthConfigured } from '../config.ts'
import type {
  ClipApiResponse,
  GroupedLightUpdatePayload,
  HueSession,
  LightUpdatePayload,
  SceneRecallAction,
} from '../types/hue'

const SESSION_KEY = 'open_hue_session_v2'
const OAUTH_STATE_KEY = 'open_hue_oauth_state'
const REQUEST_TIMEOUT_MS = 15_000

class ApiStatusError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export class AuthExpiredError extends Error {
  constructor(message = 'Your Philips Hue session has expired. Please sign in again.') {
    super(message)
    this.name = 'AuthExpiredError'
  }
}

let inflightRefresh: Promise<HueSession> | null = null
let inflightPair: Promise<string> | null = null

interface WorkerTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  application_key?: string | null
  error?: string
}

interface WorkerPairResponse {
  application_key: string
  error?: string
}

interface ClipRequestOptions {
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE'
  body?: unknown
}

export function loadStoredSession(): HueSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
    const record = parsed as Record<string, unknown>
    if (typeof record.access_token !== 'string' || !record.access_token.trim()) return null

    return {
      access_token: record.access_token,
      refresh_token:
        typeof record.refresh_token === 'string' && record.refresh_token
          ? record.refresh_token
          : undefined,
      application_key: typeof record.application_key === 'string' ? record.application_key : '',
      expires_at:
        typeof record.expires_at === 'number' && Number.isFinite(record.expires_at)
          ? record.expires_at
          : 0,
    }
  } catch {
    return null
  }
}

export function saveSession(session: HueSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // Ignore storage quota/privacy errors
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(OAUTH_STATE_KEY)
  } catch {
    // Ignore storage errors
  }
}

export function startHueOAuth(): void {
  if (!isOAuthConfigured()) {
    throw new Error(
      'Hue OAuth is not configured yet. Add VITE_HUE_CLIENT_ID and VITE_WORKER_URL in .env, or use Demo Mode.'
    )
  }
  const state = crypto.randomUUID()
  sessionStorage.setItem(OAUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: HUE_CONFIG.clientId,
    response_type: 'code',
    state,
    appid: HUE_CONFIG.appId,
    deviceid: 'open-hue-browser',
    devicename: 'Open Hue Controller',
  })
  window.location.href = `${HUE_CONFIG.authorizeUrl}?${params.toString()}`
}

async function workerJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${HUE_CONFIG.workerUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new ApiStatusError(data.error || `Request failed (${res.status})`, res.status)
  }
  return data
}

export async function handleOAuthCallbackIfPresent(): Promise<HueSession | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (!code && !oauthError) return null
  window.history.replaceState({}, document.title, `${url.origin}${url.pathname}`)

  let expectedState: string | null
  try {
    expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)
    sessionStorage.removeItem(OAUTH_STATE_KEY)
  } catch {
    expectedState = null
  }

  if (oauthError) {
    throw new Error(
      `Philips Hue login denied: ${url.searchParams.get('error_description') || oauthError}`
    )
  }

  if (!expectedState || !returnedState || expectedState !== returnedState || !code) {
    throw new Error('OAuth state verification failed. Please sign in again.')
  }

  const tokenData = await workerJson<WorkerTokenResponse>('/auth/token', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })

  if (typeof tokenData.access_token !== 'string' || !tokenData.access_token.trim()) {
    throw new Error('OAuth token exchange did not return a valid access token.')
  }

  let applicationKey =
    typeof tokenData.application_key === 'string' ? tokenData.application_key : ''
  if (!applicationKey) {
    applicationKey = await pairApplicationKey(tokenData.access_token)
  }

  const session: HueSession = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    application_key: applicationKey,
    expires_at: Date.now() + (Number(tokenData.expires_in) || 604800) * 1000,
  }
  saveSession(session)
  return session
}

async function refreshSessionTokens(session: HueSession): Promise<HueSession> {
  if (inflightRefresh) return inflightRefresh

  if (!session.refresh_token) {
    clearSession()
    throw new AuthExpiredError()
  }

  const refreshToken = session.refresh_token
  inflightRefresh = (async () => {
    try {
      const refreshed = await workerJson<WorkerTokenResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (typeof refreshed.access_token !== 'string' || !refreshed.access_token.trim()) {
        throw new Error('Token refresh did not return a valid access token.')
      }
      const latest = loadStoredSession() || session
      const updated: HueSession = {
        ...latest,
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token || refreshToken,
        expires_at: Date.now() + (Number(refreshed.expires_in) || 604800) * 1000,
      }
      saveSession(updated)
      return updated
    } catch (err) {
      if (err instanceof ApiStatusError && (err.status === 400 || err.status === 401)) {
        clearSession()
        throw new AuthExpiredError()
      }
      throw err
    } finally {
      inflightRefresh = null
    }
  })()

  return inflightRefresh
}

async function pairApplicationKey(accessToken: string): Promise<string> {
  if (inflightPair) return inflightPair
  inflightPair = (async () => {
    try {
      const pair = await workerJson<WorkerPairResponse>('/auth/pair', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (typeof pair.application_key !== 'string' || !pair.application_key.trim()) {
        throw new Error('Bridge pairing did not return an application key.')
      }
      return pair.application_key
    } finally {
      inflightPair = null
    }
  })()
  return inflightPair
}

async function ensureActiveSession(): Promise<HueSession> {
  let session = loadStoredSession()
  if (!session) throw new AuthExpiredError('Not signed in. Please sign in with Philips Hue.')

  if (session.expires_at && Date.now() > session.expires_at - 5 * 60 * 1000) {
    session = await refreshSessionTokens(session)
  }
  if (!session.application_key) {
    const applicationKey = await pairApplicationKey(session.access_token)
    const latest = loadStoredSession() || session
    session = { ...latest, application_key: applicationKey }
    saveSession(session)
  }
  return session
}

async function clipRequest(
  subpath = '',
  options: ClipRequestOptions = {},
  retry = 0
): Promise<ClipApiResponse> {
  const session = await ensureActiveSession()
  const res = await fetch(`${HUE_CONFIG.workerUrl}/api/clip/v2/resource${subpath}`, {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'hue-application-key': session.application_key,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (res.status === 401) {
    if (retry < 1) {
      await refreshSessionTokens(session)
      return clipRequest(subpath, options, retry + 1)
    }
    clearSession()
    throw new AuthExpiredError()
  }
  if (res.status === 403 && retry < 1) {
    const applicationKey = await pairApplicationKey(session.access_token)
    const latest = loadStoredSession() || session
    saveSession({ ...latest, application_key: applicationKey })
    return clipRequest(subpath, options, retry + 1)
  }

  const payload = (await res.json().catch(() => ({}))) as ClipApiResponse
  if (!res.ok) {
    throw new Error(
      payload.errors?.[0]?.description || payload.error || `Hue API error (${res.status})`
    )
  }
  return payload
}

export const fetchAllResources = (): Promise<ClipApiResponse> => clipRequest('')
export const updateGroupedLight = (
  id: string,
  body: GroupedLightUpdatePayload
): Promise<ClipApiResponse> =>
  clipRequest(`/grouped_light/${encodeURIComponent(id)}`, { method: 'PUT', body })
export const updateLight = (id: string, body: LightUpdatePayload): Promise<ClipApiResponse> =>
  clipRequest(`/light/${encodeURIComponent(id)}`, { method: 'PUT', body })
export const recallScene = (
  id: string,
  action: SceneRecallAction = 'active'
): Promise<ClipApiResponse> =>
  clipRequest(`/scene/${encodeURIComponent(id)}`, { method: 'PUT', body: { recall: { action } } })

