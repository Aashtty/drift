// apps/web/src/app/tasks/page.tsx
'use client'

import { useState } from 'react'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { TaskList } from '@/components/tasks/TaskList'
import { LimboPanel } from '@/components/tasks/LimboPanel'
import { useUser } from '@/hooks/useUser'

export default function TasksPage() {
  const { user } = useUser()
  const { tasks, anchorFor, setStatus, tasksByStatus } = useTaskEngine(user?.id ?? '')
  useTaskDecay()
  const [limboOpen, setLimboOpen] = useState(false)

  if (!user) return null
  const limboTasks = tasksByStatus('limbo')

  return (
    <main style={{ padding: 48 }}>
      <p className="text-section-label" style={{ marginBottom: 16 }}>TASKS</p>
      <TaskList tasks={tasks} anchorFor={anchorFor} />
      <button type="button" data-testid="limbo-trigger" onClick={() => setLimboOpen(true)} style={{ marginTop: 24, background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11, cursor: 'pointer' }}>
        limbo ({limboTasks.length})
      </button>
      <LimboPanel
        open={limboOpen}
        onClose={() => setLimboOpen(false)}
        tasks={limboTasks}
        onRestore={(id) => setStatus(id, 'active')}
        onArchive={(id) => setStatus(id, 'archived')}
        onKillAll={() => { for (const t of limboTasks) setStatus(t.id, 'archived') }}
      />
    </main>
  )
}