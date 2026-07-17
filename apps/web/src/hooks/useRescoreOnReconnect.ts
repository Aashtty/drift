// apps/web/src/hooks/useRescoreOnReconnect.ts
import { useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { scoreSingleTask } from '@/lib/tasks/createScoredTask'

/**
 * The other half of the offline-scoring fix: when the browser regains
 * connectivity, finds every task that's still genuinely unscored
 * (aes_score AND energy_level both null - the "added while offline,
 * never got scored" signature) and retries scoring for each. Mounted
 * once, globally, in AppShell.
 */
export function useRescoreOnReconnect() {
  useEffect(() => {
    function handleOnline() {
      const { tasks } = useTaskStore.getState()
      const pending = tasks.filter((t) => t.status === 'active' && t.aes_score == null && t.energy_level == null)
      for (const t of pending) {
        scoreSingleTask(t.id, t.name)
      }
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])
}