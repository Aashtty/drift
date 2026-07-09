// apps/web/src/app/tasks/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { TaskList } from '@/components/tasks/TaskList'
import { LimboPanel } from '@/components/tasks/LimboPanel'
import { useUser } from '@/hooks/useUser'

export default function TasksPage() {
  const { user } = useUser()
  const router = useRouter()
  const { tasks, anchorFor, setStatus, tasksByStatus, markComplete } = useTaskEngine(user?.id ?? '')
  useTaskDecay()
  const [limboOpen, setLimboOpen] = useState(false)

  if (!user) return null
  const limboTasks = tasksByStatus('limbo')

  function startTask(taskId: string, name: string, anchorName: string | null) {
    const params = new URLSearchParams({ taskId, task: name })
    if (anchorName) params.set('anchor', anchorName)
    router.push(`/now?${params.toString()}`)
  }

  return (
    <main style={{ padding: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, maxWidth: 480 }}>
        <p className="text-section-label">TASKS</p>
        <button
          type="button"
          data-testid="limbo-trigger"
          onClick={() => setLimboOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          limbo
          {limboTasks.length > 0 && (
            <span
              style={{
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent)',
                color: 'var(--bg)',
                fontSize: 10,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {limboTasks.length}
            </span>
          )}
        </button>
      </div>

      <TaskList
        tasks={tasks}
        anchorFor={anchorFor}
        onTaskStart={(task) => startTask(task.id, task.name, anchorFor(task)?.name ?? null)}
        onTaskComplete={(task) => void markComplete(task)}
        onTaskSendToLimbo={(task) => setStatus(task.id, 'limbo')}
      />

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