// apps/web/src/lib/utils/taskDecay.test.ts
import { describe, it, expect } from 'vitest'
import { decayLevel, decayOpacity, opacityForTask } from './taskDecay'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

describe('decayLevel', () => {
  it('is fresh for a task updated today', () => {
    expect(decayLevel(daysAgo(0))).toBe('fresh')
  })

  it('is fresh right up to (but not including) 3 days', () => {
    expect(decayLevel(daysAgo(2.9))).toBe('fresh')
  })

  it('is fading at exactly 3 days', () => {
    expect(decayLevel(daysAgo(3))).toBe('fading')
  })

  it('is fading right up to (but not including) 7 days', () => {
    expect(decayLevel(daysAgo(6.9))).toBe('fading')
  })

  it('is limbo at exactly 7 days', () => {
    expect(decayLevel(daysAgo(7))).toBe('limbo')
  })

  it('is limbo well past 7 days', () => {
    expect(decayLevel(daysAgo(30))).toBe('limbo')
  })
})

describe('decayOpacity', () => {
  it('maps fresh/fading/limbo to 1 / 0.6 / 0.3 exactly', () => {
    expect(decayOpacity('fresh')).toBe(1)
    expect(decayOpacity('fading')).toBe(0.6)
    expect(decayOpacity('limbo')).toBe(0.3)
  })
})

describe('opacityForTask', () => {
  it('combines both steps correctly for a 5-day-old task', () => {
    expect(opacityForTask(daysAgo(5))).toBe(0.6)
  })
})