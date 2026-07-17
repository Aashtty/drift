// apps/web/src/app/shutdown/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShutdownRitual } from '@/components/session/ShutdownRitual'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { insertShutdownRemote } from '@/lib/db/queries'
import { useAppState } from '@/hooks/useAppState'
import { useUser } from '@/hooks/useUser'
import { createScoredTask } from '@/lib/tasks/createScoredTask'
import { markDayEndRitualCompleted } from '@/lib/utils/dayEndSnooze'
import { useTodaysPriorityTaskId } from '@/hooks/useTodaysPriority'

const CLOSING_HOLD_MS = 3000

export default function ShutdownPage() {
  const router = useRouter()
  const { user } = useUser()
  const { tasksByStatus, addCompletedTask } = useTaskEngine(user?.id ?? '')
  const { transition } = useAppState()
  const priorityTaskId = useTodaysPriorityTaskId()

  useEffect(() => {
    transition('SHUTDOWN')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayStr = new Date().toDateString()
  const completedTasks = tasksByStatus('done').filter((t) => t.completed_at && new Date(t.completed_at).toDateString() === todayStr)
  const incompleteTasks = tasksByStatus('active')
  const allTasks = [...completedTasks, ...incompleteTasks, ...tasksByStatus('limbo'), ...tasksByStatus('archived')]

  const priorityTask = priorityTaskId ? allTasks.find((t) => t.id === priorityTaskId) ?? null : null
  const priorityCompleted = priorityTaskId ? completedTasks.some((t) => t.id === priorityTaskId) : false

  async function handleAddCompletedTask(name: string) {
    if (!user) throw new Error('no user')
    return addCompletedTask(user.id, name)
  }

  async function handleCreateTask(name: string) {
    if (!user) throw new Error('no user')
    return createScoredTask({ userId: user.id, name })
  }

  async function handleComplete(result: { completedTaskIds: string[]; carriedTaskIds: string[]; priorityTaskId: string | null; focusText: string }) {
    if (!user) throw new Error('not signed in')
    await insertShutdownRemote({ userId: user.id, completedTaskIds: result.completedTaskIds, carriedTaskIds: result.carriedTaskIds, priorityTaskId: result.priorityTaskId, notes: result.focusText || null })
    markDayEndRitualCompleted()
    await new Promise((resolve) => setTimeout(resolve, CLOSING_HOLD_MS))
    transition('IDLE')
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      void import('@tauri-apps/api/window').then(({ getCurrentWindow }) => void getCurrentWindow().minimize())
    }
    router.push('/')
  }

  if (!user) return null

  return (
    <ShutdownRitual
      completedTasks={completedTasks}
      incompleteTasks={incompleteTasks}
      onAddCompletedTask={handleAddCompletedTask}
      onCreateTask={handleCreateTask}
      onComplete={handleComplete}
      priorityTaskName={priorityTask?.name ?? null}
      priorityCompleted={priorityCompleted}
    />
  )
}