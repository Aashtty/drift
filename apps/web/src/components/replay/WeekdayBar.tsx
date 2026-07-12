// apps/web/src/components/replay/WeekdayBar.tsx
'use client'

import type { WeekdayTotal } from '@/lib/analytics/sessionAnalytics'

interface WeekdayBarProps {
  data: WeekdayTotal[]
  selectedWeekday?: number | null
  /** Optional — makes bars clickable. Selecting a day again clears it. */
  onSelect?: (weekday: number | null) => void
}

const TRACK_HEIGHT = 84

export function WeekdayBar({ data, selectedWeekday = null, onSelect }: WeekdayBarProps) {
  const max = Math.max(...data.map((d) => d.totalMinutes), 1)

  return (
    <div data-testid="weekday-bar" style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      {data.map((d) => {
        const barHeight = d.totalMinutes === 0 ? 2 : Math.max(4, (d.totalMinutes / max) * TRACK_HEIGHT)
        const isSelected = selectedWeekday === d.weekday
        const dimmed = selectedWeekday !== null && !isSelected
        return (
          <button
            key={d.weekday}
            type="button"
            onClick={() => onSelect?.(isSelected ? null : d.weekday)}
            disabled={!onSelect}
            title={`${d.label}: ${d.totalMinutes}m${onSelect ? ' — click to filter recent sessions' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              flex: 1,
              minWidth: 28,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: onSelect ? 'pointer' : 'default',
            }}
          >
            <div style={{ height: TRACK_HEIGHT, display: 'flex', alignItems: 'flex-end' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: 26,
                  height: barHeight,
                  borderRadius: 4,
                  background: 'var(--accent)',
                  opacity: d.totalMinutes === 0 ? 0.15 : dimmed ? 0.25 : 0.75,
                  boxShadow: isSelected ? 'var(--glow-accent-sm)' : 'none',
                  transition: 'height 600ms var(--ease-focus), opacity 200ms var(--ease-out-expo)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {d.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}