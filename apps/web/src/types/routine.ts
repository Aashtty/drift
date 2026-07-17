// apps/web/src/types/routine.ts
import type { EnergyLevel } from './task'

export type RoutineCadence = 'daily' | 'weekly' | 'monthly'

export interface Routine {
  id: string
  user_id: string
  name: string
  cadence: RoutineCadence
  /** 0=Sun..6=Sat — only meaningful (and only enforced) for 'weekly'. */
  weekdays: number[]
  /** 1-31 — only meaningful for 'monthly'. */
  day_of_month: number | null
  anchor_id: string | null
  energy_level: EnergyLevel | null
  active: boolean
  /** 'YYYY-MM-DD', local date — stamped by the engine after generating
   *  today's task instance, so it doesn't generate a second one on a
   *  same-day remount. */
  last_generated_date: string | null
  created_at: string
  updated_at: string
}