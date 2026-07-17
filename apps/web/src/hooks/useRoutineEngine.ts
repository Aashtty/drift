// apps/web/src/hooks/useRoutineEngine.ts
import { useEffect } from 'react'
import { useRoutineStore } from '@/stores/routineStore'
import { useTaskStore } from '@/stores/taskStore'
import { isDueToday, todayDateKey } from '@/lib/utils/routineSchedule'
import { createScoredTask } from '@/lib/tasks/createScoredTask'

/**
 * Two real bugs fixed here:
 *
 * 1. "Doesn't generate until refresh" — the old effect only depended on
 *    [userId, routinesLoaded, tasksLoaded], none of which change again
 *    after initial load. Creating a routine mid-session had nothing to
 *    re-trigger a check with. Now depends on `routines` and `tasks`
 *    themselves, so any store change re-evaluates immediately.
 *
 * 2. "Toggling off/on won't bring a deleted task back" — the old
 *    version gated purely on last_generated_date === today, which once
 *    set could never be cleared same-day by anything. The stamp now
 *    only prevents re-generation on its own; routines/page.tsx's toggle
 *    handler explicitly clears it when turning a routine back on, which
 *    is what makes off→on a real "check again" action. This engine then
 *    does a genuine existence check against `tasks` before creating
 *    anything, so re-checking can never produce a duplicate if the
 *    task was never actually removed.
 *
 * 3. Routine-generated tasks previously built their Task object by hand
 *    with aes_score always null and never called the scorer — the real
 *    bug behind "routine tasks don't get AES scores." Routed through
 *    createScoredTask now, same as every other add path, with the
 *    routine's own energy_level preserved via forcedEnergyLevel.
 */
export function useRoutineEngine(userId: string | null) {
  const routines = useRoutineStore((s) => s.routines)
  const routinesLoaded = useRoutineStore((s) => s.loaded)
  const markGeneratedToday = useRoutineStore((s) => s.markGeneratedToday)
  const tasks = useTaskStore((s) => s.tasks)
  const tasksLoaded = useTaskStore((s) => s.loaded)

  useEffect(() => {
    if (!userId || !routinesLoaded || !tasksLoaded) return
    const now = new Date()
    const dateKey = todayDateKey(now)

    for (const routine of routines) {
      if (!isDueToday(routine, now)) continue
      if (routine.last_generated_date === dateKey) continue

      const alreadyHasInstanceToday = tasks.some(
        (t) => t.routine_id === routine.id && t.created_at.slice(0, 10) === dateKey
      )
      if (alreadyHasInstanceToday) {
        void markGeneratedToday(routine.id, dateKey)
        continue
      }

      createScoredTask({ userId, name: routine.name, anchorId: routine.anchor_id, routineId: routine.id, forcedEnergyLevel: routine.energy_level })
      void markGeneratedToday(routine.id, dateKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, routinesLoaded, tasksLoaded, routines, tasks])
}