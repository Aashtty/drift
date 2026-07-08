// apps/web/src/lib/utils/elasticTimer.ts
export type TimerPhase = 'FOCUS' | 'FLOW'

export interface ElasticTimerState {
  elapsedSeconds: number
  phase: TimerPhase
  justPulsed: boolean
}

export function initialTimerState(): ElasticTimerState {
  return { elapsedSeconds: 0, phase: 'FOCUS', justPulsed: false }
}

/**
 * Pure state transition — advances the timer by exactly 1 second.
 * Deterministic and side-effect-free so it can be unit tested without
 * fake timers or real clock waits. The hook below drives this with a
 * real 1s interval; tests drive it by calling `tick` in a loop.
 */
export function tick(state: ElasticTimerState, baseDurationSeconds: number): ElasticTimerState {
  const elapsedSeconds = state.elapsedSeconds + 1
  const crossingIntoFlow = state.phase === 'FOCUS' && elapsedSeconds >= baseDurationSeconds

  return {
    elapsedSeconds,
    phase: crossingIntoFlow ? 'FLOW' : state.phase,
    justPulsed: crossingIntoFlow,
  }
}

/** Clears the one-shot justPulsed flag after the UI has consumed it. */
export function clearPulse(state: ElasticTimerState): ElasticTimerState {
  return { ...state, justPulsed: false }
}