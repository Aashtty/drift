// apps/web/src/lib/utils/elasticTimer.test.ts
import { describe, it, expect } from 'vitest'
import { initialTimerState, tick, clearPulse } from './elasticTimer'

function runSeconds(n: number, baseDurationSeconds: number) {
  let state = initialTimerState()
  for (let i = 0; i < n; i++) {
    state = tick(state, baseDurationSeconds)
    if (state.justPulsed) state = { ...state, justPulsed: true } // preserve for inspection this tick only
    else state = clearPulse(state)
  }
  return state
}

describe('elasticTimer.tick', () => {
  const BASE = 1200 // 20 minutes in seconds

  it('starts in FOCUS phase', () => {
    expect(initialTimerState().phase).toBe('FOCUS')
  })

  it('stays in FOCUS for every second before the base duration', () => {
    let state = initialTimerState()
    for (let i = 0; i < BASE - 1; i++) {
      state = tick(state, BASE)
      expect(state.phase).toBe('FOCUS')
    }
  })

  it('transitions to FLOW at exactly the configured base duration, not before', () => {
    let state = initialTimerState()
    for (let i = 0; i < BASE - 1; i++) {
      state = tick(state, BASE)
    }
    expect(state.phase).toBe('FOCUS')
    expect(state.elapsedSeconds).toBe(BASE - 1)

    state = tick(state, BASE) // the BASE-th tick
    expect(state.phase).toBe('FLOW')
    expect(state.elapsedSeconds).toBe(BASE)
    expect(state.justPulsed).toBe(true)
  })

  it('does not re-pulse on subsequent ticks once in FLOW', () => {
    let state = initialTimerState()
    for (let i = 0; i < BASE; i++) state = tick(state, BASE)
    expect(state.justPulsed).toBe(true)

    state = clearPulse(state)
    state = tick(state, BASE)
    expect(state.phase).toBe('FLOW')
    expect(state.justPulsed).toBe(false)
  })

  it('elapsedSeconds increments by exactly 1 per tick, indefinitely', () => {
    let state = initialTimerState()
    for (let i = 1; i <= 2000; i++) {
      state = tick(state, BASE)
      expect(state.elapsedSeconds).toBe(i)
    }
  })
})