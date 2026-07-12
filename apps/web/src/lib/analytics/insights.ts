// apps/web/src/lib/analytics/insights.ts
import type { WeekdayTotal, WindowComparison } from './sessionAnalytics'

interface GenerateInsightParams {
  weekdays: WeekdayTotal[]
  comparison: WindowComparison
  flowRate: number
  peakHours: { startHour: number; endHour: number }
}

/**
 * Turns the numbers Replay already computes into one plain-language
 * sentence. Deliberately picks ONE candidate rather than showing every
 * possible observation — a wall of auto-generated bullet points reads
 * as noise, one sentence reads as something worth actually noticing.
 * The pick is deterministic per calendar day (not random per render) so
 * it doesn't flicker to a different message on every reload/refetch.
 */
export function generateInsight({ weekdays, comparison, flowRate, peakHours }: GenerateInsightParams): string | null {
  const candidates: string[] = []

  const best = [...weekdays].sort((a, b) => b.totalMinutes - a.totalMinutes)[0]
  if (best && best.totalMinutes > 0) {
    candidates.push(`${best.label}s are your strongest day — that's where most of your focus time lands.`)
  }

  if (comparison.deltaPercent !== null) {
    if (comparison.deltaPercent >= 15) {
      candidates.push(`You've focused ${comparison.deltaPercent}% more this week than last — momentum's building.`)
    } else if (comparison.deltaPercent <= -15) {
      candidates.push(`Focus time dipped ${Math.abs(comparison.deltaPercent)}% from last week — no judgment, just noting it.`)
    }
  }

  if (flowRate >= 60) {
    candidates.push(`You're hitting flow in most sessions lately (${flowRate}%) — whatever you're doing, it's working.`)
  } else if (flowRate > 0 && flowRate <= 20) {
    candidates.push(`Flow's been rare this week (${flowRate}% of sessions) — might be worth protecting one with Lock In.`)
  }

  candidates.push(`You tend to do your best work between ${peakHours.startHour}:00 and ${peakHours.endHour + 1}:00.`)

  if (candidates.length === 0) return null
  const dayIndex = new Date().getDate() % candidates.length
  return candidates[dayIndex]
}