// apps/web/src/types/settings.ts
import type { EnergyLevel } from './task'

export interface UserSettings {
  user_id: string
  day_start: string
  day_end: string
  base_session_minutes: number
  shutdown_time: string | null
  energy_default: EnergyLevel
  sound_enabled: boolean
  sound_volume: number
  fuzzy_time: boolean
  distraction_sites: string[]
  ambient_transition_seconds: number
  /** New - how many days of inactivity before a task quietly moves to
   *  Limbo. Previously hardcoded to 7 everywhere. */
  limbo_decay_days: number
  updated_at: string
}