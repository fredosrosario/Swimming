import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import { netBalance, outstandingBalance } from '../../lib/ledger'
import type { Swimmer } from '../../lib/types'

export default function PaymentsScreen() {
  const { t } = useTranslation()
  const state = useAppState()
  const [openFor, setOpenFor] = useState<Swimmer | null>(null)

  const rows = useMemo(() => {
    return state.swimmers
      .filter((s) => s.active)
      .map((s) => ({ swimmer: s, balance: netBalance(state, s.id) }))
      .filter((r) => r.balance !== 0)
      .sort((a, b) => b.balance - a.balance)
  }, [state])

  return (
    <div className="flex flex-col gap-2 p-3">
      {rows.length === 0 && (
        <p className="p-6 text-center text-slate-400">{t('payments.noneOwing')}</p>
      )}
      <ul className="flex flex-col gap-2">
        {rows.map(({ swimmer, balance }) => (
          <li
            key={swimmer.id}
            className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm"
          >
            <div>
              <div className="font-medium text-slate-800">{swimmer.displayName}</div>
              <div
                className={`text-sm ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
              >
                {balance > 0
                  ? t('payments.owes', { amount: balance })
                  : t('payments.credit', { amount: -balance })}
              </div>
            </div>
            <button
              onClick={() => setOpenFor(swimmer)}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white active:bg-brand-700"
            >
              {t('payments.record')}
            </button>
          </li>
        ))}
      </ul>

      {openFor && <PaymentModal swimmer={openFor} onClose={() => setOpenFor(null)} />}
    </div>
  )
}

function PaymentModal({ swimmer, onClose }: { swimmer: Swimmer; onClose: () => void }) {
  const { t } = useTranslation()
  const state = useAppState()
  const owed = outstandingBalance(state, swimmer.id)
  const [amount, setAmount] = useState(String(owed > 0 ? owed : ''))
  const [note, setNote] = useState('')

  const history = state.payments
    .filter((p) => p.swimmerId === swimmer.id)
    .sort((a, b) => b.paidOn.localeCompare(a.paidOn))

  function record() {
    const n = Number(amount)
    if (!n || n <= 0) return
    store.addPayment(swimmer.id, n, store.today(), note.trim() || undefined)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/30" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-md rounded-t-2xl bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-800">{swimmer.displayName}</span>
          <span className={`text-sm ${owed > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {owed > 0 ? t('payments.owes', { amount: owed }) : t('payments.settled')}
          </span>
        </div>

        <label className="mt-2 block text-sm text-slate-500">{t('payments.amount')}</label>
        <input
          type="number"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-lg outline-none focus:border-brand-400"
        />
        {owed > 0 && (
          <button
            onClick={() => setAmount(String(owed))}
            className="mt-2 rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600"
          >
            {t('payments.full', { amount: owed })}
          </button>
        )}

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('payments.note')}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
        />

        <div className="mt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-100 py-2 font-medium text-slate-600"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={record}
            className="flex-1 rounded-xl bg-brand-600 py-2 font-semibold text-white"
          >
            {t('payments.record')}
          </button>
        </div>

        {history.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('payments.history')}
            </div>
            <ul className="flex flex-col gap-1">
              {history.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">
                    {p.paidOn} · {p.amount}
                    {state.settings.currencyLabel}
                    {p.note ? ` · ${p.note}` : ''}
                  </span>
                  <button
                    onClick={() => store.deletePayment(p.id)}
                    className="text-xs text-rose-500"
                  >
                    {t('payments.delete')}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
