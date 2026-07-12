// apps/web/src/app/shutdown/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShutdownRitual } from '@/components/session/ShutdownRitual'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { insertShutdownRemote } from '@/lib/db/queries'
import { useAppState } from '@/hooks/useAppState'
import { useUser } from '@/hooks/useUser'

// The closing screen holds for this long after a *successful* save
// before routing away — same pacing as before, it's just no longer
// doing the actual write during this window.
const CLOSING_HOLD_MS = 3000

export default function ShutdownPage() {
  const router = useRouter()
  const { user } = useUser()
  const { tasksByStatus, addCompletedTask } = useTaskEngine(user?.id ?? '')
  const { transition } = useAppState()

  const completedTasks = tasksByStatus('done')
  const incompleteTasks = tasksByStatus('active')

  async function handleAddCompletedTask(name: string) {
    if (!user) throw new Error('no user')
    return addCompletedTask(user.id, name)
  }

  // Now throws on failure instead of swallowing it — ShutdownRitual
  // awaits this and only advances to the closing screen once it
  // resolves, so an error here correctly keeps the person on Q3 with a
  // visible message and a way to retry, rather than silently discarding
  // the whole day's reflection.
  async function handleComplete(result: { completedTaskIds: string[]; carriedTaskIds: string[]; anchorText: string }) {
    if (!user) throw new Error('not signed in')
    await insertShutdownRemote({
      userId: user.id,
      completedTaskIds: result.completedTaskIds,
      carriedTaskIds: result.carriedTaskIds,
      anchorTaskId: result.carriedTaskIds[0] ?? null,
      notes: result.anchorText,
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