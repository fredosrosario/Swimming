import { useTranslation } from 'react-i18next'

export default function InvalidLink() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="text-4xl">🔒</div>
      <h1 className="text-lg font-bold text-slate-800">{t('invalid.title')}</h1>
      <p className="text-slate-500">{t('invalid.body')}</p>
    </div>
  )
}
