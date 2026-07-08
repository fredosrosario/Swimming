import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppState } from '../lib/useStore'
import { store } from '../lib/store'
import LanguageToggle from '../components/LanguageToggle'
import { Sheet } from '../components/ui'
import { ChevronRightIcon, CopyIcon, KeyIcon, WaveMark } from '../components/icons'

export default function Home() {
  const { t } = useTranslation()
  const { settings } = useAppState()
  const [recoverOpen, setRecoverOpen] = useState(false)
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

        <button
          onClick={() => setRecoverOpen(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-white/85 active:text-white"
        >
          <KeyIcon className="h-4 w-4" />
          {t('home.recover')}
        </button>

        {!store.isRemote() && (
          <p className="text-center text-xs text-brand-100">{t('home.note')}</p>
        )}
        <LanguageToggle onDark />
      </div>

      {recoverOpen && <RecoverSheet onClose={() => setRecoverOpen(false)} />}
    </div>
  )
}

function RecoverSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<'wrong' | 'network' | null>(null)
  const [tokens, setTokens] = useState<{ coachToken: string; parentToken: string } | null>(null)
  const base =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''

  async function unlock() {
    if (!pin.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await store.recover(pin)
      if (result) setTokens(result)
      else setError('wrong')
    } catch {
      setError('network')
    } finally {
      setBusy(false)
    }
  }

  if (tokens) {
    return (
      <Sheet title={t('home.recoverTitle')} onClose={onClose}>
        <p className="mb-3 text-sm text-slate-500">{t('home.recoverFound')}</p>
        <RevealRow
          label={t('settings.coachLink')}
          to={`/c/${tokens.coachToken}`}
          url={`${base}#/c/${tokens.coachToken}`}
        />
        <RevealRow
          label={t('settings.parentLink')}
          to={`/p/${tokens.parentToken}`}
          url={`${base}#/p/${tokens.parentToken}`}
        />
        <button onClick={onClose} className="btn-secondary mt-2 w-full">
          {t('common.close')}
        </button>
      </Sheet>
    )
  }

  return (
    <Sheet title={t('home.recoverTitle')} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">{t('home.recoverPrompt')}</p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        value={pin}
        onChange={(e) => {
          setPin(e.target.value)
          setError(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && unlock()}
        placeholder={t('home.recoverPinPlaceholder')}
        aria-label={t('home.recoverPinPlaceholder')}
        className="input text-lg tracking-[0.3em]"
      />
      {error === 'wrong' && <p className="mt-2 text-sm text-rose-600">{t('home.recoverWrong')}</p>}
      {error === 'network' && (
        <p className="mt-2 text-sm text-rose-600">{t('home.recoverError')}</p>
      )}
      <div className="mt-4 flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">
          {t('common.cancel')}
        </button>
        <button onClick={unlock} disabled={!pin.trim() || busy} className="btn-primary flex-1">
          {t('home.recoverUnlock')}
        </button>
      </div>
    </Sheet>
  )
}

function RevealRow({ label, to, url }: { label: string; to: string; url: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mb-3">
      <div className="mb-1 text-sm font-medium text-slate-600">{label}</div>
      <div className="truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
        {url}
      </div>
      <div className="mt-1.5 flex gap-2">
        <Link to={to} className="btn-primary !min-h-[36px] !px-3 text-sm">
          {t('home.openLink')}
        </Link>
        <button onClick={copy} className="btn-secondary !min-h-[36px] gap-1 !px-3 text-sm">
          <CopyIcon className="h-4 w-4" />
          {copied ? t('common.copied') : t('settings.copyLink')}
        </button>
      </div>
    </div>
  )
}
