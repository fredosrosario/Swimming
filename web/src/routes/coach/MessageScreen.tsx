import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import { buildMonthlyMessage } from '../../lib/ledger'

export default function MessageScreen() {
  const { t } = useTranslation()
  const state = useAppState()
  const [month, setMonth] = useState(() => store.today().slice(0, 7))
  const [copied, setCopied] = useState(false)

  const message = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    return buildMonthlyMessage(state, y, m)
  }, [state, month])

  // "empty" = only the header + footer, nobody owes.
  const bodyLines = message.split('\n').length
  const isEmpty = bodyLines <= 4

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
    } catch {
      /* clipboard may be blocked; the textarea is selectable as fallback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
        <label className="text-sm text-slate-500">{t('message.month')}</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
        />
      </div>

      <textarea
        readOnly
        value={message}
        className="h-80 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 font-mono text-sm leading-relaxed text-slate-800 shadow-sm"
      />

      {isEmpty && <p className="text-center text-sm text-slate-400">{t('message.empty')}</p>}

      <button
        onClick={copy}
        className="rounded-xl bg-brand-600 py-3 font-semibold text-white active:bg-brand-700"
      >
        {copied ? t('message.copied') : t('message.copy')}
      </button>
    </div>
  )
}
