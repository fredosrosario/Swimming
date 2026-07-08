import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { store } from '../lib/store'
import { Sheet } from './ui'

/**
 * PIN gate for coach (edit) access. The correct PIN trades for the coach token
 * and opens the coach view; wrong-PIN and offline states are surfaced inline.
 * Used from the Home chooser and the parent view's header.
 */
export default function CoachLoginSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<'wrong' | 'network' | null>(null)

  async function unlock() {
    if (!pin.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await store.recover(pin)
      if (result) navigate(`/c/${result.coachToken}`)
      else setError('wrong')
    } catch {
      setError('network')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title={t('parent.coachLoginTitle')} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">{t('parent.coachLoginPrompt')}</p>
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
