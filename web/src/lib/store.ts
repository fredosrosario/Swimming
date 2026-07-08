import type { AppState, Payment, Settings, Swimmer } from './types'
import { todayInTz } from './dates'
import { REMOTE_ENABLED, fetchRemoteState, pushRemoteState } from './api'

const STORAGE_KEY = 'kapok-swim-club/v1'
const PUSH_DEBOUNCE_MS = 600
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
    coachToken: token(),
    parentToken: token(),
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

class Store {
  private state: AppState = load()
  private listeners = new Set<Listener>()

  // Remote sync state (only used when REMOTE_ENABLED).
  private token: string | null = null
  private loaded = !REMOTE_ENABLED // local-only mode is "loaded" from localStorage
  private canWrite = !REMOTE_ENABLED // local-only mode: always writable
  private pushTimer: ReturnType<typeof setTimeout> | null = null
  private polling = false

  getState = (): AppState => this.state
  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  isRemote(): boolean {
    return REMOTE_ENABLED
  }
  isLoaded(): boolean {
    return this.loaded
  }

  private notify() {
    this.listeners.forEach((l) => l())
  }

  /**
   * Local commit: update the in-memory cache + localStorage, notify React, and
   * (in remote mode, as the coach) schedule a debounced push of the whole doc.
   */
  private commit(next: AppState) {
    this.state = next
    persist(next)
    this.notify()
    if (REMOTE_ENABLED && this.canWrite && this.token) this.schedulePush()
  }

  private schedulePush() {
    if (this.pushTimer) clearTimeout(this.pushTimer)
    this.pushTimer = setTimeout(() => {
      this.pushTimer = null
      const tok = this.token
      if (!tok) return
      pushRemoteState(tok, this.state).catch((e) => console.error('remote push failed', e))
    }, PUSH_DEBOUNCE_MS)
  }

  /**
   * Called by the route guards once the URL token is known. Fetches the shared
   * state from the server; the coach (whose token matches) becomes writable,
   * parents stay read-only and poll for the coach's updates.
   */
  async connect(token: string) {
    if (!REMOTE_ENABLED) return
    if (this.token === token && this.loaded) return
    this.token = token
    try {
      const remote = await fetchRemoteState(token)
      this.canWrite = remote.settings.coachToken === token
      this.state = remote
      persist(remote)
    } catch (e) {
      console.error('remote connect failed', e)
      // Fall back to whatever is cached; guard will validate the token.
    } finally {
      this.loaded = true
      this.notify()
      if (!this.canWrite) this.startPolling()
    }
  }

  private startPolling() {
    if (this.polling || !REMOTE_ENABLED) return
    this.polling = true
    const tick = async () => {
      if (this.token && !this.canWrite) {
        try {
          const remote = await fetchRemoteState(this.token)
          this.state = remote
          persist(remote)
          this.notify()
        } catch {
          /* transient; try again next interval */
        }
      }
      setTimeout(tick, POLL_INTERVAL_MS)
    }
    setTimeout(tick, POLL_INTERVAL_MS)
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

  rotateToken(which: 'coachToken' | 'parentToken') {
    this.updateSettings({ [which]: token() } as Partial<Settings>)
  }
}

export const store = new Store()
