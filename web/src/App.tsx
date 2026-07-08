import { useEffect } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { store } from './lib/store'
import { useAppState } from './lib/useStore'
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

function CoachGuard() {
  const { token } = useParams()
  const { settings } = useAppState()
  useEffect(() => {
    if (token) store.connect(token)
  }, [token])
  if (store.isRemote() && !store.isLoaded()) return <Loading />
  if (token !== settings.coachToken) return <InvalidLink />
  return <CoachApp />
}

function ParentGuard() {
  const { token } = useParams()
  const { settings } = useAppState()
  useEffect(() => {
    if (token) store.connect(token)
  }, [token])
  if (store.isRemote() && !store.isLoaded()) return <Loading />
  if (token !== settings.parentToken) return <InvalidLink />
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
