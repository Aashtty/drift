// apps/web/src/components/tasks/TaskCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'

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

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-testid="task-card"
      className={`${active ? 'glass-chromatic' : 'glass'} glass-interactive`}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.12 }}
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
        <span
          role="checkbox"
          aria-checked={false}
          aria-label="mark task complete"
          data-testid="task-complete-toggle"
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(task)
          }}
          style={{
            width: 16,
            height: 16,
            flexShrink: 0,
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border-accent)',
            cursor: 'pointer',
          }}
        />
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
      {task.aes_score != null && (
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