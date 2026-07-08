// apps/web/src/lib/utils/taskDecay.ts
export type DecayLevel = 'fresh' | 'fading' | 'limbo'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function daysSince(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate).getTime()
  return (now.getTime() - then) / MS_PER_DAY
}

export function decayLevel(updatedAt: string, now: Date = new Date()): DecayLevel {
  const days = daysSince(updatedAt, now)
  if (days >= 7) return 'limbo'
  if (days >= 3) return 'fading'
  return 'fresh'
}

export function decayOpacity(level: DecayLevel): number {
  switch (level) {
    case 'fresh':
      return 1
    case 'fading':
      return 0.6
    case 'limbo':
      return 0.3
  }
}

export function opacityForTask(updatedAt: string, now: Date = new Date()): number {
  return decayOpacity(decayLevel(updatedAt, now))
}