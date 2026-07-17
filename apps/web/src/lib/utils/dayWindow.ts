// apps/web/src/lib/utils/dayWindow.ts
/**
 * Shared day-window math - EdgeArc's progress bar and event-tick
 * placement both use this.
 *
 * The bug this fixes: day_end can be on the calendar NEXT day relative
 * to day_start (e.g. start 10:00, end 00:30) - completely normal for
 * anyone who works or focuses late. The previous implementation did
 * `total = endMinutes - startMinutes` directly on two 0-1439 values
 * with no wraparound handling, so an overnight range produced a
 * negative total and the whole arc rendered as permanently empty for
 * the entire day, every day.
 *
 * Design choice (documented so it's easy to revisit): the "gap" between
 * an overnight window's end and its next start (e.g. 00:30-10:00) is
 * treated as EMPTY, matching the existing "before day_start -> empty"
 * convention already used for same-day windows - not "full," which
 * would change behavior nobody asked about for the far more common
 * same-day case if the two were unified under one formula. Only the
 * overnight case gets new logic; same-day windows compute identically
 * to before.
 */

export interface DayWindow {
  startMinutes: number
  /** Raw 0-1439 end-of-day minute, NOT extended past 1440 even when overnight. */
  endMinutesRaw: number
  overnight: boolean
  totalMinutes: number
}

export function parseHHMM(value: string, fallbackMinutes: number): number {
  const parts = value.split(':')
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallbackMinutes
  return h * 60 + m
}

export function getDayWindow(dayStart: string, dayEnd: string): DayWindow {
  const startMinutes = parseHHMM(dayStart, 9 * 60)
  const endMinutesRaw = parseHHMM(dayEnd, 19 * 60)
  const overnight = endMinutesRaw <= startMinutes
  const totalMinutes = overnight ? endMinutesRaw + 1440 - startMinutes : endMinutesRaw - startMinutes
  return { startMinutes, endMinutesRaw, overnight, totalMinutes }
}

/**
 * Fraction (0-1) of the way `atMinutes` is through the window.
 * Returns null when `atMinutes` falls outside it entirely - callers
 * (event ticks) use null to mean "don't render this."
 */
export function dayWindowPosition(window: DayWindow, atMinutes: number): number | null {
  const { startMinutes, endMinutesRaw, overnight, totalMinutes } = window
  if (totalMinutes <= 0) return null

  if (!overnight) {
    if (atMinutes < startMinutes || atMinutes > endMinutesRaw) return null
    return (atMinutes - startMinutes) / totalMinutes
  }

  if (atMinutes >= startMinutes) {
    // Today, after start, before midnight - window that started today.
    return (atMinutes - startMinutes) / totalMinutes
  }
  if (atMinutes < endMinutesRaw) {
    // After midnight, still inside the window that started yesterday -
    // project forward a day so it lines up on the same numberline.
    return (atMinutes + 1440 - startMinutes) / totalMinutes
  }
  // Gap between yesterday's end and today's start.
  return null
}

/**
 * Progress-bar version - always returns a clamped 0-1 number,
 * reproducing the ORIGINAL same-day clamp behavior exactly (before
 * start -> 0, after end -> 1, growing in between), and extending it
 * sensibly to overnight windows (grows continuously through midnight,
 * reaches 1 exactly at day_end, drops to 0 for the gap until the next
 * day_start).
 */
export function currentDayProgress(dayStart: string, dayEnd: string, now: Date = new Date()): number {
  const window = getDayWindow(dayStart, dayEnd)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const position = dayWindowPosition(window, nowMinutes)
  if (position == null) {
    if (!window.overnight && nowMinutes > window.endMinutesRaw) return 1
    return 0
  }
  return Math.min(1, Math.max(0, position))
}