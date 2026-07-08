// Token-gated gateway for the KaPok Swim Club app.
//
//   GET  /functions/v1/api?token=...   → returns the whole AppState.
//                                         Coach token: full state.
//                                         Parent token: state with coachToken hidden.
//   GET  /functions/v1/api?pin=...     → recovery: if the PIN matches
//                                         settings.recoveryPin (default 1111),
//                                         returns just { coachToken, parentToken }
//                                         so a fresh device can find its links.
//   POST /functions/v1/api?token=...   → replaces the whole AppState (coach token only).
//
// Deploy with JWT verification OFF so the browser needs no Supabase auth header —
// this function does its own capability-token check:
//   supabase functions deploy api --no-verify-jwt
//
// The service-role key is injected automatically by Supabase; it bypasses RLS,
// so the browser never needs (and never gets) direct table access.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url = new URL(req.url)
  const token = req.headers.get('x-app-token') ?? url.searchParams.get('token') ?? ''

  const { data: row, error } = await admin
    .from('app_state')
    .select('data')
    .eq('id', 1)
    .single()
  if (error || !row) return json({ error: 'not_initialized' }, 500)

  // deno-lint-ignore no-explicit-any
  const state: any = row.data
  const isCoach = token !== '' && token === state.settings?.coachToken
  const isParent = token !== '' && token === state.settings?.parentToken

  if (req.method === 'GET') {
    // Recovery path: a device that lost (or never had) its link can trade the
    // PIN for the coach/parent tokens. This grants edit access, so the coach
    // should set a private PIN — see settings.recoveryPin (defaults to 1111).
    const pin = url.searchParams.get('pin')
    if (pin !== null) {
      const realPin = String(state.settings?.recoveryPin ?? '').trim() || '1111'
      if (pin.trim() !== realPin) return json({ error: 'invalid_pin' }, 403)
      return json({
        coachToken: state.settings?.coachToken,
        parentToken: state.settings?.parentToken,
      })
    }

    if (!isCoach && !isParent) return json({ error: 'invalid_token' }, 403)
    if (isCoach) return json(state)
    // Parents must not learn the coach (edit) token.
    return json({ ...state, settings: { ...state.settings, coachToken: undefined } })
  }

  if (req.method === 'POST') {
    if (!isCoach) return json({ error: 'forbidden' }, 403)
    let body: any
    try {
      body = await req.json()
    } catch {
      return json({ error: 'bad_json' }, 400)
    }
    // Never accept a doc that would corrupt the schema or erase the
    // capability tokens (which would lock everyone out permanently).
    const valid = body &&
      typeof body.settings?.coachToken === 'string' && body.settings.coachToken.length > 0 &&
      typeof body.settings?.parentToken === 'string' && body.settings.parentToken.length > 0 &&
      Array.isArray(body.swimmers) && Array.isArray(body.attendance) && Array.isArray(body.payments)
    if (!valid) return json({ error: 'bad_state' }, 400)
    await admin
      .from('app_state')
      .update({ data: body, updated_at: new Date().toISOString() })
      .eq('id', 1)
    return json({ ok: true })
  }

  return json({ error: 'method_not_allowed' }, 405)
})
