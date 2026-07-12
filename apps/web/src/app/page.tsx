// apps/web/src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { useMomentum } from '@/hooks/useMomentum'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskDetailSheet } from '@/components/tasks/TaskDetailSheet'
import { QuickAddTask } from '@/components/tasks/QuickAddTask'
import { UpcomingEvents } from '@/components/events/UpcomingEvents'
import { useUser } from '@/hooks/useUser'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { useSettingsStore } from '@/stores/settingsStore'
import { useSessionStore } from '@/stores/sessionStore'
import { fetchSessionsRemote } from '@/lib/db/queries'
import { formatElapsed } from '@/lib/utils/formatElapsed'
import { toast } from '@/stores/toastStore'
import type { Task, EnergyLevel } from '@/types/task'

const DevStateSwitcher =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('@/components/core/DevStateSwitcher').then((m) => m.DevStateSwitcher))
    : () => null

const DASHBOARD_TASK_LIMIT = 6

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'still up.'
  if (hour < 12) return 'morning.'
  if (hour < 17) return 'afternoon.'
  if (hour < 21) return 'evening.'
  return 'late one.'
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass" style={{ padding: '10px 16px', flex: 1, minWidth: 100 }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      <p className="text-micro-mono" style={{ marginTop: 2 }}>{label}</p>
    </div>
  )
}

/**
 * The dashboard's job is a calm daily glance, not a workspace — no
 * search, no sort, no bulk actions (that's what Tasks is for). What it
 * adds this pass: a resume-session card (previously an in-progress
 * session was invisible unless you happened to be on /now), a light
 * "today so far" stat strip, and a capped, curated task list instead of
 * the entire backlog dumped onto the landing screen.
 */
export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const { tasks, anchors, anchorFor, markComplete, updateTask, setStatus, removeTask, addTask } = useTaskEngine(user?.id ?? '')
  const { events, refreshManualEvents } = useCalendarBridge(user?.id ?? null)
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const activeSession = useSessionStore((s) => s.active)
  const { score, trend } = useMomentum(user?.id ?? '', tasks.filter((t) => t.status === 'done'))
  useTaskDecay()

  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [todayStats, setTodayStats] = useState<{ minutes: number; sessions: number } | null>(null)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

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
    const params = new URLSearchParams({ taskId, task: name })
    if (anchorName) params.set('anchor', anchorName)
    router.push(`/now?${params.toString()}`)
  }

  function quickAdd(name: string, anchorId: string | null) {
    if (!user) return
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

  function handleTaskComplete(task: Task) {
    void markComplete(task)
    toast.undo(`"${task.name}" marked done.`, () => setStatus(task.id, 'active'))
  }

  const resumeTaskName = activeSession
    ? tasks.find((t) => t.id === activeSession.taskId)?.name ?? 'a task'
    : null
  const resumeElapsedSeconds = activeSession ? Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000) : 0

  return (
    <main style={{ position: 'relative', zIndex: 1, padding: '64px 56px', display: 'flex', gap: 72, minHeight: '100vh' }}>
      <div style={{ flex: 1, maxWidth: 640 }}>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-glow"
          style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
        >
          {greeting()}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="text-meta"
          style={{ marginBottom: 20, fontSize: 13.5 }}
        >
          {tasks.filter((t) => t.status === 'active').length > 0
            ? `${tasks.filter((t) => t.status === 'active').length} on the board today`
            : 'nothing on the board yet — add something to start'}
        </motion.p>

        {activeSession && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.4 }}
            onClick={() => startTask(activeSession.taskId ?? '', resumeTaskName ?? 'a task', null)}
            data-testid="resume-session-card"
            className="glass glass-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '14px 18px',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--glow-accent-sm)',
              marginBottom: 20,
              width: '100%',
              cursor: 'pointer',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <p className="text-micro-mono" style={{ color: 'var(--accent)', marginBottom: 3 }}>SESSION IN PROGRESS</p>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', margin: 0 }}>{resumeTaskName} · {formatElapsed(resumeElapsedSeconds)}</p>
            </div>
            <span style={{ color: 'var(--accent)', fontSize: 13 }}>resume →</span>
          </motion.button>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.16, duration: 0.4 }}
          style={{ marginBottom: 20 }}
        >
          <QuickAddTask onAdd={quickAdd} anchors={anchors} />
        </motion.div>

        {todayStats && (todayStats.minutes > 0 || todayStats.sessions > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.19, duration: 0.4 }}
            style={{ display: 'flex', gap: 10, marginBottom: 24 }}
          >
            <StatChip label="focused today" value={`${todayStats.minutes}m`} />
            <StatChip label="sessions" value={String(todayStats.sessions)} />
            <StatChip label={`momentum ${trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}`} value={String(score)} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}
        >
          <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>UP NEXT</p>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <TaskList
            tasks={tasks}
            anchorFor={anchorFor}
            defaultEnergy={settings?.energy_default ?? 'high'}
            limit={DASHBOARD_TASK_LIMIT}
            onViewAll={() => router.push('/tasks')}
            onTaskStart={(task) => startTask(task.id, task.name, anchorFor(task)?.name ?? null)}
            onTaskComplete={handleTaskComplete}
            onOpenDetail={setDetailTask}
            onEnergyChange={(level) => void updateSettings({ energy_default: level })}
          />
        </motion.div>

        <DevStateSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass"
        style={{ width: 288, padding: 22, alignSelf: 'flex-start', boxShadow: 'var(--glow-accent-sm)' }}
      >
        <UpcomingEvents userId={user.id} events={events} onRefresh={refreshManualEvents} />
      </motion.div>

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
          handleTaskComplete(task)
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
    </main>
  )
}