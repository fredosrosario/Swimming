import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '../components/LanguageToggle'
import CoachLoginSheet from '../components/CoachLoginSheet'
import { ChevronRightIcon, LockIcon, WaveMark } from '../components/icons'

export default function Home() {
  const { t } = useTranslation()
  const [coachLoginOpen, setCoachLoginOpen] = useState(false)

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-700 via-brand-600 to-brand-400">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-8 p-6">
        <div className="flex flex-col items-center text-center">
          <WaveMark className="h-16 w-16 drop-shadow-lg" />
          <h1 className="mt-4 text-xl font-bold text-white">{t('home.title')}</h1>
          <p className="mt-1 text-brand-100">{t('home.subtitle')}</p>
        </div>

        <div className="flex w-full flex-col gap-3">
          {/* Parent: read-only, open to everyone. */}
          <Link to="/parent" className="card flex items-center gap-3 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-xl">
              👀
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-slate-800">{t('home.openParent')}</span>
              <span className="block text-sm text-slate-400">{t('home.openParentHint')}</span>
            </span>
            <ChevronRightIcon className="h-5 w-5 text-slate-300" />
          </Link>

          {/* Coach: edit access, gated by the PIN. */}
          <button
            onClick={() => setCoachLoginOpen(true)}
            className="card flex items-center gap-3 p-4 text-left"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-xl text-white">
              ✓
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-slate-800">{t('home.openCoach')}</span>
              <span className="block text-sm text-slate-400">{t('home.openCoachHint')}</span>
            </span>
            <LockIcon className="h-4 w-4 text-slate-300" />
          </button>
        </div>

        <LanguageToggle onDark />
      </div>

      {coachLoginOpen && <CoachLoginSheet onClose={() => setCoachLoginOpen(false)} />}
    </div>
  )
}
