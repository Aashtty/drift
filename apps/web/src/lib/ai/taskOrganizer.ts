// apps/web/src/lib/ai/taskOrganizer.ts
import { scoreTasksBatch, type ScoredTask } from './aesScorer'
import type { Task, EnergyLevel } from '@/types/task'

export function splitBrainDump(rawText: string): string[] {
  return rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
}

function aesToEnergy(aes: number): EnergyLevel {
  if (aes <= 2) return 'low'
  if (aes <= 3) return 'medium'
  return 'high'
}

/**
 * Full pipeline: brain dump text -> newline split -> batched AES scoring
 * (Gemini, with automatic keyword fallback) -> ready-to-insert Task objects.
 */
export async function organizeBrainDump(
  rawText: string,
  userId: string,
  anchorNameToId: (name: string | null) => string | null
): Promise<Task[]> {
  const lines = splitBrainDump(rawText)
  if (lines.length === 0) return []

  const scored: ScoredTask[] = await scoreTasksBatch(lines)

  return scored.map((s) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    anchor_id: anchorNameToId(s.anchor),
    name: s.task,
    aes_score: s.aes,
    energy_level: aesToEnergy(s.aes),
    status: 'active',
    decay_started_at: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))
}