import { useTranslation } from 'react-i18next'
import { store } from '../lib/store'
import { useSyncStatus } from '../lib/useStore'

/** Live save indicator for the coach: synced / saving / offline-retrying.
 *  Answers the "did that save?" question without being asked. */
export default function SyncBadge() {
  const { t } = useTranslation()
  const sync = useSyncStatus()
  if (!store.isRemote() || sync.role !== 'coach') return null

  const state = sync.pushFailed
    ? { dot: 'bg-rose-500', text: t('sync.retrying'), cls: 'text-rose-600' }
    : sync.saving
      ? { dot: 'bg-amber-400 animate-pulse', text: t('sync.saving'), cls: 'text-amber-600' }
      : { dot: 'bg-emerald-500', text: t('sync.saved'), cls: 'text-emerald-600' }

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium ${state.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} aria-hidden="true" />
      {state.text}
    </span>
  )
}
