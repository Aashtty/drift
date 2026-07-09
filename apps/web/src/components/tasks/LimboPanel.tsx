// apps/web/src/components/tasks/LimboPanel.tsx
'use client'

import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import type { Task } from '@/types/task'
import { daysSince } from '@/lib/utils/taskDecay'

interface LimboPanelProps {
  open: boolean
  onClose: () => void
  tasks: Task[]
  onRestore: (id: string) => void
  onArchive: (id: string) => void
  onKillAll: () => void
}

const SWIPE_THRESHOLD = 100

function limboAgeLabel(task: Task): string {
  const days = Math.floor(daysSince(task.updated_at))
  if (days <= 0) return 'parked today'
  if (days === 1) return 'in limbo for 1 day'
  return `in limbo for ${days} days`
}

function LimboRow({
  task,
  onRestore,
  onArchive,
}: {
  task: Task
  onRestore: (id: string) => void
  onArchive: (id: string) => void
}) {
  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) onRestore(task.id)
    else if (info.offset.x < -SWIPE_THRESHOLD) onArchive(task.id)
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.4}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      data-testid="limbo-row"
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        touchAction: 'pan-y',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {task.name}
        </p>
        <p className="text-meta" style={{ marginTop: 3, fontSize: 11, opacity: 0.55 }}>
          {limboAgeLabel(task)}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          data-testid="limbo-restore-button"
          onClick={(e) => {
            e.stopPropagation()
            onRestore(task.id)
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'rgba(0, 229, 160, 0.15)',
            color: 'var(--success)',
            fontSize: 12.5,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          restore
        </button>

        <button
          type="button"
          data-testid="limbo-archive-button"
          onClick={(e) => {
            e.stopPropagation()
            onArchive(task.id)
          }}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontSize: 12.5,
            fontWeight: 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          archive
        </button>
      </div>
    </motion.div>
  )
}

export function LimboPanel({ open, onClose, tasks, onRestore, onArchive, onKillAll }: LimboPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="limbo-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            // solid dim + blur — this is the actual fix. A full-viewport
            // overlay needs an opaque-enough backdrop that nothing behind
            // it (sidebar, page content) can bleed through. .glass alone
            // is tuned for small cards, not this.
            background: 'rgba(6, 5, 16, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <motion.div
            data-testid="limbo-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-chromatic"
            style={{
              width: 'min(560px, 100%)',
              maxHeight: '78vh',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p className="text-section-label">LIMBO</p>
                <p className="text-meta" style={{ marginTop: 4, opacity: 0.55, fontSize: 12, maxWidth: 380 }}>
                  Tasks you parked, or that quietly went stale.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="close"
                style={{
                  width: 28, height: 28, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--surface)', border: 'none', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {tasks.length === 0 && (
                <p className="text-meta" style={{ padding: '24px 0', textAlign: 'center', opacity: 0.5 }}>
                  Limbo is empty.
                </p>
              )}
              {tasks.map((t) => (
                <LimboRow key={t.id} task={t} onRestore={onRestore} onArchive={onArchive} />
              ))}
            </div>

            {tasks.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--border)' }} />
                <KillAllButton onKillAll={onKillAll} />
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function KillAllButton({ onKillAll }: { onKillAll: () => void }) {
  return <ConfirmButton onConfirm={onKillAll} />
}

function ConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  return (
    <button
      type="button"
      data-testid="kill-all-button"
      onClick={(e) => {
        const btn = e.currentTarget
        if (btn.dataset.armed === 'true') {
          onConfirm()
          btn.dataset.armed = 'false'
          btn.textContent = 'kill all'
          return
        }
        btn.dataset.armed = 'true'
        btn.textContent = 'tap again to confirm'
        setTimeout(() => {
          if (btn.dataset.armed === 'true') {
            btn.dataset.armed = 'false'
            btn.textContent = 'kill all'
          }
        }, 2000)
      }}
      style={{
        alignSelf: 'center',
        background: 'none',
        border: 'none',
        color: 'var(--danger)',
        fontSize: 12.5,
        cursor: 'pointer',
        padding: '4px 12px',
      }}
    >
      kill all
    </button>
  )
}