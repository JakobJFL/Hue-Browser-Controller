import { HUE_CONFIG, isOAuthConfigured } from '../config'
import type {
  ClipApiResponse,
  GroupedLightUpdatePayload,
  HueSession,
  LightUpdatePayload,
  SceneRecallAction,
} from '../types/hue'

const SESSION_KEY = 'open_hue_session_v2'
const OAUTH_STATE_KEY = 'open_hue_oauth_state'

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
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Partial<HueSession> | null
    if (!parsed?.access_token) return null
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      application_key: parsed.application_key || '',
      expires_at: parsed.expires_at || 0,
    }
  } catch {
    return null
  }
}

export function saveSession(session: HueSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
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
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export async function handleOAuthCallbackIfPresent(): Promise<HueSession | null> {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const oauthError = url.searchParams.get('error')

  if (!code && !oauthError) return null
  window.history.replaceState({}, document.title, `${url.origin}${url.pathname}`)

  if (oauthError) {
    throw new Error(
      `Philips Hue login denied: ${url.searchParams.get('error_description') || oauthError}`
    )
  }

  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
  if (expectedState && returnedState && expectedState !== returnedState) {
    throw new Error('OAuth state mismatch. Please try signing in again.')
  }

  const tokenData = await workerJson<WorkerTokenResponse>('/auth/token', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })

  let applicationKey = tokenData.application_key || ''
  if (!applicationKey) {
    const pair = await workerJson<WorkerPairResponse>('/auth/pair', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    applicationKey = pair.application_key
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
  if (!session.refresh_token) {
    clearSession()
    throw new Error('Session expired. Please sign in again.')
  }
  const refreshed = await workerJson<WorkerTokenResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  })
  const updated: HueSession = {
    ...session,
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || session.refresh_token,
    expires_at: Date.now() + (Number(refreshed.expires_in) || 604800) * 1000,
  }
  saveSession(updated)
  return updated
}

async function ensureActiveSession(): Promise<HueSession> {
  let session = loadStoredSession()
  if (!session) throw new Error('Not signed in.')

  if (session.expires_at && Date.now() > session.expires_at - 5 * 60 * 1000) {
    session = await refreshSessionTokens(session)
  }
  if (!session.application_key) {
    const pair = await workerJson<WorkerPairResponse>('/auth/pair', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    session = { ...session, application_key: pair.application_key }
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
  })

  if (res.status === 401 && retry < 1) {
    await refreshSessionTokens(session)
    return clipRequest(subpath, options, retry + 1)
  }
  if (res.status === 403 && retry < 1) {
    const pair = await workerJson<WorkerPairResponse>('/auth/pair', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    saveSession({ ...session, application_key: pair.application_key })
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
): Promise<ClipApiResponse> => clipRequest(`/grouped_light/${id}`, { method: 'PUT', body })
export const updateLight = (id: string, body: LightUpdatePayload): Promise<ClipApiResponse> =>
  clipRequest(`/light/${id}`, { method: 'PUT', body })
export const recallScene = (
  id: string,
  action: SceneRecallAction = 'active'
): Promise<ClipApiResponse> =>
  clipRequest(`/scene/${id}`, { method: 'PUT', body: { recall: { action } } })

