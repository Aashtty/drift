// apps/web/src/app/shutdown/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { ShutdownRitual } from '@/components/session/ShutdownRitual'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { insertShutdownRemote } from '@/lib/db/queries'
import { useAppState } from '@/hooks/useAppState'

const DEV_USER_ID = 'dev-local-user'

export default function ShutdownPage() {
  const router = useRouter()
  const { tasksByStatus } = useTaskEngine(DEV_USER_ID)
  const { transition } = useAppState()

  const completedTasks = tasksByStatus('done')
  const incompleteTasks = tasksByStatus('active')

  async function handleComplete(result: {
    completedTaskIds: string[]
    carriedTaskIds: string[]
    anchorText: string
  }) {
    await insertShutdownRemote({
      userId: DEV_USER_ID,
      completedTaskIds: result.completedTaskIds,
      carriedTaskIds: result.carriedTaskIds,
      anchorTaskId: result.carriedTaskIds[0] ?? null,
      notes: result.anchorText,
    })

    transition('IDLE')

    // Real "app minimize" only exists under Tauri — no-op harmlessly in browser.
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
        void getCurrentWindow().minimize()
      })
    }

    router.push('/')
  }

  return (
    <ShutdownRitual
      completedTasks={completedTasks}
      incompleteTasks={incompleteTasks}
      onComplete={handleComplete}
    />
  )
}