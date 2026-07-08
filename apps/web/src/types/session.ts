// apps/web/src/types/session.ts
export type SessionEndState = 'FOCUS' | 'FLOW' | 'DRIFT'

export interface FocusSession {
  id: string
  user_id: string
  task_id: string | null
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  base_duration_seconds: number | null
  exceeded_base: boolean
  flow_detected: boolean
  hyperfocus: boolean
  state_at_end: SessionEndState | null
  created_at: string
}