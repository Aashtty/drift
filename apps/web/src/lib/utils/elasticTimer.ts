// apps/web/src/lib/utils/elasticTimer.ts
export type TimerPhase = 'FOCUS' | 'FLOW'

export interface ElasticTimerState {
  startedAtMs: number
  elapsedSeconds: number
  phase: TimerPhase
  justPulsed: boolean
}

/**
 * `freezeAtMs`, when given, computes elapsed against that timestamp
 * instead of Date.now() - this is what lets a recovered, still-paused
 * session render its FROZEN elapsed time on first paint instead of
 * silently recomputing as if it had been running the whole time it was
 * away. See useElasticTimer's initialPausedAtMs.
 */
export function initialTimerState(
  startedAtMs: number = Date.now(),
  baseDurationSeconds: number = Infinity,
  freezeAtMs?: number
): ElasticTimerState {
  const referenceMs = freezeAtMs ?? Date.now()
  const elapsedSeconds = Math.max(0, Math.floor((referenceMs - startedAtMs) / 1000))
  const phase: TimerPhase = elapsedSeconds >= baseDurationSeconds ? 'FLOW' : 'FOCUS'
  return { startedAtMs, elapsedSeconds, phase, justPulsed: false }
}

export function tick(state: ElasticTimerState, baseDurationSeconds: number): ElasticTimerState {
  const elapsedSeconds = Math.floor((Date.now() - state.startedAtMs) / 1000)
  const crossingIntoFlow = state.phase === 'FOCUS' && elapsedSeconds >= baseDurationSeconds

  return {
    ...state,
    elapsedSeconds,
    phase: crossingIntoFlow ? 'FLOW' : state.phase,
    justPulsed: crossingIntoFlow,
  }
}

export function clearPulse(state: ElasticTimerState): ElasticTimerState {
  return { ...state, justPulsed: false }
}

export function shiftStart(state: ElasticTimerState, byMs: number): ElasticTimerState {
  return { ...state, startedAtMs: state.startedAtMs + byMs }
}