// apps/web/src/components/replay/TopTasksList.tsx
'use client'

import type { TopTask } from '@/lib/analytics/sessionAnalytics'
import type { Anchor } from '@/types/anchor'

interface TopTasksListProps {
  topTasks: TopTask[]
  taskNameById: Map<string, string>
  /** Optional — resolves a task's anchor for a small colored dot next
   *  to the name, so this list reads as "part of the same picture" as
   *  the Anchor Breakdown widget beside it rather than two disconnected
   *  views of the same underlying sessions. */
  anchorForTask?: (taskId: string) => Anchor | null
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function TopTasksList({ topTasks, taskNameById, anchorForTask }: TopTasksListProps) {
  if (topTasks.length === 0) {
    return <p className="text-meta" style={{ padding: '8px 0' }}>Not enough data yet.</p>
  }

  const max = Math.max(...topTasks.map((t) => t.totalMinutes), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }} data-testid="top-tasks-list">
      {topTasks.map((t) => {
        const name = taskNameById.get(t.taskId) ?? 'untitled task'
        const anchor = anchorForTask?.(t.taskId) ?? null
        const widthPct = Math.max(4, (t.totalMinutes / max) * 100)
        return (
          <div key={t.taskId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 13, color: 'var(--text-primary)' }}>
                {anchor && <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: anchor.color, flexShrink: 0 }} />}
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
              </span>
              <span className="text-micro-mono" style={{ opacity: 0.6, flexShrink: 0 }}>{formatMinutes(t.totalMinutes)}</span>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--surface)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${widthPct}%`, background: anchor?.color ?? 'var(--accent)', opacity: 0.8, borderRadius: 999, transition: 'width 600ms var(--ease-focus)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}