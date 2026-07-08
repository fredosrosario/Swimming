import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { renderSVG } from 'uqr'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import LanguageToggle from '../../components/LanguageToggle'
import { Sheet, toast } from '../../components/ui'
import { CopyIcon, DownloadIcon, QrIcon, ShareIcon } from '../../components/icons'

export default function SettingsScreen() {
  const { t } = useTranslation()
  const { settings } = useAppState()
  // Absolute link to this deployment's index, with a hash route appended
  // (HashRouter → works on GitHub Pages without server rewrites).
  const base =
    typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''

  function exportBackup() {
    const data = JSON.stringify(store.getState(), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kapok-backup-${store.today()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      <Section title={t('settings.club')}>
        <Field label={t('settings.clubName')}>
          <input
            value={settings.clubName}
            onChange={(e) => store.updateSettings({ clubName: e.target.value })}
            className="input"
          />
        </Field>
        <Field label={t('settings.venue')}>
          <input
            value={settings.venueName}
            onChange={(e) => store.updateSettings({ venueName: e.target.value })}
            className="input"
          />
        </Field>
        <div className="flex gap-3">
          <Field label={t('settings.price')} className="flex-1">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              value={settings.sessionPrice}
              onChange={(e) => store.updateSettings({ sessionPrice: Number(e.target.value) || 0 })}
              className="input"
            />
          </Field>
          <Field label={t('settings.currency')} className="flex-1">
            <input
              value={settings.currencyLabel}
              onChange={(e) => store.updateSettings({ currencyLabel: e.target.value })}
              className="input"
            />
          </Field>
        </div>
      </Section>

      <Section title={t('settings.links')}>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">{t('settings.linksHint')}</p>
        <LinkRow
          label={t('settings.parentLink')}
          url={`${base}#/p/${settings.parentToken}`}
          onRotate={() => {
            if (confirm(t('settings.rotateWarn'))) void store.rotateToken('parentToken')
          }}
        />
        {settings.coachToken && (
          <LinkRow
            label={t('settings.coachLink')}
            url={`${base}#/c/${settings.coachToken}`}
            onRotate={() => {
              if (confirm(t('settings.rotateWarn'))) void store.rotateToken('coachToken')
            }}
          />
        )}
      </Section>

      <Section title={t('settings.recovery')}>
        <Field label={t('settings.recoveryPin')}>
          <input
            value={settings.recoveryPin ?? '1111'}
            onChange={(e) => store.updateSettings({ recoveryPin: e.target.value })}
            inputMode="numeric"
            autoComplete="off"
            className="input tracking-[0.2em]"
          />
        </Field>
        <p className="text-xs leading-relaxed text-slate-400">{t('settings.recoveryHint')}</p>
      </Section>

      <Section title={t('settings.language')}>
        <LanguageToggle />
      </Section>

      <Section title={t('settings.data')}>
        <button onClick={exportBackup} className="btn-secondary w-full">
          <DownloadIcon className="h-5 w-5" />
          {t('settings.export')}
        </button>
        <p className="mt-2 text-xs text-slate-400">{t('settings.exportHint')}</p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="section-label mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`mb-3 block ${className}`}>
      <span className="mb-1 block text-sm text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function LinkRow({ label, url, onRotate }: { label: string; url: string; onRotate: () => void }) {
  const { t } = useTranslation()
  const [showQr, setShowQr] = useState(false)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      toast(t('common.copied'))
    } catch {
      /* ignore */
    }
  }

  async function share() {
    try {
      await navigator.share({ url })
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-1 text-sm font-medium text-slate-600">{label}</div>
      <div className="truncate rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
        {url}
      </div>
      <div className="mt-1.5 flex gap-2">
        <button onClick={copy} className="btn-secondary !min-h-[36px] gap-1 !px-3 text-sm">
          <CopyIcon className="h-4 w-4" />
          {t('settings.copyLink')}
        </button>
        {canShare && (
          <button onClick={share} className="btn-secondary !min-h-[36px] gap-1 !px-3 text-sm">
            <ShareIcon className="h-4 w-4" />
            {t('settings.shareLink')}
          </button>
        )}
        <button onClick={() => setShowQr(true)} className="btn-secondary !min-h-[36px] gap-1 !px-3 text-sm">
          <QrIcon className="h-4 w-4" />
          {t('settings.showQr')}
        </button>
        <span className="flex-1" />
        <button onClick={onRotate} className="btn-danger !min-h-[36px] !px-3 text-sm">
          {t('settings.rotate')}
        </button>
      </div>
      {showQr && <QrSheet label={label} url={url} onClose={() => setShowQr(false)} />}
    </div>
  )
}

function QrSheet({ label, url, onClose }: { label: string; url: string; onClose: () => void }) {
  const { t } = useTranslation()
  // uqr emits a plain black-on-white SVG string — safe to inline (our input).
  const svg = useMemo(() => renderSVG(url, { ecc: 'M', border: 2 }), [url])
  return (
    <Sheet title={t('settings.qrTitle')} onClose={onClose}>
      <p className="mb-3 text-sm text-slate-500">{label}</p>
      <div
        className="mx-auto w-64 max-w-full overflow-hidden rounded-2xl ring-1 ring-slate-200 [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-3 text-center text-xs text-slate-400">{t('settings.qrHint')}</p>
      <button onClick={onClose} className="btn-secondary mt-4 w-full">
        {t('common.close')}
      </button>
    </Sheet>
  )
}
