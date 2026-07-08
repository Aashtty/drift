// apps/web/src/lib/analytics/sessionAnalytics.test.ts
import { describe, it, expect } from 'vitest'
import { buildHeatmap, peakHoursWindow, weeklyAverageSessionLength } from './sessionAnalytics'
import type { FocusSession } from '@/types/session'

const TODAY = new Date('2026-07-15T12:00:00Z')

function fakeSession(startedAt: string, durationSeconds: number): FocusSession {
  return {
    id: crypto.randomUUID(), user_id: 'u1', task_id: null, started_at: startedAt,
    ended_at: null, duration_seconds: durationSeconds, base_duration_seconds: 1200,
    exceeded_base: false, flow_detected: false, hyperfocus: false,
    state_at_end: 'FOCUS', created_at: startedAt,
  }
}

describe('buildHeatmap', () => {
  it('produces exactly 168 cells', () => {
    expect(buildHeatmap([], TODAY)).toHaveLength(168)
  })
  it('sums multiple sessions in the same cell', () => {
    const cells = buildHeatmap(
      [fakeSession('2026-07-15T14:10:00Z', 600), fakeSession('2026-07-15T14:40:00Z', 600)],
      TODAY
    )
    expect(cells.find((c) => c.day === 6 && c.hour === 14)?.depth).toBe(1200)
  })
})

describe('peakHoursWindow', () => {
  it('identifies the correct 2-hour peak window', () => {
    const cells = buildHeatmap(
      [fakeSession('2026-07-14T09:10:00Z', 1200), fakeSession('2026-07-14T10:10:00Z', 1200)],
      TODAY
    )
    expect(peakHoursWindow(cells)).toEqual({ startHour: 9, endHour: 10 })
  })
})

describe('weeklyAverageSessionLength', () => {
  it('returns 4 weeks, all zero with no sessions', () => {
    const weeks = weeklyAverageSessionLength([], TODAY)
    expect(weeks).toHaveLength(4)
    expect(weeks.every((w) => w.avgMinutes === 0)).toBe(true)
  })

  it('computes the correct average for a known this-week fixture', () => {
    const sessions = [
      fakeSession('2026-07-15T09:00:00Z', 1200), // 20 min
      fakeSession('2026-07-15T11:00:00Z', 1800), // 30 min
    ]
    const weeks = weeklyAverageSessionLength(sessions, TODAY)
    expect(weeks[3].avgMinutes).toBe(25) // (20+30)/2
  })

  it('excludes sessions older than 4 weeks', () => {
    const sessions = [fakeSession('2026-01-01T09:00:00Z', 1200)]
    const weeks = weeklyAverageSessionLength(sessions, TODAY)
    expect(weeks.every((w) => w.avgMinutes === 0)).toBe(true)
  })

  it('buckets a session from exactly 2 weeks ago into weekIndex 2, not 3', () => {
    const twoWeeksAgo = new Date(TODAY)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const sessions = [fakeSession(twoWeeksAgo.toISOString(), 600)]
    const weeks = weeklyAverageSessionLength(sessions, TODAY)
    expect(weeks[2].avgMinutes).toBeGreaterThan(0)
    expect(weeks[3].avgMinutes).toBe(0)
  })
})