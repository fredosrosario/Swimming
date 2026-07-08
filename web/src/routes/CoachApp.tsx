import { useState, type ComponentType, type SVGProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../lib/useStore'
import SyncBadge from '../components/SyncBadge'
import { Toaster, useOnline } from '../components/ui'
import {
  MessageIcon,
  PaymentsIcon,
  RollCallIcon,
  RosterIcon,
  SettingsIcon,
} from '../components/icons'
import AttendanceScreen from './coach/AttendanceScreen'
import PaymentsScreen from './coach/PaymentsScreen'
import RosterScreen from './coach/RosterScreen'
import MessageScreen from './coach/MessageScreen'
import SettingsScreen from './coach/SettingsScreen'

type Tab = 'attendance' | 'payments' | 'roster' | 'message' | 'settings'

const TABS: { key: Tab; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { key: 'attendance', Icon: RollCallIcon },
  { key: 'payments', Icon: PaymentsIcon },
  { key: 'roster', Icon: RosterIcon },
  { key: 'message', Icon: MessageIcon },
  { key: 'settings', Icon: SettingsIcon },
]

export default function CoachApp() {
  const { t } = useTranslation()
  const { settings } = useAppState()
  const [tab, setTab] = useState<Tab>('attendance')
  const online = useOnline()

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-4 pb-2.5 pt-safe text-white shadow-md">
        <div className="flex items-center justify-between gap-2 pt-2.5">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold">{t(`nav.${tab}`)}</h1>
            <p className="truncate text-xs text-brand-100">{settings.clubName}</p>
          </div>
          <SyncBadge onDark />
        </div>
      </header>

      {!online && (
        <p className="bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700">
          {t('sync.offlineBanner')}
        </p>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {tab === 'attendance' && <AttendanceScreen />}
        {tab === 'payments' && <PaymentsScreen />}
        {tab === 'roster' && <RosterScreen />}
        {tab === 'message' && <MessageScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <nav
        aria-label={t('nav.attendance')}
        className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-slate-200 bg-white/95 pb-safe backdrop-blur"
      >
        <div className="flex">
          {TABS.map(({ key, Icon }) => {
            const current = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={current ? 'page' : undefined}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  current ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                <Icon className={`h-6 w-6 ${current ? '' : 'opacity-80'}`} />
                {t(`nav.${key}`)}
              </button>
            )
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  )
}
