// apps/web/src/components/tasks/AnchorManager.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AnchorBadge } from './AnchorBadge'
import { useAnchorStore } from '@/stores/anchorStore'
import { useTaskStore } from '@/stores/taskStore'
import { toast } from '@/stores/toastStore'
import type { Anchor } from '@/types/anchor'

interface AnchorManagerProps {
  open: boolean
  onClose: () => void
  userId: string
}

const COLOR_PALETTE = [
  '#8f6bff', // accent
  '#4fd8ff', // accent-b
  '#00e5a0', // success
  '#ffaa00', // warning
  '#ff3366', // danger
  '#ff6b9d',
  '#66d9ef',
  '#ffd166',
]

const MAX_ANCHORS = 6

/**
 * Anchors previously had no UI at all for creating or deleting one —
 * `addAnchor` existed in the store since Phase 1 but nothing called it.
 * This is that missing surface: name + color, capped at 6 (enforced by
 * the store), with delete-with-undo and automatic cleanup of any tasks
 * that were tagged with a deleted anchor.
 */
export function AnchorManager({ open, onClose, userId }: AnchorManagerProps) {
  const anchors = useAnchorStore((s) => s.anchors)
  const addAnchor = useAnchorStore((s) => s.addAnchor)
  const removeAnchor = useAnchorStore((s) => s.removeAnchor)
  const tasks = useTaskStore((s) => s.tasks)
  const updateTask = useTaskStore((s) => s.updateTask)

  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0])
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || creating) return
    setCreating(true)
    const anchor: Anchor = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: trimmed,
      color,
      created_at: new Date().toISOString(),
    }
    const result = await addAnchor(anchor)
    setCreating(false)
    if (!result.ok) {
      toast.error(result.reason ?? "Couldn't create that anchor.")
      return
    }
    setName('')
    toast.success(`Created "${trimmed}".`)
  }

  async function handleDelete(anchor: Anchor) {
    const affectedTasks = tasks.filter((t) => t.anchor_id === anchor.id)
    await removeAnchor(anchor.id)
    // Clear the dangling reference locally so TaskCard's left-border
    // color doesn't point at a color that no longer means anything —
    // the DB's ON DELETE SET NULL handles this server-side, but the
    // locally cached copies need the same patch applied by hand.
    for (const t of affectedTasks) void updateTask(t.id, { anchor_id: null })

    toast.undo(`Removed "${anchor.name}".`, async () => {
      await addAnchor(anchor)
      for (const t of affectedTasks) void updateTask(t.id, { anchor_id: anchor.id })
    })
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)' as any,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel chromatic style={{ padding: 24, width: 380 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className="text-section-label">ANCHORS · {anchors.length}/{MAX_ANCHORS}</p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="close"
                  style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 15 }}
                >
                  ×
                </button>
              </div>

              {anchors.length === 0 && (
                <p className="text-meta" style={{ marginBottom: 16 }}>
                  Anchors group related tasks with a color — e.g. "Work", "Home", "Health". Create one to get started.
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {anchors.map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <AnchorBadge name={a.name} color={a.color} />
                    <button
                      type="button"
                      data-testid={`anchor-delete-${a.id}`}
                      onClick={() => void handleDelete(a)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11.5, cursor: 'pointer' }}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>

              {anchors.length < MAX_ANCHORS ? (
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="anchor name"
                    data-testid="anchor-name-input"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        aria-label={`color ${c}`}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: c,
                          border: c === color ? '2px solid var(--text-primary)' : '2px solid transparent',
                          cursor: 'pointer',
                          boxShadow: c === color ? `0 0 8px ${c}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={!name.trim() || creating}
                    data-testid="anchor-create-submit"
                    style={{
                      padding: '9px 0',
                      background: 'var(--surface-active)',
                      border: 'none',
                      borderRadius: 8,
                      color: name.trim() ? 'var(--accent)' : 'var(--text-tertiary)',
                      fontSize: 13.5,
                      cursor: name.trim() ? 'pointer' : 'default',
                    }}
                  >
                    {creating ? 'creating…' : '+ create anchor'}
                  </button>
                </form>
              ) : (
                <p className="text-meta" style={{ opacity: 0.6, fontSize: 11.5 }}>
                  Max {MAX_ANCHORS} reached — remove one to add another.
                </p>
              )}
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}