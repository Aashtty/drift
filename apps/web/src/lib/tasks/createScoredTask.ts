// apps/web/src/lib/tasks/createScoredTask.ts
import { scoreTasksBatch } from '@/lib/ai/aesScorer'
import { useTaskStore } from '@/stores/taskStore'
import type { Task, EnergyLevel } from '@/types/task'

function aesToEnergy(aes: number): EnergyLevel {
  if (aes <= 2) return 'low'
  if (aes <= 3) return 'medium'
  return 'high'
}

interface CreateScoredTaskArgs {
  userId: string
  name: string
  anchorId?: string | null
  routineId?: string | null
  forcedEnergyLevel?: EnergyLevel | null
}

/**
 * Single source of truth for "add a task, then score it." Two bugs
 * fixed here:
 *
 * 1. Offline tasks were getting a silent "medium" energy guess. The
 *    scorer's local fallback (used when the AI API is unreachable)
 *    defaults to AES 3 whenever nothing matches its keyword lists,
 *    and that fallback ran unconditionally even when offline - so
 *    every offline-added task ended up mislabeled "medium" with no
 *    indication it was a guess rather than a real score. Now: if
 *    offline, scoring is skipped entirely and the task stays
 *    genuinely unscored (aes_score/energy_level both null, same
 *    "scoring..." state TaskCard already shows for pending items).
 *    useRescoreOnReconnect picks these back up the moment connectivity
 *    returns.
 *
 * 2. A manual energy edit in Task Detail could be silently overwritten
 *    a few seconds later if the async AI score happened to resolve
 *    after the edit. Fixed by re-reading the task from the store right
 *    before applying the AI result, and skipping the patch entirely if
 *    energy_level is no longer null - i.e. someone already made a
 *    real choice, so the AI's guess is no longer relevant.
 */
export function createScoredTask({ userId, name, anchorId = null, routineId = null, forcedEnergyLevel = null }: CreateScoredTaskArgs): Task {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const task: Task = {
    id,
    user_id: userId,
    name,
    status: 'active',
    aes_score: null,
    energy_level: forcedEnergyLevel,
    anchor_id: anchorId,
    decay_started_at: null,
    completed_at: null,
    created_at: now,
    updated_at: now,
    routine_id: routineId,
  }

  const { addTask } = useTaskStore.getState()
  void addTask(task)

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    // Offline - leave unscored on purpose. useRescoreOnReconnect will
    // retry this once the connection comes back.
    return task
  }

  scoreSingleTask(id, name, forcedEnergyLevel)
  return task
}

/**
 * Exported separately so useRescoreOnReconnect can re-run scoring for
 * already-created tasks without duplicating this logic.
 */
export function scoreSingleTask(id: string, name: string, forcedEnergyLevel: EnergyLevel | null = null): void {
  const { updateTask, tasks } = useTaskStore.getState()
  void scoreTasksBatch([name])
    .then(([scored]) => {
      if (!scored) return
      const current = useTaskStore.getState().tasks.find((t) => t.id === id)
      if (!current) return // task was deleted while scoring was in flight
      const patch: Partial<Task> = { aes_score: scored.aes }
      // Only apply the AI's energy guess if nobody has set one manually
      // in the meantime (including a routine's own forced level).
      if (current.energy_level == null && forcedEnergyLevel == null) {
        patch.energy_level = aesToEnergy(scored.aes)
      }
      void updateTask(id, patch)
    })
    .catch((err) => {
      console.error('[createScoredTask] scoring failed, task stays unscored:', id, err?.message ?? err)
    })
}