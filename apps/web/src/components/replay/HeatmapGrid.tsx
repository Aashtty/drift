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
const GRID_LEFT_OFFSET = 40
const HOUR_LABEL_ROW_HEIGHT = 14
const LEGEND_STEPS = [0.08, 0.2, 0.35, 0.5, 0.58]

function depthToOpacity(depth: number, max: number): number {
  if (max === 0) return 0.04
  return 0.08 + 0.5 * (depth / max)
}

export function HeatmapGrid({ cells, peakHours }: HeatmapGridProps) {
  const maxDepth = Math.max(...cells.map((c) => c.depth), 1)

  return (
    <div data-testid="heatmap-grid">
      <svg
        width={24 * (CELL_SIZE + CELL_GAP) + GRID_LEFT_OFFSET}
        height={7 * (CELL_SIZE + CELL_GAP) + HOUR_LABEL_ROW_HEIGHT}
      >
        {Array.from({ length: 8 }, (_, i) => i * 3).map((hour) => (
          <text
            key={hour}
            x={GRID_LEFT_OFFSET + hour * (CELL_SIZE + CELL_GAP)}
            y={7 * (CELL_SIZE + CELL_GAP) + HOUR_LABEL_ROW_HEIGHT - 3}
            fontSize={8.5}
            fill="var(--text-tertiary)"
            fontFamily="var(--font-mono)"
          >
            {hour}
          </text>
        ))}

        {cells.map((cell) => {
          const isPeak = cell.hour >= peakHours.startHour && cell.hour <= peakHours.endHour
          const minutes = Math.round(cell.depth / 60)
          return (
            <rect
              key={`${cell.day}-${cell.hour}`}
              x={GRID_LEFT_OFFSET + cell.hour * (CELL_SIZE + CELL_GAP)}
              y={cell.day * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill="var(--accent)"
              opacity={depthToOpacity(cell.depth, maxDepth)}
              stroke={isPeak ? 'var(--accent)' : 'none'}
              strokeWidth={isPeak ? 1 : 0}
              strokeOpacity={0.6}
            >
              <title>{`${DAY_LABELS[cell.day]} · ${cell.hour}:00 — ${minutes > 0 ? `${minutes}m focused` : 'no focus time'}`}</title>
            </rect>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <p className="text-meta" style={{ margin: 0 }}>
          peak hours: {peakHours.startHour}:00–{peakHours.endHour + 1}:00
        </p>
        {/* Raw opacity gradients don't mean anything without a key */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="text-micro-mono" style={{ opacity: 0.5 }}>less</span>
          {LEGEND_STEPS.map((o, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{ width: 9, height: 9, borderRadius: 2, background: 'var(--accent)', opacity: o }}
            />
          ))}
          <span className="text-micro-mono" style={{ opacity: 0.5 }}>more</span>
        </div>
      </div>
    </div>
  )
}