// apps/web/src/app/now/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useElasticTimer } from '@/hooks/useElasticTimer'
import { NowBar } from '@/components/core/NowBar'
import { HyperfocusLock } from '@/components/session/HyperfocusLock'
import { SoundControl } from '@/components/session/SoundControl'
import { useAppState } from '@/hooks/useAppState'
import { useSessionStore } from '@/stores/sessionStore'
import { useTaskStore } from '@/stores/taskStore'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { fetchSessionsRemote } from '@/lib/db/queries'
import { toast } from '@/stores/toastStore'

const MIN_SESSION_MINUTES = 5

interface SessionSeed {
  startedAtMs: number
  baseDurationSeconds: number
  recovered: boolean
}

export default function NowPage() {
  const params = useSearchParams()
  const { user } = useUser()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const startSession = useSessionStore((s) => s.startSession)

  const taskId = params.get('taskId')
  const [seed, setSeed] = useState<SessionSeed | null>(null)
  const resolvedRef = useRef(false)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  useEffect(() => {
    if (!settings || resolvedRef.current) return
    resolvedRef.current = true

    const existing = useSessionStore.getState().active
    const isRecoverable = Boolean(existing && existing.taskId === taskId)

    if (isRecoverable && existing) {
      const startedAtMs = new Date(existing.startedAt).getTime()
      const recoveredMinutes = Math.floor((Date.now() - startedAtMs) / 60000)
      setSeed({ startedAtMs, baseDurationSeconds: existing.baseDurationSeconds, recovered: true })
      toast.info(
        recoveredMinutes > 0
          ? `Welcome back — resumed your session from ${recoveredMinutes}m ago.`
          : 'Welcome back — resumed your session.'
      )
    } else {
      if (existing) {
        toast.info("Starting a new session — your last one wasn't wrapped up, so its time may be short.")
      }
      const baseDurationSeconds = Math.max(MIN_SESSION_MINUTES, settings.base_session_minutes) * 60
      startSession(taskId, baseDurationSeconds)
      setSeed({ startedAtMs: Date.now(), baseDurationSeconds, recovered: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  if (!user || !settings || !seed) return null

  return <NowSession seed={seed} taskId={taskId} />
}

function NowSession({ seed, taskId }: { seed: SessionSeed; taskId: string | null }) {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useUser()
  const updateTask = useTaskStore((s) => s.updateTask)
  const { state, transition } = useAppState()
  const endSession = useSessionStore((s) => s.endSession)
  const setHyperfocus = useSessionStore((s) => s.setHyperfocus)

  const anchorName = params.get('anchor')
  const [displayName, setDisplayName] = useState(params.get('task') ?? 'Untitled task')
  const [locked, setLocked] = useState(false)
  const [ending, setEnding] = useState(false)
  const [todayFocusedSeconds, setTodayFocusedSeconds] = useState<number | null>(null)

  const { elapsedSeconds, phase, justPulsed, paused, pause, resume } = useElasticTimer({
    baseDurationSeconds: seed.baseDurationSeconds,
    startedAtMs: seed.startedAtMs,
  })

  useEffect(() => {
    transition('FOCUS')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === 'FLOW' && state === 'FOCUS') transition('FLOW')
  }, [phase, state, transition])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchSessionsRemote(user.id, 1)
      .then((sessions) => {
        if (cancelled) return
        const todayStr = new Date().toDateString()
        const total = sessions
          .filter((s) => new Date(s.started_at).toDateString() === todayStr)
          .reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
        setTodayFocusedSeconds(total)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (locked) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [locked])

  function handleLockIn() {
    if (paused) return
    setLocked(true)
    setHyperfocus(true)
  }

  function handleTogglePause() {
    if (paused) resume()
    else pause()
  }

  function handleRename(newName: string) {
    setDisplayName(newName)
    if (taskId) void updateTask(taskId, { name: newName })
  }

  // `restingState` is the real fix for the color-bleed bug: ending a
  // session used to always call transition('DRIFT') regardless of
  // where you were headed next. That was fine on the way to
  // drift-summary (which itself resets to IDLE when you hit Continue),
  // but "End session" routes straight back to '/' with no such reset —
  // so the whole app stayed tinted DRIFT's color (amber) indefinitely,
  // which is exactly what showed up as an unexpectedly orange Tasks
  // page. Dashboard/Tasks now also force IDLE defensively on mount, so
  // this is fixed twice over — at the source and as a safety net.
  async function endAndRoute(path: string, restingState: 'IDLE' | 'DRIFT') {
    if (!user || ending) return
    setEnding(true)
    const stateAtEnd = phase === 'FLOW' ? 'FLOW' : 'FOCUS'
    try {
      await endSession(user.id, elapsedSeconds, phase === 'FLOW', stateAtEnd)
    } catch (err: any) {
      console.error('Session failed to save:', err?.message ?? err)
      toast.error("Couldn't save this session — your focus time this round wasn't recorded.")
    }
    transition(restingState)
    router.push(path)
  }

  if (locked) {
    return (
      <HyperfocusLock
        taskName={displayName}
        elapsedSeconds={elapsedSeconds}
        onExit={() => {
          setLocked(false)
          setHyperfocus(false)
        }}
      />
    )
  }

  return (
    <>
      <NowBar
        taskName={displayName}
        anchorName={anchorName}
        elapsedSeconds={elapsedSeconds}
        baseDurationSeconds={seed.baseDurationSeconds}
        phase={phase}
        justPulsed={justPulsed}
        appState={state}
        paused={paused}
        ending={ending}
        todayFocusedSeconds={todayFocusedSeconds != null ? todayFocusedSeconds + elapsedSeconds : null}
        onDone={() => void endAndRoute('/drift-summary', 'DRIFT')}
        onEnd={() => void endAndRoute('/', 'IDLE')}
        onLockIn={handleLockIn}
        onTogglePause={handleTogglePause}
        onRename={taskId ? handleRename : undefined}
      />
      <SoundControl />
    </>
  )
}