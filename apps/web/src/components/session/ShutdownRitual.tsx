// apps/web/src/components/session/ShutdownRitual.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import type { Task } from '@/types/task'

interface ShutdownRitualProps {
  completedTasks: Task[]
  incompleteTasks: Task[]
  onAddCompletedTask: (name: string) => Promise<Task>
  onCreateTask: (name: string) => Promise<Task>
  onComplete: (result: { completedTaskIds: string[]; carriedTaskIds: string[]; priorityTaskId: string | null; focusText: string }) => Promise<void>
  /** New - acknowledges yesterday's chosen priority right where the
   *  ritual is deciding tomorrow's. */
  priorityTaskName?: string | null
  priorityCompleted?: boolean
}

type Step = 1 | 2 | 3 | 'saving' | 'closing'

const crossfade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } }
const heading: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--text-primary)', margin: '10px 0 0' }

function CheckIcon() { return (<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>) }
function PlusIcon() { return (<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>) }
function TargetIcon() { return (<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>) }

function StepLabel({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3].map((n) => (
        <span key={n} aria-hidden="true" style={{ width: n === current ? 22 : 7, height: 4, borderRadius: 999, background: n <= current ? 'var(--accent)' : 'var(--border)', transition: 'width 250ms var(--ease-spring)' }} />
      ))}
    </div>
  )
}

function StepFooter({ onBack, onNext, nextLabel, nextTestId }: { onBack?: () => void; onNext: () => void; nextLabel: string; nextTestId?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: onBack ? 'space-between' : 'flex-end', marginTop: 26 }}>
      {onBack && <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 13.5, cursor: 'pointer' }}>back</button>}
      <button type="button" data-testid={nextTestId ?? 'shutdown-step-next'} onClick={onNext} className="glass glass-interactive" style={{ padding: '9px 20px', border: 'none', color: 'var(--accent)', fontSize: 13.5, cursor: 'pointer', boxShadow: 'var(--glow-accent-sm)' }}>
        {nextLabel} -&gt;
      </button>
    </div>
  )
}

