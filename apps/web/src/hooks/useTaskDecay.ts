// apps/web/src/hooks/useTaskDecay.ts
import { useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { decayLevel } from '@/lib/utils/taskDecay'

export function useTaskDecay() {
  const tasks = useTaskStore((s) => s.tasks)
  const setStatus = useTaskStore((s) => s.setStatus)
  const settings = useSettingsStore((s) => s.settings)
  const limboDays = settings?.limbo_decay_days ?? 7

  useEffect(() => {
    const now = new Date()
    for (const task of tasks) {
      if (task.status !== 'active') continue
      if (decayLevel(task.updated_at, now, limboDays) === 'limbo') {
        void setStatus(task.id, 'limbo')
      }
    }
    // Intentionally runs once per mount (app open), not on every tasks
    // or settings change - matches the original "decay calculated on
    // app open" spec.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}