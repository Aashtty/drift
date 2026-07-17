// apps/web/src/components/tasks/TaskCard.tsx
'use client'

import { motion } from 'motion/react'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'
import { decayLevel, opacityForTask } from '@/lib/utils/taskDecay'
import { AnchorBadge } from './AnchorBadge'
import { ENERGY_COLOR, ENERGY_LABEL } from '@/lib/utils/energyColors'
import { useSettingsStore } from '@/stores/settingsStore'

interface TaskCardProps {
  task: Task
  anchor?: Anchor | null
  active?: boolean
  onClick?: () => void
  onToggleComplete?: (task: Task) => void
  onOpenDetail?: (task: Task) => void
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: (task: Task) => void
  /** New - marks this row as today's chosen priority task, see
   *  hooks/useTodaysPriority.ts. */
  isPriority?: boolean
}

function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TargetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
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
  isPriority = false,
}: TaskCardProps) {
  const settings = useSettingsStore((s) => s.settings)
  const limboDays = settings?.limbo_decay_days ?? 7
  const anchorColor = anchor?.color ?? 'var(--border)'
  const level = task.updated_at ? decayLevel(task.updated_at, new Date(), limboDays) : 'fresh'
  const opacity = task.updated_at ? opacityForTask(task.updated_at, new Date(), limboDays) : 1

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
      animate={{ opacity, borderColor: selected ? 'var(--accent)' : isPriority ? 'var(--accent)' : undefined }}
      transition={{ duration: 0.12, opacity: { duration: 0.6 } }}
      style={{
        height: 54, width: '100%', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10,
        borderLeft: `2px solid ${active ? 'var(--accent)' : anchorColor}`,
        boxShadow: active || selected ? 'var(--glow-accent-sm)' : isPriority ? 'var(--glow-accent-sm)' : undefined,
        cursor: 'pointer', textAlign: 'left', userSelect: 'none', WebkitUserSelect: 'none',
      }}
    >
      {selectionMode ? (
        <span role="checkbox" aria-checked={selected} data-testid="task-select-checkbox" style={{ width: 28, height: 28, marginLeft: -4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid var(--border-accent)', background: selected ? 'var(--accent)' : 'transparent', boxShadow: selected ? 'var(--glow-accent-sm)' : 'none' }} />
        </span>
      ) : (
        onToggleComplete && (
          <span
            role="checkbox"
            aria-checked={task.status === 'done'}
            aria-label="mark task complete"
            data-testid="task-complete-toggle"
            onClick={(e) => { e.stopPropagation(); onToggleComplete(task) }}
            style={{ width: 28, height: 28, marginLeft: -6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-accent)', background: task.status === 'done' ? 'var(--accent)' : 'transparent' }} />
          </span>
        )
      )}

      {isPriority && (
        <span title="Today's priority - chosen last night" aria-hidden="true" style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0 }} data-testid="task-card-priority-badge">
          <TargetIcon />
        </span>
      )}

      <span style={{ flex: 1, fontSize: 14.5, fontFamily: 'var(--font-body)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {task.name}
      </span>

      {anchor && <AnchorBadge name={anchor.name} color={anchor.color} />}

      {level === 'fading' && (
        <span title={`fading - heading to Limbo in a few days`} aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: 'var(--warning)' }} />
      )}

      {task.energy_level != null ? (
        <span title={task.aes_score != null ? `AES ${task.aes_score}` : undefined} className="text-micro-mono" style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: 0.85, padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)', color: ENERGY_COLOR[task.energy_level] }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: ENERGY_COLOR[task.energy_level], flexShrink: 0 }} />
          {ENERGY_LABEL[task.energy_level]}
        </span>
      ) : (
        <span className="text-micro-mono animate-pulse-soft" style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)' }}>
          scoring...
        </span>
      )}

      {!selectionMode && onOpenDetail && (
        <span role="button" aria-label="view task details" title="details" data-testid="task-detail-trigger" onClick={(e) => { e.stopPropagation(); onOpenDetail(task) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0, borderRadius: 'var(--radius-sm)', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
          <ChevronIcon />
        </span>
      )}
    </motion.button>
  )
}