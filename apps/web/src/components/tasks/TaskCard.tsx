// apps/web/src/components/tasks/TaskCard.tsx
'use client'

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
  const baseClass = active ? 'glass-chromatic' : 'glass'

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="task-card"
      className={baseClass}
      style={{
        height: 52,
        width: '100%',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: `3px solid ${active ? 'var(--accent)' : anchorColor}`,
        cursor: 'pointer',
        transition: 'transform 150ms var(--ease-drift), background 150ms var(--ease-drift)',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.background = 'var(--surface-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.background = 'var(--surface)'
      }}
    >
      <span
        style={{
          flex: 1,
          fontSize: 14,
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
        <span className="text-micro-mono" style={{ opacity: 0.4 }}>
          AES{task.aes_score}
        </span>
      )}
    </button>
  )
}