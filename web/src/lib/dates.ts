/** Session weekdays: Sunday(0), Monday(1), Thursday(4). */
export const SESSION_WEEKDAYS = new Set([0, 1, 4])

/** Today's date as 'YYYY-MM-DD' in the given IANA timezone. */
export function todayInTz(tz: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Weekday (0=Sun..6=Sat) for a 'YYYY-MM-DD' string, timezone-independent. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export function isSessionDay(dateStr: string): boolean {
  return SESSION_WEEKDAYS.has(weekdayOf(dateStr))
}

/** 'YYYY-MM-DD' shifted by n days, timezone-independent. */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
export function weekdayLabel(dateStr: string): string {
  return `週${WEEKDAY_LABELS[weekdayOf(dateStr)]}`
}

const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2026-07-08' → '7月8日 週三' (zh) or 'Wed, Jul 8' (en). */
export function formatDateLabel(dateStr: string, lang: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  if (lang.startsWith('zh')) return `${m}月${d}日 ${weekdayLabel(dateStr)}`
  return `${WEEKDAY_EN[weekdayOf(dateStr)]}, ${MONTH_EN[m - 1]} ${d}`
}

/** '2026-07' → '2026年7月' (zh) or 'Jul 2026' (en). */
export function formatMonthTitle(month: string, lang: string): string {
  const [y, m] = month.split('-').map(Number)
  if (lang.startsWith('zh')) return `${y}年${m}月`
  return `${MONTH_EN[m - 1]} ${y}`
}

/** 'YYYY-MM' shifted by n months. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const total = y * 12 + (m - 1) + n
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  return `${ny}-${String(nm).padStart(2, '0')}`
}
