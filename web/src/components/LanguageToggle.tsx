import { useTranslation } from 'react-i18next'
import { setLanguage } from '../i18n'

export default function LanguageToggle({ onDark = false }: { onDark?: boolean }) {
  const { i18n } = useTranslation()
  const lang = i18n.language
  const wrap = onDark ? 'bg-white/15' : 'bg-slate-200'
  const on = onDark ? 'bg-white font-semibold text-brand-700 shadow-sm' : 'bg-white font-semibold text-brand-700 shadow-sm'
  const off = onDark ? 'text-white/80' : 'text-slate-500'
  return (
    <div className={`inline-flex rounded-full p-0.5 text-sm ${wrap}`}>
      <button
        onClick={() => setLanguage('zh-Hant')}
        aria-pressed={lang === 'zh-Hant'}
        className={`rounded-full px-3 py-1 ${lang === 'zh-Hant' ? on : off}`}
      >
        中
      </button>
      <button
        onClick={() => setLanguage('en')}
        aria-pressed={lang === 'en'}
        className={`rounded-full px-3 py-1 ${lang === 'en' ? on : off}`}
      >
        EN
      </button>
    </div>
  )
}
