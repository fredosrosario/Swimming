import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { settings } = useAppState()
  // Absolute link to this deployment's index, with a hash route appended
  // (HashRouter → works on GitHub Pages without server rewrites).
  const base =
    typeof window !== 'undefined'
      ? window.location.origin + window.location.pathname
      : ''

  return (
    <div className="flex flex-col gap-4 p-3">
      <section className="rounded-xl bg-white p-3 shadow-sm">
        <Field label={t('settings.venue')}>
          <input
            value={settings.venueName}
            onChange={(e) => store.updateSettings({ venueName: e.target.value })}
            className="input"
          />
        </Field>
        <Field label={t('settings.price')}>
          <input
            type="number"
            inputMode="numeric"
            value={settings.sessionPrice}
            onChange={(e) => store.updateSettings({ sessionPrice: Number(e.target.value) || 0 })}
            className="input"
          />
        </Field>
        <Field label={t('settings.currency')}>
          <input
            value={settings.currencyLabel}
            onChange={(e) => store.updateSettings({ currencyLabel: e.target.value })}
            className="input"
          />
        </Field>
      </section>

      <section className="rounded-xl bg-white p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('settings.links')}
        </div>
        <LinkRow
          label={t('settings.coachLink')}
          url={`${base}#/c/${settings.coachToken}`}
          onRotate={() => {
            if (confirm(t('settings.rotateWarn'))) store.rotateToken('coachToken')
          }}
        />
        <LinkRow
          label={t('settings.parentLink')}
          url={`${base}#/p/${settings.parentToken}`}
          onRotate={() => {
            if (confirm(t('settings.rotateWarn'))) store.rotateToken('parentToken')
          }}
        />
      </section>

      <style>{`.input{width:100%;border:1px solid #e2e8f0;border-radius:0.75rem;padding:0.5rem 0.75rem;outline:none}
        .input:focus{border-color:#38bdf8}`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function LinkRow({ label, url, onRotate }: { label: string; url: string; onRotate: () => void }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="mb-3">
      <div className="mb-1 text-sm text-slate-600">{label}</div>
      <div className="truncate rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">{url}</div>
      <div className="mt-1 flex gap-3">
        <button onClick={copy} className="text-sm font-medium text-brand-600">
          {copied ? t('common.copied') : t('settings.copyLink')}
        </button>
        <button onClick={onRotate} className="text-sm font-medium text-rose-500">
          {t('settings.rotate')}
        </button>
      </div>
    </div>
  )
}
