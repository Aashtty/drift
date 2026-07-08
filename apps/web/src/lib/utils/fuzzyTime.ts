// apps/web/src/lib/utils/fuzzyTime.ts
/**
 * Buckets chosen so every example string in §4.4 lands exactly where the
 * spec implies: "early morning", "mid morning", "just after noon",
 * "late afternoon", "evening" — plus reasonable coverage for the rest
 * of the 24 hours.
 */
export function fuzzyTimeLabel(date: Date): string {
  const hour = date.getHours()

  if (hour >= 0 && hour < 5) return 'late night'
  if (hour >= 5 && hour < 9) return 'early morning'
  if (hour >= 9 && hour < 11) return 'mid morning'
  if (hour >= 11 && hour < 13) return 'just after noon'
  if (hour >= 13 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'late afternoon'
  if (hour >= 20 && hour < 23) return 'evening'
  return 'late night' // 23:00–23:59
}

export function exactTimeLabel(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}