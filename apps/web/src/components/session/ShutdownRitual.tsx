// apps/web/src/components/session/ShutdownRitual.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence, Reorder } from 'motion/react'
import type { Task } from '@/types/task'

interface ShutdownRitualProps {
  completedTasks: Task[]
  incompleteTasks: Task[]
  onAddCompletedTask: (name: string) => Promise<Task>
  onComplete: (result: {
    completedTaskIds: string[]
    carriedTaskIds: string[]
    /** Renamed from `anchorText` — was sharing the word "anchor" with
     *  the unrelated task-tagging Anchors, which read as confusing next
     *  to actual Anchor badges elsewhere in the app. */
    focusText: string
  }) => Promise<void>
}

type Step = 1 | 2 | 3 | 'saving' | 'closing'

const crossfade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
}

export function ShutdownRitual({ completedTasks, incompleteTasks, onAddCompletedTask, onComplete }: ShutdownRitualProps) {
  const [step, setStep] = useState<Step>(1)
  const [extraCompleted, setExtraCompleted] = useState<Task[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set(completedTasks.map((t) => t.id)))
  const [extraFinished, setExtraFinished] = useState('')
  const [adding, setAdding] = useState(false)
  const [carryOver, setCarryOver] = useState<Task[]>(incompleteTasks)
  const [focusText, setFocusText] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)

  const allCompleted = [...completedTasks, ...extraCompleted]

  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAddExtra() {
    const name = extraFinished.trim()
    if (!name || adding) return
    setAdding(true)
    try {
      const newTask = await onAddCompletedTask(name)
      setExtraCompleted((prev) => [...prev, newTask])
      setChecked((prev) => new Set(prev).add(newTask.id))
      setExtraFinished('')
    } catch (err) {
      console.error('Failed to add completed task:', err)
    } finally {
      setAdding(false)
    }
  }

  function goToQ2() {
    setStep(2)
  }

  function goToQ3() {
    setFocusText(carryOver[0]?.name ?? '')
    setStep(3)
  }

  async function finish() {
    setStep('saving')
    setSaveError(null)
    try {
      await onComplete({
        completedTaskIds: Array.from(checked),
        carriedTaskIds: carryOver.map((t) => t.id),
        focusText,
      })
      setStep('closing')
    } catch (err: any) {
      console.error('Failed to save shutdown:', err?.message ?? err)
      setSaveError("Couldn't save today's wrap-up. Check your connection and try again.")
      setStep(3)
    }
  }

  return (
    <div
      data-testid="shutdown-ritual"
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-fullscreen)' as any,
        background: step === 'closing' ? '#000' : 'rgba(10,10,26,0.85)',
        backdropFilter: step === 'closing' ? 'none' : 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 800ms var(--ease-focus)',
      }}
    >
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="q1" {...crossfade} style={{ width: 480 }}>
            <p className="text-meta">Q 1 of 3</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '8px 0 24px' }}>
              what did you finish today?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allCompleted.map((t) => (
                <label key={t.id} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checked.has(t.id)} onChange={() => toggleChecked(t.id)} />
                  <span>{t.name}</span>
                </label>
              ))}
              <input
                value={extraFinished}
                onChange={(e) => setExtraFinished(e.target.value)}
                placeholder={adding ? 'adding...' : '[type to add more, press Enter]'}
                disabled={adding}
                data-testid="shutdown-extra-input"
                style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', outline: 'none', color: 'var(--text-secondary)', padding: '4px 0' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleAddExtra()
                  }
                }}
              />
            </div>
            <button type="button" onClick={goToQ2} style={{ marginTop: 24, float: 'right', background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer' }}>
              next →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="q2" {...crossfade} style={{ width: 480 }}>
            <p className="text-meta">Q 2 of 3</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '8px 0 24px' }}>
              what carries over?
            </h2>
            <Reorder.Group axis="y" values={carryOver} onReorder={setCarryOver} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {carryOver.map((t) => (
                <Reorder.Item key={t.id} value={t} className="glass" style={{ padding: '10px 16px', cursor: 'grab' }}>
                  {t.name}
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 14, cursor: 'pointer' }}>
                ← back
              </button>
              <button type="button" onClick={goToQ3} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer' }}>
                next →
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="q3" {...crossfade} style={{ width: 480 }}>
            <p className="text-meta">Q 3 of 3</p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '8px 0 24px' }}>
              one thing. tomorrow's focus:
            </h2>
            <input
              value={focusText}
              onChange={(e) => setFocusText(e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-accent)', outline: 'none', color: 'var(--text-primary)', fontSize: 18, padding: '8px 0' }}
              data-testid="shutdown-focus-input"
            />
            {saveError && (
              <p style={{ marginTop: 12, fontSize: 12.5, color: 'var(--danger)' }} data-testid="shutdown-save-error">
                {saveError}
              </p>
            )}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 14, cursor: 'pointer' }}>
                ← back
              </button>
              <button type="button" data-testid="shutdown-confirm" onClick={() => void finish()} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer' }}>
                done →
              </button>
            </div>
          </motion.div>
        )}

        {step === 'saving' && (
          <motion.p key="saving" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 0.3 }} style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: 18 }} data-testid="shutdown-saving-text">
            wrapping up…
          </motion.p>
        )}

        {step === 'closing' && (
          <motion.p key="closing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: 24 }} data-testid="shutdown-closing-text">
            good work. you showed up.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}