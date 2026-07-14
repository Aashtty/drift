// apps/web/src/lib/utils/sessionStateMachine.ts
import type { AppState } from '@/types/appState'

/**
 * The only moves DRIFT's real product flow is allowed to make.
 * (The Phase 0 dev-state-switcher intentionally bypasses this — it's a
 * debug tool, not part of the guarded flow.)
 *
 *   IDLE     -> FOCUS, SHUTDOWN
 *   FOCUS    -> FLOW, DRIFT, IDLE
 *   FLOW     -> DRIFT, IDLE
 *   DRIFT    -> IDLE, FOCUS      (back to dashboard, or straight into next task)
 *   SHUTDOWN -> IDLE             (ritual complete, new day)
 *
 * FOCUS/FLOW -> IDLE was missing until now. This is what "End Session"
 * (leaving a session without marking it done) actually needs — abandoning
 * a session is a real, legitimate move, and it was previously blocked by
 * the guard (isValidTransition returned false, so the store's transition()
 * silently warned and did nothing). The only reason that never visibly
 * broke anything is that Dashboard/Tasks/Replay/Settings each force an
 * UNGUARDED setState('IDLE') on their own mount as a safety net — which
 * masked the guard failing on every single "End Session" click. This
 * fixes it at the source: ending a session now transitions correctly on
 * its own, and the defensive resets on other pages become a true backstop
 * instead of doing the actual work.
 *
 * DRIFT -> FOCUS was already valid but nothing used it — see
 * drift-summary/page.tsx's new "start another task" action, which lets
 * you go straight from finishing one task into the next without a detour
 * through IDLE.
 */
export const VALID_TRANSITIONS: Record<AppState, AppState[]> = {
  IDLE: ['FOCUS', 'SHUTDOWN'],
  FOCUS: ['FLOW', 'DRIFT', 'IDLE'],
  FLOW: ['DRIFT', 'IDLE'],
  DRIFT: ['IDLE', 'FOCUS'],
  SHUTDOWN: ['IDLE'],
}

export function isValidTransition(from: AppState, to: AppState): boolean {
  if (from === to) return false
  return VALID_TRANSITIONS[from].includes(to)
}

export class InvalidTransitionError extends Error {
  constructor(from: AppState, to: AppState) {
    super(`Invalid state transition: ${from} -> ${to}`)
    this.name = 'InvalidTransitionError'
  }
}

/** Throws if the move isn't allowed; returns the new state otherwise. */
export function transition(from: AppState, to: AppState): AppState {
  if (!isValidTransition(from, to)) {
    throw new InvalidTransitionError(from, to)
  }
  return to
}

/** Canonical left-to-right ordering, used anywhere the 5 states need a
 *  consistent sequence (dev switcher, the new Focus Path widget). */
export const STATE_ORDER: AppState[] = ['IDLE', 'FOCUS', 'FLOW', 'DRIFT', 'SHUTDOWN']

export interface StateMeta {
  label: string
  /** What's true about this moment, in plain language. */
  description: string
  /** How you actually get here — shown on locked/unreachable nodes so
   *  the state graph explains itself instead of just looking greyed out
   *  for no stated reason. */
  howReached: string
  /** CSS var, not a raw hex — deliberately separate from stateColors.ts's
   *  STATE_COLORS, which holds the raw hex values `applyState()` writes
   *  onto :root for full-page theming. This is just UI copy metadata for
   *  describing states in already-themed contexts (e.g. this widget), so
   *  it references the same semantic vars EdgeArc already uses per state
   *  rather than hardcoding hex a second time in a second place.
   */
  colorVar: string
}

export const STATE_META: Record<AppState, StateMeta> = {
  IDLE: {
    label: 'Idle',
    description: 'Nothing in progress — the resting state.',
    howReached: 'Where every day starts, and where things return to by default.',
    colorVar: 'var(--text-tertiary)',
  },
  FOCUS: {
    label: 'Focus',
    description: 'A session is running.',
    howReached: 'Start a session from a task, or jump in untethered.',
    colorVar: 'var(--accent)',
  },
  FLOW: {
    label: 'Flow',
    description: "You've been at it a while.",
    howReached: 'Reached automatically once a Focus session passes your base session length — never triggered manually.',
    colorVar: 'var(--accent-b)',
  },
  DRIFT: {
    label: 'Drift',
    description: 'Catching your breath after finishing something.',
    howReached: 'Reached the moment you mark a task done — never triggered manually.',
    colorVar: 'var(--warning)',
  },
  SHUTDOWN: {
    label: 'Shutdown',
    description: 'Wrapping up the day.',
    howReached: 'Started from End Day.',
    colorVar: 'var(--success)',
  },
}

/** Which states can be reached directly from `state`, per the guard. */
export function nextStatesFrom(state: AppState): AppState[] {
  return VALID_TRANSITIONS[state]
}