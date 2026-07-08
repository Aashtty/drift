// apps/web/src/components/tasks/LimboPanel.tsx
'use client'

import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import type { Task } from '@/types/task'

interface LimboPanelProps {
  open: boolean
  onClose: () => void
  tasks: Task[]
  onRestore: (id: string) => void
  onArchive: (id: string) => void
  onKillAll: () => void
}

const SWIPE_THRESHOLD = 100

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
    if (info.offset.x > SWIPE_THRESHOLD) {
      onRestore(task.id)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onArchive(task.id)
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      className="glass"
      data-testid="limbo-row"
      style={{
        height: 52,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        opacity: 0.6,
        filter: 'saturate(0.6)',
        touchAction: 'pan-y',
      }}
    >
      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{task.name}</span>
    </motion.div>
  )
}

export function LimboPanel({
  open,
  onClose,
  tasks,
  onRestore,
  onArchive,
  onKillAll,
}: LimboPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="limbo-panel"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass"
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            height: '90vh',
            zIndex: 90,
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="text-section-label">LIMBO — swipe right to restore, left to archive</p>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              close
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', flex: 1 }}>
            {tasks.length === 0 && <p className="text-meta">Limbo is empty.</p>}
            {tasks.map((t) => (
              <LimboRow key={t.id} task={t} onRestore={onRestore} onArchive={onArchive} />
            ))}
          </div>

          {tasks.length > 0 && (
            <KillAllButton onKillAll={onKillAll} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function KillAllButton({ onKillAll }: { onKillAll: () => void }) {
  return (
    <ConfirmButton onConfirm={onKillAll} />
  )
}

function ConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  // Local, tiny confirm-within-2s state machine, kept inline since it's
  // only used here.
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
        fontSize: 13,
        cursor: 'pointer',
        padding: '12px 24px',
      }}
    >
      kill all
    </button>
  )
}