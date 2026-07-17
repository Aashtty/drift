// apps/web/src/components/core/NextMoveWidget.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/sessionStore'
import { useTaskStore } from '@/stores/taskStore'
import { useTodaysPriorityTaskId } from '@/hooks/useTodaysPriority'

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function TargetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

export function NextMoveWidget() {
  const router = useRouter()
  const activeSession = useSessionStore((s) => s.active)
  const tasks = useTaskStore((s) => s.tasks)
  const priorityTaskId = useTodaysPriorityTaskId()

  if (activeSession) return null

  const priorityTask = priorityTaskId ? tasks.find((t) => t.id === priorityTaskId && t.status === 'active') : null

  function startTask(taskId: string, name: string) {
    router.push(`/now?${new URLSearchParams({ taskId, task: name }).toString()}`)
  }

  return (
    <div className="glass" data-testid="next-move-widget" style={{ padding: 20 }}>
      {priorityTask ? (
        <>
          <p className="text-micro-mono" style={{ color: 'var(--accent)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TargetIcon /> TODAY'S PRIORITY - CHOSEN LAST NIGHT
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ fontSize: 16, color: 'var(--text-primary)', margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{priorityTask.name}</p>
            <button
              type="button"
              data-testid="next-move-start-priority"
              onClick={() => startTask(priorityTask.id, priorityTask.name)}
              className="glass-interactive"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', boxShadow: 'var(--glow-accent-sm)', flexShrink: 0 }}
            >
              Start <ArrowIcon />
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-meta" style={{ fontSize: 13, marginBottom: 12 }}>Nothing in progress right now.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" data-testid="next-move-focus" onClick={() => router.push('/now')} className="glass-interactive" style={{ padding: '9px 16px', border: 'none', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}>
              Start a session
            </button>
            <button type="button" data-testid="next-move-shutdown" onClick={() => router.push('/shutdown')} className="glass-interactive" style={{ padding: '9px 16px', border: 'none', borderRadius: 'var(--radius-full)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
              End the day
            </button>
          </div>
        </>
      )}
    </div>
  )
}