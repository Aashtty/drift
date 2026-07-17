// apps/web/src/components/replay/RecentSessionsList.tsx
'use client'

import { useState } from 'react'
import { Dropdown } from '@/components/ui/Dropdown'
import type { FocusSession } from '@/types/session'
import type { Anchor } from '@/types/anchor'

interface RecentSessionsListProps {
  sessions: FocusSession[]
  taskNameById: Map<string, string>
  anchorForTask?: (taskId: string) => Anchor | null
  defaultLimit?: number
}

type ViewMode = 'top' | 'all'

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `today, ${time}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

function LockIcon() {
  return (<svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>)
}

export function RecentSessionsList({ sessions, taskNameById, anchorForTask, defaultLimit = 8 }: RecentSessionsListProps) {
  const [view, setView] = useState<ViewMode>('top')
  const sorted = [...sessions].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

  if (sorted.length === 0) {
    return <p className="text-meta" style={{ padding: '8px 0' }}>No sessions in this window yet.</p>
  }

  const shown = view === 'all' ? sorted : sorted.slice(0, defaultLimit)

  return (
    <div data-testid="recent-sessions-list">
      {sorted.length > defaultLimit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <Dropdown
            value={view}
            onChange={setView}
            options={[{ value: 'top', label: `Recent ${defaultLimit}` }, { value: 'all', label: `All (${sorted.length})` }]}
            testId="recent-sessions-view-select"
            minWidth={130}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {shown.map((s) => {
          const minutes = Math.round((s.duration_seconds ?? 0) / 60)
          const name = (s.task_id && taskNameById.get(s.task_id)) || 'untitled session'
          const anchor = s.task_id ? anchorForTask?.(s.task_id) ?? null : null
          return (
            <div key={s.id} className="glass" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderLeft: anchor ? `2px solid ${anchor.color}` : undefined }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                <p className="text-meta" style={{ marginTop: 2 }}>{formatWhen(s.started_at)}{anchor && ` - ${anchor.name}`}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {s.flow_detected && <span className="text-micro-mono" style={{ padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)', color: 'var(--accent-b)' }}>flow</span>}
                {s.hyperfocus && <span title="locked in" style={{ display: 'flex', color: 'var(--accent)', padding: '2px 5px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-active)' }}><LockIcon /></span>}
                <span className="text-micro-mono" style={{ opacity: 0.6 }}>{minutes}m</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}