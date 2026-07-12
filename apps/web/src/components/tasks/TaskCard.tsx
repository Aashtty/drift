// apps/web/src/components/tasks/TaskCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'
import { decayLevel, opacityForTask } from '@/lib/utils/taskDecay'

interface TaskCardProps {
  task: Task
  anchor?: Anchor | null
  active?: boolean
  onClick?: () => void
  onToggleComplete?: (task: Task) => void
  onSendToLimbo?: (task: Task) => void
}

export function TaskCard({ task, anchor, active = false, onClick, onToggleComplete, onSendToLimbo }: TaskCardProps) {
  const anchorColor = anchor?.color ?? 'var(--border)'
  const [limboHover, setLimboHover] = useState(false)

  // Task decay was fully implemented in lib/utils/taskDecay.ts (opacity
  // 1 / 0.6 / 0.3 as a task ages) but never actually applied here — the
  // core "old tasks quietly fade" mechanic had no visible effect. Wired
  // up now, plus a small amber dot once a task enters the "fading" band
  // so people get one quiet signal before it drops into Limbo.
  const level = task.updated_at ? decayLevel(task.updated_at) : 'fresh'
  const opacity = task.updated_at ? opacityForTask(task.updated_at) : 1

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-testid="task-card"
      className={`${active ? 'glass-chromatic' : 'glass'} glass-interactive`}
      whileTap={{ scale: 0.99 }}
      animate={{ opacity }}
      transition={{ duration: 0.12, opacity: { duration: 0.6 } }}
      style={{
        height: 54,
        width: '100%',
        padding: '0 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: `2px solid ${active ? 'var(--accent)' : anchorColor}`,
        boxShadow: active ? 'var(--glow-accent-sm)' : undefined,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {onToggleComplete && (
        // Outer span is the actual click/hit target (28x28) — the
        // previous 16x16 target doubled as both visual box and hitbox,
        // which is a small, precision-demanding tap target for a
        // frequently-used control. Inner span stays visually identical.
        <span
          role="checkbox"
          aria-checked={task.status === 'done'}
          aria-label="mark task complete"
          data-testid="task-complete-toggle"
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(task)
          }}
          style={{
            width: 28,
            height: 28,
            marginLeft: -6,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
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

      {level === 'fading' && (
        <span
          title="fading — heading to Limbo soon"
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: 'var(--warning, #e0a83f)',
          }}
        />
      )}

      {task.aes_score != null ? (
        <span
          className="text-micro-mono"
          style={{
            opacity: 0.5,
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-active)',
          }}
        >
          AES{task.aes_score}
        </span>
      ) : (
        // AI scoring (or the local fallback) hasn't resolved yet — give a
        // visible "still working on it" signal instead of just omitting
        // the badge silently, which reads as broken rather than pending.
        <motion.span
          className="text-micro-mono"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-active)',
          }}
        >
          scoring…
        </motion.span>
      )}

      {onSendToLimbo && (
        <span
          role="button"
          aria-label="not right now — snooze to limbo"
          title="not right now"
          data-testid="task-limbo-toggle"
          onClick={(e) => {
            e.stopPropagation()
            onSendToLimbo(task)
          }}
          onMouseEnter={() => setLimboHover(true)}
          onMouseLeave={() => setLimboHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            background: limboHover ? 'var(--surface-active)' : 'var(--surface)',
            opacity: limboHover ? 1 : 0.65,
            transition: 'opacity 150ms var(--ease-drift), background 150ms var(--ease-drift)',
            cursor: 'pointer',
          }}
        >
          {/* clock/snooze glyph — "deal with this later," unambiguous vs. a download arrow */}
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8.5" r="5.5" stroke={limboHover ? 'var(--text-primary)' : 'var(--text-secondary)'} strokeWidth="1.3" />
            <path
              d="M8 5.5V8.5L10 10"
              stroke={limboHover ? 'var(--text-primary)' : 'var(--text-secondary)'}
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 1.5h4"
              stroke={limboHover ? 'var(--text-primary)' : 'var(--text-secondary)'}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      )}
    </motion.button>
  )
}