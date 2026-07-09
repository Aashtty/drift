// apps/web/src/app/shutdown/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ShutdownRitual } from '@/components/session/ShutdownRitual'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { insertShutdownRemote } from '@/lib/db/queries'
import { useAppState } from '@/hooks/useAppState'
import { useUser } from '@/hooks/useUser'

export default function ShutdownPage() {
  const router = useRouter()
  const { user } = useUser()
  const { tasksByStatus } = useTaskEngine(user?.id ?? '')
  const { transition } = useAppState()

  const completedTasks = tasksByStatus('done')
  const incompleteTasks = tasksByStatus('active')

  async function handleComplete(result: { completedTaskIds: string[]; carriedTaskIds: string[]; anchorText: string }) {
    if (!user) return
    await insertShutdownRemote({
      userId: user.id,
      completedTaskIds: result.completedTaskIds,
      carriedTaskIds: result.carriedTaskIds,
      anchorTaskId: result.carriedTaskIds[0] ?? null,
      notes: result.anchorText,
    })
    transition('IDLE')
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => void getCurrentWindow().minimize())
    }
    router.push('/')
  }

  if (!user) return null

  return <ShutdownRitual completedTasks={completedTasks} incompleteTasks={incompleteTasks} onComplete={handleComplete} />
}