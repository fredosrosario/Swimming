import type { AppState, Attendance, Settings, Swimmer } from './types'

/** The amount charged for a single attended session. */
export function chargeAmount(a: Attendance, settings: Settings): number {
  return a.amountOverride ?? settings.sessionPrice
}

/** 'YYYY-MM-DD' or 'YYYY-MM' → the month key 'YYYY-MM'. */
export function monthKey(dateOrMonth: string): string {
  return dateOrMonth.slice(0, 7)
}

/** 'YYYY-MM' → the Chinese month number label, e.g. '2026-05' → '5月'. */
export function monthLabel(month: string): string {
  const m = Number(month.slice(5, 7))
  return `${m}月`
}

interface Charge {
  date: string
  amount: number
}

function swimmerCharges(state: AppState, swimmerId: string, asOfMonth?: string): Charge[] {
  return state.attendance
    .filter((a) => a.swimmerId === swimmerId)
    .filter((a) => !asOfMonth || monthKey(a.sessionDate) <= asOfMonth)
    .map((a) => ({ date: a.sessionDate, amount: chargeAmount(a, state.settings) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function swimmerPaidTotal(state: AppState, swimmerId: string, asOfMonth?: string): number {
  return state.payments
    .filter((p) => p.swimmerId === swimmerId)
    .filter((p) => !asOfMonth || monthKey(p.paidOn) <= asOfMonth)
    .reduce((sum, p) => sum + p.amount, 0)
}

export interface MonthAmount {
  month: string
  amount: number
}

/**
 * Outstanding (unpaid) charges for a swimmer, grouped by month, in ascending
 * month order. Payments are applied FIFO to the oldest charges first, so a
 * partial payment eats into the earliest months and the remainder carries
 * forward — reproducing lines like "5月120元6月135元 共255元".
 */
export function outstandingByMonth(
  state: AppState,
  swimmerId: string,
  asOfMonth?: string,
): MonthAmount[] {
  const charges = swimmerCharges(state, swimmerId, asOfMonth)
  let remainingPayment = swimmerPaidTotal(state, swimmerId, asOfMonth)

  const byMonth = new Map<string, number>()
  const order: string[] = []
  for (const c of charges) {
    let owed = c.amount
    if (remainingPayment > 0) {
      const applied = Math.min(remainingPayment, owed)
      owed -= applied
      remainingPayment -= applied
    }
    if (owed <= 0) continue
    const m = monthKey(c.date)
    if (!byMonth.has(m)) order.push(m)
    byMonth.set(m, (byMonth.get(m) ?? 0) + owed)
  }
  return order.map((month) => ({ month, amount: byMonth.get(month)! }))
}

/** Total outstanding balance for a swimmer (>= 0; overpayment shows as 0 here). */
export function outstandingBalance(state: AppState, swimmerId: string, asOfMonth?: string): number {
  return outstandingByMonth(state, swimmerId, asOfMonth).reduce((s, m) => s + m.amount, 0)
}

/** Signed balance: positive = owes, negative = credit/overpaid. */
export function netBalance(state: AppState, swimmerId: string, asOfMonth?: string): number {
  const charged = swimmerCharges(state, swimmerId, asOfMonth).reduce((s, c) => s + c.amount, 0)
  return charged - swimmerPaidTotal(state, swimmerId, asOfMonth)
}

/** Number of sessions a swimmer attended (optionally within a month). */
export function sessionCount(state: AppState, swimmerId: string, asOfMonth?: string): number {
  return state.attendance.filter(
    (a) => a.swimmerId === swimmerId && (!asOfMonth || monthKey(a.sessionDate) === asOfMonth),
  ).length
}

function formatSwimmerLine(
  swimmer: Swimmer,
  months: MonthAmount[],
  currency: string,
): string[] {
  if (months.length === 0) return []
  if (months.length === 1) {
    return [`${swimmer.displayName}${months[0].amount}${currency}`]
  }
  const total = months.reduce((s, m) => s + m.amount, 0)
  const breakdown = months.map((m) => `${monthLabel(m.month)}${m.amount}${currency}`).join('')
  return [swimmer.displayName, breakdown, `共${total}${currency}`]
}

/**
 * Build the paste-able Traditional-Chinese monthly message as of the end of the
 * given year/month. Includes every active swimmer with a positive outstanding
 * balance, broken down by month. Swimmers who owe nothing are omitted.
 */
export function buildMonthlyMessage(state: AppState, year: number, month: number): string {
  const asOfMonth = `${year}-${String(month).padStart(2, '0')}`
  const { venueName, currencyLabel } = state.settings

  const lines: string[] = [`${year}年${month}月份${venueName}門票。`]

  const activeSwimmers = [...state.swimmers]
    .filter((s) => s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  for (const swimmer of activeSwimmers) {
    const months = outstandingByMonth(state, swimmer.id, asOfMonth)
    lines.push(...formatSwimmerLine(swimmer, months, currencyLabel))
  }

  lines.push('', '請大家MP轉給我。', '註了名不用再給訊息')
  return lines.join('\n')
}
