// apps/web/src/hooks/useTodaysPriority.ts
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { fetchShutdownsRemote } from '@/lib/db/queries'

export const SHUTDOWN_COMPLETED_EVENT = 'drift:shutdown-completed'

/**
 * Real bug fix: this used to fetch once on mount and never again - a
 * component staying mounted across a shutdown completion (or a
 * background tab finishing one) would keep showing stale priority
 * data indefinitely. Now also listens for a small custom event that
 * shutdown/page.tsx dispatches the moment a shutdown actually saves,
 * so any currently-mounted priority widget (NextMoveWidget, TaskCard,
 * TaskDetailSheet) refreshes immediately instead of only on next
 * navigation/remount.
 */
export function useTodaysPriorityTaskId(): string | null {
  const { user } = useUser()
  const [priorityTaskId, setPriorityTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    function refresh() {
      fetchShutdownsRemote(user!.id, 3)
        .then((shutdowns) => {
          const todayStr = new Date().toDateString()
          const lastNight = shutdowns.find((s) => new Date(s.completed_at).toDateString() !== todayStr)
          setPriorityTaskId(lastNight?.priority_task_id ?? null)
        })
        .catch(() => {})
    }

    refresh()
    window.addEventListener(SHUTDOWN_COMPLETED_EVENT, refresh)
    return () => window.removeEventListener(SHUTDOWN_COMPLETED_EVENT, refresh)
  }, [user])

  return priorityTaskId
}