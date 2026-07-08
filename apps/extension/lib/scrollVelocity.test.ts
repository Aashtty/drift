// apps/extension/lib/scrollVelocity.test.ts
import { describe, it, expect } from 'vitest'
import { initialVelocityState, recordScrollSample, instantVelocity } from './scrollVelocity'

describe('instantVelocity', () => {
  it('returns Infinity with fewer than 2 samples (avoids false trigger on page load)', () => {
    expect(instantVelocity([{ scrollY: 0, timestampMs: 0 }])).toBe(Infinity)
  })

  it('computes px/min correctly for a simple 2-sample case', () => {
    const samples = [
      { scrollY: 0, timestampMs: 0 },
      { scrollY: 100, timestampMs: 60_000 }, // 100px over 1 minute
    ]
    expect(instantVelocity(samples)).toBe(100)
  })
})

describe('recordScrollSample', () => {
  it('does not intervene on a single fast scroll', () => {
    let state = initialVelocityState()
    const r1 = recordScrollSample(state, { scrollY: 0, timestampMs: 0 })
    state = r1.state
    const r2 = recordScrollSample(state, { scrollY: 5000, timestampMs: 1000 }) // huge fast scroll
    expect(r2.shouldIntervene).toBe(false)
  })

  it('intervenes after 8 continuous minutes below the velocity threshold', () => {
    let state = initialVelocityState()
    let result = recordScrollSample(state, { scrollY: 0, timestampMs: 0 })
    state = result.state

    // simulate slow scrolling: 20px per minute, sampled every minute, for 9 minutes
    for (let minute = 1; minute <= 9; minute++) {
      result = recordScrollSample(state, { scrollY: 20 * minute, timestampMs: minute * 60_000 })
      state = result.state
      if (minute < 8) {
        expect(result.shouldIntervene).toBe(false)
      }
    }
    expect(result.shouldIntervene).toBe(true)
  })

  it('resets the streak if the user scrolls fast partway through', () => {
    let state = initialVelocityState()
    let result = recordScrollSample(state, { scrollY: 0, timestampMs: 0 })
    state = result.state

    for (let minute = 1; minute <= 5; minute++) {
      result = recordScrollSample(state, { scrollY: 20 * minute, timestampMs: minute * 60_000 })
      state = result.state
    }
    // fast scroll at minute 6 — resets the streak
    result = recordScrollSample(state, { scrollY: 3000, timestampMs: 6 * 60_000 })
    state = result.state
    expect(result.shouldIntervene).toBe(false)

    // even continuing slow after this shouldn't trigger until a fresh 8 minutes pass
    for (let minute = 7; minute <= 13; minute++) {
      result = recordScrollSample(state, { scrollY: 3000 + 20 * (minute - 6), timestampMs: minute * 60_000 })
      state = result.state
      if (minute < 14) expect(result.shouldIntervene).toBe(false)
    }
  })

  it('never intervenes while scrolling faster than the threshold throughout', () => {
    let state = initialVelocityState()
    let result = recordScrollSample(state, { scrollY: 0, timestampMs: 0 })
    state = result.state
    for (let minute = 1; minute <= 10; minute++) {
      result = recordScrollSample(state, { scrollY: 1000 * minute, timestampMs: minute * 60_000 })
      state = result.state
      expect(result.shouldIntervene).toBe(false)
    }
  })
})