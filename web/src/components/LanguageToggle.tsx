import { useTranslation } from 'react-i18next'
import { setLanguage } from '../i18n'

export default function LanguageToggle() {
  const { i18n } = useTranslation()
  const lang = i18n.language
  return (
    <div className="inline-flex rounded-full bg-slate-200 p-0.5 text-sm">
      <button
        onClick={() => setLanguage('zh-Hant')}
        className={`rounded-full px-3 py-1 ${
          lang === 'zh-Hant' ? 'bg-white font-semibold text-brand-700 shadow-sm' : 'text-slate-500'
        }`}
      >
        中
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`rounded-full px-3 py-1 ${
          lang === 'en' ? 'bg-white font-semibold text-brand-700 shadow-sm' : 'text-slate-500'
        }`}
      >
        EN
      </button>
    </div>
  )
}
