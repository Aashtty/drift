// apps/web/src/hooks/useTaskDecay.ts
import { useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { decayLevel } from '@/lib/utils/taskDecay'

/**
 * Runs once on app load (per the spec: "Decay calculated on app open").
 * Purely a status transition — active tasks that have crossed the 7-day
 * threshold move to 'limbo'. Opacity itself is calculated live by TaskCard
 * from updated_at, not stored.
 */
export function useTaskDecay() {
  const tasks = useTaskStore((s) => s.tasks)
  const setStatus = useTaskStore((s) => s.setStatus)

  useEffect(() => {
    const now = new Date()
    for (const task of tasks) {
      if (task.status !== 'active') continue
      if (decayLevel(task.updated_at, now) === 'limbo') {
        void setStatus(task.id, 'limbo')
      }
    }
    // Intentionally runs once per mount (app open), not on every tasks change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}