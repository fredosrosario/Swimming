import type { AppState, Payment, Settings, Swimmer } from './types'
import { todayInTz } from './dates'
import { REMOTE_ENABLED, ApiError, fetchRemoteState, pushRemoteState } from './api'

const STORAGE_KEY = 'kapok-swim-club/v1'
const PUSH_DEBOUNCE_MS = 600
const PUSH_RETRY_MS = 5000
const POLL_INTERVAL_MS = 8000

/** Initial roster seeded on first run (order = sortOrder), all at zero balance. */
export const SEED_NAMES = [
  '靖翹', '奕熹', '晞兒', '楷楷', '筱白', '子菩', '義騰', '雪諾', '永皓', '巧澄',
  '熙朗', '知韻', '雅晴', '羅偉祺', '馮驤', '穎希', '筱淞', '樂澄', '君諾', '穎天',
  '星宇', '日朗', '冼政霖', '金文馨', '郭梓睿', '菲澄', '一琛', '昕潼', '盧以弢', '毛烈度',
  '嘉寶', '迦諾', '奕訢', '卓翹', '曾翔皓',
]

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function token(): string {
  return uid().replace(/-/g, '')
}

function nowIso(): string {
  return new Date().toISOString()
}

function seedState(): AppState {
  const createdAt = nowIso()
  const settings: Settings = {
    clubName: 'Macau KaPok Swimming Club',
    venueName: '英才',
    sessionPrice: 15,
    currencyLabel: '元',
    // In remote mode the real tokens live in the shared database; a fresh
    // device learns them from the link it opens — it must never invent its
    // own, or its Home-page links point at tokens the server rejects.
    coachToken: REMOTE_ENABLED ? '' : token(),
    parentToken: REMOTE_ENABLED ? '' : token(),
    timezone: 'Asia/Macau',
  }
  const swimmers: Swimmer[] = SEED_NAMES.map((displayName, i) => ({
    id: uid(),
    displayName,
    active: true,
    sortOrder: i,
    createdAt,
    archivedAt: null,
  }))
  return { settings, swimmers, attendance: [], payments: [] }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* ignore malformed storage */
  }
  const seeded = seedState()
  persist(seeded)
  return seeded
}

function persist(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage may be unavailable; keep in-memory state */
  }
}

type Listener = () => void

export type SyncRole = 'coach' | 'parent' | null

export interface SyncStatus {
  /** First remote fetch (or failure) has settled; safe to render a screen. */
  loaded: boolean
  /** What the connected token unlocked. 'coach' = can edit. */
  role: SyncRole
  /** Server explicitly rejected the token (403) — the link is invalid. */
  rejected: boolean
  /** Local edits exist that have not landed on the server yet. */
  saving: boolean
  /** The last push attempt failed (offline?); retrying automatically. */
  pushFailed: boolean
}

class Store {
  private state: AppState = load()
  private listeners = new Set<Listener>()

  // Remote sync state (only used when REMOTE_ENABLED).
  private token: string | null = null
  private sync: SyncStatus = {
    loaded: !REMOTE_ENABLED, // local-only mode is "loaded" from localStorage
    role: REMOTE_ENABLED ? null : 'coach', // local-only mode: always writable
    rejected: false,
    saving: false,
    pushFailed: false,
  }
  private connecting: Promise<void> | null = null
  private pushTimer: ReturnType<typeof setTimeout> | null = null
  private pushInFlight = false
  private polling = false

