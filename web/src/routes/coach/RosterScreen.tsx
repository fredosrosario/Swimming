import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { store } from '../../lib/store'
import { useAppState } from '../../lib/useStore'

export default function RosterScreen() {
  const { t } = useTranslation()
  const state = useAppState()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const active = state.swimmers.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder)
  const archived = state.swimmers.filter((s) => !s.active)

  function add() {
    const n = newName.trim()
    if (!n) return
    store.addSwimmer(n)
    setNewName('')
  }

  function saveRename(id: string) {
    if (editName.trim()) store.renameSwimmer(id, editName)
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={t('roster.namePlaceholder')}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:border-brand-400"
        />
        <button
          onClick={add}
          className="rounded-xl bg-brand-600 px-4 font-semibold text-white active:bg-brand-700"
        >
          {t('roster.add')}
        </button>
      </div>

      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('roster.active')} · {active.length}
      </div>
      <ul className="flex flex-col gap-1">
        {active.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm"
          >
            {editingId === s.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveRename(s.id)}
                  autoFocus
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-brand-400"
                />
                <button onClick={() => saveRename(s.id)} className="text-sm text-brand-600">
                  {t('common.save')}
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-medium text-slate-800">{s.displayName}</span>
                <button
                  onClick={() => {
                    setEditingId(s.id)
                    setEditName(s.displayName)
                  }}
                  className="text-sm text-slate-400"
                >
                  {t('roster.rename')}
                </button>
                <button
                  onClick={() => store.setSwimmerActive(s.id, false)}
                  className="text-sm text-rose-400"
                >
                  {t('roster.archive')}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {archived.length > 0 && (
        <>
          <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('roster.archived')} · {archived.length}
          </div>
          <ul className="flex flex-col gap-1">
            {archived.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
              >
                <span className="flex-1 text-slate-500">{s.displayName}</span>
                <button
                  onClick={() => store.setSwimmerActive(s.id, true)}
                  className="text-sm text-brand-600"
                >
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
