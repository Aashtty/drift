// apps/web/src/app/page.tsx
'use client'

import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { TaskList } from '@/components/tasks/TaskList'

const DEV_USER_ID = 'dev-local-user'

export default function DashboardPage() {
  const { tasks, anchorFor } = useTaskEngine(DEV_USER_ID)
  useTaskDecay()

  return (
    <main style={{ padding: 48 }}>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          color: 'var(--text-secondary)',
          marginBottom: 32,
        }}
      >
        good morning.
      </p>
      <p className="text-section-label" style={{ marginBottom: 16 }}>up next</p>
      <TaskList tasks={tasks} anchorFor={anchorFor} defaultEnergy="high" />
    </main>
  )
}