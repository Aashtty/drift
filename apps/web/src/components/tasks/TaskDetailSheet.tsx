// apps/web/src/components/tasks/TaskDetailSheet.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { EnergySelector } from './EnergySelector'
import { AnchorBadge } from './AnchorBadge'
import type { Task, EnergyLevel } from '@/types/task'
import type { Anchor } from '@/types/anchor'

interface TaskDetailSheetProps {
  task: Task | null
  anchors: Anchor[]
  onClose: () => void
  onRename: (id: string, name: string) => void
  onSetAnchor: (id: string, anchorId: string | null) => void
  onSetEnergy: (id: string, level: EnergyLevel) => void
  onStart: (task: Task) => void
  onMarkDone: (task: Task) => void
  onSendToLimbo: (task: Task) => void
  onArchive: (task: Task) => void
  onRestore: (task: Task) => void
  onDelete: (task: Task) => void
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

/**
 * There was previously no way to edit anything about a task besides its
 * name (via the /now screen only, mid-session) or its status (via the
 * TaskCard row icons). Anchor assignment, a manual energy override, and
 * deletion had zero UI anywhere. This panel is that missing surface —
 * one place per task for everything about it.
 */
export function TaskDetailSheet({
  task,
  anchors,
  onClose,
  onRename,
  onSetAnchor,
  onSetEnergy,
  onStart,
  onMarkDone,
  onSendToLimbo,
  onArchive,
  onRestore,
  onDelete,
}: TaskDetailSheetProps) {
  const [draftName, setDraftName] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (task) setDraftName(task.name)
    setConfirmingDelete(false)
  }, [task?.id])

  function commitRename() {
    if (!task) return
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== task.name) onRename(task.id, trimmed)
  }

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-panel)' as any, background: 'color-mix(in srgb, var(--bg) 45%, transparent)', backdropFilter: 'blur(10px)' }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            data-testid="task-detail-sheet"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(400px, 100vw)',
              zIndex: 'var(--z-panel)' as any,
              background: 'color-mix(in srgb, var(--bg) 90%, black)',
              backdropFilter: 'blur(24px) saturate(140%)',
              borderLeft: '1px solid var(--border-accent)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              overflowY: 'auto',
            }}
            className="scroll-thin"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <p className="text-section-label">TASK</p>
              <button
                type="button"
                onClick={onClose}
                aria-label="close"
                style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 15 }}
              >
                ×
              </button>
            </div>

            <div>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
                data-testid="task-detail-name-input"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-accent)',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 20,
                  padding: '4px 0',
                }}
              />
              <p className="text-meta" style={{ marginTop: 8, fontSize: 11 }}>
                created {relativeTime(task.created_at)} · updated {relativeTime(task.updated_at)}
                {task.aes_score != null && ` · AES ${task.aes_score}`}
              </p>
            </div>

            <div>
              <p className="text-section-label" style={{ marginBottom: 10 }}>ANCHOR</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <AnchorBadge
                  name="none"
                  color="var(--text-tertiary)"
                  interactive
                  selected={!task.anchor_id}
                  onClick={() => onSetAnchor(task.id, null)}
                />
                {anchors.map((a) => (
                  <AnchorBadge
                    key={a.id}
                    name={a.name}
                    color={a.color}
                    interactive
                    selected={task.anchor_id === a.id}
                    onClick={() => onSetAnchor(task.id, a.id)}
                  />
                ))}
              </div>
              {anchors.length === 0 && (
                <p className="text-meta" style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>
                  No anchors yet — create one from the Tasks page.
                </p>
              )}
            </div>

            <div>
              <p className="text-section-label" style={{ marginBottom: 10 }}>ENERGY</p>
              <EnergySelector value={task.energy_level ?? 'medium'} onChange={(level) => onSetEnergy(task.id, level)} />
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 1, background: 'var(--border)', marginBottom: 4 }} />

              {task.status === 'active' && (
                <>
                  <ActionButton label="start task" tone="accent" onClick={() => onStart(task)} testId="detail-start" />
                  <ActionButton label="mark done" tone="success" onClick={() => onMarkDone(task)} testId="detail-done" />
                  <ActionButton label="send to limbo" tone="neutral" onClick={() => onSendToLimbo(task)} testId="detail-limbo" />
                </>
              )}
              {task.status === 'limbo' && (
                <>
                  <ActionButton label="restore to active" tone="accent" onClick={() => onRestore(task)} testId="detail-restore" />
                  <ActionButton label="archive" tone="neutral" onClick={() => onArchive(task)} testId="detail-archive" />
                </>
              )}
              {task.status === 'done' && (
                <ActionButton label="reopen (send to active)" tone="accent" onClick={() => onRestore(task)} testId="detail-reopen" />
              )}
              {task.status === 'archived' && (
                <ActionButton label="restore to active" tone="accent" onClick={() => onRestore(task)} testId="detail-restore" />
              )}

              {!confirmingDelete ? (
                <ActionButton label="delete task" tone="danger" onClick={() => setConfirmingDelete(true)} testId="detail-delete-prompt" />
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionButton label="cancel" tone="neutral" onClick={() => setConfirmingDelete(false)} />
                  <ActionButton
                    label="confirm delete"
                    tone="danger"
                    testId="detail-delete-confirm"
                    onClick={() => {
                      onDelete(task)
                      onClose()
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ActionButton({
  label,
  tone,
  onClick,
  testId,
}: {
  label: string
  tone: 'accent' | 'success' | 'neutral' | 'danger'
  onClick: () => void
  testId?: string
}) {
  const color =
    tone === 'accent' ? 'var(--accent)' : tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : 'var(--text-secondary)'
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="glass glass-interactive"
      style={{ flex: 1, padding: '10px 0', border: 'none', color, fontSize: 13, cursor: 'pointer' }}
    >
      {label}
    </button>
  )
}