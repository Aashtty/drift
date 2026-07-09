// apps/web/src/lib/utils/elasticTimer.ts
export type TimerPhase = 'FOCUS' | 'FLOW'

export interface ElasticTimerState {
  startedAtMs: number
  elapsedSeconds: number
  phase: TimerPhase
  justPulsed: boolean
}

export function initialTimerState(): ElasticTimerState {
  return { startedAtMs: Date.now(), elapsedSeconds: 0, phase: 'FOCUS', justPulsed: false }
}

/**
 * Wall-clock based — recomputes elapsed from a fixed start timestamp
 * rather than accumulating +1 per tick. This makes the timer immune to
 * setInterval being throttled or suspended on backgrounded/inactive
 * tabs: whenever a tick DOES fire (even late, even just once after the
 * tab regains focus), elapsed jumps to the true real-world value instead
 * of having silently undercounted the whole time the tab was hidden.
 */
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