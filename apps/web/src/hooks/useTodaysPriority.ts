// apps/web/src/hooks/useTodaysPriority.ts
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { fetchShutdownsRemote } from '@/lib/db/queries'

/**
 * Extracted from NextMoveWidget so Dashboard, Tasks, and TaskDetailSheet
 * can all mark "this is the task I chose as tomorrow's priority" -
 * previously that acknowledgment only existed on Dashboard's widget and
 * nowhere else, per feedback that it wasn't recognized anywhere.
 */
export function useTodaysPriorityTaskId(): string | null {
  const { user } = useUser()
  const [priorityTaskId, setPriorityTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    fetchShutdownsRemote(user.id, 3)
      .then((shutdowns) => {
        const todayStr = new Date().toDateString()
        const lastNight = shutdowns.find((s) => new Date(s.completed_at).toDateString() !== todayStr)
        setPriorityTaskId(lastNight?.priority_task_id ?? null)
      })
      .catch(() => {})
  }, [user])

  return priorityTaskId
}