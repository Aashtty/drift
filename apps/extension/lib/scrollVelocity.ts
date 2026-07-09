// apps/extension/lib/scrollVelocity.ts
export interface ScrollSample {
  scrollY: number
  timestampMs: number
}

const VELOCITY_THRESHOLD_PX_PER_MIN = 3
const SUSTAINED_MS = 10 * 1000 // 8 minutes

export interface VelocityState {
  samples: ScrollSample[]
  slowScrollStartedAt: number | null
}

export function initialVelocityState(): VelocityState {
  return { samples: [], slowScrollStartedAt: null }
}

/** Instantaneous velocity (px/min) between the two most recent samples. */
export function instantVelocity(samples: ScrollSample[]): number {
  if (samples.length < 2) return Infinity // not enough data yet — don't false-trigger
  const a = samples[samples.length - 2]
  const b = samples[samples.length - 1]
  const dtMs = b.timestampMs - a.timestampMs
  if (dtMs <= 0) return Infinity
  const dyPx = Math.abs(b.scrollY - a.scrollY)
  return (dyPx / dtMs) * 60_000
}

/**
 * Pure state update — call on every scroll event (throttled by the caller).
 * Returns the new state plus whether this update should trigger the
 * intervention (crossed 8 continuous minutes of sub-threshold velocity).
 */
export function recordScrollSample(
  state: VelocityState,
  sample: ScrollSample
): { state: VelocityState; shouldIntervene: boolean } {
  const samples = [...state.samples, sample].slice(-2) // only need the last 2 for velocity
  const velocity = instantVelocity(samples)

  let slowScrollStartedAt = state.slowScrollStartedAt

  if (velocity < VELOCITY_THRESHOLD_PX_PER_MIN) {
    if (slowScrollStartedAt === null) {
      slowScrollStartedAt = sample.timestampMs
    }
  } else {
    slowScrollStartedAt = null // fast scroll or big jump resets the streak
  }

  const shouldIntervene =
    slowScrollStartedAt !== null && sample.timestampMs - slowScrollStartedAt >= SUSTAINED_MS

  return {
    state: { samples, slowScrollStartedAt },
    shouldIntervene,
  }
}