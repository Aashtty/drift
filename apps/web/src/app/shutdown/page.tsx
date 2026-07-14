// apps/web/src/app/shutdown/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShutdownRitual } from '@/components/session/ShutdownRitual'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { insertShutdownRemote } from '@/lib/db/queries'
import { useAppState } from '@/hooks/useAppState'
import { useUser } from '@/hooks/useUser'

const CLOSING_HOLD_MS = 3000

export default function ShutdownPage() {
  const router = useRouter()
  const { user } = useUser()
  const { tasksByStatus, addCompletedTask } = useTaskEngine(user?.id ?? '')
  const { transition } = useAppState()

  // This was missing entirely — nothing anywhere ever set the app state
  // to SHUTDOWN, so the ritual's own ambient color never actually applied
  // while you were doing it. IDLE -> SHUTDOWN is valid (and this page is
  // only ever reached from Dashboard/Tasks/Replay/Settings, all of which
  // force IDLE on their own mount, so the guard should always pass here).
  useEffect(() => {
    transition('SHUTDOWN')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completedTasks = tasksByStatus('done')
  const incompleteTasks = tasksByStatus('active')

  async function handleAddCompletedTask(name: string) {
    if (!user) throw new Error('no user')
    return addCompletedTask(user.id, name)
  }

  async function handleComplete(result: { completedTaskIds: string[]; carriedTaskIds: string[]; focusText: string }) {
    if (!user) throw new Error('not signed in')
    await insertShutdownRemote({
      userId: user.id,
      completedTaskIds: result.completedTaskIds,
      carriedTaskIds: result.carriedTaskIds,
      priorityTaskId: result.carriedTaskIds[0] ?? null,
      notes: result.focusText,
    })

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
      onComplete={handleComplete}
    />
  )
}