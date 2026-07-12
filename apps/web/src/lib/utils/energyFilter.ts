// apps/web/src/lib/utils/energyFilter.ts
import type { EnergyLevel, Task } from '@/types/task'

// AES ceiling shown per energy selection — Low: AES 1–2, Medium: AES 1–3, High: all
const AES_CEILING: Record<EnergyLevel, number> = {
  low: 2,
  medium: 3,
  high: 5,
}

export function filterByEnergy(tasks: Task[], level: EnergyLevel): Task[] {
  const ceiling = AES_CEILING[level]
  return tasks
    .filter((t) => t.status === 'active')
    // Tasks with no score yet (AES scoring hasn't returned from Gemini or
    // the local fallback) used to default to 5 and vanish from Low/Medium
    // entirely until scoring resolved. They now stay visible at every
    // energy level while pending, and sort to the bottom, instead of
    // silently disappearing.
    .filter((t) => t.aes_score == null || t.aes_score <= ceiling)
    .sort((a, b) => {
      if (a.aes_score == null && b.aes_score == null) return 0
      if (a.aes_score == null) return 1
      if (b.aes_score == null) return -1
      return a.aes_score - b.aes_score
    })
}