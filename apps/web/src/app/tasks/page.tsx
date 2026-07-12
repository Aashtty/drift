// apps/web/src/app/tasks/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { TaskList } from '@/components/tasks/TaskList'
import { LimboPanel } from '@/components/tasks/LimboPanel'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { AnchorManager } from '@/components/tasks/AnchorManager'
import { AnchorBadge } from '@/components/tasks/AnchorBadge'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { BulkActionBar } from '@/components/tasks/BulkActionBar'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from '@/stores/toastStore'
import type { Task, EnergyLevel } from '@/types/task'

type SortMode = 'aes' | 'alpha' | 'recent' | 'anchor'

const SORT_LABELS: Record<SortMode, string> = {
  aes: 'by effort',
  alpha: 'a → z',
  recent: 'recently updated',
  anchor: 'by anchor',
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5V8.5L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 1.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function SelectIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 8.2L7 10.2L11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Tasks is the workspace: search, sort, anchor filtering, multi-select
 * with bulk actions, and per-task detail editing. This is what the
 * dashboard deliberately does NOT try to be — everything here exists
 * because managing the full backlog needs more control than a daily
 * glance does.
 */
export default function TasksPage() {
  const { user } = useUser()
  const router = useRouter()
  const { tasks, anchors, anchorFor, setStatus, tasksByStatus, markComplete, updateTask, removeTask, addTask } = useTaskEngine(user?.id ?? '')
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  useTaskDecay()

  const [limboOpen, setLimboOpen] = useState(false)
  const [anchorManagerOpen, setAnchorManagerOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('aes')
  const [anchorFilter, setAnchorFilter] = useState<string | null>(null) // null = all, 'none' = unanchored
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  // "/" focuses search from anywhere on the page — a real power-user
  // convenience once you have more than a handful of tasks.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === 'Escape' && selectionMode) {
        setSelectionMode(false)
        setSelectedIds(new Set())
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectionMode])

  if (!user) return null

  const limboTasks = tasksByStatus('limbo')
  const completedToday = tasks.filter(
    (t) => t.status === 'done' && new Date(t.updated_at).toDateString() === new Date().toDateString()
  )

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }
    if (anchorFilter === 'none') {
      result = result.filter((t) => !t.anchor_id)
    } else if (anchorFilter) {
      result = result.filter((t) => t.anchor_id === anchorFilter)
    }
    return result
  }, [tasks, search, anchorFilter])

  const sortComparator = useMemo(() => {
    if (sortMode === 'alpha') return (a: Task, b: Task) => a.name.localeCompare(b.name)
    if (sortMode === 'recent') return (a: Task, b: Task) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    if (sortMode === 'anchor') return (a: Task, b: Task) => (a.anchor_id ?? '').localeCompare(b.anchor_id ?? '')
    return undefined // 'aes' — TaskList's default via filterByEnergy
  }, [sortMode])

  function startTask(taskId: string, name: string, anchorName: string | null) {
    const params = new URLSearchParams({ taskId, task: name })
    if (anchorName) params.set('anchor', anchorName)
    router.push(`/now?${params.toString()}`)
  }

  function quickAdd(name: string, anchorId: string | null) {
    const now = new Date().toISOString()
    const task: Task = {
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      status: 'active',
      aes_score: null,
      energy_level: null,
      anchor_id: anchorId,
      decay_started_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now,
    }
    void addTask(task)
  }

  function handleComplete(task: Task) {
    void markComplete(task)
    toast.undo(`"${task.name}" marked done.`, () => setStatus(task.id, 'active'))
  }

  function toggleSelect(task: Task) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(task.id)) next.delete(task.id)
      else next.add(task.id)
      return next
    })
  }

  function clearSelection() {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }

  function bulkApply(status: 'done' | 'limbo' | 'archived') {
    const ids = Array.from(selectedIds)
    for (const id of ids) {
      if (status === 'done') {
        const t = tasks.find((x) => x.id === id)
        if (t) void markComplete(t)
      } else {
        setStatus(id, status)
      }
    }
    toast.undo(`${ids.length} task${ids.length === 1 ? '' : 's'} updated.`, () => {
      for (const id of ids) setStatus(id, 'active')
    })
    clearSelection()
  }

  return (
    <main style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, maxWidth: 640, flexWrap: 'wrap', gap: 10 }}>
        <p className="text-section-label">TASKS</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            data-testid="anchor-manager-trigger"
            onClick={() => setAnchorManagerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
          >
            anchors
          </button>
          <button
            type="button"
            data-testid="selection-mode-toggle"
            onClick={() => (selectionMode ? clearSelection() : setSelectionMode(true))}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-full)',
              background: selectionMode ? 'var(--surface-active)' : 'var(--surface)',
              border: `1px solid ${selectionMode ? 'var(--accent)' : 'var(--border)'}`,
              color: selectionMode ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
            }}
          >
            <SelectIcon /> select
          </button>
          <button
            type="button"
            data-testid="limbo-trigger"
            onClick={() => setLimboOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
          >
            <ClockIcon /> limbo
            {limboTasks.length > 0 && (
              <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 'var(--radius-full)', background: 'var(--accent)', color: 'var(--bg)', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {limboTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <QuickAddTask onAdd={quickAdd} anchors={anchors} />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
              <SearchIcon />
            </span>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search tasks... (press /)"
              data-testid="task-search-input"
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '8px 12px 8px 34px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            data-testid="task-sort-select"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '8px 14px', color: 'var(--text-secondary)', fontSize: 12.5, outline: 'none', cursor: 'pointer' }}
          >
            {Object.entries(SORT_LABELS).map(([mode, label]) => (
              <option key={mode} value={mode}>{label}</option>
            ))}
          </select>
        </div>

        {anchors.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <AnchorBadge name="all" color="var(--text-secondary)" interactive selected={anchorFilter === null} onClick={() => setAnchorFilter(null)} />
            <AnchorBadge name="none" color="var(--text-tertiary)" interactive selected={anchorFilter === 'none'} onClick={() => setAnchorFilter('none')} />
            {anchors.map((a) => (
              <AnchorBadge key={a.id} name={a.name} color={a.color} interactive selected={anchorFilter === a.id} onClick={() => setAnchorFilter(a.id)} />
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 640 }}>
        <TaskList
          tasks={filteredTasks}
          anchorFor={anchorFor}
          defaultEnergy={settings?.energy_default ?? 'high'}
          sortComparator={sortComparator}
          onTaskStart={(task) => startTask(task.id, task.name, anchorFor(task)?.name ?? null)}
          onTaskComplete={handleComplete}
          onOpenDetail={setDetailTask}
          onEnergyChange={(level) => void updateSettings({ energy_default: level })}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      </div>

      {completedToday.length > 0 && (
        <div style={{ marginTop: 32, maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <p className="text-section-label" style={{ letterSpacing: '0.08em', opacity: 0.7 }}>DONE TODAY · {completedToday.length}</p>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {completedToday.map((t) => (
              <div key={t.id} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-tertiary)', textDecoration: 'line-through', opacity: 0.7 }}>
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

      <AnchorManager open={anchorManagerOpen} onClose={() => setAnchorManagerOpen(false)} userId={user.id} />

      <TaskDetailSheet
        task={detailTask}
        anchors={anchors}
        onClose={() => setDetailTask(null)}
        onRename={(id, name) => void updateTask(id, { name })}
        onSetAnchor={(id, anchorId) => void updateTask(id, { anchor_id: anchorId })}
        onSetEnergy={(id, level) => void updateTask(id, { energy_level: level as EnergyLevel })}
        onStart={(task) => {
          setDetailTask(null)
          startTask(task.id, task.name, anchorFor(task)?.name ?? null)
        }}
        onMarkDone={(task) => {
          handleComplete(task)
          setDetailTask(null)
        }}
        onSendToLimbo={(task) => {
          setStatus(task.id, 'limbo')
          setDetailTask(null)
          toast.undo(`"${task.name}" sent to limbo.`, () => setStatus(task.id, 'active'))
        }}
        onArchive={(task) => {
          setStatus(task.id, 'archived')
          setDetailTask(null)
          toast.undo(`"${task.name}" archived.`, () => setStatus(task.id, 'active'))
        }}
        onRestore={(task) => {
          setStatus(task.id, 'active')
          setDetailTask(null)
        }}
        onDelete={(task) => {
          void removeTask(task.id)
          toast.info(`"${task.name}" deleted.`)
        }}
      />

      <BulkActionBar
        count={selectedIds.size}
        onComplete={() => bulkApply('done')}
        onLimbo={() => bulkApply('limbo')}
        onArchive={() => bulkApply('archived')}
        onClear={clearSelection}
      />
    </main>
  )
}