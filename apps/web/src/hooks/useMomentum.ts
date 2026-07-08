// apps/web/src/hooks/useMomentum.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/db/supabase'
import { fetchSessionsRemote } from '@/lib/db/queries'
import { calculateMomentum, momentumTrend, type DayActivity, type MomentumTrend } from '@/lib/analytics/momentumScore'
import type { Task } from '@/types/task'

function bucketByDay(sessions: { started_at: string }[], doneTasks: Task[]): DayActivity[] {
  const map = new Map<string, DayActivity>()

  function ensure(date: string): DayActivity {
    let entry = map.get(date)
    if (!entry) {
      entry = { date, sessionsCompleted: 0, tasksDone: 0 }
      map.set(date, entry)
    }
    return entry
  }

  for (const s of sessions) {
    const date = s.started_at.slice(0, 10)
    ensure(date).sessionsCompleted += 1
  }
  for (const t of doneTasks) {
    if (!t.completed_at) continue
    const date = t.completed_at.slice(0, 10)
    ensure(date).tasksDone += 1
  }

  return Array.from(map.values())
}

export function useMomentum(userId: string, doneTasks: Task[]) {
  const [score, setScore] = useState(0)
  const [trend, setTrend] = useState<MomentumTrend>('flat')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) return
        const sessions = await fetchSessionsRemote(userId, 28) // covers current + prior 14-day window
        if (cancelled) return
        const activities = bucketByDay(sessions, doneTasks)
        setScore(calculateMomentum(activities))
        setTrend(momentumTrend(activities))
      } catch {
        // offline or unreachable — keep last known score
      }
    }
    void load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, doneTasks.length])

  return { score, trend }
}

// re-exported so Sidebar doesn't need to import supabase directly
export { supabase }