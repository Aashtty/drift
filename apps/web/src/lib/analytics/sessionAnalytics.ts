// apps/web/src/lib/analytics/sessionAnalytics.ts
import type { FocusSession } from '@/types/session'

export interface HeatmapCell {
  day: number
  hour: number
  depth: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

export function buildHeatmap(sessions: FocusSession[], today: Date = new Date()): HeatmapCell[] {
  const cells = new Map<string, HeatmapCell>()
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.set(`${day}-${hour}`, { day, hour, depth: 0 })
    }
  }
  const windowStart = new Date(today)
  windowStart.setHours(0, 0, 0, 0)
  windowStart.setTime(windowStart.getTime() - 6 * DAY_MS)

  for (const s of sessions) {
    const started = new Date(s.started_at)
    const dayIndex = Math.floor((started.getTime() - windowStart.getTime()) / DAY_MS)
    if (dayIndex < 0 || dayIndex > 6) continue
    const hour = started.getHours()
    const key = `${dayIndex}-${hour}`
    const cell = cells.get(key)
    if (cell) cell.depth += s.duration_seconds ?? 0
  }
  return Array.from(cells.values())
}

export function peakHoursWindow(cells: HeatmapCell[]): { startHour: number; endHour: number } {
  const hourTotals = new Array(24).fill(0)
  for (const cell of cells) hourTotals[cell.hour] += cell.depth
  let bestStart = 0
  let bestSum = -1
  for (let h = 0; h < 23; h++) {
    const sum = hourTotals[h] + hourTotals[h + 1]
    if (sum > bestSum) {
      bestSum = sum
      bestStart = h
    }
  }
  return { startHour: bestStart, endHour: bestStart + 1 }
}

export interface WeeklyAvg {
  weekIndex: number // 0 = 4 weeks ago ... 3 = this week
  avgMinutes: number
}

/** Average session length (in minutes) per week, over the last 4 weeks. */
export function weeklyAverageSessionLength(
  sessions: FocusSession[],
  today: Date = new Date()
): WeeklyAvg[] {
  const windowStart = new Date(today)
  windowStart.setHours(0, 0, 0, 0)
  windowStart.setTime(windowStart.getTime() - 4 * WEEK_MS)

  const buckets: { totalSeconds: number; count: number }[] = [
    { totalSeconds: 0, count: 0 },
    { totalSeconds: 0, count: 0 },
    { totalSeconds: 0, count: 0 },
    { totalSeconds: 0, count: 0 },
  ]

  for (const s of sessions) {
    const started = new Date(s.started_at).getTime()
    const weekIndex = Math.floor((started - windowStart.getTime()) / WEEK_MS)
    if (weekIndex < 0 || weekIndex > 3) continue
    buckets[weekIndex].totalSeconds += s.duration_seconds ?? 0
    buckets[weekIndex].count += 1
  }

  return buckets.map((b, i) => ({
    weekIndex: i,
    avgMinutes: b.count === 0 ? 0 : Math.round(b.totalSeconds / b.count / 60),
  }))
}