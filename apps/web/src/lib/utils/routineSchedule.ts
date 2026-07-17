// apps/web/src/lib/utils/routineSchedule.ts
import type { Routine } from '@/types/routine'

export function todayDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Pure schedule check — cadence + active only, no memory of what's
 * already been generated. That bookkeeping lives entirely in
 * useRoutineEngine now, which is what makes toggling off then back on
 * actually bring a deleted task back: this function alone can't
 * distinguish "already did this today" from "haven't yet."
 */
export function isDueToday(routine: Routine, date: Date = new Date()): boolean {
  if (!routine.active) return false
  if (routine.cadence === 'daily') return true
  if (routine.cadence === 'weekly') return routine.weekdays.includes(date.getDay())
  if (routine.cadence === 'monthly') return routine.day_of_month === date.getDate()
  return false
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ordinalSuffix(n: number): string {
  const j = n % 10
  const k = n % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

export function cadenceLabel(routine: Routine): string {
  if (routine.cadence === 'daily') return 'Every day'
  if (routine.cadence === 'weekly') {
    if (routine.weekdays.length === 0) return 'Weekly'
    return routine.weekdays.slice().sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join(', ')
  }
  const day = routine.day_of_month ?? 1
  return `Monthly on the ${day}${ordinalSuffix(day)}`
}