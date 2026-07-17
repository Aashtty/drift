// apps/web/src/lib/utils/dayEndSnooze.ts
/**
 * Shared snooze/suppress state for the day-end prompt - both its own
 * "remind me in Nm" buttons and shutdown/page.tsx (on a successful
 * ritual completion) write to the same key.
 */
const SNOOZE_KEY = 'drift:dayend-snoozed-until'

export function isDayEndSnoozed(): boolean {
  const until = Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0)
  return Date.now() < until
}

export function snoozeDayEndForMinutes(minutes: number): void {
  window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + minutes * 60_000))
}

/**
 * Called once the Shutdown Ritual actually finishes. This is the real
 * fix for "the prompt pops up again right after I complete it" -
 * previously nothing ever recorded that the ritual had been done; the
 * prompt's check was purely time-based, so the very next 30s poll
 * would show it again regardless. An 18h snooze reuses the exact same
 * suppression mechanism as the manual snooze buttons rather than
 * adding a second, separate "already completed today" flag - simpler,
 * and it self-resets correctly in time for the next real day-end
 * cycle no matter how day_start/day_end are configured.
 */
export function markDayEndRitualCompleted(): void {
  snoozeDayEndForMinutes(18 * 60)
}