// apps/web/src/app/tasks/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { useAppState } from '@/hooks/useAppState'
import { TaskList } from '@/components/tasks/TaskList'
import { LimboPanel } from '@/components/tasks/LimboPanel'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { AnchorManager } from '@/components/tasks/AnchorManager'
import { AnchorBadge } from '@/components/tasks/AnchorBadge'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { BulkActionBar } from '@/components/tasks/BulkActionBar'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { scoreTasksBatch } from '@/lib/ai/aesScorer'
import { toast } from '@/stores/toastStore'
import type { Task, EnergyLevel } from '@/types/task'

type SortMode = 'aes' | 'alpha' | 'recent' | 'anchor'

const SORT_LABELS: Record<SortMode, string> = {
  aes: 'by effort',
  alpha: 'a → z',
  recent: 'recently updated',
  anchor: 'by anchor',
}

const ENERGY_COLOR: Record<'low' | 'medium' | 'high' | 'unscored', string> = {
  low: 'var(--success)',
  medium: 'var(--accent-b)',
  high: 'var(--accent)',
  unscored: 'var(--text-tertiary)',
}

function aesToEnergy(aes: number): EnergyLevel {
  if (aes <= 2) return 'low'
  if (aes <= 3) return 'medium'
  return 'high'
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

function ToolbarButton({ children, onClick, active, testId }: { children: React.ReactNode; onClick: () => void; active?: boolean; testId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--radius-full)',
        background: active ? 'var(--surface-active)' : 'var(--surface)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        color: active ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 'var(--radius-full)', background: 'var(--accent)', color: 'var(--bg)', fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </span>
  )
}
function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: 20 }}>
      <p className="text-section-label" style={{ marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  )
}
function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      <p className="text-micro-mono" style={{ marginTop: 2 }}>{label}</p>
    </div>
  )
}

/**
 * Complete layout rebuild, same spirit as Dashboard: a real two-column
 * grid up to 1360px instead of a fixed ~480px-wide list floating with
 * blank space on every side. The toolbar (quick add / search / sort /
 * anchor filter) is now grouped inside one cohesive card instead of
 * loose rows on bare background, and the right rail adds three
 * genuinely new glanceable widgets — overview counts, an energy
 * breakdown, and an anchor breakdown — using data that was already
 * available but never surfaced anywhere.
 */
