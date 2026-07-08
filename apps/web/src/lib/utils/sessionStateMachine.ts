// apps/web/src/lib/utils/sessionStateMachine.ts
import type { AppState } from '@/types/appState'

/**
 * The only moves DRIFT's real product flow is allowed to make.
 * (The Phase 0 dev-state-switcher intentionally bypasses this — it's a
 * debug tool, not part of the guarded flow.)
 *
 *   IDLE     -> FOCUS, SHUTDOWN
 *   FOCUS    -> FLOW, DRIFT
 *   FLOW     -> DRIFT
 *   DRIFT    -> IDLE, FOCUS      (back to dashboard, or straight into next task)
 *   SHUTDOWN -> IDLE             (ritual complete, new day)
 */
export const VALID_TRANSITIONS: Record<AppState, AppState[]> = {
  IDLE: ['FOCUS', 'SHUTDOWN'],
  FOCUS: ['FLOW', 'DRIFT'],
  FLOW: ['DRIFT'],
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