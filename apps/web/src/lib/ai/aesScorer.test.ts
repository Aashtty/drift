// apps/web/src/lib/ai/aesScorer.test.ts
import { describe, it, expect } from 'vitest'
import { fallbackScoreTask, fallbackScoreBatch } from './aesScorer'

describe('fallbackScoreTask', () => {
  it('scores a quick-word task low (AES 1)', () => {
    expect(fallbackScoreTask('Reply to Alex').aes).toBe(1)
  })

  it('scores a blocking-word task high (AES 4)', () => {
    expect(fallbackScoreTask('Write the Q4 strategy doc').aes).toBe(4)
  })

  it('scores a task with neither keyword type as neutral (AES 3)', () => {
    expect(fallbackScoreTask('Feed the cat').aes).toBe(3)
  })

  it('splits the difference when both keyword types appear', () => {
    expect(fallbackScoreTask('Reply with the roadmap plan').aes).toBe(3)
  })

  it('always returns a score between 1 and 5', () => {
    const results = fallbackScoreBatch([
      'Reply to Alex', 'Write the Q4 strategy doc', 'Feed the cat', 'Call mom',
    ])
    for (const r of results) {
      expect(r.aes).toBeGreaterThanOrEqual(1)
      expect(r.aes).toBeLessThanOrEqual(5)
    }
  })

  it('preserves the original task text unchanged', () => {
    const input = 'Review the PR from Sam'
    expect(fallbackScoreTask(input).task).toBe(input)
  })
})