// apps/web/src/lib/ai/aesScorer.ts
export interface ScoredTask {
  task: string
  aes: number
  anchor: string | null
}

/**
 * Pure, offline, zero-network fallback. Used when the Gemini call fails
 * (offline, rate-limited, key missing). Keyword-matched, not AI — but never
 * leaves a brain dump unscored.
 */
const BLOCKING_WORDS = [
  'plan', 'write', 'design', 'build', 'review', 'research', 'refactor',
  'proposal', 'strategy', 'architecture', 'roadmap', 'presentation',
]
const QUICK_WORDS = [
  'reply', 'email', 'call', 'text', 'water', 'check', 'confirm', 'pay',
  'schedule', 'book', 'buy', 'reminder',
]

export function fallbackScoreTask(taskText: string): ScoredTask {
  const lower = taskText.toLowerCase()
  const isBlocking = BLOCKING_WORDS.some((w) => lower.includes(w))
  const isQuick = QUICK_WORDS.some((w) => lower.includes(w))

  let aes = 3
  if (isBlocking && !isQuick) aes = 4
  if (isQuick && !isBlocking) aes = 1
  if (isBlocking && isQuick) aes = 3 // ambiguous — split the difference

  return { task: taskText, aes, anchor: null }
}

export function fallbackScoreBatch(tasks: string[]): ScoredTask[] {
  return tasks.map(fallbackScoreTask)
}

/**
 * Client-side entrypoint. Calls the server route (which holds the Gemini
 * key); falls back to local keyword scoring on any failure, including
 * being offline.
 */
export async function scoreTasksBatch(tasks: string[]): Promise<ScoredTask[]> {
  if (tasks.length === 0) return []

  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('offline')
    }
    const res = await fetch('/api/ai/score-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    })
    if (!res.ok) throw new Error(`score-tasks failed: ${res.status}`)
    const data = (await res.json()) as { scored: ScoredTask[] }
    if (!Array.isArray(data.scored) || data.scored.length !== tasks.length) {
      throw new Error('malformed AI response')
    }
    return data.scored
  } catch {
    return fallbackScoreBatch(tasks)
  }
}