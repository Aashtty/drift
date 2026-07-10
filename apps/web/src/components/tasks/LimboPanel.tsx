// apps/web/src/components/tasks/LimboPanel.tsx
'use client'

import { useRef } from 'react'
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
      style={{
        padding: '14px 16px',
        borderRadius: 14,
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
        <p style={{ marginTop: 3, fontSize: 11, color: 'var(--text-tertiary)' }}>{limboAgeLabel(task)}</p>
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
            borderRadius: 9,
            border: 'none',
            background: 'color-mix(in srgb, var(--success) 18%, transparent)',
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
            borderRadius: 9,
            border: '1px solid var(--border-accent)',
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
  // Guards the exact bug you hit: dragging a row with elastic overshoot can
  // put the cursor physically outside the card at release, so the browser's
  // click lands on the backdrop instead of the row and closes the whole
  // panel. This ref suppresses backdrop-close for a brief window around
  // any row drag.
  const suppressCloseRef = useRef(false)

  function handleBackdropClick() {
    if (suppressCloseRef.current) return
    onClose()
  }

  function handleDragStateChange(dragging: boolean) {
    if (dragging) {
      suppressCloseRef.current = true
    } else {
      setTimeout(() => {
        suppressCloseRef.current = false
      }, 150)
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="limbo-backdrop"
            data-testid="limbo-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              background: 'color-mix(in srgb, var(--bg) 40%, transparent)',
              backdropFilter: 'blur(22px)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              padding: '24px 24px 0',
            }}
          >
            <motion.div
              initial={{ y: '110%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '90%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30, mass: 0.7 }}
              onClick={(e) => e.stopPropagation()}
              data-testid="limbo-panel"
              style={{
                position: 'relative',
                width: 'min(560px, 100%)',
                maxHeight: '72vh',
                borderRadius: '20px 20px 0 0',
                overflow: 'hidden',
                boxShadow: '0 -16px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(135deg,
                    color-mix(in srgb, var(--accent) 26%, var(--bg)) 0%,
                    color-mix(in srgb, var(--bg) 94%, black) 40%,
                    color-mix(in srgb, var(--accent) 18%, var(--bg)) 75%,
                    color-mix(in srgb, var(--bg) 95%, black) 100%)`,
                  backgroundSize: '240% 240%',
                  animation: 'limbo-gradient-shift 12s ease infinite',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  background: 'color-mix(in srgb, var(--bg) 86%, black)',
                  backdropFilter: 'blur(20px) saturate(140%)',
                  borderTop: '1px solid var(--border-accent)',
                  borderLeft: '1px solid var(--border-accent)',
                  borderRight: '1px solid var(--border-accent)',
                  borderRadius: '20px 20px 0 0',
                  padding: '10px 26px 26px',
                  maxHeight: '72vh',
                  overflowX: 'hidden',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--border-accent)',
                    alignSelf: 'center',
                    marginTop: 6,
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>
                      LIMBO {tasks.length > 0 && `· ${tasks.length}`}
                    </p>
                    <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 380 }}>
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
                      background: 'var(--surface)', border: 'none', borderRadius: 8,
                      color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="limbo-scroll-area" style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', overflowX: 'hidden' }}>
                  {tasks.length === 0 && (
                    <p style={{ padding: '28px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)' }}>
                      Limbo is empty.
                    </p>
                  )}
                  {tasks.map((t) => (
                    <LimboRow
                      key={t.id}
                      task={t}
                      onRestore={onRestore}
                      onArchive={onArchive}
                      onDragStateChange={handleDragStateChange}
                    />
                  ))}
                </div>

                {tasks.length > 0 && (
                  <>
                    <div style={{ height: 1, background: 'var(--border)' }} />
                    <KillAllButton onKillAll={onKillAll} />
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes limbo-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        /* thin, theme-tinted scrollbar instead of the default OS one */
        .limbo-scroll-area {
          scrollbar-width: thin;
          scrollbar-color: var(--border-accent) transparent;
        }
        .limbo-scroll-area::-webkit-scrollbar {
          width: 5px;
        }
        .limbo-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .limbo-scroll-area::-webkit-scrollbar-thumb {
          background: var(--border-accent);
          border-radius: 999px;
        }
      `}</style>
    </>
  )
}

function KillAllButton({ onKillAll }: { onKillAll: () => void }) {
  return (
    <button
      type="button"
      data-testid="kill-all-button"
      onClick={(e) => {
        const btn = e.currentTarget
        if (btn.dataset.armed === 'true') {
          onKillAll()
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
        alignSelf: 'center', background: 'none', border: 'none',
        color: 'var(--danger)', fontSize: 12.5, cursor: 'pointer', padding: '4px 12px',
      }}
    >
      kill all
    </button>
  )
}