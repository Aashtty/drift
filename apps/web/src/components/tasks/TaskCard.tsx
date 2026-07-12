// apps/web/src/components/tasks/TaskCard.tsx
'use client'

import { motion } from 'motion/react'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'
import { decayLevel, opacityForTask } from '@/lib/utils/taskDecay'
import { AnchorBadge } from './AnchorBadge'

interface TaskCardProps {
  task: Task
  anchor?: Anchor | null
  active?: boolean
  onClick?: () => void
  onToggleComplete?: (task: Task) => void
  onOpenDetail?: (task: Task) => void
  /** Bulk-select mode — replaces the complete-checkbox with a selection
   *  circle, and clicking the row toggles selection instead of starting
   *  the task. */
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: (task: Task) => void
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TaskCard({
  task,
  anchor,
  active = false,
  onClick,
  onToggleComplete,
  onOpenDetail,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: TaskCardProps) {
  const anchorColor = anchor?.color ?? 'var(--border)'
  const level = task.updated_at ? decayLevel(task.updated_at) : 'fresh'
  const opacity = task.updated_at ? opacityForTask(task.updated_at) : 1

  function handleRowClick() {
    if (selectionMode) onToggleSelect?.(task)
    else onClick?.()
  }

  return (
    <motion.button
      type="button"
      onClick={handleRowClick}
      data-testid="task-card"
      className={`${active ? 'glass-chromatic' : 'glass'} glass-interactive`}
      whileTap={{ scale: 0.99 }}
      animate={{ opacity, borderColor: selected ? 'var(--accent)' : undefined }}
      transition={{ duration: 0.12, opacity: { duration: 0.6 } }}
      style={{
        height: 54,
        width: '100%',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderLeft: `2px solid ${active ? 'var(--accent)' : anchorColor}`,
        boxShadow: active ? 'var(--glow-accent-sm)' : selected ? 'var(--glow-accent-sm)' : undefined,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {selectionMode ? (
        <span
          role="checkbox"
          aria-checked={selected}
          data-testid="task-select-checkbox"
          style={{ width: 28, height: 28, marginLeft: -4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '1.5px solid var(--border-accent)',
              background: selected ? 'var(--accent)' : 'transparent',
              boxShadow: selected ? 'var(--glow-accent-sm)' : 'none',
            }}
          />
        </span>
      ) : (
        onToggleComplete && (
          <span
            role="checkbox"
            aria-checked={task.status === 'done'}
            aria-label="mark task complete"
            data-testid="task-complete-toggle"
            onClick={(e) => {
              e.stopPropagation()
              onToggleComplete(task)
            }}
            style={{ width: 28, height: 28, marginLeft: -6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 16,
                height: 16,
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--border-accent)',
                background: task.status === 'done' ? 'var(--accent)' : 'transparent',
              }}
            />
          </span>
        )
      )}

      <span
        style={{
          flex: 1,
          fontSize: 14.5,
          fontFamily: 'var(--font-body)',
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {task.name}
      </span>

      {/* Anchor was passed into TaskCard from day one but never
          actually rendered anywhere — the color only ever showed up as
          a 2px border strip, with no name attached anywhere in the row. */}
      {anchor && <AnchorBadge name={anchor.name} color={anchor.color} />}

      {level === 'fading' && (
        <span
          title="fading — heading to Limbo soon"
          aria-hidden="true"
          style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: 'var(--warning)' }}
        />
      )}

      {task.aes_score != null ? (
        <span
          className="text-micro-mono"
          style={{ opacity: 0.5, padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)' }}
        >
          AES{task.aes_score}
        </span>
      ) : (
        <span className="text-micro-mono animate-pulse-soft" style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)' }}>
          scoring…
        </span>
      )}

      {/* Replaces the old separate "snooze to limbo" icon — limbo,
          archive, anchor, and energy are now all one tap away in the
          Detail Sheet instead of each needing its own icon crammed into
          a 54px row. */}
      {!selectionMode && onOpenDetail && (
        <span
          role="button"
          aria-label="view task details"
          title="details"
          data-testid="task-detail-trigger"
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail(task)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
          }}
        >
          <ChevronIcon />
        </span>
      )}
    </motion.button>
  )
}