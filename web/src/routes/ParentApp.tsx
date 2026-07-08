import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../lib/store'
import { useAppState } from '../lib/useStore'
import {
  attendedSessions,
  milestoneReached,
  monthLabel,
  netBalance,
  nextMilestone,
  outstandingByMonth,
} from '../lib/ledger'
import { addMonths, formatDateLabel, formatMonthTitle } from '../lib/dates'
import type { Swimmer } from '../lib/types'
import LanguageToggle from '../components/LanguageToggle'
import CoachLoginSheet from '../components/CoachLoginSheet'
import { Avatar, EmptyState, Sheet, Stepper } from '../components/ui'
import { ChevronRightIcon, KeyIcon, SearchIcon, XIcon } from '../components/icons'

export default function ParentApp() {
  const { t, i18n } = useTranslation()
  const state = useAppState()
  const [month, setMonth] = useState(() => store.today().slice(0, 7))
  const [query, setQuery] = useState('')
  const [openFor, setOpenFor] = useState<Swimmer | null>(null)
  const [coachLoginOpen, setCoachLoginOpen] = useState(false)
  const currency = state.settings.currencyLabel

  const rows = useMemo(() => {
    const q = query.trim()
    return state.swimmers
      .filter((s) => s.active)
      .filter((s) => (q ? s.displayName.includes(q) : true))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        swimmer: s,
        attended: attendedSessions(state, s.id, month).length,
        balance: netBalance(state, s.id),
      }))
  }, [state, month, query])

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 pb-2.5 pt-safe text-white shadow-md">
        <div className="flex items-center justify-between gap-2 pt-2.5">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">{state.settings.clubName}</h1>
            <p className="truncate text-xs text-brand-100">{t('parent.readonly')}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <LanguageToggle onDark />
            <button
              onClick={() => setCoachLoginOpen(true)}
              aria-label={t('parent.coachLogin')}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
            >
              <KeyIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

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

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('parent.search')}
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

        {rows.length === 0 && <EmptyState emoji="🔍" title={t('parent.empty')} />}

        <ul className="flex flex-col gap-1.5 pb-6">
          {rows.map(({ swimmer, attended, balance }) => (
            <li key={swimmer.id}>
              <button
                onClick={() => setOpenFor(swimmer)}
                className="card flex min-h-[64px] w-full items-center gap-3 px-3 text-left"
              >
                <Avatar name={swimmer.displayName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">
                    {swimmer.displayName}
                  </span>
                  <span className="block text-sm text-slate-400">
                    {t('parent.attendedMonth', { count: attended })}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-xs text-slate-400">{t('parent.balance')}</span>
                  <span
                    className={`block font-semibold ${
                      balance > 0
                        ? 'text-rose-600'
                        : balance < 0
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                    }`}
                  >
                    {balance > 0
                      ? `${balance}${currency}`
                      : balance < 0
                        ? t('parent.credit', { amount: `${-balance}${currency}` })
                        : t('parent.settled')}
                  </span>
                </span>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {openFor && (
        <SwimmerDetailSheet swimmer={openFor} month={month} onClose={() => setOpenFor(null)} />
      )}
      {coachLoginOpen && <CoachLoginSheet onClose={() => setCoachLoginOpen(false)} />}
    </div>
  )
}

function SwimmerDetailSheet({
  swimmer,
  month,
  onClose,
}: {
  swimmer: Swimmer
  month: string
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const state = useAppState()
  const currency = state.settings.currencyLabel
  const sessions = attendedSessions(state, swimmer.id, month)
  const owingMonths = outstandingByMonth(state, swimmer.id)
  const payments = state.payments
    .filter((p) => p.swimmerId === swimmer.id)
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn))
  const owedTotal = owingMonths.reduce((s, m) => s + m.amount, 0)
  const totalSessions = state.attendance.filter((a) => a.swimmerId === swimmer.id).length
  const reached = milestoneReached(totalSessions)
  const next = nextMilestone(totalSessions)

  return (
    <Sheet
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <Avatar name={swimmer.displayName} size="lg" />
          <span>
            {swimmer.displayName}
            <span
              className={`block text-sm font-medium ${
                owedTotal > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {owedTotal > 0
                ? `${t('parent.balance')} ${owedTotal}${currency}`
                : t('parent.settled')}
            </span>
          </span>
        </span>
      }
    >
      {/* milestone progress — a little celebration for the kids */}
      {totalSessions > 0 && (
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-brand-50 to-sky-50 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-700">
              {t('parent.totalSessions', { count: totalSessions })}
            </span>
            {reached && (
              <span className="chip bg-amber-100 text-amber-700">
                🏅 {t('parent.milestone', { target: reached })}
              </span>
            )}
          </div>
          {next && (
            <>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100"
                role="progressbar"
                aria-valuenow={totalSessions}
                aria-valuemin={reached ?? 0}
                aria-valuemax={next}
              >
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${Math.min(100, (totalSessions / next) * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {t('parent.nextMilestone', { remaining: next - totalSessions, target: next })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="section-label mb-1">
        {t('parent.sessionsIn')} · {formatMonthTitle(month, i18n.language)}
      </div>
      {sessions.length === 0 ? (
        <p className="mb-3 text-sm text-slate-400">{t('parent.noSessions')}</p>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {sessions.map((s) => (
            <span key={s.date} className="chip bg-brand-50 text-brand-700">
              {formatDateLabel(s.date, i18n.language)}
              {s.amount !== state.settings.sessionPrice && (
                <span className="text-brand-400">
                  {s.amount}
                  {currency}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {owingMonths.length > 0 && (
        <>
          <div className="section-label mb-1">{t('parent.owingMonths')}</div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {owingMonths.map((m) => (
              <span key={m.month} className="chip bg-rose-50 text-rose-600">
                {monthLabel(m.month)} {m.amount}
                {currency}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="section-label mb-1">{t('parent.payments')}</div>
      {payments.length === 0 ? (
        <p className="text-sm text-slate-400">{t('parent.noPayments')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm"
            >
              <span className="text-slate-600">{p.paidOn}</span>
              <span className="font-semibold text-slate-800">
                {p.amount}
                {currency}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button onClick={onClose} className="btn-secondary mt-4 w-full">
        {t('common.close')}
      </button>
    </Sheet>
  )
}
