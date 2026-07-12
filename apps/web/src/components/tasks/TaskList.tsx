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
  onTaskStart?: (task: Task) => void
  onTaskComplete?: (task: Task) => void
  onTaskSendToLimbo?: (task: Task) => void
  /** Fires whenever the user manually changes the energy level, so a
   *  parent can persist it (e.g. to settingsStore's energy_default). */
  onEnergyChange?: (level: EnergyLevel) => void
}

export function TaskList({
  tasks,
  anchorFor,
  defaultEnergy = 'high',
  onTaskStart,
  onTaskComplete,
  onTaskSendToLimbo,
  onEnergyChange,
}: TaskListProps) {
  const [energy, setEnergy] = useState<EnergyLevel>(defaultEnergy)
  // `defaultEnergy` commonly arrives late — settings load async after
  // mount — so the initial useState value is often stale by the time the
  // real saved preference shows up. Sync to it as it changes, but only
  // until the person makes their own choice in this session; after that,
  // their in-session pick should win over a late-arriving default.
  const userChangedRef = useRef(false)

  useEffect(() => {
    if (!userChangedRef.current) setEnergy(defaultEnergy)
  }, [defaultEnergy])

  function handleEnergyChange(level: EnergyLevel) {
    userChangedRef.current = true
    setEnergy(level)
    onEnergyChange?.(level)
  }

  const visible = filterByEnergy(tasks, energy)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 480 }}>
      <EnergySelector value={energy} onChange={handleEnergyChange} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} data-testid="task-list">
        <AnimatePresence mode="popLayout">
          {visible.length === 0 && (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-meta"
              style={{ padding: '12px 2px' }}
            >
              Nothing matches this energy level right now — try another one, or add a task.
            </motion.p>
          )}
          {visible.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <TaskCard
                task={t}
                anchor={anchorFor(t)}
                onClick={() => onTaskStart?.(t)}
                onToggleComplete={onTaskComplete}
                onSendToLimbo={onTaskSendToLimbo}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}