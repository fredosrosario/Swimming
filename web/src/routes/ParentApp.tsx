import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../lib/store'
import { useAppState } from '../lib/useStore'
import { netBalance, sessionCount } from '../lib/ledger'
import LanguageToggle from '../components/LanguageToggle'

export default function ParentApp() {
  const { t } = useTranslation()
  const state = useAppState()
  const [month, setMonth] = useState(() => store.today().slice(0, 7))
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim()
    return state.swimmers
      .filter((s) => s.active)
      .filter((s) => (q ? s.displayName.includes(q) : true))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        swimmer: s,
        attended: sessionCount(state, s.id, month),
        balance: netBalance(state, s.id, month),
      }))
  }, [state, month, query])

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div>
          <div className="font-semibold text-slate-700">{t('parent.title')}</div>
          <div className="text-xs text-slate-400">{t('parent.readonly')}</div>
        </div>
        <LanguageToggle />
      </header>

      <div className="flex items-center gap-2 p-3">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('parent.search')}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      </div>

      <ul className="flex flex-col gap-1 px-3 pb-6">
        {rows.map(({ swimmer, attended, balance }) => (
          <li
            key={swimmer.id}
            className="flex items-center justify-between rounded-xl bg-white px-3 py-3 shadow-sm"
          >
            <div>
              <div className="font-medium text-slate-800">{swimmer.displayName}</div>
              <div className="text-sm text-slate-400">
                {t('parent.attended', { count: attended })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">{t('parent.balance')}</div>
              <div
                className={`font-semibold ${
                  balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {balance}
                {state.settings.currencyLabel}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
