import type { SVGProps } from 'react'

// Hand-drawn 24px stroke icons (feather-style) so the app never ships an
// icon-font or emoji glyphs that render differently per platform.

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...props}
    >
      {children}
    </svg>
  )
}

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M5 13l4 4L19 7" />
  </Base>
)

export const RollCallIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
  </Base>
)

export const PaymentsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6.5v11M15 9c-.6-.9-1.7-1.5-3-1.5-1.8 0-3 1-3 2.25S10.2 12 12 12s3 .9 3 2.25-1.2 2.25-3 2.25c-1.3 0-2.4-.6-3-1.5" />
  </Base>
)

export const RosterIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" />
    <path d="M16.5 4.9A3.5 3.5 0 0 1 16.5 11M18.5 15.4c1.9.7 3 2.2 3 4.1" />
  </Base>
)

export const MessageIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
  </Base>
)

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
    <circle cx="15" cy="8" r="2" />
    <circle cx="9" cy="16" r="2" />
  </Base>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Base>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9 6l6 6-6 6" />
  </Base>
)

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Base>
)

export const XIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
)

export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const CopyIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </Base>
)

export const ShareIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </Base>
)

export const TrashIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </Base>
)

export const PencilIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z" />
    <path d="M14.5 6.5l3 3" />
  </Base>
)

export const ArchiveIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="5" rx="1" />
    <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4" />
  </Base>
)

export const RestoreIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 10a8 8 0 1 1 2.3 6.3" />
    <path d="M4 15v-5h5" />
  </Base>
)

export const DownloadIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 4v11M8 11l4 4 4-4" />
    <path d="M5 19h14" />
  </Base>
)

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
  </Base>
)

export const LockIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Base>
)

/** Brand mark: swimmer wave in a rounded tile. */
export function WaveMark({ className = 'h-12 w-12' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#0284c7" />
      <path
        d="M8 40c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0"
        fill="none"
        stroke="#bae6fd"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M8 50c4-4 8-4 12 0s8 4 12 0 8-4 12 0 8 4 12 0"
        fill="none"
        stroke="#7dd3fc"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="22" cy="22" r="5" fill="#fff" />
      <path
        d="M27 27c4-3 9-4 14-2l9 4"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}