export function ShutdownRitual({ completedTasks, incompleteTasks, onAddCompletedTask, onCreateTask, onComplete, priorityTaskName = null, priorityCompleted = false }: ShutdownRitualProps) {
  const [step, setStep] = useState<Step>(1)
  const [checked, setChecked] = useState<Set<string>>(() => new Set(completedTasks.map((t) => t.id)))
  const [extraFinished, setExtraFinished] = useState('')
  const [adding, setAdding] = useState(false)
  const [carryOver, setCarryOver] = useState<Task[]>(incompleteTasks)
  const [priorityTaskId, setPriorityTaskId] = useState<string | null>(null)
  const [newPriorityText, setNewPriorityText] = useState('')
  const [creatingPriority, setCreatingPriority] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function toggleChecked(id: string) {
    setChecked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  async function handleAddExtra() {
    const name = extraFinished.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      const newTask = await onAddCompletedTask(name)
      setChecked((prev) => new Set(prev).add(newTask.id))
      setExtraFinished('')
    } catch (err) {
      console.error('Failed to add completed task:', err)
    } finally {
      setAdding(false)
    }
  }

  function selectPriority(id: string) {
    setPriorityTaskId((prev) => (prev === id ? null : id))
    setNewPriorityText('')
  }

  async function handleCreatePriority() {
    const name = newPriorityText.trim()
    if (!name || creatingPriority) return
    setCreatingPriority(true)
    try {
      const task = await onCreateTask(name)
      setPriorityTaskId(task.id)
      setNewPriorityText('')
    } catch (err) {
      console.error('Failed to create priority task:', err)
    } finally {
      setCreatingPriority(false)
    }
  }

  async function finish() {
    setStep('saving')
    setSaveError(null)
    const priorityName = priorityTaskId ? carryOver.find((t) => t.id === priorityTaskId)?.name ?? null : null
    try {
      await onComplete({ completedTaskIds: Array.from(checked), carriedTaskIds: carryOver.map((t) => t.id), priorityTaskId, focusText: priorityName ?? '' })
      setStep('closing')
    } catch (err: any) {
      console.error('Failed to save shutdown:', err?.message ?? err)
      setSaveError("Couldn't save today's wrap-up. Check your connection and try again.")
      setStep(3)
    }
  }

  return (
    <div data-testid="shutdown-ritual" style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-fullscreen)' as any, background: step === 'closing' ? '#000' : 'rgba(6,6,16,0.9)', backdropFilter: step === 'closing' ? 'none' : 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 800ms var(--ease-focus)' }}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="q1" {...crossfade} className="glass-chromatic" style={{ width: 480, padding: 32 }}>
            <StepLabel current={1} />
            <h2 style={heading}>what did you finish today?</h2>

            {/* New: acknowledges yesterday's chosen priority - this is
                the "make sense that I completed it" ask. Distinct
                accent-bordered banner using the same target icon
                that now appears wherever the priority task shows up
                (NextMoveWidget, TaskCard, TaskDetailSheet). */}
            {priorityTaskName && (
              <div className="glass" data-testid="shutdown-priority-acknowledgment" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', marginTop: 16, border: priorityCompleted ? '1px solid var(--success)' : '1px solid var(--border-accent)' }}>
                <span style={{ color: priorityCompleted ? 'var(--success)' : 'var(--text-tertiary)', display: 'flex', flexShrink: 0 }}><TargetIcon /></span>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-primary)' }}>
                  {priorityCompleted ? <>You completed yesterday's priority: <strong>{priorityTaskName}</strong></> : <>Yesterday's priority was <strong>{priorityTaskName}</strong> - still there below if you want it.</>}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
              {completedTasks.length === 0 && <p className="text-meta" style={{ fontSize: 12.5, opacity: 0.6 }}>Nothing marked done today yet - add anything you finished below.</p>}
              {completedTasks.map((t) => {
                const isChecked = checked.has(t.id)
                return (
                  <button key={t.id} type="button" onClick={() => toggleChecked(t.id)} className="glass glass-interactive" data-testid="shutdown-completed-row" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                    <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${isChecked ? 'var(--accent)' : 'var(--border-accent)'}`, background: isChecked ? 'var(--accent)' : 'transparent', color: 'var(--bg)' }}>
                      {isChecked && <CheckIcon />}
                    </span>
                    <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{t.name}</span>
                  </button>
                )
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input value={extraFinished} onChange={(e) => setExtraFinished(e.target.value)} placeholder={adding ? 'adding...' : 'something else you finished...'} disabled={adding} data-testid="shutdown-extra-input" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', color: 'var(--text-primary)', padding: '9px 12px', fontSize: 13 }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleAddExtra() } }} />
                <button type="button" onClick={() => void handleAddExtra()} disabled={!extraFinished.trim() || adding} style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--surface-active)', color: extraFinished.trim() ? 'var(--accent)' : 'var(--text-tertiary)', cursor: extraFinished.trim() ? 'pointer' : 'default' }}><PlusIcon /></button>
              </div>
            </div>
            <StepFooter onNext={() => setStep(2)} nextLabel="next" />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="q2" {...crossfade} className="glass-chromatic" style={{ width: 480, padding: 32 }}>
            <StepLabel current={2} />
            <h2 style={heading}>what carries over?</h2>
            <p className="text-meta" style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>Drag to reorder by priority for tomorrow.</p>
            <Reorder.Group axis="y" values={carryOver} onReorder={setCarryOver} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {carryOver.map((t) => (
                <Reorder.Item key={t.id} value={t} className="glass" style={{ padding: '10px 16px', cursor: 'grab', fontSize: 13.5, color: 'var(--text-primary)' }}>{t.name}</Reorder.Item>
              ))}
              {carryOver.length === 0 && <p className="text-meta" style={{ fontSize: 12.5, opacity: 0.6, padding: '8px 2px' }}>Nothing carrying over - board's clear.</p>}
            </Reorder.Group>
            <StepFooter onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="next" />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="q3" {...crossfade} className="glass-chromatic" style={{ width: 480, padding: 32 }}>
            <StepLabel current={3} />
            <h2 style={heading}>one thing. tomorrow's priority:</h2>
            <p className="text-meta" style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>Pick something already carrying over, or add something new.</p>

            {carryOver.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {carryOver.map((t) => {
                  const selected = priorityTaskId === t.id
                  return (
                    <button key={t.id} type="button" onClick={() => selectPriority(t.id)} data-testid="shutdown-priority-option" className="glass glass-interactive" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: selected ? '1.5px solid var(--accent)' : 'none', boxShadow: selected ? 'var(--glow-accent-sm)' : 'none', textAlign: 'left', cursor: 'pointer' }}>
                      <span aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-accent)'}`, background: selected ? 'var(--accent)' : 'transparent' }} />
                      <span style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>{t.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newPriorityText} onChange={(e) => setNewPriorityText(e.target.value)} placeholder={creatingPriority ? 'creating...' : 'or type something new...'} disabled={creatingPriority} data-testid="shutdown-priority-new-input" style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', outline: 'none', color: 'var(--text-primary)', padding: '9px 12px', fontSize: 13 }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreatePriority() } }} />
              <button type="button" onClick={() => void handleCreatePriority()} disabled={!newPriorityText.trim() || creatingPriority} data-testid="shutdown-priority-create" style={{ width: 38, height: 38, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--surface-active)', color: newPriorityText.trim() ? 'var(--accent)' : 'var(--text-tertiary)', cursor: newPriorityText.trim() ? 'pointer' : 'default' }}><PlusIcon /></button>
            </div>

            {saveError && <p style={{ marginTop: 14, fontSize: 12.5, color: 'var(--danger)' }} data-testid="shutdown-save-error">{saveError}</p>}
            <StepFooter onBack={() => setStep(2)} onNext={() => void finish()} nextLabel="done" nextTestId="shutdown-confirm" />
          </motion.div>
        )}

        {step === 'saving' && (
          <motion.p key="saving" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 0.3 }} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 18 }} data-testid="shutdown-saving-text">wrapping up...</motion.p>
        )}
        {step === 'closing' && (
          <motion.p key="closing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 24 }} data-testid="shutdown-closing-text">good work. you showed up.</motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}