export default function TasksPage() {
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tasks, anchors, anchorFor, setStatus, tasksByStatus, markComplete, updateTask, removeTask, addTask } = useTaskEngine(user?.id ?? '')
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const { setState } = useAppState()
  useTaskDecay()

  useEffect(() => {
    // See app/page.tsx for the full explanation of why this is here.
    setState('IDLE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [limboOpen, setLimboOpen] = useState(false)
  const [anchorManagerOpen, setAnchorManagerOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('aes')
  // Pre-filled from ?anchor=<id> so the Dashboard's anchor breakdown
  // widget can deep-link straight into a filtered view here.
  const [anchorFilter, setAnchorFilter] = useState<string | null>(() => searchParams.get('anchor'))
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

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
  const activeTasks = tasksByStatus('active')
  const archivedTasks = tasksByStatus('archived')
  const completedToday = tasks.filter((t) => t.status === 'done' && new Date(t.updated_at).toDateString() === new Date().toDateString())

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }
    if (anchorFilter === 'none') result = result.filter((t) => !t.anchor_id)
    else if (anchorFilter) result = result.filter((t) => t.anchor_id === anchorFilter)
    return result
  }, [tasks, search, anchorFilter])

  const sortComparator = useMemo(() => {
    if (sortMode === 'alpha') return (a: Task, b: Task) => a.name.localeCompare(b.name)
    if (sortMode === 'recent') return (a: Task, b: Task) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    if (sortMode === 'anchor') return (a: Task, b: Task) => (a.anchor_id ?? '').localeCompare(b.anchor_id ?? '')
    return undefined
  }, [sortMode])

  const energyBuckets = useMemo(() => {
    const buckets: Record<'low' | 'medium' | 'high' | 'unscored', number> = { low: 0, medium: 0, high: 0, unscored: 0 }
    for (const t of activeTasks) {
      const lvl = t.energy_level
      if (lvl === 'low' || lvl === 'medium' || lvl === 'high') buckets[lvl]++
      else buckets.unscored++
    }
    return buckets
  }, [activeTasks])
  const maxBucket = Math.max(...Object.values(energyBuckets), 1)

  const anchorCounts = anchors
    .map((a) => ({ anchor: a, count: activeTasks.filter((t) => t.anchor_id === a.id).length }))
    .sort((a, b) => b.count - a.count)

  function startTask(taskId: string, name: string, anchorName: string | null) {
    const p = new URLSearchParams({ taskId, task: name })
    if (anchorName) p.set('anchor', anchorName)
    router.push(`/now?${p.toString()}`)
  }

  function quickAdd(name: string, anchorId: string | null) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const task: Task = {
      id, user_id: user.id, name, status: 'active', aes_score: null, energy_level: null,
      anchor_id: anchorId, decay_started_at: null, completed_at: null, created_at: now, updated_at: now,
    }
    void addTask(task)
    void scoreTasksBatch([name])
      .then(([scored]) => {
        if (scored) void updateTask(id, { aes_score: scored.aes, energy_level: aesToEnergy(scored.aes) })
      })
      .catch(() => {})
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
    <main style={{ padding: 56, maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 40, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p className="text-section-label">TASKS</p>
            <p className="text-meta" style={{ marginTop: 4, fontSize: 13 }}>{activeTasks.length} active · {limboTasks.length} in limbo</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <ToolbarButton testId="anchor-manager-trigger" onClick={() => setAnchorManagerOpen(true)}>anchors</ToolbarButton>
            <ToolbarButton testId="selection-mode-toggle" active={selectionMode} onClick={() => (selectionMode ? clearSelection() : setSelectionMode(true))}>
              <SelectIcon /> select
            </ToolbarButton>
            <ToolbarButton testId="limbo-trigger" onClick={() => setLimboOpen(true)}>
              <ClockIcon /> limbo
              {limboTasks.length > 0 && <CountBadge>{limboTasks.length}</CountBadge>}
            </ToolbarButton>
          </div>
        </div>

        <div className="glass" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
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

        {completedToday.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <p className="text-section-label" style={{ letterSpacing: '0.08em', opacity: 0.7 }}>DONE TODAY · {completedToday.length}</p>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {completedToday.map((t) => (
                <div key={t.id} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-tertiary)', textDecoration: 'line-through', opacity: 0.7 }}>{t.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <RailCard title="OVERVIEW">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <MiniStat label="active" value={activeTasks.length} />
            <MiniStat label="done today" value={completedToday.length} />
            <MiniStat label="in limbo" value={limboTasks.length} />
            <MiniStat label="archived" value={archivedTasks.length} />
          </div>
        </RailCard>

        <RailCard title="BY ENERGY">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['low', 'medium', 'high', 'unscored'] as const).map((k) => (
              <div key={k}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k}</span>
                  <span className="text-micro-mono">{energyBuckets[k]}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: 'var(--surface)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(energyBuckets[k] / maxBucket) * 100}%`, background: ENERGY_COLOR[k], opacity: 0.8, borderRadius: 999, transition: 'width 500ms var(--ease-focus)' }} />
                </div>
              </div>
            ))}
          </div>
        </RailCard>

        {anchorCounts.length > 0 && (
          <RailCard title="BY ANCHOR">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {anchorCounts.map(({ anchor, count }) => (
                <button
                  key={anchor.id}
                  type="button"
                  onClick={() => setAnchorFilter(anchor.id)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: anchor.color }} />
                    {anchor.name}
                  </span>
                  <span className="text-micro-mono">{count}</span>
                </button>
              ))}
            </div>
          </RailCard>
        )}
      </div>

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
        onStart={(task) => { setDetailTask(null); startTask(task.id, task.name, anchorFor(task)?.name ?? null) }}
        onMarkDone={(task) => { handleComplete(task); setDetailTask(null) }}
        onSendToLimbo={(task) => { setStatus(task.id, 'limbo'); setDetailTask(null); toast.undo(`"${task.name}" sent to limbo.`, () => setStatus(task.id, 'active')) }}
        onArchive={(task) => { setStatus(task.id, 'archived'); setDetailTask(null); toast.undo(`"${task.name}" archived.`, () => setStatus(task.id, 'active')) }}
        onRestore={(task) => { setStatus(task.id, 'active'); setDetailTask(null) }}
        onDelete={(task) => { void removeTask(task.id); toast.info(`"${task.name}" deleted.`) }}
      />
      <BulkActionBar count={selectedIds.size} onComplete={() => bulkApply('done')} onLimbo={() => bulkApply('limbo')} onArchive={() => bulkApply('archived')} onClear={clearSelection} />
    </main>
  )
}