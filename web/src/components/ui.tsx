import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

/* ---------------------------------------------------------------- Sheet -- */

interface SheetProps {
  title?: ReactNode
  onClose: () => void
  children: ReactNode
}

/** Mobile bottom sheet: backdrop tap or Escape closes; content is labelled
 *  for screen readers and focus starts inside. */
export function Sheet({ title, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    // Move focus into the dialog so keyboard/screen-reader users land in it.
    const first = ref.current?.querySelector<HTMLElement>(
      'input, textarea, button, [tabindex]',
    )
    first?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className="mx-auto max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 pb-safe animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" aria-hidden="true" />
        {title && <div className="mb-3 text-lg font-bold text-slate-800">{title}</div>}
        {children}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Toast -- */

type ToastListener = (msg: string) => void
const toastListeners = new Set<ToastListener>()

/** Fire-and-forget confirmation message shown briefly at the bottom. */
export function toast(msg: string) {
  toastListeners.forEach((l) => l(msg))
}

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const listener: ToastListener = (m) => {
      setMsg(m)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setMsg(null), 2200)
    }
    toastListeners.add(listener)
    return () => {
      toastListeners.delete(listener)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  if (!msg) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4">
      <div
        role="status"
        className="max-w-md rounded-full bg-slate-800/95 px-4 py-2 text-sm font-medium text-white shadow-lg animate-toast-in"
      >
        {msg}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- Avatar -- */

const AVATAR_HUES = [199, 262, 340, 152, 24, 292, 178, 48]

/** Deterministic pastel avatar from the swimmer's name — makes long name
 *  lists scannable without photos. */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  const hue = AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length]
  const cls = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-9 w-9 text-sm'
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${cls}`}
      style={{ background: `hsl(${hue} 85% 92%)`, color: `hsl(${hue} 55% 35%)` }}
    >
      {name.slice(0, 1)}
    </span>
  )
}

/* ----------------------------------------------------------- EmptyState -- */

export function EmptyState({
  emoji,
  title,
  hint,
}: {
  emoji: string
  title: string
  hint?: string
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      <div className="text-4xl" aria-hidden="true">
        {emoji}
      </div>
      <p className="mt-1 font-medium text-slate-600">{title}</p>
      {hint && <p className="text-sm text-slate-400">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------------- Stepper -- */

/** ‹ label › — the one-thumb way to move between days or months. */
export function Stepper({
  label,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  children,
}: {
  label: ReactNode
  onPrev: () => void
  onNext: () => void
  prevLabel: string
  nextLabel: string
  children?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      <button onClick={onPrev} aria-label={prevLabel} className="btn-secondary !min-h-[40px] !px-3">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center font-semibold text-slate-800">
        {label}
        {children}
      </div>
      <button onClick={onNext} aria-label={nextLabel} className="btn-secondary !min-h-[40px] !px-3">
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------- useOnlineState -- */

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  )
}
