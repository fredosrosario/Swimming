import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageToggle from '../components/LanguageToggle'
import AttendanceScreen from './coach/AttendanceScreen'
import PaymentsScreen from './coach/PaymentsScreen'
import RosterScreen from './coach/RosterScreen'
import MessageScreen from './coach/MessageScreen'
import SettingsScreen from './coach/SettingsScreen'

type Tab = 'attendance' | 'payments' | 'roster' | 'message' | 'settings'

const TABS: { key: Tab; icon: string }[] = [
  { key: 'attendance', icon: '✓' },
  { key: 'payments', icon: '$' },
  { key: 'roster', icon: '☰' },
  { key: 'message', icon: '✉' },
  { key: 'settings', icon: '⚙' },
]

export default function CoachApp() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('attendance')

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-4 py-2">
        <span className="font-semibold text-slate-700">{t(`nav.${tab}`)}</span>
        <LanguageToggle />
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {tab === 'attendance' && <AttendanceScreen />}
        {tab === 'payments' && <PaymentsScreen />}
        {tab === 'roster' && <RosterScreen />}
        {tab === 'message' && <MessageScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t bg-white">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              tab === tb.key ? 'text-brand-600' : 'text-slate-400'
            }`}
          >
            <span className="text-lg leading-none">{tb.icon}</span>
            {t(`nav.${tb.key}`)}
          </button>
        ))}
      </nav>
    </div>
  )
}
