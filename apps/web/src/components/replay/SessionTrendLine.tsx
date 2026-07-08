// apps/web/src/components/replay/SessionTrendLine.tsx
'use client'

import type { WeeklyAvg } from '@/lib/analytics/sessionAnalytics'

interface SessionTrendLineProps {
  weeks: WeeklyAvg[]
}

const WIDTH = 320
const HEIGHT = 100
const PADDING = 16

export function SessionTrendLine({ weeks }: SessionTrendLineProps) {
  const maxVal = Math.max(...weeks.map((w) => w.avgMinutes), 1)
  const stepX = (WIDTH - PADDING * 2) / (weeks.length - 1)

  const points = weeks.map((w, i) => {
    const x = PADDING + i * stepX
    const y = HEIGHT - PADDING - (w.avgMinutes / maxVal) * (HEIGHT - PADDING * 2)
    return { x, y, w }
  })

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div data-testid="session-trend-line">
      <svg width={WIDTH} height={HEIGHT}>
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent)" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: WIDTH }}>
        {weeks.map((w, i) => (
          <span key={i} className="text-micro-mono">{w.avgMinutes}m</span>
        ))}
      </div>
    </div>
  )
}