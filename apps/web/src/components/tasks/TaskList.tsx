// apps/web/src/components/tasks/TaskList.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TaskCard } from './TaskCard'
import { EnergySelector } from './EnergySelector'
import { filterByEnergy } from '@/lib/utils/energyFilter'
import type { Task, EnergyLevel } from '@/types/task'
import type { Anchor } from '@/types/anchor'

interface TaskListProps {
  tasks: Task[]
  anchorFor: (task: Task) => Anchor | null
  defaultEnergy?: EnergyLevel
  limit?: number
  onViewAll?: () => void
  onTaskStart?: (task: Task) => void
  onTaskComplete?: (task: Task) => void
  onOpenDetail?: (task: Task) => void
  onEnergyChange?: (level: EnergyLevel) => void
  sortComparator?: (a: Task, b: Task) => number
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (task: Task) => void
}

export function TaskList({
  tasks,
  anchorFor,
  defaultEnergy = 'high',
  limit,
  onViewAll,
  onTaskStart,
  onTaskComplete,
  onOpenDetail,
  onEnergyChange,
  sortComparator,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: TaskListProps) {
  const [energy, setEnergy] = useState<EnergyLevel>(defaultEnergy)
  const userChangedRef = useRef(false)

  useEffect(() => {
    if (!userChangedRef.current) setEnergy(defaultEnergy)
  }, [defaultEnergy])

  function handleEnergyChange(level: EnergyLevel) {
    userChangedRef.current = true
    setEnergy(level)
    onEnergyChange?.(level)
  }

  let visible = filterByEnergy(tasks, energy)
  if (sortComparator) visible = [...visible].sort(sortComparator)

  const overflow = limit != null ? Math.max(0, visible.length - limit) : 0
  const shown = limit != null ? visible.slice(0, limit) : visible

  return (
    // Was `maxWidth: 480` here — the actual source of both pages
    // reading as a narrow floating column no matter how wide the
    // viewport was. Width is now entirely the parent's call.
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <EnergySelector value={energy} onChange={handleEnergyChange} />
        <span className="text-micro-mono" style={{ opacity: 0.5 }}>{visible.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="task-list">
        <AnimatePresence mode="popLayout">
          {shown.length === 0 && (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-meta" style={{ padding: '12px 2px' }}>
              Nothing matches this energy level right now — try another one, or add a task.
            </motion.p>
          )}
          {shown.map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>
              <TaskCard
                task={t}
                anchor={anchorFor(t)}
                onClick={() => onTaskStart?.(t)}
                onToggleComplete={onTaskComplete}
                onOpenDetail={onOpenDetail}
                selectionMode={selectionMode}
                selected={selectedIds?.has(t.id) ?? false}
                onToggleSelect={onToggleSelect}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {overflow > 0 && onViewAll && (
        <button type="button" onClick={onViewAll} data-testid="task-list-view-all" style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}>
          +{overflow} more → see all tasks
        </button>
      )}
    </div>
  )
}