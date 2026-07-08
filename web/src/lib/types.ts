export interface Settings {
  clubName: string
  /** Label used in the monthly message, e.g. "英才" → "6月份英才門票。" */
  venueName: string
  /** Default price charged per attended session. */
  sessionPrice: number
  /** Currency suffix used in the message, e.g. "元". */
  currencyLabel: string
  /** Secret token for the coach (edit) capability link. */
  coachToken: string
  /** Secret token for the parent (read-only) capability link. */
  parentToken: string
  /** IANA timezone used to resolve "today" and month boundaries. */
  timezone: string
  /** PIN that reveals the share links on the Home page. Defaults to '1111'. */
  recoveryPin?: string
}

export interface Swimmer {
  id: string
  displayName: string
  /** Coach-only free text, e.g. "兄妹9折" or "試堂". */
  note?: string
  active: boolean
  sortOrder: number
  createdAt: string
  archivedAt?: string | null
}

export interface Attendance {
  id: string
  swimmerId: string
  /** 'YYYY-MM-DD' in the club timezone. */
  sessionDate: string
  /** If set, overrides settings.sessionPrice for this session (e.g. a 10元 trial). */
  amountOverride?: number | null
  note?: string
  createdAt: string
}

export interface Payment {
  id: string
  swimmerId: string
  /** 'YYYY-MM-DD' in the club timezone. */
  paidOn: string
  amount: number
  note?: string
  createdAt: string
}

export interface AppState {
  settings: Settings
  swimmers: Swimmer[]
  attendance: Attendance[]
  payments: Payment[]
}
