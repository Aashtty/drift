// apps/web/src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { useMomentum } from '@/hooks/useMomentum'
import { useAppState } from '@/hooks/useAppState'
import { useLiveSessionElapsed } from '@/hooks/useLiveSessionElapsed'
import { useTodaysPriorityTaskId } from '@/hooks/useTodaysPriority'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { UpcomingEvents } from '@/components/events/UpcomingEvents'
import { NextMoveWidget } from '@/components/core/NextMoveWidget'
import { useUser } from '@/hooks/useUser'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSessionStore } from '@/stores/sessionStore'
import { fetchSessionsRemote } from '@/lib/db/queries'
import { formatElapsed } from '@/lib/utils/formatElapsed'
import { createScoredTask } from '@/lib/tasks/createScoredTask'
import { toast } from '@/stores/toastStore'
import type { Task, EnergyLevel } from '@/types/task'

const DevStateSwitcher = process.env.NODE_ENV !== 'production' ? dynamic(() => import('@/components/core/DevStateSwitcher').then((m) => m.DevStateSwitcher)) : () => null

const DASHBOARD_TASK_LIMIT = 8

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'still up.'
  if (hour < 12) return 'morning.'
  if (hour < 17) return 'afternoon.'
  if (hour < 21) return 'evening.'
  return 'late one.'
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass" style={{ padding: '14px 18px', flex: 1, minWidth: 120 }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-primary)', margin: 0 }}>{value}</p>
      <p className="text-micro-mono" style={{ marginTop: 3 }}>{label}</p>
    </div>
  )
}

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {action}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const { tasks, anchors, anchorFor, markComplete, updateTask, setStatus, removeTask } = useTaskEngine(user?.id ?? '')
  const { events, refreshManualEvents } = useCalendarBridge(user?.id ?? null)
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const activeSession = useSessionStore((s) => s.active)
  const { score, trend } = useMomentum(user?.id ?? '', tasks.filter((t) => t.status === 'done'))
  const { setState } = useAppState()
  // Real fix for "time isn't shown live on Dashboard" - previously
  // computed once at render with no ticking mechanism. Also now
  // correctly reflects paused sessions instead of counting through them.
  const { elapsedSeconds: resumeElapsedSeconds, paused: resumePaused } = useLiveSessionElapsed()
  const priorityTaskId = useTodaysPriorityTaskId()
  useTaskDecay()

  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const detailTask = detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null
  const [todayStats, setTodayStats] = useState<{ minutes: number; sessions: number } | null>(null)

  useEffect(() => {
    setState('IDLE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (user) void loadSettings(user.id) }, [user, loadSettings])

  useEffect(() => {
    if (!user) return
    fetchSessionsRemote(user.id, 1)
      .then((sessions) => {
        const todayStr = new Date().toDateString()
        const todaySessions = sessions.filter((s) => new Date(s.started_at).toDateString() === todayStr)
        const minutes = Math.round(todaySessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) / 60)
        setTodayStats({ minutes, sessions: todaySessions.length })
      })
      .catch(() => {})
  }, [user])

  if (!user) return null

  function startTask(taskId: string, name: string, anchorName: string | null) {
    const searchParams = new URLSearchParams({ taskId, task: name })
    if (anchorName) searchParams.set('anchor', anchorName)
    router.push(`/now?${searchParams.toString()}`)
  }

  function quickAdd(name: string, anchorId: string | null) {
    if (!user) return
    createScoredTask({ userId: user.id, name, anchorId })
  }

  function handleTaskComplete(task: Task) {
    void markComplete(task)
    toast.undo(`"${task.name}" marked done.`, () => setStatus(task.id, 'active'))
  }

  const activeTasks = tasks.filter((t) => t.status === 'active')
  const doneToday = tasks.filter((t) => t.status === 'done' && new Date(t.updated_at).toDateString() === new Date().toDateString())
  const resumeTaskName = activeSession ? tasks.find((t) => t.id === activeSession.taskId)?.name ?? 'a task' : null
  const anchorCounts = anchors.map((a) => ({ anchor: a, count: activeTasks.filter((t) => t.anchor_id === a.id).length })).sort((a, b) => b.count - a.count)

  return (
    <main style={{ position: 'relative', zIndex: 1, padding: 56, maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 48, alignItems: 'start', minHeight: '100vh' }}>
      <div>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="text-glow" style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{greeting()}</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.5 }} className="text-meta" style={{ marginBottom: 20, fontSize: 13.5 }}>
          {activeTasks.length > 0 ? `${activeTasks.length} on the board today` : 'nothing on the board yet - add something to start'}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13, duration: 0.4 }} style={{ marginBottom: 20 }}>
          <NextMoveWidget />
        </motion.div>

        {activeSession && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.4 }}
            onClick={() => startTask(activeSession.taskId ?? '', resumeTaskName ?? 'a task', null)}
            data-testid="resume-session-card"
            className="glass glass-interactive"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', border: '1px solid var(--border-accent)', boxShadow: 'var(--glow-accent-md)', marginBottom: 22, width: '100%', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <span aria-hidden="true" className={resumePaused ? undefined : 'animate-pulse-soft'} style={{ width: 8, height: 8, borderRadius: '50%', background: resumePaused ? 'var(--text-tertiary)' : 'var(--accent)', boxShadow: resumePaused ? 'none' : '0 0 8px 2px var(--accent)', flexShrink: 0 }} />
              <div>
                <p className="text-micro-mono" style={{ color: resumePaused ? 'var(--text-tertiary)' : 'var(--accent)', marginBottom: 3 }}>{resumePaused ? 'SESSION PAUSED' : 'SESSION IN PROGRESS'}</p>
                <p style={{ fontSize: 14.5, color: 'var(--text-primary)', margin: 0 }}>{resumeTaskName} - {formatElapsed(resumeElapsedSeconds)}</p>
              </div>
            </div>
            <span style={{ color: 'var(--accent)', fontSize: 13, flexShrink: 0 }}>{resumePaused ? 'resume ->' : 'view ->'}</span>
          </motion.button>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.19, duration: 0.4 }} style={{ marginBottom: 20 }}>
          <QuickAddTask onAdd={quickAdd} anchors={anchors} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22, duration: 0.4 }} style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatChip label="focused today" value={todayStats ? `${todayStats.minutes}m` : '-'} />
          <StatChip label="sessions" value={todayStats ? String(todayStats.sessions) : '-'} />
          <StatChip label="done today" value={String(doneToday.length)} />
          <StatChip label={`momentum ${trend === 'up' ? '^' : trend === 'down' ? 'v' : '-'}`} value={String(score)} accent />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.4 }}>
          <SectionHeader label="UP NEXT" action={activeTasks.length > DASHBOARD_TASK_LIMIT ? (<button type="button" onClick={() => router.push('/tasks')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer' }}>see all -&gt;</button>) : undefined} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <TaskList
            tasks={tasks}
            anchorFor={anchorFor}
            defaultEnergy={settings?.energy_default ?? 'high'}
            limit={DASHBOARD_TASK_LIMIT}
            onViewAll={() => router.push('/tasks')}
            onTaskStart={(task) => startTask(task.id, task.name, anchorFor(task)?.name ?? null)}
            onTaskComplete={handleTaskComplete}
            onOpenDetail={(task) => setDetailTaskId(task.id)}
            onEnergyChange={(level) => void updateSettings({ energy_default: level })}
            priorityTaskId={priorityTaskId}
          />
        </motion.div>

        <DevStateSwitcher />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.24, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="glass" style={{ padding: 22, boxShadow: 'var(--glow-accent-sm)' }}>
          <UpcomingEvents userId={user.id} events={events} onRefresh={refreshManualEvents} />
        </motion.div>

        {anchorCounts.length > 0 && (
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="glass" style={{ padding: 22 }} data-testid="dashboard-anchor-breakdown">
            <p className="text-section-label" style={{ marginBottom: 14 }}>ANCHORS</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {anchorCounts.map(({ anchor, count }) => (
                <button key={anchor.id} type="button" onClick={() => router.push(`/tasks?anchor=${anchor.id}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}><span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: anchor.color, boxShadow: `0 0 6px ${anchor.color}` }} />{anchor.name}</span>
                  <span className="text-micro-mono">{count}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <TaskDetailSheet
        task={detailTask}
        anchors={anchors}
        isPriority={detailTask?.id === priorityTaskId}
        onClose={() => setDetailTaskId(null)}
        onRename={(id, name) => void updateTask(id, { name })}
        onSetAnchor={(id, anchorId) => void updateTask(id, { anchor_id: anchorId })}
        onSetEnergy={(id, level) => void updateTask(id, { energy_level: level as EnergyLevel })}
        onStart={(task) => { setDetailTaskId(null); startTask(task.id, task.name, anchorFor(task)?.name ?? null) }}
        onMarkDone={(task) => { handleTaskComplete(task); setDetailTaskId(null) }}
        onSendToLimbo={(task) => { setStatus(task.id, 'limbo'); setDetailTaskId(null); toast.undo(`"${task.name}" sent to limbo.`, () => setStatus(task.id, 'active')) }}
        onArchive={(task) => { setStatus(task.id, 'archived'); setDetailTaskId(null); toast.undo(`"${task.name}" archived.`, () => setStatus(task.id, 'active')) }}
        onRestore={(task) => { setStatus(task.id, 'active'); setDetailTaskId(null) }}
        onDelete={(task) => { void removeTask(task.id); toast.info(`"${task.name}" deleted.`) }}
      />
    </main>
  )
}