// apps/web/src/lib/utils/fuzzyTime.test.ts
import { describe, it, expect } from 'vitest'
import { fuzzyTimeLabel } from './fuzzyTime'

function at(hour: number, minute = 0): Date {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d
}

describe('fuzzyTimeLabel', () => {
  it('returns "early morning" at 7am', () => {
    expect(fuzzyTimeLabel(at(7))).toBe('early morning')
  })

  it('returns "mid morning" at 10am', () => {
    expect(fuzzyTimeLabel(at(10))).toBe('mid morning')
  })

  it('returns "just after noon" at 12:15pm', () => {
    expect(fuzzyTimeLabel(at(12, 15))).toBe('just after noon')
  })

  it('returns "late afternoon" at 6pm', () => {
    expect(fuzzyTimeLabel(at(18))).toBe('late afternoon')
  })

  it('returns "evening" at 9pm', () => {
    expect(fuzzyTimeLabel(at(21))).toBe('evening')
  })

  it('returns "late night" just after midnight', () => {
    expect(fuzzyTimeLabel(at(1))).toBe('late night')
  })

  it('handles the exact boundary between buckets correctly (9:00 is mid morning, 8:59 is early morning)', () => {
    expect(fuzzyTimeLabel(at(8, 59))).toBe('early morning')
    expect(fuzzyTimeLabel(at(9, 0))).toBe('mid morning')
  })
})