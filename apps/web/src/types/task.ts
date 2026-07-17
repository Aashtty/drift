// apps/web/src/types/task.ts
export type TaskStatus = 'active' | 'done' | 'limbo' | 'archived'
export type EnergyLevel = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  user_id: string
  anchor_id: string | null
  name: string
  aes_score: number | null
  energy_level: EnergyLevel | null
  status: TaskStatus
  decay_started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  /**
   * Set when this task was auto-generated from a Routine (see
   * hooks/useRoutineEngine.ts). Deliberately optional rather than
   * required — making it required would mean every existing
   * Task-construction call site across the app (quick add on three
   * pages, the command palette, the brain-dump organizer, the shutdown
   * ritual's "add completed task") would need to be touched to add
   * `routine_id: null`, none of which actually need to know about
   * routines. Omitting it is equivalent to null both here and in
   * Postgres (the column defaults to NULL), so this stays a purely
   * additive, non-breaking change.
   */
  routine_id?: string | null
}