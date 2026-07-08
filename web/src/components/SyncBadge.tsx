import { useTranslation } from 'react-i18next'
import { store } from '../lib/store'
import { useSyncStatus } from '../lib/useStore'

/** Live save indicator for the coach: synced / saving / offline-retrying.
 *  Answers the "did that save?" question without being asked.
 *  `onDark` restyles it for the gradient header. */
export default function SyncBadge({ onDark = false }: { onDark?: boolean }) {
  const { t } = useTranslation()
  const sync = useSyncStatus()
  if (!store.isRemote() || sync.role !== 'coach') return null

  const state = sync.pushFailed
    ? {
        dot: onDark ? 'bg-rose-300' : 'bg-rose-500',
        text: t('sync.retrying'),
        cls: onDark ? 'text-rose-100' : 'text-rose-600',
      }
    : sync.saving
      ? {
          dot: `animate-pulse ${onDark ? 'bg-amber-300' : 'bg-amber-400'}`,
          text: t('sync.saving'),
          cls: onDark ? 'text-amber-100' : 'text-amber-600',
        }
      : {
          dot: onDark ? 'bg-emerald-300' : 'bg-emerald-500',
          text: t('sync.saved'),
          cls: onDark ? 'text-emerald-50' : 'text-emerald-600',
        }

  return (
    <span
      role="status"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        onDark ? 'bg-white/15' : 'bg-slate-100'
      } ${state.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} aria-hidden="true" />
      {state.text}
    </span>
  )
}
