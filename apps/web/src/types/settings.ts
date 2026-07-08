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
  updated_at: string
}