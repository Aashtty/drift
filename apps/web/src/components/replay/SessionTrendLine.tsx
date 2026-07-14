// apps/web/src/components/replay/SessionTrendLine.tsx
'use client'

import type { WeeklyAvg } from '@/lib/analytics/sessionAnalytics'

interface SessionTrendLineProps {
  weeks: WeeklyAvg[]
}

const WIDTH = 320
const HEIGHT = 110
const PADDING = 16

function weekLabel(index: number, total: number): string {
  const weeksAgo = total - 1 - index
  if (weeksAgo === 0) return 'this week'
  if (weeksAgo === 1) return '1w ago'
  return `${weeksAgo}w ago`
}

export function SessionTrendLine({ weeks }: SessionTrendLineProps) {
  const maxVal = Math.max(...weeks.map((w) => w.avgMinutes), 1)
  const stepX = (WIDTH - PADDING * 2) / (weeks.length - 1)

  const points = weeks.map((w, i) => {
    const x = PADDING + i * stepX
    const y = HEIGHT - PADDING - (w.avgMinutes / maxVal) * (HEIGHT - PADDING * 2)
    return { x, y, w }
  })

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${lineD} L ${points[points.length - 1].x} ${HEIGHT - PADDING} L ${points[0].x} ${HEIGHT - PADDING} Z`

  return (
    <div data-testid="session-trend-line">
      <svg width={WIDTH} height={HEIGHT}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#trend-fill)" />
        <path d={lineD} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.2} fill="var(--accent)">
            <title>{`${weekLabel(i, weeks.length)} — avg ${p.w.avgMinutes}m per session`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: WIDTH }}>
        {weeks.map((w, i) => (
          <span key={i} className="text-micro-mono">{w.avgMinutes}m</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: WIDTH, marginTop: 2 }}>
        {weeks.map((_, i) => (
          <span key={i} style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{weekLabel(i, weeks.length)}</span>
        ))}
      </div>
    </div>
  )
}