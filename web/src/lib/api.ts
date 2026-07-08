import type { AppState } from './types'

// When VITE_SUPABASE_URL is set (in .env or the GitHub Actions build), the app
// syncs through the Supabase Edge Function. When it's absent, the app stays
// fully local (localStorage) and none of this code runs.
const BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
export const REMOTE_ENABLED = BASE.length > 0
const ENDPOINT = REMOTE_ENABLED ? `${BASE.replace(/\/+$/, '')}/functions/v1/api` : ''

async function call(method: 'GET' | 'POST', token: string, body?: AppState): Promise<Response> {
  const res = await fetch(`${ENDPOINT}?token=${encodeURIComponent(token)}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-app-token': token },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`api ${method} → ${res.status}`)
  return res
}

/** Fetch the full app state. Parents receive it with `coachToken` stripped. */
export async function fetchRemoteState(token: string): Promise<AppState> {
  const res = await call('GET', token)
  return (await res.json()) as AppState
}

/** Replace the whole app state (coach token only; server rejects others). */
export async function pushRemoteState(token: string, state: AppState): Promise<void> {
  await call('POST', token, state)
}
