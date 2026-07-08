import { useEffect } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { store } from './lib/store'
import { useAppState, useSyncStatus } from './lib/useStore'
import CoachApp from './routes/CoachApp'
import ParentApp from './routes/ParentApp'
import InvalidLink from './routes/InvalidLink'
import Home from './routes/Home'

function Loading() {
  return (
    <div className="flex min-h-full items-center justify-center p-8 text-slate-400">
      <span className="animate-pulse">…</span>
    </div>
  )
}

/**
 * In remote mode the SERVER decides what a token unlocks (the local cache may
 * hold stale or never-validated tokens); locally we compare against settings.
 * A coach token also opens the read-only parent view.
 */
function useGuard(kind: 'coach' | 'parent'): 'loading' | 'ok' | 'invalid' {
  const { token } = useParams()
  const { settings } = useAppState()
  const sync = useSyncStatus()
  useEffect(() => {
    if (token) void store.connect(token)
  }, [token])
  if (store.isRemote()) {
    if (!sync.loaded) return 'loading'
    if (sync.rejected) return 'invalid'
    if (kind === 'coach') return sync.role === 'coach' ? 'ok' : 'invalid'
    return sync.role !== null ? 'ok' : 'invalid'
  }
  const expected = kind === 'coach' ? settings.coachToken : settings.parentToken
  return token && token === expected ? 'ok' : 'invalid'
}

function CoachGuard() {
  const verdict = useGuard('coach')
  if (verdict === 'loading') return <Loading />
  if (verdict === 'invalid') return <InvalidLink />
  return <CoachApp />
}

function ParentGuard() {
  const verdict = useGuard('parent')
  if (verdict === 'loading') return <Loading />
  if (verdict === 'invalid') return <InvalidLink />
  return <ParentApp />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/c/:token" element={<CoachGuard />} />
      <Route path="/p/:token" element={<ParentGuard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
