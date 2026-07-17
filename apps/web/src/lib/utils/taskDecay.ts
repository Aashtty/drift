// apps/web/src/lib/utils/taskDecay.ts
export type DecayLevel = 'fresh' | 'fading' | 'limbo'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function daysSince(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate).getTime()
  return (now.getTime() - then) / MS_PER_DAY
}

/** `limboDays` is user-configurable now (Settings > Tasks & Limbo);
 *  "fading" - the amber warning dot - starts halfway there, scaling
 *  with whatever the person has set instead of a fixed 3-day mark. */
export function decayLevel(updatedAt: string, now: Date = new Date(), limboDays: number = 7): DecayLevel {
  const days = daysSince(updatedAt, now)
  const fadingDays = Math.max(1, Math.floor(limboDays / 2))
  if (days >= limboDays) return 'limbo'
  if (days >= fadingDays) return 'fading'
  return 'fresh'
}

export function decayOpacity(level: DecayLevel): number {
  switch (level) {
    case 'fresh': return 1
    case 'fading': return 0.6
    case 'limbo': return 0.3
  }
}

export function opacityForTask(updatedAt: string, now: Date = new Date(), limboDays: number = 7): number {
  return decayOpacity(decayLevel(updatedAt, now, limboDays))
}