// apps/web/src/lib/analytics/momentumScore.ts
export interface DayActivity {
  /** ISO date string, "YYYY-MM-DD", most recent last is NOT required — order-independent. */
  date: string
  sessionsCompleted: number
  tasksDone: number
}

export function dayScore(activity: DayActivity): number {
  const raw = activity.sessionsCompleted * 20 + activity.tasksDone * 10
  return Math.min(100, raw)
}

/** Days 1–3 ago (most recent) get weight 3, days 4–7 weight 2, days 8–14 weight 1. */
function weightForDaysAgo(daysAgo: number): number {
  if (daysAgo <= 3) return 3
  if (daysAgo <= 7) return 2
  if (daysAgo <= 14) return 1
  return 0
}

/**
 * `today` defaults to real "now" but is injectable for deterministic tests.
 * `activities` need not be sorted or contiguous — missing days are simply
 * treated as 0 activity (weight still applies, day score 0).
 */
export function calculateMomentum(activities: DayActivity[], today: Date = new Date()): number {
  const byDate = new Map(activities.map((a) => [a.date, a]))

  let weightedSum = 0
  let weightTotal = 0

  for (let daysAgo = 1; daysAgo <= 14; daysAgo++) {
    const d = new Date(today)
    d.setDate(d.getDate() - daysAgo)
    const key = d.toISOString().slice(0, 10)

    const weight = weightForDaysAgo(daysAgo)
    const activity = byDate.get(key)
    const score = activity ? dayScore(activity) : 0

    weightedSum += score * weight
    weightTotal += weight
  }

  if (weightTotal === 0) return 0
  return Math.round(weightedSum / weightTotal)
}

export type MomentumTrend = 'up' | 'down' | 'flat'

/** Compares this 14-day momentum to the PRIOR 14-day window (days 15–28 ago) to derive a trend arrow. */
export function momentumTrend(
  activities: DayActivity[],
  today: Date = new Date()
): MomentumTrend {
  const current = calculateMomentum(activities, today)

  const priorWindowStart = new Date(today)
  priorWindowStart.setDate(priorWindowStart.getDate() - 14)
  const prior = calculateMomentum(activities, priorWindowStart)

  if (current > prior) return 'up'
  if (current < prior) return 'down'
  return 'flat'
}