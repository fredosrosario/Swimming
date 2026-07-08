import { useEffect } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { store } from './lib/store'
import { useAppState, useSyncStatus } from './lib/useStore'
import { WaveMark } from './components/icons'
import CoachApp from './routes/CoachApp'
import ParentApp from './routes/ParentApp'
import InvalidLink from './routes/InvalidLink'
import Home from './routes/Home'

function Loading() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <WaveMark className="h-14 w-14 animate-pulse" />
      <p className="text-sm text-slate-400" role="status">
        {t('common.loading')}
      </p>
    </div>
  )
}

/**
 * Read-only parent view. `token` is undefined for the public base URL `/`, or a
 * parent token for a legacy `/p/:token` link. Reads are public, so this always
 * resolves to the parent view once loaded — there is no "invalid parent link".
 */
function ParentRoute({ token }: { token?: string }) {
  const sync = useSyncStatus()
  useEffect(() => {
    void store.connect(token)
  }, [token])
  if (!store.isRemote()) return <ParentApp />
  if (!sync.loaded) return <Loading />
  return <ParentApp />
}

function ParentTokenRoute() {
  const { token } = useParams()
  return <ParentRoute token={token} />
}

/**
 * Coach view — the server decides ('coach' only for the exact coach token,
 * which a device only obtains through the PIN login). Any other token resolves
 * to a non-coach role and is turned away.
 */
function CoachGuard() {
  const { token } = useParams()
  const { settings } = useAppState()
  const sync = useSyncStatus()
  useEffect(() => {
    if (token) void store.connect(token)
  }, [token])
  if (store.isRemote()) {
    if (!sync.loaded) return <Loading />
    if (sync.rejected) return <InvalidLink />
    return sync.role === 'coach' ? <CoachApp /> : <InvalidLink />
  }
  return token && token === settings.coachToken ? <CoachApp /> : <InvalidLink />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/parent" element={<ParentRoute />} />
      <Route path="/c/:token" element={<CoachGuard />} />
      <Route path="/p/:token" element={<ParentTokenRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
