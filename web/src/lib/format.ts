/** Compact display for large amounts in stat tiles: 9500 stays exact,
 *  150000 → 15萬 (zh) / 150K (en). Exact figures remain in lists and sheets. */
export function compactAmount(n: number, lang: string): string {
  if (Math.abs(n) < 10000) return String(n)
  return new Intl.NumberFormat(lang.startsWith('zh') ? 'zh-Hant' : 'en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n)
}
