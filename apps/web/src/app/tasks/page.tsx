// apps/web/src/app/tasks/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { TaskList } from '@/components/tasks/TaskList'
import { LimboPanel } from '@/components/tasks/LimboPanel'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTaskStore } from '@/stores/taskStore'
import type { Task } from '@/types/task'

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5V8.5L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 1.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function QuickAddTask({ onAdd }: { onAdd: (name: string) => void }) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 20, maxWidth: 480 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="quick add a task..."
        data-testid="quick-add-input"
        style={{
          flex: 1,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '9px 16px',
          color: 'var(--text-primary)',
          fontSize: 13.5,
          outline: 'none',
        }}
      />
      <button
        type="submit"
        title="add task"
        data-testid="quick-add-submit"
        disabled={!value.trim()}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--surface-active)',
          color: value.trim() ? 'var(--accent)' : 'var(--text-tertiary)',
          cursor: value.trim() ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PlusIcon />
      </button>
    </form>
  )
}

export default function TasksPage() {
  const { user } = useUser()
  const router = useRouter()
  const { tasks, anchorFor, setStatus, tasksByStatus, markComplete } = useTaskEngine(user?.id ?? '')
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const addTask = useTaskStore((s) => s.addTask)
  useTaskDecay()
  const [limboOpen, setLimboOpen] = useState(false)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  if (!user) return null
  const limboTasks = tasksByStatus('limbo')

  // Finishing a task on this page made it vanish instantly with zero
  // record of it anywhere on the page — no small win, no glance-back.
  // Anything marked done today gets a quiet spot below the active list.
  const completedToday = tasks.filter(
    (t) => t.status === 'done' && new Date(t.updated_at).toDateString() === new Date().toDateString()
  )

  function startTask(taskId: string, name: string, anchorName: string | null) {
    const params = new URLSearchParams({ taskId, task: name })
    if (anchorName) params.set('anchor', anchorName)
    router.push(`/now?${params.toString()}`)
  }

  function quickAdd(name: string) {
    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      status: 'active',
      aes_score: null,
      anchor_id: null,
      created_at: now,
      updated_at: now,
    } as Task
    void addTask(task)
  }

  return (
    <main style={{ padding: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, maxWidth: 480 }}>
        <p className="text-section-label">TASKS</p>
        <button
          type="button"
          data-testid="limbo-trigger"
          onClick={() => setLimboOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <ClockIcon />
          limbo
          {limboTasks.length > 0 && (
            <span
              style={{
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--accent)',
                color: 'var(--bg)',
                fontSize: 10,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {limboTasks.length}
            </span>
          )}
        </button>
      </div>

      <QuickAddTask onAdd={quickAdd} />

      <TaskList
        tasks={tasks}
        anchorFor={anchorFor}
        defaultEnergy={settings?.energy_default ?? 'high'}
        onTaskStart={(task) => startTask(task.id, task.name, anchorFor(task)?.name ?? null)}
        onTaskComplete={(task) => void markComplete(task)}
        onTaskSendToLimbo={(task) => setStatus(task.id, 'limbo')}
        onEnergyChange={(level) => void updateSettings({ energy_default: level })}
      />

      {completedToday.length > 0 && (
        <div style={{ marginTop: 32, maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <p className="text-section-label" style={{ letterSpacing: '0.08em', opacity: 0.7 }}>
              DONE TODAY · {completedToday.length}
            </p>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {completedToday.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  color: 'var(--text-tertiary)',
                  textDecoration: 'line-through',
                  opacity: 0.7,
                }}
              >
                {t.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <LimboPanel
        open={limboOpen}
        onClose={() => setLimboOpen(false)}
        tasks={limboTasks}
        onRestore={(id) => setStatus(id, 'active')}
        onArchive={(id) => setStatus(id, 'archived')}
        onKillAll={() => { for (const t of limboTasks) setStatus(t.id, 'archived') }}
      />
    </main>
  )
}