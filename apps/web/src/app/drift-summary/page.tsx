// apps/web/src/app/drift-summary/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'motion/react'
import { SessionSummaryCard } from '@/components/session/SessionSummaryCard'
import { useSessionStore } from '@/stores/sessionStore'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { useAppState } from '@/hooks/useAppState'

const NEXT_TASK_LIMIT = 4

export default function DriftSummaryPage() {
  const router = useRouter()
  const lastSummary = useSessionStore((s) => s.lastSummary)
  const clearSummary = useSessionStore((s) => s.clearSummary)
  const tasks = useTaskStore((s) => s.tasks)
  const anchors = useAnchorStore((s) => s.anchors)
  const { transition } = useAppState()

  useEffect(() => {
    if (!lastSummary) router.push('/')
  }, [lastSummary, router])

  if (!lastSummary) return null

  const minutes = Math.round(lastSummary.durationSeconds / 60)
  const nextUp = tasks.filter((t) => t.status === 'active' && t.id !== lastSummary.taskId).slice(0, NEXT_TASK_LIMIT)

  function handleContinue() {
    clearSummary()
    transition('IDLE')
    router.push('/')
  }

  // Puts DRIFT -> FOCUS to actual use — previously valid in the state
  // machine but nothing ever exercised it, so finishing a task always
  // detoured through IDLE even when the obvious next move was starting
  // the next one. No manual transition() call needed: NowSession's own
  // mount effect already calls transition('FOCUS') unconditionally, and
  // DRIFT -> FOCUS is a valid move, so it resolves correctly on its own.
  function handleStartAnother(taskId: string, name: string, anchorId: string | null) {
    clearSummary()
    const anchor = anchorId ? anchors.find((a) => a.id === anchorId) : null
    const params = new URLSearchParams({ taskId, task: name })
    if (anchor) params.set('anchor', anchor.name)
    router.push(`/now?${params.toString()}`)
  }

  return (
    <main
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24 }}
    >
      <SessionSummaryCard minutes={minutes} onContinue={handleContinue} />

      {nextUp.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <p className="text-micro-mono" style={{ textAlign: 'center', letterSpacing: '0.06em' }}>OR JUMP STRAIGHT INTO</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nextUp.map((t) => {
              const anchor = t.anchor_id ? anchors.find((a) => a.id === t.anchor_id) : null
              return (
                <button
                  key={t.id}
                  type="button"
                  data-testid="drift-summary-start-another"
                  onClick={() => handleStartAnother(t.id, t.name, t.anchor_id)}
                  className="glass glass-interactive"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: 'none', color: 'var(--text-primary)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                >
                  {anchor && <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: anchor.color, flexShrink: 0 }} />}
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</span>
                  <span style={{ color: 'var(--accent)', fontSize: 12, flexShrink: 0 }}>start →</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </main>
  )
}