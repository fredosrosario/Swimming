import type { AppState } from './types'

// When VITE_SUPABASE_URL is set (in .env or the GitHub Actions build), the app
// syncs through the Supabase Edge Function. When it's absent, the app stays
// fully local (localStorage) and none of this code runs.
const BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
export const REMOTE_ENABLED = BASE.length > 0
const ENDPOINT = REMOTE_ENABLED ? `${BASE.replace(/\/+$/, '')}/functions/v1/api` : ''

/** Non-2xx response. `status === 403` means the capability token was rejected. */
export class ApiError extends Error {
  status: number
  constructor(method: string, status: number) {
    super(`api ${method} → ${status}`)
    this.status = status
  }
}

async function call(method: 'GET' | 'POST', token: string, body?: AppState): Promise<Response> {
  const res = await fetch(`${ENDPOINT}?token=${encodeURIComponent(token)}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-app-token': token },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new ApiError(method, res.status)
  return res
}

/** Fetch the full app state. Parents receive it with `coachToken` stripped. */
export async function fetchRemoteState(token: string): Promise<AppState> {
  const res = await call('GET', token)
  return (await res.json()) as AppState
}

/** Public read-only state — no token. Coach token and PIN are stripped server
 *  side. Backs the shared base URL. No custom headers → no CORS preflight. */
export async function fetchPublicState(): Promise<AppState> {
  const res = await fetch(ENDPOINT, { method: 'GET' })
  if (!res.ok) throw new ApiError('GET', res.status)
  return (await res.json()) as AppState
}

/** Replace the whole app state (coach token only; server rejects others). */
export async function pushRemoteState(token: string, state: AppState): Promise<void> {
  await call('POST', token, state)
}

/** Trade a recovery PIN for the share tokens. Throws ApiError(403) on a wrong
 *  PIN, or a network error when offline. No custom headers → no CORS preflight. */
export async function recoverTokens(
  pin: string,
): Promise<{ coachToken: string; parentToken: string }> {
  const res = await fetch(`${ENDPOINT}?pin=${encodeURIComponent(pin)}`, { method: 'GET' })
  if (!res.ok) throw new ApiError('GET', res.status)
  return (await res.json()) as { coachToken: string; parentToken: string }
}
