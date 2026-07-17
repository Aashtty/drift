// apps/web/src/app/routines/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRoutineStore } from '@/stores/routineStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { useAppState } from '@/hooks/useAppState'
import { RoutineFormModal } from '@/components/routines/RoutineFormModal'
import { cadenceLabel } from '@/lib/utils/routineSchedule'
import { toast } from '@/stores/toastStore'
import type { Routine, RoutineCadence } from '@/types/routine'
import type { EnergyLevel } from '@/types/task'

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
function RepeatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M3 5.5h7.5a2.5 2.5 0 0 1 2.5 2.5v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.5 3L3 5.5L5.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 10.5H5.5A2.5 2.5 0 0 1 3 8V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.5 13L13 10.5L10.5 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Toggle({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      style={{ width: 38, height: 21, borderRadius: 999, border: 'none', padding: 2, cursor: 'pointer', background: checked ? 'var(--accent)' : 'var(--surface-active)', transition: 'background 180ms var(--ease-out-expo)', flexShrink: 0 }}
    >
      <span aria-hidden="true" style={{ display: 'block', width: 17, height: 17, borderRadius: '50%', background: 'var(--bg)', transform: checked ? 'translateX(17px)' : 'translateX(0)', transition: 'transform 180ms var(--ease-spring)' }} />
    </button>
  )
}

export default function RoutinesPage() {
  const { user } = useUser()
  const routines = useRoutineStore((s) => s.routines)
  const loaded = useRoutineStore((s) => s.loaded)
  const addRoutine = useRoutineStore((s) => s.addRoutine)
  const updateRoutine = useRoutineStore((s) => s.updateRoutine)
  const removeRoutine = useRoutineStore((s) => s.removeRoutine)
  const anchors = useAnchorStore((s) => s.anchors)
  const { setState } = useAppState()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Routine | null>(null)

  useEffect(() => {
    setState('IDLE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!user) return null

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(r: Routine) {
    setEditing(r)
    setModalOpen(true)
  }

  function handleSave(data: { name: string; cadence: RoutineCadence; weekdays: number[]; dayOfMonth: number | null; anchorId: string | null; energyLevel: EnergyLevel | null }) {
    if(!user)return
    if (editing) {
      void updateRoutine(editing.id, {
        name: data.name, cadence: data.cadence, weekdays: data.weekdays,
        day_of_month: data.dayOfMonth, anchor_id: data.anchorId, energy_level: data.energyLevel,
      })
      toast.success(`"${data.name}" updated.`)
    } else {
      const now = new Date().toISOString()
      const routine: Routine = {
        id: crypto.randomUUID(), user_id: user.id, name: data.name, cadence: data.cadence,
        weekdays: data.weekdays, day_of_month: data.dayOfMonth, anchor_id: data.anchorId,
        energy_level: data.energyLevel, active: true, last_generated_date: null, created_at: now, updated_at: now,
      }
      void addRoutine(routine)
      toast.success(`"${data.name}" created — check your board, it may already be there.`)
    }
    setModalOpen(false)
  }

  function handleDelete(r: Routine) {
    void removeRoutine(r.id)
    toast.undo(`"${r.name}" deleted.`, () => void addRoutine(r))
  }

  // Turning a routine back on is the deliberate "check again" action —
  // it clears last_generated_date so useRoutineEngine re-evaluates
  // today from scratch instead of trusting a stamp that might be stale
  // (e.g. because today's generated task was deleted while the routine
  // sat off). The engine's own existence check still prevents a
  // duplicate if the task was never actually removed.
  function handleToggleActive(r: Routine, active: boolean) {
    if (active) void updateRoutine(r.id, { active: true, last_generated_date: null })
    else void updateRoutine(r.id, { active: false })
  }

  return (
    <main style={{ padding: 56, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p className="text-section-label">ROUTINES</p>
          <p className="text-meta" style={{ marginTop: 4, fontSize: 13 }}>
            Recurring tasks that add themselves to your board on schedule — daily, weekly, or monthly.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          data-testid="routine-create-trigger"
          className="glass glass-interactive"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
        >
          <PlusIcon /> New Routine
        </button>
      </div>

      {loaded && routines.length === 0 && (
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <p className="text-meta">No routines yet. Add one for anything you do on a schedule — it'll show up on your board automatically, no manual re-adding.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {routines.map((r) => {
          const anchor = r.anchor_id ? anchors.find((a) => a.id === r.anchor_id) : null
          return (
            <div
              key={r.id}
              className="glass"
              data-testid="routine-row"
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, borderLeft: anchor ? `2px solid ${anchor.color}` : undefined, opacity: r.active ? 1 : 0.5, transition: 'opacity 200ms var(--ease-out-expo)' }}
            >
              <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}><RepeatIcon /></span>
              <button type="button" onClick={() => openEdit(r)} data-testid={`routine-edit-${r.id}`} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{r.name}</p>
                <p className="text-meta" style={{ marginTop: 2, fontSize: 11.5 }}>{cadenceLabel(r)}{anchor && ` · ${anchor.name}`}</p>
              </button>
              <Toggle checked={r.active} onChange={(v) => handleToggleActive(r, v)} testId={`routine-active-toggle-${r.id}`} />
              <button type="button" onClick={() => handleDelete(r)} data-testid={`routine-delete-${r.id}`} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11.5, cursor: 'pointer' }}>
                delete
              </button>
            </div>
          )
        })}
      </div>

      <RoutineFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} anchors={anchors} initial={editing} />
    </main>
  )
}