  getState = (): AppState => this.state
  /** Stable snapshot object — replaced only when a field actually changes. */
  getSync = (): SyncStatus => this.sync
  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  isRemote(): boolean {
    return REMOTE_ENABLED
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  private setSync(patch: Partial<SyncStatus>) {
    const next = { ...this.sync, ...patch }
    const keys = Object.keys(next) as (keyof SyncStatus)[]
    if (keys.every((k) => next[k] === this.sync[k])) return
    this.sync = next
    this.notify()
  }

  private roleFor(state: AppState, tok: string): SyncRole {
    if (tok && tok === state.settings.coachToken) return 'coach'
    if (tok && tok === state.settings.parentToken) return 'parent'
    return null
  }

  /**
   * Local commit: update the in-memory cache + localStorage, notify React, and
   * (in remote mode, as the coach) schedule a debounced push of the whole doc.
   */
  private commit(next: AppState) {
    this.state = next
    persist(next)
    this.notify()
    if (REMOTE_ENABLED && this.sync.role === 'coach' && this.token) this.schedulePush()
  }

  /** Adopt a server copy — unless local edits are still waiting to be pushed. */
  private adoptRemote(remote: AppState) {
    if (this.pushTimer !== null || this.pushInFlight) return
    // Parent payloads arrive with coachToken stripped; keep any coach token
    // this device already knows so a coach can browse the parent view without
    // wiping their own cached credentials.
    const merged: AppState = {
      ...remote,
      settings: {
        ...remote.settings,
        coachToken: remote.settings.coachToken ?? this.state.settings.coachToken ?? '',
      },
    }
    if (JSON.stringify(merged) === JSON.stringify(this.state)) return
    this.state = merged
    persist(merged)
    this.notify()
  }

  /** A 403 proves the token is dead — drop any cached copy of it so the Home
   *  page stops offering links that the server will reject. */
  private forgetRejectedToken(tok: string) {
    const s = this.state.settings
    if (s.coachToken !== tok && s.parentToken !== tok) return
    this.state = {
      ...this.state,
      settings: {
        ...s,
        coachToken: s.coachToken === tok ? '' : s.coachToken,
        parentToken: s.parentToken === tok ? '' : s.parentToken,
      },
    }
    persist(this.state)
    this.notify()
  }

  /**
   * Called by the route guards once the URL token is known. Fetches the shared
   * state from the server; the coach (whose token matches) becomes writable,
   * everyone polls for updates.
   */
  connect(tok: string): Promise<void> | undefined {
    if (!REMOTE_ENABLED) return
    if (this.token === tok && (this.connecting || this.sync.loaded))
      return this.connecting ?? undefined
    if (this.token !== tok) this.setSync({ loaded: false, role: null, rejected: false })
    this.token = tok
    this.connecting = (async () => {
      try {
        const remote = await fetchRemoteState(tok)
        this.adoptRemote(remote)
        this.setSync({ loaded: true, rejected: false, role: this.roleFor(remote, tok) })
      } catch (e) {
        if (e instanceof ApiError && e.status === 403) {
          this.forgetRejectedToken(tok)
          this.setSync({ loaded: true, rejected: true, role: null })
        } else {
          // Offline / transient failure: fall back to the cached copy and let
          // the poller keep retrying in the background.
          console.error('remote connect failed', e)
          this.setSync({ loaded: true, rejected: false, role: this.roleFor(this.state, tok) })
        }
      } finally {
        this.connecting = null
        if (!this.sync.rejected) this.startPolling()
      }
    })()
    return this.connecting
  }

  private startPolling() {
    if (this.polling || !REMOTE_ENABLED) return
    this.polling = true
    const tick = async () => {
      const tok = this.token
      const busy = this.pushTimer !== null || this.pushInFlight
      const hidden = typeof document !== 'undefined' && document.hidden
      if (tok && !busy && !hidden) {
        try {
          const remote = await fetchRemoteState(tok)
          this.adoptRemote(remote)
          this.setSync({ rejected: false, role: this.roleFor(remote, tok) })
        } catch (e) {
          if (e instanceof ApiError && e.status === 403) {
            // The link was reset while we were connected.
            this.forgetRejectedToken(tok)
            this.setSync({ rejected: true, role: null })
            this.polling = false
            return
          }
          /* transient; try again next interval */
        }
      }
      setTimeout(tick, POLL_INTERVAL_MS)
    }
    setTimeout(tick, POLL_INTERVAL_MS)
  }

  private schedulePush(delay = PUSH_DEBOUNCE_MS) {
    this.setSync({ saving: true })
    if (this.pushTimer) clearTimeout(this.pushTimer)
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null
      void this.pushNow()
    }, delay)
  }

  private async pushNow() {
    const tok = this.token
    if (!tok) return
    if (this.pushInFlight) {
      this.schedulePush()
      return
    }
    this.pushInFlight = true
    try {
      await pushRemoteState(tok, this.state)
      // Only report "saved" when no newer edit is already queued.
      if (this.pushTimer === null) this.setSync({ saving: false, pushFailed: false })
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        this.forgetRejectedToken(tok)
        this.setSync({ rejected: true, role: null, saving: false })
      } else {
        // Offline / transient failure: never drop the edit — retry until the
        // push lands.
        console.error('remote push failed; will retry', e)
        this.setSync({ pushFailed: true })
        this.schedulePush(PUSH_RETRY_MS)
      }
    } finally {
      this.pushInFlight = false
    }
  }

  today(): string {
    return todayInTz(this.state.settings.timezone)
  }

  // ---- swimmers ----
  addSwimmer(displayName: string): Swimmer {
    const name = displayName.trim()
    const maxOrder = this.state.swimmers.reduce((m, s) => Math.max(m, s.sortOrder), -1)
    const swimmer: Swimmer = {
      id: uid(),
      displayName: name,
      active: true,
      sortOrder: maxOrder + 1,
      createdAt: nowIso(),
      archivedAt: null,
    }
    this.commit({ ...this.state, swimmers: [...this.state.swimmers, swimmer] })
    return swimmer
  }

  renameSwimmer(id: string, displayName: string) {
    this.commit({
      ...this.state,
      swimmers: this.state.swimmers.map((s) =>
        s.id === id ? { ...s, displayName: displayName.trim() } : s,
      ),
    })
  }

  setSwimmerActive(id: string, active: boolean) {
    this.commit({
      ...this.state,
      swimmers: this.state.swimmers.map((s) =>
        s.id === id ? { ...s, active, archivedAt: active ? null : nowIso() } : s,
      ),
    })
  }

  // ---- attendance ----
  isPresent(swimmerId: string, sessionDate: string): boolean {
    return this.state.attendance.some(
      (a) => a.swimmerId === swimmerId && a.sessionDate === sessionDate,
    )
  }

  toggleAttendance(swimmerId: string, sessionDate: string) {
    const existing = this.state.attendance.find(
      (a) => a.swimmerId === swimmerId && a.sessionDate === sessionDate,
    )
    if (existing) {
      this.commit({
        ...this.state,
        attendance: this.state.attendance.filter((a) => a.id !== existing.id),
      })
    } else {
      this.commit({
        ...this.state,
        attendance: [
          ...this.state.attendance,
          {
            id: uid(),
            swimmerId,
            sessionDate,
            amountOverride: null,
            createdAt: nowIso(),
          },
        ],
      })
    }
  }

  setAttendanceOverride(swimmerId: string, sessionDate: string, amount: number | null) {
    this.commit({
      ...this.state,
      attendance: this.state.attendance.map((a) =>
        a.swimmerId === swimmerId && a.sessionDate === sessionDate
          ? { ...a, amountOverride: amount }
          : a,
      ),
    })
  }

  // ---- payments ----
  addPayment(swimmerId: string, amount: number, paidOn: string, note?: string): Payment {
    const payment: Payment = {
      id: uid(),
      swimmerId,
      amount,
      paidOn,
      note,
      createdAt: nowIso(),
    }
    this.commit({ ...this.state, payments: [...this.state.payments, payment] })
    return payment
  }

  deletePayment(id: string) {
    this.commit({ ...this.state, payments: this.state.payments.filter((p) => p.id !== id) })
  }

  // ---- settings ----
  updateSettings(patch: Partial<Settings>) {
    this.commit({ ...this.state, settings: { ...this.state.settings, ...patch } })
  }

  /**
   * Rotating a token must be pushed while the CURRENT session token is still
   * valid on the server; only then does the coach session adopt the new one.
   * (A debounced push could otherwise race and lock the coach out.)
   */
  async rotateToken(which: 'coachToken' | 'parentToken') {
    const fresh = token()
    const sessionToken = this.token
    const next: AppState = {
      ...this.state,
      settings: { ...this.state.settings, [which]: fresh },
    }
    this.state = next
    persist(next)
    this.notify()
    if (!(REMOTE_ENABLED && this.sync.role === 'coach' && sessionToken)) return
    if (this.pushTimer) {
      clearTimeout(this.pushTimer)
      this.pushTimer = null
    }
    this.setSync({ saving: true })
    try {
      await pushRemoteState(sessionToken, next)
      if (which === 'coachToken') this.token = fresh
      if (this.pushTimer === null) this.setSync({ saving: false, pushFailed: false })
    } catch (e) {
      console.error('token rotation push failed; will retry', e)
      this.schedulePush(PUSH_RETRY_MS)
    }
  }
}

export const store = new Store()
