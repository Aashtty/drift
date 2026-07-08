// apps/web/src/lib/utils/sessionStateMachine.test.ts
import { describe, it, expect } from 'vitest'
import { isValidTransition, transition, InvalidTransitionError } from './sessionStateMachine'
import type { AppState } from '@/types/appState'

const ALL_STATES: AppState[] = ['IDLE', 'FOCUS', 'FLOW', 'DRIFT', 'SHUTDOWN']

describe('session state machine — valid transitions', () => {
  const validCases: [AppState, AppState][] = [
    ['IDLE', 'FOCUS'],
    ['IDLE', 'SHUTDOWN'],
    ['FOCUS', 'FLOW'],
    ['FOCUS', 'DRIFT'],
    ['FLOW', 'DRIFT'],
    ['DRIFT', 'IDLE'],
    ['DRIFT', 'FOCUS'],
    ['SHUTDOWN', 'IDLE'],
  ]

  it.each(validCases)('allows %s -> %s', (from, to) => {
    expect(isValidTransition(from, to)).toBe(true)
    expect(transition(from, to)).toBe(to)
  })
})

describe('session state machine — invalid transitions', () => {
  it('rejects every (from, to) pair not explicitly listed as valid, including no-ops', () => {
    const validSet = new Set([
      'IDLE->FOCUS', 'IDLE->SHUTDOWN',
      'FOCUS->FLOW', 'FOCUS->DRIFT',
      'FLOW->DRIFT',
      'DRIFT->IDLE', 'DRIFT->FOCUS',
      'SHUTDOWN->IDLE',
    ])

    for (const from of ALL_STATES) {
      for (const to of ALL_STATES) {
        const key = `${from}->${to}`
        const shouldBeValid = validSet.has(key)
        expect(isValidTransition(from, to)).toBe(shouldBeValid)
      }
    }
  })

  it('throws InvalidTransitionError for a known-bad jump (IDLE -> FLOW)', () => {
    expect(() => transition('IDLE', 'FLOW')).toThrow(InvalidTransitionError)
  })

  it('throws for going backward (FLOW -> FOCUS)', () => {
    expect(() => transition('FLOW', 'FOCUS')).toThrow(InvalidTransitionError)
  })

  it('throws for a same-state no-op transition', () => {
    expect(() => transition('FOCUS', 'FOCUS')).toThrow(InvalidTransitionError)
  })
})