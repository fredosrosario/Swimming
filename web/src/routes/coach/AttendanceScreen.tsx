import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import { addDays, formatDateLabel, isSessionDay } from '../../lib/dates'
import { chargeAmount } from '../../lib/ledger'
import type { Attendance, Swimmer } from '../../lib/types'
import { Avatar, EmptyState, Sheet, Stepper } from '../../components/ui'
import { CheckIcon, PlusIcon, SearchIcon, XIcon } from '../../components/icons'

const RECENT_WINDOW_DAYS = 28

export default function AttendanceScreen() {
  const { t, i18n } = useTranslation()
  const state = useAppState()
  const today = store.today()
  const [date, setDate] = useState(today)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [overrideFor, setOverrideFor] = useState<Swimmer | null>(null)

  const active = useMemo(() => state.swimmers.filter((s) => s.active), [state.swimmers])

  const attendanceOn = useMemo(() => {
    const m = new Map<string, Attendance>()
    for (const a of state.attendance) if (a.sessionDate === date) m.set(a.swimmerId, a)
    return m
  }, [state.attendance, date])

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

  const present = active.filter((s) => attendanceOn.has(s.id))
  const collected = present.reduce(
    (sum, s) => sum + chargeAmount(attendanceOn.get(s.id)!, state.settings),
    0,
  )

  // First-use trap fixed: with no attendance history nobody is a "regular",
  // which used to render an empty roll-call list. Fall back to showing all.
  const nobodyRecent = active.every((s) => (stats.get(s.id)?.recent ?? 0) === 0)
  const q = query.trim()
  const effectiveShowAll = showAll || nobodyRecent || q.length > 0

  const notPresent = active
    .filter((s) => !attendanceOn.has(s.id))
    .filter((s) => (q ? s.displayName.includes(q) : true))
    .filter((s) => effectiveShowAll || (stats.get(s.id)?.recent ?? 0) > 0)
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
      {/* date navigation + day summary */}
      <div className="card flex flex-col gap-2 p-3">
        <Stepper
          prevLabel={t('common.prev')}
          nextLabel={t('common.next')}
          onPrev={() => setDate(addDays(date, -1))}
          onNext={() => setDate(addDays(date, 1))}
          label={
            <span className="flex flex-col leading-tight">
              <span>{formatDateLabel(date, i18n.language)}</span>
              {!isSessionDay(date) && (
                <span className="text-xs font-medium text-amber-600">
                  {t('attendance.notSessionDay')}
                </span>
              )}
            </span>
          }
        />
        <div className="flex items-center justify-between">
          {date !== today ? (
            <button
              onClick={() => setDate(today)}
              className="chip bg-brand-50 text-brand-700 !py-1.5"
            >
              {t('attendance.backToToday')}
            </button>
          ) : (
            <span className="chip bg-slate-100 text-slate-500 !py-1.5">{t('common.today')}</span>
          )}
          <span
            key={`${present.length}-${collected}`}
            className="chip bg-brand-600 text-sm text-white !py-1.5 animate-pop-in"
          >
            {t('attendance.headcount', { count: present.length })}
            {present.length > 0 && (
              <span className="font-normal text-brand-100">
                · {collected}
                {state.settings.currencyLabel}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* search / quick add */}
      <div>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('attendance.searchOrAdd')}
            className="input !pl-10 shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label={t('attendance.clearSearch')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 active:bg-slate-100"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        {q && !exactMatch && (
          <button onClick={addAndTick} className="btn mt-2 w-full bg-emerald-500 text-white active:bg-emerald-600">
            <PlusIcon className="h-5 w-5" />
            {t('attendance.addNew', { name: q })}
          </button>
        )}
      </div>

      {/* present */}
      {present.length > 0 && (
        <section aria-label={t('attendance.presentToday')}>
          <div className="section-label pb-1 text-brand-700">
            {t('attendance.presentToday')} · {present.length}
          </div>
          <ul className="flex flex-col gap-1.5">
            {present.map((s) => (
              <SwimmerRow
                key={s.id}
                swimmer={s}
                date={date}
                attendance={attendanceOn.get(s.id)!}
                onOverride={() => setOverrideFor(s)}
                price={state.settings.sessionPrice}
                currency={state.settings.currencyLabel}
              />
            ))}
          </ul>
        </section>
      )}

      {/* still to tick */}
      <section>
        <div className="flex items-center justify-between pb-1">
          <span className="section-label">
            {q ? '' : effectiveShowAll ? t('attendance.allSwimmers') : t('attendance.regulars')}
          </span>
          {!q && !nobodyRecent && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs font-semibold text-brand-600"
            >
              {showAll ? t('attendance.showRecent') : t('attendance.showAll')}
            </button>
          )}
        </div>
        {active.length === 0 ? (
          <EmptyState emoji="🏊" title={t('attendance.empty')} />
        ) : notPresent.length === 0 ? (
          q ? (
            <EmptyState emoji="🔍" title={t('attendance.noMatch', { name: q })} />
          ) : !effectiveShowAll && present.length < active.length ? (
            // Every regular is ticked but others are hidden — never imply
            // the whole roster is done; offer the rest instead.
            <button onClick={() => setShowAll(true)} className="btn-secondary w-full">
              {t('attendance.othersHidden', { count: active.length - present.length })}
            </button>
          ) : (
            <EmptyState emoji="✅" title={t('attendance.allPresent')} />
          )
        ) : (
          <ul className="flex flex-col gap-1.5">
            {notPresent.map((s) => (
              <SwimmerRow
                key={s.id}
                swimmer={s}
                date={date}
                attendance={null}
                onOverride={() => setOverrideFor(s)}
                price={state.settings.sessionPrice}
                currency={state.settings.currencyLabel}
              />
            ))}
          </ul>
        )}
      </section>

      {overrideFor && (
        <OverrideSheet swimmer={overrideFor} date={date} onClose={() => setOverrideFor(null)} />
      )}
    </div>
  )
}

