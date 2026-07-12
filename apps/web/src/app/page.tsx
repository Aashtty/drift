// apps/web/src/app/page.tsx
'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useTaskDecay } from '@/hooks/useTaskDecay'
import { TaskList } from '@/components/tasks/TaskList'
import { UpcomingEvents } from '@/components/events/UpcomingEvents'
import { useUser } from '@/hooks/useUser'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTaskStore } from '@/stores/taskStore'
import type { Task } from '@/types/task'

const DevStateSwitcher =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('@/components/core/DevStateSwitcher').then((m) => m.DevStateSwitcher))
    : () => null

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'still up.'
  if (hour < 12) return 'morning.'
  if (hour < 17) return 'afternoon.'
  if (hour < 21) return 'evening.'
  return 'late one.'
}

export default function DashboardPage() {
  const { user } = useUser()
  const router = useRouter()
  const { tasks, anchorFor, markComplete } = useTaskEngine(user?.id ?? '')
  const { events, refreshManualEvents } = useCalendarBridge(user?.id ?? null)
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const setStatus = useTaskStore((s) => s.setStatus)
  useTaskDecay()

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  if (!user) return null

  function startTask(taskId: string, name: string, anchorName: string | null) {
    const params = new URLSearchParams({ taskId, task: name })
    if (anchorName) params.set('anchor', anchorName)
    router.push(`/now?${params.toString()}`)
  }

  // Was defined on TaskCard/TaskList already but never actually wired up
  // here — the "not right now" limbo icon on task cards had no handler
  // passed in, so it never rendered.
  function sendToLimbo(task: Task) {
    void setStatus(task.id, 'limbo')
  }

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 1,
        padding: '64px 56px',
        display: 'flex',
        gap: 72,
        minHeight: '100vh',
      }}
    >
      <div style={{ flex: 1, maxWidth: 640 }}>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-glow"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}
        >
          {greeting()}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12, duration: 0.5 }}
          className="text-meta"
          style={{ marginBottom: 44, fontSize: 13.5 }}
        >
          {tasks.length > 0 ? `${tasks.length} on the board today` : 'nothing on the board yet — add something to start'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 18,
          }}
        >
          <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>UP NEXT</p>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <TaskList
            tasks={tasks}
            anchorFor={anchorFor}
            defaultEnergy={settings?.energy_default ?? 'high'}
            onTaskStart={(task) => startTask(task.id, task.name, anchorFor(task)?.name ?? null)}
            onTaskComplete={(task) => void markComplete(task)}
            onTaskSendToLimbo={sendToLimbo}
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
    </main>
  )
}