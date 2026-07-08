// apps/web/src/lib/utils/stateColors.test.ts
import { describe, it, expect } from 'vitest'
import { STATE_COLORS } from './stateColors'

describe('STATE_COLORS', () => {
  it('defines all five app states', () => {
    expect(Object.keys(STATE_COLORS).sort()).toEqual(
      ['DRIFT', 'FLOW', 'FOCUS', 'IDLE', 'SHUTDOWN'].sort()
    )
  })

  it('matches the spec exactly for IDLE', () => {
    expect(STATE_COLORS.IDLE).toEqual({
      bg: '#0a0a1a',
      accent: '#6655CC',
      accentB: '#6655CC',
      textPrimary: '#c8c8e8',
    })
  })

  it('matches the spec exactly for FLOW (two-color accent)', () => {
    expect(STATE_COLORS.FLOW).toEqual({
      bg: '#06000f',
      accent: '#9f55ff',
      accentB: '#00e5cc',
      textPrimary: '#e0ccff',
    })
  })

  it('every state has a unique background color', () => {
    const bgs = Object.values(STATE_COLORS).map((s) => s.bg)
    expect(new Set(bgs).size).toBe(bgs.length)
  })
})