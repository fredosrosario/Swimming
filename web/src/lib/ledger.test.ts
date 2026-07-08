import { describe, expect, it } from 'vitest'
import type { AppState, Attendance, Payment } from './types'
import { buildMonthlyMessage, outstandingBalance, outstandingByMonth } from './ledger'

let seq = 0
function att(swimmerId: string, dates: string[], override?: number): Attendance[] {
  return dates.map((sessionDate) => ({
    id: `a${seq++}`,
    swimmerId,
    sessionDate,
    amountOverride: override ?? null,
    createdAt: sessionDate,
  }))
}
function daysIn(month: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
}
function pay(swimmerId: string, amount: number, paidOn: string): Payment {
  return { id: `p${seq++}`, swimmerId, amount, paidOn, createdAt: paidOn }
}

function baseState(attendance: Attendance[], payments: Payment[] = []): AppState {
  return {
    settings: {
      clubName: 'KaPok',
      venueName: '英才',
      sessionPrice: 15,
      currencyLabel: '元',
      coachToken: 'c',
      parentToken: 'p',
      timezone: 'Asia/Macau',
    },
    swimmers: [
      { id: 'jing', displayName: '靖翹', active: true, sortOrder: 0, createdAt: '' },
      { id: 'kai', displayName: '楷楷', active: true, sortOrder: 1, createdAt: '' },
      { id: 'yat', displayName: '逸信', active: true, sortOrder: 2, createdAt: '' },
      { id: 'paid', displayName: '已付', active: true, sortOrder: 3, createdAt: '' },
    ],
    attendance,
    payments,
  }
}

describe('outstandingByMonth', () => {
  it('carries unpaid charges forward across months', () => {
    const state = baseState([
      ...att('kai', daysIn('2026-05', 8)), // 8×15 = 120
      ...att('kai', daysIn('2026-06', 9)), // 9×15 = 135
    ])
    expect(outstandingByMonth(state, 'kai', '2026-06')).toEqual([
      { month: '2026-05', amount: 120 },
      { month: '2026-06', amount: 135 },
    ])
  })

  it('applies a partial payment FIFO to the oldest month first', () => {
    const state = baseState(
      [...att('kai', daysIn('2026-05', 8)), ...att('kai', daysIn('2026-06', 9))],
      [pay('kai', 150, '2026-06-30')], // clears May (120) + 30 of June
    )
    expect(outstandingByMonth(state, 'kai', '2026-06')).toEqual([
      { month: '2026-06', amount: 105 },
    ])
  })

  it('returns nothing once fully paid', () => {
    const state = baseState(att('paid', daysIn('2026-06', 4)), [pay('paid', 60, '2026-06-30')])
    expect(outstandingBalance(state, 'paid', '2026-06')).toBe(0)
  })
})

describe('buildMonthlyMessage', () => {
  const state = baseState(
    [
      ...att('jing', daysIn('2026-06', 4)), // 60元, single month
      ...att('kai', daysIn('2026-05', 8)), // carryover May 120
      ...att('kai', daysIn('2026-06', 9)), // + June 135 → 共255
      ...att('yat', ['2026-06-01'], 10), // overridden 10元 line
      ...att('paid', daysIn('2026-06', 4)), // 60 but fully paid → omitted
    ],
    [pay('paid', 60, '2026-06-30')],
  )
  const msg = buildMonthlyMessage(state, 2026, 6)

  it('has the header', () => {
    expect(msg.split('\n')[0]).toBe('2026年6月份英才門票。')
  })
  it('renders a single-month line inline', () => {
    expect(msg).toContain('\n靖翹60元\n')
  })
  it('renders a multi-month carryover with a 共 total', () => {
    expect(msg).toContain('楷楷\n5月120元6月135元\n共255元')
  })
  it('respects a per-session amount override', () => {
    expect(msg).toContain('\n逸信10元\n')
  })
  it('omits swimmers who owe nothing', () => {
    expect(msg).not.toContain('已付')
  })
  it('ends with the footer', () => {
    expect(msg.endsWith('請大家MP轉給我。\n註了名不用再給訊息')).toBe(true)
  })
})