function SwimmerRow({
  swimmer,
  date,
  attendance,
  onOverride,
  price,
  currency,
}: {
  swimmer: Swimmer
  date: string
  attendance: Attendance | null
  onOverride: () => void
  price: number
  currency: string
}) {
  const { t } = useTranslation()
  const present = attendance !== null
  const amount = attendance ? attendance.amountOverride ?? price : price
  const overridden = attendance?.amountOverride != null

  return (
    <li
      className={`card flex items-center gap-1 pr-2 transition-shadow ${
        present ? 'ring-2 ring-brand-400' : ''
      }`}
    >
      <button
        onClick={() => store.toggleAttendance(swimmer.id, date)}
        aria-pressed={present}
        aria-label={
          present
            ? t('attendance.markAbsent', { name: swimmer.displayName })
            : t('attendance.markPresent', { name: swimmer.displayName })
        }
        className="flex min-h-[56px] flex-1 items-center gap-3 rounded-2xl px-3 text-left"
      >
        {present ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white"
            aria-hidden="true"
          >
            <CheckIcon className="h-5 w-5 animate-pop-in" />
          </span>
        ) : (
          <Avatar name={swimmer.displayName} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-slate-800">
            {swimmer.displayName}
          </span>
          {swimmer.note && (
            <span className="block truncate text-xs text-slate-400">{swimmer.note}</span>
          )}
        </span>
      </button>
      {present && (
        <button
          onClick={onOverride}
          className={`chip !py-1.5 text-sm ${
            overridden ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {amount}
          {currency}
        </button>
      )}
    </li>
  )
}

function OverrideSheet({
  swimmer,
  date,
  onClose,
}: {
  swimmer: Swimmer
  date: string
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const state = useAppState()
  const att = state.attendance.find(
    (a) => a.swimmerId === swimmer.id && a.sessionDate === date,
  )
  const [value, setValue] = useState(String(att?.amountOverride ?? state.settings.sessionPrice))
  const n = Number(value)
  const valid = Number.isFinite(n) && n >= 0

  function save() {
    if (!valid) return
    const isDefault = n === state.settings.sessionPrice
    store.setAttendanceOverride(swimmer.id, date, isDefault ? null : n)
    onClose()
  }

  return (
    <Sheet title={t('attendance.overrideTitle')} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">
        {t('attendance.overrideHint', {
          name: swimmer.displayName,
          date: formatDateLabel(date, i18n.language),
        })}
      </p>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        className="input text-lg"
        aria-label={t('attendance.overrideTitle')}
      />
      <button
        onClick={() => setValue(String(state.settings.sessionPrice))}
        className="chip mt-2 bg-slate-100 text-slate-600 !py-1.5"
      >
        {t('attendance.useDefault', {
          amount: `${state.settings.sessionPrice}${state.settings.currencyLabel}`,
        })}
      </button>
      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">
          {t('common.cancel')}
        </button>
        <button onClick={save} disabled={!valid} className="btn-primary flex-1">
          {t('common.save')}
        </button>
      </div>
    </Sheet>
  )
}
