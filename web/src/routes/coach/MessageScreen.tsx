import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import { buildMonthlyMessage, monthStats, monthlyOwing } from '../../lib/ledger'
import { addMonths, formatMonthTitle } from '../../lib/dates'
import { compactAmount } from '../../lib/format'
import { EmptyState, StatTile, Stepper, toast } from '../../components/ui'
import {
  CheckIcon,
  CopyIcon,
  PaymentsIcon,
  RollCallIcon,
  ShareIcon,
} from '../../components/icons'

export default function MessageScreen() {
  const { t, i18n } = useTranslation()
  const state = useAppState()
  const [month, setMonth] = useState(() => store.today().slice(0, 7))

  const { message, rows, total, stats } = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const owing = monthlyOwing(state, month)
    return {
      message: buildMonthlyMessage(state, y, m),
      rows: owing,
      total: owing.reduce((s, r) => s + r.total, 0),
      stats: monthStats(state, month),
    }
  }, [state, month])

  const currency = state.settings.currencyLabel
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      toast(t('message.copied'))
    } catch {
      /* clipboard may be blocked; the textarea below stays selectable */
    }
  }

  async function share() {
    try {
      await navigator.share({ text: message })
    } catch {
      /* user cancelled the share sheet */
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="card p-3">
        <Stepper
          prevLabel={t('common.prev')}
          nextLabel={t('common.next')}
          onPrev={() => setMonth(addMonths(month, -1))}
          onNext={() => setMonth(addMonths(month, 1))}
          label={formatMonthTitle(month, i18n.language)}
        />
      </div>

      {/* the month at a glance */}
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          tone="brand"
          icon={<RollCallIcon className="h-5 w-5" />}
          label={t('message.statDays')}
          value={String(stats.sessionDays)}
        />
        <StatTile
          tone="brand"
          icon={<CheckIcon className="h-5 w-5" />}
          label={t('message.statCheckIns')}
          value={String(stats.checkIns)}
        />
        <StatTile
          tone="emerald"
          icon={<PaymentsIcon className="h-5 w-5" />}
          label={t('message.statCollected')}
          value={`${compactAmount(stats.collected, i18n.language)}${currency}`}
        />
        <StatTile
          tone="rose"
          icon={<PaymentsIcon className="h-5 w-5" />}
          label={t('message.statOutstanding')}
          value={`${compactAmount(stats.outstanding, i18n.language)}${currency}`}
        />
      </div>

      {rows.length === 0 ? (
        <EmptyState emoji="🎉" title={t('message.empty')} hint={t('message.emptyHint')} />
      ) : (
        <>
          <div className="flex justify-center">
            <span className="chip bg-rose-50 text-sm text-rose-600 !py-1.5">
              {t('message.stats', { count: rows.length, amount: `${total}${currency}` })}
            </span>
          </div>

          <textarea
            readOnly
            value={message}
            aria-label={t('nav.message')}
            className="card h-72 w-full resize-none border-0 p-4 font-mono text-sm leading-relaxed text-slate-800"
          />

          <div className="flex gap-2">
            <button onClick={copy} className="btn-primary flex-1">
              <CopyIcon className="h-5 w-5" />
              {t('message.copy')}
            </button>
            {canShare && (
              <button onClick={share} className="btn-secondary shrink-0">
                <ShareIcon className="h-5 w-5" />
                {t('message.share')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
