// apps/web/src/lib/utils/energyColors.ts
import type { EnergyLevel } from '@/types/task'

/**
 * Single source of truth for energy-level color coding — used by
 * TaskCard's status chip, the Tasks page's "BY ENERGY" rail widget, and
 * EnergySelector's icons. Previously each picked its own colors
 * independently, which is part of why the app's energy language felt
 * inconsistent screen to screen.
 */
export const ENERGY_COLOR: Record<EnergyLevel, string> = {
  low: 'var(--success)',
  medium: 'var(--accent-b)',
  high: 'var(--accent)',
}

export const ENERGY_LABEL: Record<EnergyLevel, string> = {
  low: 'Low',
  medium: 'Med',
  high: 'High',
}