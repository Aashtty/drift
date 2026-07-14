// apps/web/src/components/tasks/ArchivePanel.tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'
import type { Task } from '@/types/task'

interface ArchivePanelProps {
  open: boolean
  onClose: () => void
  tasks: Task[]
  onRestore: (id: string) => void
  onDeletePermanently: (id: string) => void
}

function ArchiveRow({ task, onRestore, onDeletePermanently }: { task: Task; onRestore: (id: string) => void; onDeletePermanently: (id: string) => void }) {
  return (
    <div data-testid="archive-row" style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          data-testid="archive-restore-button"
          onClick={() => onRestore(task.id)}
          style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'color-mix(in srgb, var(--success) 18%, transparent)', color: 'var(--success)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Restore
        </button>
        <button
          type="button"
          data-testid="archive-delete-button"
          onClick={(e) => {
            const btn = e.currentTarget
            if (btn.dataset.armed === 'true') {
              onDeletePermanently(task.id)
              return
            }
            btn.dataset.armed = 'true'
            btn.textContent = 'Confirm Delete'
            setTimeout(() => {
              if (btn.dataset.armed === 'true') {
                btn.dataset.armed = 'false'
                btn.textContent = 'Delete'
              }
            }, 2000)
          }}
          style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border-accent)', background: 'transparent', color: 'var(--danger)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

/**
 * New. Archived tasks previously had nowhere to be viewed at all — the
 * Overview widget shows a bare count ("5 archived") with no way to see
 * or act on any of them; every task list filters `status === 'active'`
 * and Limbo only surfaces `status === 'limbo'`. Modeled after
 * LimboPanel for visual consistency, but simpler: archived tasks don't
 * need quick triage, so this offers just Restore or a permanent
 * two-tap-confirm Delete.
 */
export function ArchivePanel({ open, onClose, tasks, onRestore, onDeletePermanently }: ArchivePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="archive-backdrop"
          data-testid="archive-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-panel)' as any, background: 'color-mix(in srgb, var(--bg) 40%, transparent)', backdropFilter: 'blur(22px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '24px 24px 0' }}
        >
          <motion.div
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '90%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.7 }}
            onClick={(e) => e.stopPropagation()}
            data-testid="archive-panel"
            style={{ position: 'relative', width: 'min(560px, 100%)', maxHeight: '72vh', borderRadius: '20px 20px 0 0', overflow: 'hidden', boxShadow: '0 -16px 60px rgba(0,0,0,0.5)' }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--bg)) 0%, color-mix(in srgb, var(--bg) 94%, black) 40%, color-mix(in srgb, var(--accent) 14%, var(--bg)) 75%, color-mix(in srgb, var(--bg) 95%, black) 100%)`,
                backgroundSize: '240% 240%', animation: 'archive-gradient-shift 12s ease infinite',
              }}
            />
            <div
              style={{
                position: 'relative', display: 'flex', flexDirection: 'column', gap: 16,
                background: 'color-mix(in srgb, var(--bg) 86%, black)', backdropFilter: 'blur(20px) saturate(140%)',
                borderTop: '1px solid var(--border-accent)', borderLeft: '1px solid var(--border-accent)', borderRight: '1px solid var(--border-accent)',
                borderRadius: '20px 20px 0 0', padding: '10px 26px 26px', maxHeight: '72vh', overflowX: 'hidden',
              }}
            >
              <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-accent)', alignSelf: 'center', marginTop: 6 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>ARCHIVED {tasks.length > 0 && `· ${tasks.length}`}</p>
                  <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 380 }}>Tasks you archived — restore one, or delete it for good.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="close"
                  style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}
                >
                  ×
                </button>
              </div>

              <div className="scroll-thin" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', overflowX: 'hidden' }}>
                {tasks.length === 0 && <p style={{ padding: '28px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>Nothing archived.</p>}
                {tasks.map((t) => (
                  <ArchiveRow key={t.id} task={t} onRestore={onRestore} onDeletePermanently={onDeletePermanently} />
                ))}
              </div>
            </div>
          </motion.div>
          <style>{`
            @keyframes archive-gradient-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}