// apps/web/src/components/replay/RecentSessionsList.tsx
'use client'

import type { FocusSession } from '@/types/session'

interface RecentSessionsListProps {
  sessions: FocusSession[]
  taskNameById: Map<string, string>
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `today, ${time}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

export function RecentSessionsList({ sessions, taskNameById }: RecentSessionsListProps) {
  const sorted = [...sessions]
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 8)

  if (sorted.length === 0) {
    return (
      <p className="text-meta" style={{ padding: '8px 0' }}>
        No sessions yet — your first one will show up here.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="recent-sessions-list">
      {sorted.map((s) => {
        const minutes = Math.round((s.duration_seconds ?? 0) / 60)
        const name = (s.task_id && taskNameById.get(s.task_id)) || 'untitled session'
        return (
          <div
            key={s.id}
            className="glass"
            style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
              </p>
              <p className="text-meta" style={{ marginTop: 2 }}>{formatWhen(s.started_at)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {s.flow_detected && (
                <span
                  className="text-micro-mono"
                  style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)', color: 'var(--accent)' }}
                >
                  flow
                </span>
              )}
              {s.hyperfocus && (
                <span
                  title="locked in"
                  className="text-micro-mono"
                  style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)' }}
                >
                  🔒
                </span>
              )}
              <span className="text-micro-mono" style={{ opacity: 0.6 }}>{minutes}m</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}