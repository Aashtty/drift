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
  weekIndex: number
  avgMinutes: number
}

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

export interface SessionSummary {
  totalFocusedMinutes: number
  sessionCount: number
  flowRate: number
  avgSessionMinutes: number
  hyperfocusCount: number
}

export function summarizeSessions(sessions: FocusSession[]): SessionSummary {
  const totalSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  const flowCount = sessions.filter((s) => s.flow_detected).length
  const hyperfocusCount = sessions.filter((s) => s.hyperfocus).length
  return {
    totalFocusedMinutes: Math.round(totalSeconds / 60),
    sessionCount: sessions.length,
    flowRate: sessions.length === 0 ? 0 : Math.round((flowCount / sessions.length) * 100),
    avgSessionMinutes: sessions.length === 0 ? 0 : Math.round(totalSeconds / sessions.length / 60),
    hyperfocusCount,
  }
}

export interface WeekdayTotal {
  weekday: number
  label: string
  totalMinutes: number
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function weekdayTotals(sessions: FocusSession[]): WeekdayTotal[] {
  const totals = new Array(7).fill(0)
  for (const s of sessions) {
    const d = new Date(s.started_at)
    totals[d.getDay()] += s.duration_seconds ?? 0
  }
  return totals.map((secs, i) => ({
    weekday: i,
    label: WEEKDAY_LABELS[i],
    totalMinutes: Math.round(secs / 60),
  }))
}

export function activeDaysInWindow(
  sessions: FocusSession[],
  windowDays = 7,
  today: Date = new Date()
): number {
  const cutoff = new Date(today)
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - (windowDays - 1))

  const activeDates = new Set<string>()
  for (const s of sessions) {
    const d = new Date(s.started_at)
    if (d.getTime() < cutoff.getTime()) continue
    activeDates.add(d.toISOString().slice(0, 10))
  }
  return activeDates.size
}

export interface WindowComparison {
  currentMinutes: number
  previousMinutes: number
  deltaPercent: number | null
  currentSessions: number
  previousSessions: number
}

export function compareWeekWindows(sessions: FocusSession[], today: Date = new Date()): WindowComparison {
  const currentStart = new Date(today)
  currentStart.setHours(0, 0, 0, 0)
  currentStart.setDate(currentStart.getDate() - 6)

  const previousStart = new Date(currentStart)
  previousStart.setDate(previousStart.getDate() - 7)
  const previousEnd = new Date(currentStart)

  let currentMinutes = 0
  let previousMinutes = 0
  let currentSessions = 0
  let previousSessions = 0

  for (const s of sessions) {
    const started = new Date(s.started_at)
    const mins = (s.duration_seconds ?? 0) / 60
    if (started >= currentStart) {
      currentMinutes += mins
      currentSessions += 1
    } else if (started >= previousStart && started < previousEnd) {
      previousMinutes += mins
      previousSessions += 1
    }
  }

  const deltaPercent =
    previousMinutes === 0 ? null : Math.round(((currentMinutes - previousMinutes) / previousMinutes) * 100)

  return {
    currentMinutes: Math.round(currentMinutes),
    previousMinutes: Math.round(previousMinutes),
    deltaPercent,
    currentSessions,
    previousSessions,
  }
}

export interface TopTask {
  taskId: string
  totalMinutes: number
}

export function topTasksByFocusTime(sessions: FocusSession[], limit = 5): TopTask[] {
  const totals = new Map<string, number>()
  for (const s of sessions) {
    if (!s.task_id) continue
    totals.set(s.task_id, (totals.get(s.task_id) ?? 0) + (s.duration_seconds ?? 0))
  }
  return Array.from(totals.entries())
    .map(([taskId, secs]) => ({ taskId, totalMinutes: Math.round(secs / 60) }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, limit)
}

export interface HyperfocusStats {
  count: number
  totalMinutes: number
  longestMinutes: number
}

export function hyperfocusStats(sessions: FocusSession[]): HyperfocusStats {
  const hf = sessions.filter((s) => s.hyperfocus)
  const totalSeconds = hf.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  const longestSeconds = hf.reduce((max, s) => Math.max(max, s.duration_seconds ?? 0), 0)
  return {
    count: hf.length,
    totalMinutes: Math.round(totalSeconds / 60),
    longestMinutes: Math.round(longestSeconds / 60),
  }
}

export interface AnchorTime {
  anchorId: string
  totalMinutes: number
}

export function anchorTimeBreakdown(
  sessions: FocusSession[],
  anchorIdForTask: (taskId: string) => string | null,
  limit = 6
): AnchorTime[] {
  const totals = new Map<string, number>()
  for (const s of sessions) {
    if (!s.task_id) continue
    const anchorId = anchorIdForTask(s.task_id)
    if (!anchorId) continue
    totals.set(anchorId, (totals.get(anchorId) ?? 0) + (s.duration_seconds ?? 0))
  }
  return Array.from(totals.entries())
    .map(([anchorId, secs]) => ({ anchorId, totalMinutes: Math.round(secs / 60) }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, limit)
}

export interface PeriodHighlights {
  longestSessionMinutes: number
  longestSessionTaskId: string | null
  bestDay: { date: string; totalMinutes: number } | null
  activeDays: number
}

export function periodHighlights(sessions: FocusSession[]): PeriodHighlights {
  let longestSessionMinutes = 0
  let longestSessionTaskId: string | null = null
  const dayTotals = new Map<string, number>()
  const activeDates = new Set<string>()

  for (const s of sessions) {
    const secs = s.duration_seconds ?? 0
    const mins = Math.round(secs / 60)
    if (mins > longestSessionMinutes) {
      longestSessionMinutes = mins
      longestSessionTaskId = s.task_id
    }
    const dateKey = s.started_at.slice(0, 10)
    dayTotals.set(dateKey, (dayTotals.get(dateKey) ?? 0) + secs)
    activeDates.add(dateKey)
  }

  let bestDay: { date: string; totalMinutes: number } | null = null
  for (const [date, secs] of dayTotals.entries()) {
    const totalMinutes = Math.round(secs / 60)
    if (!bestDay || totalMinutes > bestDay.totalMinutes) bestDay = { date, totalMinutes }
  }

  return { longestSessionMinutes, longestSessionTaskId, bestDay, activeDays: activeDates.size }
}

export interface DaySummary {
  totalMinutes: number
  sessionCount: number
  flowRate: number
  hyperfocusMinutes: number
}

/**
 * New — Replay previously had no view of "just today" at all; every
 * stat was either a rolling 7-day window or a range-selected multi-day
 * total. This isolates a single calendar day for the new TODAY section.
 */
export function summarizeDay(sessions: FocusSession[], date: Date = new Date()): DaySummary {
  const dateStr = date.toDateString()
  const daySessions = sessions.filter((s) => new Date(s.started_at).toDateString() === dateStr)
  const totalSeconds = daySessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  const flowCount = daySessions.filter((s) => s.flow_detected).length
  const hyperfocusSeconds = daySessions.filter((s) => s.hyperfocus).reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  return {
    totalMinutes: Math.round(totalSeconds / 60),
    sessionCount: daySessions.length,
    flowRate: daySessions.length === 0 ? 0 : Math.round((flowCount / daySessions.length) * 100),
    hyperfocusMinutes: Math.round(hyperfocusSeconds / 60),
  }
}