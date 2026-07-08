import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import { monthLabel, netBalance, outstandingBalance, outstandingByMonth } from '../../lib/ledger'
import type { Swimmer } from '../../lib/types'
import { Avatar, EmptyState, Sheet, toast } from '../../components/ui'
import { ChevronRightIcon, SearchIcon, TrashIcon, XIcon } from '../../components/icons'

export default function PaymentsScreen() {
  const { t } = useTranslation()
  const state = useAppState()
  const [openFor, setOpenFor] = useState<Swimmer | null>(null)
  const [query, setQuery] = useState('')
  const [showSettled, setShowSettled] = useState(false)
  const currency = state.settings.currencyLabel

  const { owing, settled, totalOwed } = useMemo(() => {
    const q = query.trim()
    const rows = state.swimmers
      .filter((s) => s.active)
      .filter((s) => (q ? s.displayName.includes(q) : true))
      .map((s) => ({ swimmer: s, balance: netBalance(state, s.id) }))
    return {
      owing: rows.filter((r) => r.balance !== 0).sort((a, b) => b.balance - a.balance),
      settled: rows
        .filter((r) => r.balance === 0)
        .sort((a, b) => a.swimmer.sortOrder - b.swimmer.sortOrder),
      totalOwed: rows.reduce((sum, r) => sum + Math.max(0, r.balance), 0),
    }
  }, [state, query])

  const owingCount = owing.filter((r) => r.balance > 0).length
  const q = query.trim()

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* summary */}
      <div className="card flex items-center justify-between p-4">
        <div>
          <div className="text-2xl font-bold text-slate-800">
            {totalOwed}
            {currency}
          </div>
          <div className="text-sm text-slate-400">{t('payments.totalLabel')}</div>
        </div>
        <span className="chip bg-rose-50 text-sm text-rose-600 !py-1.5">
          {t('payments.owingSummary', { count: owingCount })}
        </span>
      </div>

      {/* search */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('payments.search')}
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

      {owing.length === 0 && !q && (
        <EmptyState emoji="🎉" title={t('payments.noneOwing')} hint={t('payments.noneOwingHint')} />
      )}
      {owing.length === 0 && q && settled.length === 0 && (
        <EmptyState emoji="🔍" title={t('attendance.noMatch', { name: q })} />
      )}

      <ul className="flex flex-col gap-1.5">
        {owing.map(({ swimmer, balance }) => (
          <BalanceRow
            key={swimmer.id}
            swimmer={swimmer}
            balance={balance}
            currency={currency}
            onOpen={() => setOpenFor(swimmer)}
          />
        ))}
      </ul>

      {/* settled — collapsed by default, expandable to record prepayments */}
      {settled.length > 0 && (
        <div>
          <button
            onClick={() => setShowSettled((v) => !v)}
            className="w-full py-1 text-center text-sm font-medium text-slate-400"
          >
            {showSettled
              ? t('payments.hideSettled')
              : t('payments.showSettled', { count: settled.length })}
          </button>
          {showSettled && (
            <ul className="mt-1 flex flex-col gap-1.5">
              {settled.map(({ swimmer, balance }) => (
                <BalanceRow
                  key={swimmer.id}
                  swimmer={swimmer}
                  balance={balance}
                  currency={currency}
                  onOpen={() => setOpenFor(swimmer)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {openFor && <PaymentSheet swimmer={openFor} onClose={() => setOpenFor(null)} />}
    </div>
  )
}

function BalanceRow({
  swimmer,
  balance,
  currency,
  onOpen,
}: {
  swimmer: Swimmer
  balance: number
  currency: string
  onOpen: () => void
}) {
  const { t } = useTranslation()
  return (
    <li>
      <button onClick={onOpen} className="card flex min-h-[60px] w-full items-center gap-3 px-3 text-left">
        <Avatar name={swimmer.displayName} />
        <span className="flex-1 truncate font-medium text-slate-800">{swimmer.displayName}</span>
        <span
          className={`text-sm font-semibold ${
            balance > 0 ? 'text-rose-600' : balance < 0 ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          {balance > 0
            ? t('payments.owes', { amount: `${balance}${currency}` })
            : balance < 0
              ? t('payments.credit', { amount: `${-balance}${currency}` })
              : t('payments.settled')}
        </span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-300" />
      </button>
    </li>
  )
}

function PaymentSheet({ swimmer, onClose }: { swimmer: Swimmer; onClose: () => void }) {
  const { t } = useTranslation()
  const state = useAppState()
  const currency = state.settings.currencyLabel
  const owed = outstandingBalance(state, swimmer.id)
  const months = outstandingByMonth(state, swimmer.id)
  const [amount, setAmount] = useState(String(owed > 0 ? owed : ''))
  const [note, setNote] = useState('')

  const n = Number(amount)
  const valid = Number.isFinite(n) && n > 0

  const history = state.payments
    .filter((p) => p.swimmerId === swimmer.id)
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.createdAt.localeCompare(a.createdAt))

  function record() {
    if (!valid) return
    store.addPayment(swimmer.id, n, store.today(), note.trim() || undefined)
    toast(t('payments.recorded', { name: swimmer.displayName, amount: `${n}${currency}` }))
    onClose()
  }

  return (
    <Sheet
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <Avatar name={swimmer.displayName} size="lg" />
          <span>
            {swimmer.displayName}
            <span
              className={`block text-sm font-medium ${owed > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
            >
              {owed > 0 ? t('payments.owes', { amount: `${owed}${currency}` }) : t('payments.settled')}
            </span>
          </span>
        </span>
      }
    >
      {months.length > 0 && (
        <div className="mb-3">
          <div className="section-label mb-1">{t('payments.owingMonths')}</div>
          <div className="flex flex-wrap gap-1.5">
            {months.map((m) => (
              <span key={m.month} className="chip bg-rose-50 text-rose-600">
                {monthLabel(m.month)} {m.amount}
                {currency}
              </span>
            ))}
          </div>
        </div>
      )}

      <label className="mb-1 block text-sm text-slate-500" htmlFor="pay-amount">
        {t('payments.amount')}
      </label>
      <input
        id="pay-amount"
        type="number"
        inputMode="decimal"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && record()}
        className="input text-lg"
      />
      {owed > 0 && n !== owed && (
        <button
          onClick={() => setAmount(String(owed))}
          className="chip mt-2 bg-slate-100 text-slate-600 !py-1.5"
        >
          {t('payments.full', { amount: `${owed}${currency}` })}
        </button>
      )}

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('payments.note')}
        className="input mt-2 text-sm"
      />

      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">
          {t('common.cancel')}
        </button>
        <button onClick={record} disabled={!valid} className="btn-primary flex-1">
          {t('payments.record')}
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-5">
          <div className="section-label mb-1">{t('payments.history')}</div>
          <ul className="flex flex-col gap-1">
            {history.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm"
              >
                <span className="text-slate-600">
                  {p.paidOn} ·{' '}
                  <span className="font-semibold text-slate-800">
                    {p.amount}
                    {currency}
                  </span>
                  {p.note ? <span className="text-slate-400"> · {p.note}</span> : ''}
                </span>
                <button
                  onClick={() => {
                    if (confirm(t('payments.confirmDelete', { amount: `${p.amount}${currency}` })))
                      store.deletePayment(p.id)
                  }}
                  aria-label={t('payments.delete')}
                  className="rounded-lg p-2 text-rose-400 active:bg-rose-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  )
}
