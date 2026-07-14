// apps/web/src/components/tasks/VaultPanel.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, type PanInfo } from 'motion/react'
import type { Task } from '@/types/task'
import { daysSince } from '@/lib/utils/taskDecay'

type VaultTab = 'limbo' | 'archived'

interface VaultPanelProps {
  open: boolean
  onClose: () => void
  /** Which tab to land on when the panel opens — lets callers (the
   *  toolbar's segmented control, or the Overview rail's clickable
   *  stats) deep-link straight to the relevant tab instead of always
   *  defaulting to Limbo. */
  initialTab?: VaultTab
  limboTasks: Task[]
  archivedTasks: Task[]
  onRestore: (id: string) => void
  onArchive: (id: string) => void
  onArchiveAll: () => void
  onDeletePermanently: (id: string) => void
}

const SWIPE_THRESHOLD = 100

const TAB_COPY: Record<VaultTab, string> = {
  limbo: "Tasks you parked, or that quietly went stale after a week untouched. This is a check-in queue — pick each one back up, or let it go.",
  archived: "Tasks you've deliberately set aside. Unlike Limbo, these don't decay or resurface on their own — restore one anytime, or delete it for good.",
}

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
  onDragStateChange,
}: {
  task: Task
  onRestore: (id: string) => void
  onArchive: (id: string) => void
  onDragStateChange: (dragging: boolean) => void
}) {
  function handleDragEnd(_: unknown, info: PanInfo) {
    onDragStateChange(false)
    if (info.offset.x > SWIPE_THRESHOLD) onRestore(task.id)
    else if (info.offset.x < -SWIPE_THRESHOLD) onArchive(task.id)
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.35}
      onDragStart={() => onDragStateChange(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      data-testid="limbo-row"
      style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, touchAction: 'pan-y' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</p>
        <p style={{ marginTop: 3, fontSize: 11, color: 'var(--text-tertiary)' }}>{limboAgeLabel(task)}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button type="button" data-testid="limbo-restore-button" onClick={(e) => { e.stopPropagation(); onRestore(task.id) }} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'color-mix(in srgb, var(--success) 18%, transparent)', color: 'var(--success)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Restore
        </button>
        <button type="button" data-testid="limbo-archive-button" onClick={(e) => { e.stopPropagation(); onArchive(task.id) }} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border-accent)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Archive
        </button>
      </div>
    </motion.div>
  )
}

