import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import { addDays, isSessionDay, weekdayLabel } from '../../lib/dates'
import type { Swimmer } from '../../lib/types'

const RECENT_WINDOW_DAYS = 28

export default function AttendanceScreen() {
  const { t } = useTranslation()
  const state = useAppState()
  const [date, setDate] = useState(() => store.today())
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [overrideFor, setOverrideFor] = useState<Swimmer | null>(null)

  const active = useMemo(
    () => state.swimmers.filter((s) => s.active),
    [state.swimmers],
  )

  const stats = useMemo(() => {
    const windowStart = addDays(date, -RECENT_WINDOW_DAYS)
    const m = new Map<string, { recent: number; last: string }>()
    for (const s of active) m.set(s.id, { recent: 0, last: '' })
    for (const a of state.attendance) {
      const e = m.get(a.swimmerId)
      if (!e) continue
      if (a.sessionDate > e.last) e.last = a.sessionDate
      if (a.sessionDate >= windowStart && a.sessionDate <= date) e.recent += 1
    }
    return m
  }, [active, state.attendance, date])

  const present = active.filter((s) => store.isPresent(s.id, date))
  const presentIds = new Set(present.map((s) => s.id))

  const q = query.trim()
  const notPresent = active
    .filter((s) => !presentIds.has(s.id))
    .filter((s) => (q ? s.displayName.includes(q) : true))
    .filter((s) => {
      if (q) return true // when searching, show every match regardless of recency
      if (showAll) return true
      return (stats.get(s.id)?.recent ?? 0) > 0 // default: regulars only
    })
    .sort((a, b) => {
      const sa = stats.get(a.id)!
      const sb = stats.get(b.id)!
      if (sb.recent !== sa.recent) return sb.recent - sa.recent
      if (sb.last !== sa.last) return sb.last.localeCompare(sa.last)
      return a.sortOrder - b.sortOrder
    })

  const exactMatch = active.some((s) => s.displayName === q)

  function addAndTick() {
    const s = store.addSwimmer(q)
    store.toggleAttendance(s.id, date)
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* date + headcount */}
      <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
          />
          <span className="text-sm text-slate-500">
            {weekdayLabel(date)}
            {!isSessionDay(date) && (
              <span className="ml-1 text-amber-600">{t('attendance.notSessionDay')}</span>
            )}
          </span>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          {t('attendance.headcount', { count: present.length })}
        </span>
      </div>

      {/* search / add */}
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('attendance.searchOrAdd')}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-brand-400"
        />
        {q && !exactMatch && (
          <button
            onClick={addAndTick}
            className="mt-2 w-full rounded-xl bg-emerald-500 px-3 py-2 font-semibold text-white active:bg-emerald-600"
          >
            {t('attendance.addNew', { name: q })}
          </button>
        )}
      </div>

      {/* present today */}
      {present.length > 0 && (
        <section className="rounded-xl bg-brand-50 p-2">
          <div className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            {t('attendance.presentToday')}
          </div>
          <ul className="flex flex-col gap-1">
            {present.map((s) => (
              <SwimmerRow
                key={s.id}
                swimmer={s}
                date={date}
                present
                onOverride={() => setOverrideFor(s)}
                price={state.settings.sessionPrice}
                currency={state.settings.currencyLabel}
              />
            ))}
          </ul>
        </section>
      )}

      {/* roster to tick */}
      <section>
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {q ? '' : showAll ? '' : t('attendance.recent')}
          </span>
          {!q && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-medium text-brand-600"
            >
              {showAll ? t('attendance.showRecent') : t('attendance.showAll')}
            </button>
          )}
        </div>
        {notPresent.length === 0 && active.length === 0 && (
          <p className="p-4 text-center text-sm text-slate-400">{t('attendance.empty')}</p>
        )}
        <ul className="flex flex-col gap-1">
          {notPresent.map((s) => (
            <SwimmerRow
              key={s.id}
              swimmer={s}
              date={date}
              present={false}
              onOverride={() => setOverrideFor(s)}
              price={state.settings.sessionPrice}
              currency={state.settings.currencyLabel}
            />
          ))}
        </ul>
      </section>

      {overrideFor && (
        <OverrideModal
          swimmer={overrideFor}
          date={date}
          onClose={() => setOverrideFor(null)}
        />
      )}
    </div>
  )
}

function SwimmerRow({
  swimmer,
  date,
  present,
  onOverride,
  price,
  currency,
}: {
  swimmer: Swimmer
  date: string
  present: boolean
  onOverride: () => void
  price: number
  currency: string
}) {
  const { t } = useTranslation()
  const att = store
    .getState()
    .attendance.find((a) => a.swimmerId === swimmer.id && a.sessionDate === date)
  const amount = att ? att.amountOverride ?? price : price
  const overridden = att?.amountOverride != null

  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-3 py-3 shadow-sm ${
        present ? 'bg-white ring-2 ring-brand-400' : 'bg-white'
      }`}
    >
      <button
        onClick={() => store.toggleAttendance(swimmer.id, date)}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg ${
          present ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-300'
        }`}
        aria-label={swimmer.displayName}
      >
        ✓
      </button>
      <button
        onClick={() => store.toggleAttendance(swimmer.id, date)}
        className="flex-1 text-left text-base font-medium text-slate-800"
      >
        {swimmer.displayName}
      </button>
      {present && (
        <button
          onClick={onOverride}
          className={`rounded-lg px-2 py-1 text-sm ${
            overridden ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {amount}
          {currency}
          <span className="ml-1 text-xs">{t('attendance.override')}</span>
        </button>
      )}
    </li>
  )
}

function OverrideModal({
  swimmer,
  date,
  onClose,
}: {
  swimmer: Swimmer
  date: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const state = useAppState()
  const att = state.attendance.find(
    (a) => a.swimmerId === swimmer.id && a.sessionDate === date,
  )
  const [value, setValue] = useState(
    String(att?.amountOverride ?? state.settings.sessionPrice),
  )

  function save() {
    const n = Number(value)
    const isDefault = n === state.settings.sessionPrice
    store.setAttendanceOverride(swimmer.id, date, isDefault ? null : n)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-md rounded-t-2xl bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-sm text-slate-500">
          {t('attendance.overridePrompt', { name: swimmer.displayName })}
        </p>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg outline-none focus:border-brand-400"
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-2 font-medium text-slate-600"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-xl bg-brand-600 py-2 font-semibold text-white"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
