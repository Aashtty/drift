// apps/web/src/components/replay/AnchorBreakdown.tsx
'use client'

import type { AnchorTime } from '@/lib/analytics/sessionAnalytics'
import type { Anchor } from '@/types/anchor'

interface AnchorBreakdownProps {
  breakdown: AnchorTime[]
  anchors: Anchor[]
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/**
 * New. Every session has always carried enough information (via its
 * task's anchor_id) to answer "which of my anchors actually gets my
 * focus time," but nothing anywhere ever computed or showed it —
 * anchors existed purely as a task-organizing color, with no feedback
 * loop back to how time was actually spent.
 */
export function AnchorBreakdown({ breakdown, anchors }: AnchorBreakdownProps) {
  if (breakdown.length === 0) {
    return <p className="text-meta" style={{ padding: '8px 0' }}>No anchored sessions in this window yet.</p>
  }

  const max = Math.max(...breakdown.map((b) => b.totalMinutes), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }} data-testid="anchor-breakdown">
      {breakdown.map((b) => {
        const anchor = anchors.find((a) => a.id === b.anchorId)
        if (!anchor) return null
        const widthPct = Math.max(4, (b.totalMinutes / max) * 100)
        return (
          <div key={b.anchorId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: anchor.color, flexShrink: 0 }} />
                {anchor.name}
              </span>
              <span className="text-micro-mono" style={{ opacity: 0.6 }}>{formatMinutes(b.totalMinutes)}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--surface)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${widthPct}%`, background: anchor.color, opacity: 0.8, borderRadius: 999, transition: 'width 600ms var(--ease-focus)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}