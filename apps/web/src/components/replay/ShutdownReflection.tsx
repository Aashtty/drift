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

/**
 * Reads `priority_task_id` (renamed from `anchor_task_id` — migration
 * 004) and labels it "focus" rather than "anchor," matching the rename
 * everywhere else. This was previously the one place in the app where
 * a Shutdown Ritual answer and an actual Anchor tag could show up
 * styled identically, which is exactly the confusion being fixed.
 */
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
              <p style={{ fontSize: 12.5, color: 'var(--text-primary)', margin: '4px 0 0' }}>
                → focus: <span style={{ color: 'var(--accent)' }}>{priorityName}</span>
              </p>
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