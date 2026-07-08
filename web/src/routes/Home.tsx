import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../lib/useStore'
import { store } from '../lib/store'
import LanguageToggle from '../components/LanguageToggle'
import { ChevronRightIcon, WaveMark } from '../components/icons'

export default function Home() {
  const { t } = useTranslation()
  const { settings } = useAppState()
  // In remote mode a token is only present once this device has opened a
  // link the server accepted — never offer a button that will be rejected.
  const hasCoach = !!settings.coachToken
  const hasParent = !!settings.parentToken

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-700 via-brand-600 to-brand-400">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-6">
        <div className="flex flex-col items-center text-center">
          <WaveMark className="h-16 w-16 drop-shadow-lg" />
          <h1 className="mt-4 text-xl font-bold text-white">{t('home.title')}</h1>
          <p className="mt-1 text-brand-100">{t('home.subtitle')}</p>
        </div>

      <div className="flex w-full flex-col gap-3">
        {hasCoach && (
          <Link to={`/c/${settings.coachToken}`} className="card flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-xl text-white">
              ✓
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-slate-800">{t('home.openCoach')}</span>
              <span className="block text-sm text-slate-400">{t('home.openCoachHint')}</span>
            </span>
            <ChevronRightIcon className="h-5 w-5 text-slate-300" />
          </Link>
        )}
        {hasParent && (
          <Link to={`/p/${settings.parentToken}`} className="card flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-xl">
              👀
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-slate-800">{t('home.openParent')}</span>
              <span className="block text-sm text-slate-400">{t('home.openParentHint')}</span>
            </span>
            <ChevronRightIcon className="h-5 w-5 text-slate-300" />
          </Link>
        )}
          {!hasCoach && !hasParent && (
            <p className="rounded-2xl bg-white/95 px-4 py-4 text-center text-sm leading-relaxed text-slate-700 shadow-sm">
              {t('home.needLink')}
            </p>
          )}
        </div>

        {!store.isRemote() && (
          <p className="text-center text-xs text-brand-100">{t('home.note')}</p>
        )}
        <LanguageToggle onDark />
      </div>
    </div>
  )
}
