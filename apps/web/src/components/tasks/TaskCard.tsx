// apps/web/src/components/tasks/TaskCard.tsx
'use client'

import { motion } from 'motion/react'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'

interface TaskCardProps {
  task: Task
  anchor?: Anchor | null
  active?: boolean
  onClick?: () => void
}

export function TaskCard({ task, anchor, active = false, onClick }: TaskCardProps) {
  const anchorColor = anchor?.color ?? 'var(--border)'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-testid="task-card"
      // Hover glow/lift now lives entirely in CSS (.glass-interactive,
      // defined in glass.css) instead of being driven by Framer's
      // whileHover. Framer animating box-shadow means the browser
      // recomputes and repaints that shadow on every animation frame via
      // JS-interpolated style updates — expensive, and the actual source
      // of the lag with multiple cards on screen. A CSS :hover transition
      // lets the browser handle it natively and far more cheaply.
      className={`${active ? 'glass-chromatic' : 'glass'} glass-interactive`}
      // Framer kept only for the tap/press feedback — scale is a
      // transform, which IS compositor-cheap, so this part was never
      // the problem.
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
    </motion.button>
  )
}