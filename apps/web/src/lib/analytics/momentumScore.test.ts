// apps/web/src/lib/analytics/momentumScore.test.ts
import { describe, it, expect } from 'vitest'
import { dayScore, calculateMomentum, momentumTrend, type DayActivity } from './momentumScore'

const TODAY = new Date('2026-07-15T12:00:00Z')

function daysAgoDate(n: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

describe('dayScore', () => {
  it('computes sessions*20 + tasks*10', () => {
    expect(dayScore({ date: '', sessionsCompleted: 2, tasksDone: 3 })).toBe(70)
  })

  it('caps at 100 even with a huge day', () => {
    expect(dayScore({ date: '', sessionsCompleted: 10, tasksDone: 10 })).toBe(100)
  })

  it('returns 0 for a fully empty day', () => {
    expect(dayScore({ date: '', sessionsCompleted: 0, tasksDone: 0 })).toBe(0)
  })
})

describe('calculateMomentum', () => {
  it('returns 0 with no activity at all', () => {
    expect(calculateMomentum([], TODAY)).toBe(0)
  })

  it('weights a perfect recent 3-day streak higher than an equally perfect distant one', () => {
    const recentPerfect: DayActivity[] = [1, 2, 3].map((n) => ({
      date: daysAgoDate(n), sessionsCompleted: 3, tasksDone: 5,
    }))
    const distantPerfect: DayActivity[] = [12, 13, 14].map((n) => ({
      date: daysAgoDate(n), sessionsCompleted: 3, tasksDone: 5,
    }))
    const recentScore = calculateMomentum(recentPerfect, TODAY)
    const distantScore = calculateMomentum(distantPerfect, TODAY)
    expect(recentScore).toBeGreaterThan(distantScore)
  })

  it('matches a hand-calculated value for a known fixture', () => {
    // 3 days at weight 3 scoring 100 each = 900
    // 4 days (4-7) at weight 2 scoring 50 each = 400
    // 7 days (8-14) at weight 1 scoring 0 each = 0
    // weightedSum = 1300, weightTotal = (3*3)+(4*2)+(7*1) = 9+8+7 = 24
    // 1300/24 = 54.166... -> rounds to 54
    const activities: DayActivity[] = [
      ...[1, 2, 3].map((n) => ({ date: daysAgoDate(n), sessionsCompleted: 5, tasksDone: 0 })), // 100 each
      ...[4, 5, 6, 7].map((n) => ({ date: daysAgoDate(n), sessionsCompleted: 0, tasksDone: 5 })), // 50 each
    ]
    expect(calculateMomentum(activities, TODAY)).toBe(54)
  })

  it('treats days with no logged activity as a score of 0, not excluded from the weighted denominator', () => {
    const onlyOneGreatDay: DayActivity[] = [{ date: daysAgoDate(1), sessionsCompleted: 5, tasksDone: 5 }]
    const score = calculateMomentum(onlyOneGreatDay, TODAY)
    // weightedSum = 100*3 = 300, weightTotal = 24 (full 14-day denominator still applies)
    expect(score).toBe(Math.round(300 / 24))
  })

  it('never returns a value above 100', () => {
    const allMax: DayActivity[] = Array.from({ length: 14 }, (_, i) => ({
      date: daysAgoDate(i + 1), sessionsCompleted: 10, tasksDone: 10,
    }))
    expect(calculateMomentum(allMax, TODAY)).toBeLessThanOrEqual(100)
  })
})

describe('momentumTrend', () => {
  it('reports "up" when this window beats the prior window', () => {
    const activities: DayActivity[] = [1, 2, 3].map((n) => ({
      date: daysAgoDate(n), sessionsCompleted: 5, tasksDone: 5,
    }))
    expect(momentumTrend(activities, TODAY)).toBe('up')
  })

  it('reports "flat" with identical (zero) activity in both windows', () => {
    expect(momentumTrend([], TODAY)).toBe('flat')
  })
})