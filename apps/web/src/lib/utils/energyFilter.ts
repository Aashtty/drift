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
    .filter((t) => (t.aes_score ?? 5) <= ceiling)
    .sort((a, b) => (a.aes_score ?? 5) - (b.aes_score ?? 5))
}