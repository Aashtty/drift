// apps/web/src/components/replay/HeatmapGrid.tsx
'use client'

import type { HeatmapCell } from '@/lib/analytics/sessionAnalytics'

interface HeatmapGridProps {
  cells: HeatmapCell[]
  peakHours: { startHour: number; endHour: number }
}

const DAY_LABELS = ['6d', '5d', '4d', '3d', '2d', '1d', 'today']
const CELL_SIZE = 10
const CELL_GAP = 2

function depthToOpacity(depth: number, max: number): number {
  if (max === 0) return 0.04
  return 0.08 + 0.5 * (depth / max)
}

export function HeatmapGrid({ cells, peakHours }: HeatmapGridProps) {
  const maxDepth = Math.max(...cells.map((c) => c.depth), 1)

  return (
    <div data-testid="heatmap-grid">
      <svg
        width={24 * (CELL_SIZE + CELL_GAP) + 40}
        height={7 * (CELL_SIZE + CELL_GAP) + 20}
      >
        {cells.map((cell) => {
          const isPeak = cell.hour >= peakHours.startHour && cell.hour <= peakHours.endHour
          return (
            <rect
              key={`${cell.day}-${cell.hour}`}
              x={40 + cell.hour * (CELL_SIZE + CELL_GAP)}
              y={cell.day * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill="var(--accent)"
              opacity={depthToOpacity(cell.depth, maxDepth)}
              stroke={isPeak ? 'var(--accent)' : 'none'}
              strokeWidth={isPeak ? 1 : 0}
              strokeOpacity={0.6}
            />
          )
        })}
        {DAY_LABELS.map((label, i) => (
          <text
            key={label}
            x={0}
            y={i * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 1}
            fontSize={9}
            fill="var(--text-tertiary)"
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        ))}
      </svg>
      <p className="text-meta" style={{ marginTop: 8 }}>
        peak hours: {peakHours.startHour}:00–{peakHours.endHour + 1}:00
      </p>
    </div>
  )
}