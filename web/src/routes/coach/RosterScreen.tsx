import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'
import type { Swimmer } from '../../lib/types'
import { Avatar, EmptyState, toast } from '../../components/ui'
import { ArchiveIcon, PencilIcon, PlusIcon, RestoreIcon } from '../../components/icons'

export default function RosterScreen() {
  const { t } = useTranslation()
  const state = useAppState()
  const [newName, setNewName] = useState('')

  const sessionsBySwimmer = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of state.attendance) m.set(a.swimmerId, (m.get(a.swimmerId) ?? 0) + 1)
    return m
  }, [state.attendance])

  const active = state.swimmers.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder)
  const archived = state.swimmers.filter((s) => !s.active)

  function add() {
    const n = newName.trim()
    if (!n) return
    store.addSwimmer(n)
    setNewName('')
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={t('roster.namePlaceholder')}
          className="input flex-1 shadow-sm"
        />
        <button onClick={add} disabled={!newName.trim()} className="btn-primary shrink-0">
          <PlusIcon className="h-5 w-5" />
          {t('roster.add')}
        </button>
      </div>

      <div className="section-label">{t('roster.active', { count: active.length })}</div>
      {active.length === 0 && <EmptyState emoji="🏊" title={t('roster.empty')} />}
      <ul className="flex flex-col gap-1.5">
        {active.map((s) => (
          <RosterRow key={s.id} swimmer={s} sessions={sessionsBySwimmer.get(s.id) ?? 0} />
        ))}
      </ul>

      {archived.length > 0 && (
        <>
          <div className="section-label mt-2">
            {t('roster.archived', { count: archived.length })}
          </div>
          <ul className="flex flex-col gap-1.5">
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                <Avatar name={s.displayName} />
                <span className="flex-1 truncate text-slate-500">{s.displayName}</span>
                <button
                  onClick={() => store.setSwimmerActive(s.id, true)}
                  className="btn-secondary !min-h-[36px] gap-1 !px-3 text-sm !text-brand-600"
                >
                  <RestoreIcon className="h-4 w-4" />
                  {t('roster.restore')}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function RosterRow({ swimmer, sessions }: { swimmer: Swimmer; sessions: number }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(swimmer.displayName)
  const [note, setNote] = useState(swimmer.note ?? '')

  function save() {
    if (name.trim()) store.updateSwimmer(swimmer.id, { displayName: name, note })
    setEditing(false)
  }

  function archive() {
    store.setSwimmerActive(swimmer.id, false)
    toast(t('roster.archivedToast', { name: swimmer.displayName }), {
      label: t('common.undo'),
      run: () => store.setSwimmerActive(swimmer.id, true),
    })
  }

  if (editing) {
    return (
      <li className="card flex flex-col gap-2 p-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
          className="input !py-1.5"
          aria-label={t('roster.namePlaceholder')}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder={t('roster.notePlaceholder')}
          className="input !py-1.5 text-sm"
          aria-label={t('roster.notePlaceholder')}
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditing(false)} className="btn-secondary !min-h-[36px] !px-3 text-sm">
            {t('common.cancel')}
          </button>
          <button onClick={save} className="btn-primary !min-h-[36px] !px-3 text-sm">
            {t('common.save')}
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="card flex min-h-[60px] items-center gap-3 px-3 py-2">
      <Avatar name={swimmer.displayName} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-800">{swimmer.displayName}</div>
        <div className="truncate text-xs text-slate-400">
          {sessions > 0 ? t('roster.sessions', { count: sessions }) : t('roster.neverAttended')}
          {swimmer.note ? ` · ${swimmer.note}` : ''}
        </div>
      </div>
      <button
        onClick={() => {
          setName(swimmer.displayName)
          setNote(swimmer.note ?? '')
          setEditing(true)
        }}
        aria-label={`${t('roster.rename')} ${swimmer.displayName}`}
        className="rounded-xl p-2.5 text-slate-400 active:bg-slate-100"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={archive}
        aria-label={`${t('roster.archive')} ${swimmer.displayName}`}
        className="rounded-xl p-2.5 text-rose-400 active:bg-rose-50"
      >
        <ArchiveIcon className="h-5 w-5" />
      </button>
    </li>
  )
}
