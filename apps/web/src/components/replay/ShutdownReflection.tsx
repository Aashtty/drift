// apps/web/src/components/replay/ShutdownReflection.tsx
'use client'

import type { ShutdownRecord } from '@/lib/db/queries'

interface ShutdownReflectionProps {
  shutdowns: ShutdownRecord[]
  taskNameById: Map<string, string>
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return 'today'
  if (isYesterday) return 'yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function TargetIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="0.9" fill="currentColor" />
    </svg>
  )
}

/** The chosen-priority line now reads as a distinct callout — a small
 *  badge with an icon and an accent border — instead of plain text
 *  indistinguishable from the metadata line above it. */
export function ShutdownReflection({ shutdowns, taskNameById }: ShutdownReflectionProps) {
  if (shutdowns.length === 0) {
    return (
      <p className="text-meta" style={{ padding: '8px 0', fontSize: 12 }}>
        No shutdowns logged yet — end your day from the sidebar to start building a history here.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto' }} className="scroll-thin" data-testid="shutdown-reflection">
      {shutdowns.map((s) => {
        const priorityName = s.priority_task_id ? taskNameById.get(s.priority_task_id) : null
        return (
          <div key={s.id} style={{ borderLeft: '2px solid var(--border-accent)', paddingLeft: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span className="text-micro-mono" style={{ textTransform: 'uppercase' }}>{formatDate(s.completed_at)}</span>
              <span className="text-micro-mono" style={{ opacity: 0.5 }}>{s.completed_task_ids.length} finished · {s.carried_task_ids.length} carried</span>
            </div>
            {priorityName && (
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', border: '1px solid var(--accent)' }}>
                <span style={{ color: 'var(--accent)', display: 'flex' }}><TargetIcon /></span>
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>{priorityName}</span>
              </div>
            )}
            {s.notes && !priorityName && (
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{s.notes}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}