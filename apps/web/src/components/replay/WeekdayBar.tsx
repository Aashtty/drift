// apps/web/src/components/replay/WeekdayBar.tsx
'use client'

import type { WeekdayTotal } from '@/lib/analytics/sessionAnalytics'

interface WeekdayBarProps {
  data: WeekdayTotal[]
  selectedWeekday?: number | null
  onSelect?: (weekday: number | null) => void
}

const TRACK_HEIGHT = 90
const BAR_WIDTH = 30
const BAR_GAP = 10

/**
 * Rebuilt after this rendered as a completely blank area in practice —
 * the previous version had no fixed width anywhere (`flex: 1, minWidth:
 * 28` per day, no width on the parent), so its actual rendered size
 * depended entirely on ambient flex context it didn't control. It also
 * had no visible "empty" state: a zero-value day rendered as a 2px
 * sliver at 0.15 opacity, which is indistinguishable from nothing at
 * normal viewing distance. Every day column now has a fixed pixel
 * width and a persistent low-opacity track behind the actual bar, so
 * the chart's structure is always visible even before data loads, and
 * low-data days read as "small bar" rather than "missing."
 */
export function WeekdayBar({ data, selectedWeekday = null, onSelect }: WeekdayBarProps) {
  const max = Math.max(...data.map((d) => d.totalMinutes), 1)
  const hasAnyData = data.some((d) => d.totalMinutes > 0)
  const totalWidth = data.length * BAR_WIDTH + (data.length - 1) * BAR_GAP

  return (
    <div data-testid="weekday-bar" style={{ width: totalWidth }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: BAR_GAP, width: totalWidth }}>
        {data.map((d) => {
          const barHeight = d.totalMinutes === 0 ? 0 : Math.max(4, (d.totalMinutes / max) * TRACK_HEIGHT)
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
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                width: BAR_WIDTH, flexShrink: 0, background: 'none', border: 'none', padding: 0,
                cursor: onSelect ? 'pointer' : 'default',
              }}
            >
              <div style={{ position: 'relative', width: BAR_WIDTH, height: TRACK_HEIGHT, display: 'flex', alignItems: 'flex-end' }}>
                {/* Always-visible track — the actual fix for "chart
                    looks completely empty": structure is present
                    regardless of data. */}
                <div
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, borderRadius: 5, background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
                />
                {barHeight > 0 && (
                  <div
                    style={{
                      position: 'relative', width: '100%', height: barHeight, borderRadius: 5,
                      background: isSelected ? 'var(--accent-gradient)' : 'var(--accent)',
                      opacity: dimmed ? 0.3 : 0.85,
                      boxShadow: isSelected ? 'var(--glow-accent-sm)' : 'none',
                      transition: 'height 500ms var(--ease-focus), opacity 200ms var(--ease-out-expo)',
                    }}
                  />
                )}
              </div>
              <span style={{ fontSize: 10, color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: isSelected ? 600 : 400 }}>
                {d.label}
              </span>
            </button>
          )
        })}
      </div>
      {!hasAnyData && (
        <p className="text-meta" style={{ marginTop: 10, fontSize: 11, opacity: 0.5 }}>No sessions logged in this window yet.</p>
      )}
    </div>
  )
}