function ArchiveRow({ task, onRestore, onDeletePermanently }: { task: Task; onRestore: (id: string) => void; onDeletePermanently: (id: string) => void }) {
  return (
    <div data-testid="archive-row" style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button type="button" data-testid="archive-restore-button" onClick={() => onRestore(task.id)} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'color-mix(in srgb, var(--success) 18%, transparent)', color: 'var(--success)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
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

function TabButton({ label, count, active, onClick, testId }: { label: string; count: number; active: boolean; onClick: () => void; testId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0',
        border: 'none', borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`, background: 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: 13, fontWeight: active ? 500 : 400, cursor: 'pointer',
      }}
    >
      {label}
      {count > 0 && (
        <span className="text-micro-mono" style={{ padding: '1px 6px', borderRadius: 999, background: active ? 'var(--surface-active)' : 'var(--surface)', color: active ? 'var(--accent)' : 'var(--text-tertiary)' }}>
          {count}
        </span>
      )}
    </button>
  )
}

/**
 * Replaces the previous LimboPanel + ArchivePanel split. Those were two
 * structurally identical popups with different labels and no explanation
 * of how they differed — from the outside, "why are there two of these"
 * was a completely fair question. This is one panel with two tabs, and
 * the actual distinction is stated in plain language at the top of
 * whichever tab is open, so the product explains itself instead of
 * requiring someone to ask.
 */
export function VaultPanel({ open, onClose, initialTab = 'limbo', limboTasks, archivedTasks, onRestore, onArchive, onArchiveAll, onDeletePermanently }: VaultPanelProps) {
  const [tab, setTab] = useState<VaultTab>(initialTab)
  const suppressCloseRef = useRef(false)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  function handleBackdropClick() {
    if (suppressCloseRef.current) return
    onClose()
  }

  function handleDragStateChange(dragging: boolean) {
    if (dragging) suppressCloseRef.current = true
    else setTimeout(() => { suppressCloseRef.current = false }, 150)
  }

  const activeTasks = tab === 'limbo' ? limboTasks : archivedTasks

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="vault-backdrop"
            data-testid="vault-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-panel)' as any, background: 'color-mix(in srgb, var(--bg) 40%, transparent)', backdropFilter: 'blur(22px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '24px 24px 0' }}
          >
            <motion.div
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '90%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.7 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="vault-panel"
              style={{ position: 'relative', width: 'min(560px, 100%)', maxHeight: '76vh', borderRadius: '20px 20px 0 0', overflow: 'hidden', boxShadow: '0 -16px 60px rgba(0,0,0,0.5)' }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, var(--bg)) 0%, color-mix(in srgb, var(--bg) 94%, black) 40%, color-mix(in srgb, var(--accent) 16%, var(--bg)) 75%, color-mix(in srgb, var(--bg) 95%, black) 100%)`,
                  backgroundSize: '240% 240%', animation: 'vault-gradient-shift 12s ease infinite',
                }}
              />
              <div
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', gap: 14,
                  background: 'color-mix(in srgb, var(--bg) 86%, black)', backdropFilter: 'blur(20px) saturate(140%)',
                  borderTop: '1px solid var(--border-accent)', borderLeft: '1px solid var(--border-accent)', borderRight: '1px solid var(--border-accent)',
                  borderRadius: '20px 20px 0 0', padding: '10px 26px 26px', maxHeight: '76vh', overflowX: 'hidden',
                }}
              >
                <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--border-accent)', alignSelf: 'center', marginTop: 6 }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>VAULT</p>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="close"
                    style={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16 }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                  <TabButton label="Limbo" count={limboTasks.length} active={tab === 'limbo'} onClick={() => setTab('limbo')} testId="vault-tab-limbo" />
                  <TabButton label="Archived" count={archivedTasks.length} active={tab === 'archived'} onClick={() => setTab('archived')} testId="vault-tab-archived" />
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6, margin: 0 }}>{TAB_COPY[tab]}</p>

                <div className="scroll-thin" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', overflowX: 'hidden' }}>
                  {activeTasks.length === 0 && (
                    <p style={{ padding: '28px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
                      {tab === 'limbo' ? 'Limbo is empty.' : 'Nothing archived.'}
                    </p>
                  )}
                  {tab === 'limbo'
                    ? limboTasks.map((t) => <LimboRow key={t.id} task={t} onRestore={onRestore} onArchive={onArchive} onDragStateChange={handleDragStateChange} />)
                    : archivedTasks.map((t) => <ArchiveRow key={t.id} task={t} onRestore={onRestore} onDeletePermanently={onDeletePermanently} />)}
                </div>

                {tab === 'limbo' && limboTasks.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <ArchiveAllButton onArchiveAll={onArchiveAll} />
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes vault-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  )
}

function ArchiveAllButton({ onArchiveAll }: { onArchiveAll: () => void }) {
  return (
    <button
      type="button"
      data-testid="archive-all-button"
      onClick={(e) => {
        const btn = e.currentTarget
        if (btn.dataset.armed === 'true') {
          onArchiveAll()
          btn.dataset.armed = 'false'
          btn.textContent = 'Archive All'
          return
        }
        btn.dataset.armed = 'true'
        btn.textContent = 'Tap again to confirm'
        setTimeout(() => {
          if (btn.dataset.armed === 'true') {
            btn.dataset.armed = 'false'
            btn.textContent = 'Archive All'
          }
        }, 2000)
      }}
      style={{ alignSelf: 'center', background: 'none', border: 'none', color: 'var(--danger)', fontSize: 12.5, cursor: 'pointer', padding: '4px 12px' }}
    >
      Archive All
    </button>
  )
}