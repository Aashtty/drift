// apps/web/src/components/routines/RoutineFormModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AnchorBadge } from '@/components/tasks/AnchorBadge'
import { EnergySelector } from '@/components/tasks/EnergySelector'
import type { Routine, RoutineCadence } from '@/types/routine'
import type { Anchor } from '@/types/anchor'
import type { EnergyLevel } from '@/types/task'

interface RoutineFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    name: string
    cadence: RoutineCadence
    weekdays: number[]
    dayOfMonth: number | null
    anchorId: string | null
    energyLevel: EnergyLevel | null
  }) => void
  anchors: Anchor[]
  /** Present when editing — prefills the form. Omit/null for create mode. */
  initial?: Routine | null
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function RoutineFormModal({ open, onClose, onSave, anchors, initial }: RoutineFormModalProps) {
  const [name, setName] = useState('')
  const [cadence, setCadence] = useState<RoutineCadence>('daily')
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [anchorId, setAnchorId] = useState<string | null>(null)
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setName(initial.name)
      setCadence(initial.cadence)
      setWeekdays(initial.weekdays.length > 0 ? initial.weekdays : [1, 2, 3, 4, 5])
      setDayOfMonth(initial.day_of_month ?? 1)
      setAnchorId(initial.anchor_id)
      setEnergyLevel(initial.energy_level ?? 'medium')
    } else {
      setName('')
      setCadence('daily')
      setWeekdays([1, 2, 3, 4, 5])
      setDayOfMonth(1)
      setAnchorId(null)
      setEnergyLevel('medium')
    }
  }, [open, initial])

  function toggleWeekday(day: number) {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    if (cadence === 'weekly' && weekdays.length === 0) return
    onSave({
      name: trimmed,
      cadence,
      weekdays: cadence === 'weekly' ? weekdays : [],
      dayOfMonth: cadence === 'monthly' ? dayOfMonth : null,
      anchorId,
      energyLevel,
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as any, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: 24 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel chromatic style={{ padding: 26, width: 420, maxHeight: '85vh', overflowY: 'auto' }} className="scroll-thin">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <p className="text-section-label">{initial ? 'EDIT ROUTINE' : 'NEW ROUTINE'}</p>
                <button type="button" onClick={onClose} aria-label="close" style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 15 }}>×</button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="routine name — e.g. Morning pages"
                  autoFocus
                  data-testid="routine-name-input"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />

                <div>
                  <p className="text-meta" style={{ fontSize: 12, marginBottom: 8 }}>Repeats</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['daily', 'weekly', 'monthly'] as RoutineCadence[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCadence(c)}
                        data-testid={`routine-cadence-${c}`}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 'var(--radius-md)', border: `1px solid ${cadence === c ? 'var(--accent)' : 'var(--border)'}`,
                          background: cadence === c ? 'var(--surface-active)' : 'var(--surface)', color: cadence === c ? 'var(--accent)' : 'var(--text-secondary)',
                          fontSize: 12.5, textTransform: 'capitalize', cursor: 'pointer',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {cadence === 'weekly' && (
                  <div>
                    <p className="text-meta" style={{ fontSize: 12, marginBottom: 8 }}>On these days</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {WEEKDAY_LABELS.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleWeekday(i)}
                          data-testid={`routine-weekday-${i}`}
                          style={{
                            width: 34, height: 34, borderRadius: '50%', border: `1px solid ${weekdays.includes(i) ? 'var(--accent)' : 'var(--border)'}`,
                            background: weekdays.includes(i) ? 'var(--surface-active)' : 'var(--surface)', color: weekdays.includes(i) ? 'var(--accent)' : 'var(--text-tertiary)',
                            fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {cadence === 'monthly' && (
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span className="text-meta" style={{ fontSize: 12 }}>Day of month</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dayOfMonth}
                      onChange={(e) => setDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                      style={{ width: 90, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 8, color: 'var(--text-primary)' }}
                    />
                  </label>
                )}

                <div>
                  <p className="text-meta" style={{ fontSize: 12, marginBottom: 8 }}>Anchor</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <AnchorBadge name="none" color="var(--text-tertiary)" interactive selected={!anchorId} onClick={() => setAnchorId(null)} />
                    {anchors.map((a) => (
                      <AnchorBadge key={a.id} name={a.name} color={a.color} interactive selected={anchorId === a.id} onClick={() => setAnchorId(a.id)} />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-meta" style={{ fontSize: 12, marginBottom: 8 }}>Energy</p>
                  <EnergySelector value={energyLevel} onChange={setEnergyLevel} />
                </div>

                <button
                  type="submit"
                  disabled={!name.trim()}
                  data-testid="routine-form-submit"
                  style={{ padding: '10px 0', background: 'var(--surface-active)', border: 'none', borderRadius: 'var(--radius-md)', color: name.trim() ? 'var(--accent)' : 'var(--text-tertiary)', fontSize: 14, cursor: name.trim() ? 'pointer' : 'default' }}
                >
                  {initial ? 'Save Changes' : 'Create Routine'}
                </button>
              </form>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}