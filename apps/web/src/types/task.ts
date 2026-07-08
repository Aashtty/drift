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
}