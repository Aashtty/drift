// apps/web/src/lib/utils/elasticTimer.ts
export type TimerPhase = 'FOCUS' | 'FLOW'

export interface ElasticTimerState {
  startedAtMs: number
  elapsedSeconds: number
  phase: TimerPhase
  justPulsed: boolean
}

/**
 * `startedAtMs` defaults to "now" for a brand-new session, but can be
 * seeded with a past timestamp to recover an in-progress session after
 * a reload or crash — elapsedSeconds and phase are derived correctly
 * from that timestamp immediately on mount, no separate "catch-up" tick
 * required before the UI reads the right numbers.
 */
export function initialTimerState(
  startedAtMs: number = Date.now(),
  baseDurationSeconds: number = Infinity
): ElasticTimerState {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
  const phase: TimerPhase = elapsedSeconds >= baseDurationSeconds ? 'FLOW' : 'FOCUS'
  return { startedAtMs, elapsedSeconds, phase, justPulsed: false }
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

/**
 * Shifts startedAtMs forward by the given pause duration so the NEXT
 * tick() resumes computing elapsedSeconds continuously from where it
 * left off, instead of jumping forward by however long the pause
 * lasted. This is what makes pause/resume "real" — the elastic timer
 * genuinely stops counting rather than just hiding the running clock
 * behind a different button label.
 */
export function shiftStart(state: ElasticTimerState, byMs: number): ElasticTimerState {
  return { ...state, startedAtMs: state.startedAtMs + byMs }
}