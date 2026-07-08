// apps/web/src/components/tasks/TaskList.tsx
'use client'

import { useState } from 'react'
import { TaskCard } from './TaskCard'
import { EnergySelector } from './EnergySelector'
import { filterByEnergy } from '@/lib/utils/energyFilter'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'
import type { EnergyLevel } from '@/types/task'

interface TaskListProps {
  tasks: Task[]
  anchorFor: (task: Task) => Anchor | null
  defaultEnergy?: EnergyLevel
}

export function TaskList({ tasks, anchorFor, defaultEnergy = 'high' }: TaskListProps) {
  const [energy, setEnergy] = useState<EnergyLevel>(defaultEnergy)
  const visible = filterByEnergy(tasks, energy)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <EnergySelector value={energy} onChange={setEnergy} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="task-list">
        {visible.length === 0 && (
          <p className="text-meta">No tasks at this energy level.</p>
        )}
        {visible.map((t) => (
          <TaskCard key={t.id} task={t} anchor={anchorFor(t)} />
        ))}
      </div>
    </div>
  )
}