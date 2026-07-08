import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../lib/useStore'
import { store } from '../lib/store'
import LanguageToggle from '../components/LanguageToggle'

export default function Home() {
  const { t } = useTranslation()
  const { settings } = useAppState()
  // In remote mode a token is only present once this device has opened a
  // link the server accepted — never offer a button that will be rejected.
  const hasCoach = !!settings.coachToken
  const hasParent = !!settings.parentToken
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        <div className="text-4xl">🏊</div>
        <h1 className="mt-2 text-xl font-bold text-slate-800">{t('home.title')}</h1>
        <p className="mt-1 text-slate-500">{t('home.subtitle')}</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        {hasCoach && (
          <Link
            to={`/c/${settings.coachToken}`}
            className="rounded-xl bg-brand-600 px-4 py-3 text-center font-semibold text-white shadow-sm active:bg-brand-700"
          >
            {t('home.openCoach')}
          </Link>
        )}
        {hasParent && (
          <Link
            to={`/p/${settings.parentToken}`}
            className="rounded-xl bg-white px-4 py-3 text-center font-semibold text-brand-700 shadow-sm ring-1 ring-brand-200 active:bg-brand-50"
          >
            {t('home.openParent')}
          </Link>
        )}
        {!hasCoach && !hasParent && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700 ring-1 ring-amber-200">
            {t('home.needLink')}
          </p>
        )}
      </div>
      {store.isRemote() ? null : (
        <p className="text-center text-xs text-slate-400">{t('home.note')}</p>
      )}
      <LanguageToggle />
    </div>
  )
}
