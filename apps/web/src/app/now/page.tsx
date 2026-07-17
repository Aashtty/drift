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
import { useAudioStore } from '@/stores/audioStore'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { fetchSessionsRemote } from '@/lib/db/queries'
import { toast } from '@/stores/toastStore'

const MIN_SESSION_MINUTES = 5
const EVENT_NOTIFY_MINUTES = 15
const EVENT_CHECK_INTERVAL_MS = 10_000
const TASK_HISTORY_LOOKBACK_DAYS = 3650

interface SessionSeed {
  startedAtMs: number
  baseDurationSeconds: number
  recovered: boolean
  pausedAtMs: number | null
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
      const pausedAtMs = existing.pausedAt ? new Date(existing.pausedAt).getTime() : null
      const recoveredMinutes = Math.floor(((pausedAtMs ?? Date.now()) - startedAtMs) / 60000)
      setSeed({ startedAtMs, baseDurationSeconds: existing.baseDurationSeconds, recovered: true, pausedAtMs })
      toast.info(
        pausedAtMs != null
          ? `Welcome back - this session is still paused at ${recoveredMinutes}m.`
          : recoveredMinutes > 0
          ? `Welcome back - resumed your session from ${recoveredMinutes}m ago.`
          : 'Welcome back - resumed your session.'
      )
    } else {
      if (existing) {
        toast.info("Starting a new session - your last one wasn't wrapped up, so its time may be short.")
      }
      const baseDurationSeconds = Math.max(MIN_SESSION_MINUTES, settings.base_session_minutes) * 60
      startSession(taskId, baseDurationSeconds)
      setSeed({ startedAtMs: Date.now(), baseDurationSeconds, recovered: false, pausedAtMs: null })
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
  const { events } = useCalendarBridge(user?.id ?? null)
  const settings = useSettingsStore((s) => s.settings)
  const audioMode = useAudioStore((s) => s.mode)
  const lastNonOffMode = useAudioStore((s) => s.lastNonOffMode)
  const manuallyMuted = useAudioStore((s) => s.manuallyMuted)
  const setAudioMode = useAudioStore((s) => s.setMode)

  const anchorName = params.get('anchor')
  const [displayName, setDisplayName] = useState(params.get('task') ?? 'Untitled task')
  const [locked, setLocked] = useState(false)
  const [ending, setEnding] = useState(false)
  const [todayFocusedSeconds, setTodayFocusedSeconds] = useState<number | null>(null)
  const [taskHistory, setTaskHistory] = useState<{ sessionCount: number; totalMinutes: number } | null>(null)
  const notifiedEventIdRef = useRef<string | null>(null)
  const autoSoundTriedRef = useRef(false)

  const { elapsedSeconds, phase, justPulsed, paused, pause, resume } = useElasticTimer({
    baseDurationSeconds: seed.baseDurationSeconds,
    startedAtMs: seed.startedAtMs,
    initialPausedAtMs: seed.pausedAtMs,
  })

  useEffect(() => {
    transition('FOCUS')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === 'FLOW' && state === 'FOCUS') transition('FLOW')
  }, [phase, state, transition])

  // Real bug fix: only auto-resume if the person never explicitly
  // muted. Previously this only checked lastNonOffMode, so turning
  // sound off yourself and leaving would get silently reversed the
  // very next time you started a task - lastNonOffMode never got
  // cleared just because you turned sound off, since that was
  // deliberately kept so a NEW session could resume it. The missing
  // piece was distinguishing "explicitly off" from "was never on" -
  // see audioStore.ts's manuallyMuted.
  useEffect(() => {
    if (autoSoundTriedRef.current) return
    autoSoundTriedRef.current = true
    if (settings?.sound_enabled && audioMode === 'off' && lastNonOffMode !== 'off' && !manuallyMuted) {
      void setAudioMode(lastNonOffMode).catch(() => {})
    }
  }, [settings, audioMode, lastNonOffMode, manuallyMuted, setAudioMode])

  useEffect(() => {
    return () => {
      void useAudioStore.getState().hardStop()
    }
  }, [])

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
    if (!user || !taskId) return
    let cancelled = false
    fetchSessionsRemote(user.id, TASK_HISTORY_LOOKBACK_DAYS)
      .then((sessions) => {
        if (cancelled) return
        const relevant = sessions.filter((s) => s.task_id === taskId)
        const totalSeconds = relevant.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
        setTaskHistory({ sessionCount: relevant.length, totalMinutes: Math.round(totalSeconds / 60) })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user, taskId])

  const upcoming = events
    .filter((e) => new Date(e.start).getTime() > Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const nextEvent = upcoming[0] ?? null

  useEffect(() => {
    const interval = setInterval(() => {
      if (!nextEvent) return
      const mins = Math.round((new Date(nextEvent.start).getTime() - Date.now()) / 60000)
      if (mins <= EVENT_NOTIFY_MINUTES && mins >= 0 && notifiedEventIdRef.current !== nextEvent.id) {
        notifiedEventIdRef.current = nextEvent.id
        toast.info(`"${nextEvent.summary}" starts ${mins <= 0 ? 'now' : `in ${mins}m`}.`)
      }
    }, EVENT_CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [nextEvent])

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

  // The actual fix for "pause shows in NowBar but keeps running
  // elsewhere": both the local display timer AND the global session
  // store now get told about every pause/resume, in that order, so
  // Dashboard and a later recovery both see the truth.
  function handleTogglePause() {
    if (paused) {
      useSessionStore.getState().resumeSession()
      resume()
    } else {
      useSessionStore.getState().pauseSession()
      pause()
    }
  }

  function handleRename(newName: string) {
    setDisplayName(newName)
    if (taskId) void updateTask(taskId, { name: newName })
  }

  async function endAndRoute(path: string, restingState: 'IDLE' | 'DRIFT') {
    if (!user || ending) return
    setEnding(true)
    const stateAtEnd = phase === 'FLOW' ? 'FLOW' : 'FOCUS'
    try {
      await endSession(user.id, elapsedSeconds, phase === 'FLOW', stateAtEnd)
    } catch (err: any) {
      console.error('Session failed to save:', err?.message ?? err)
      toast.error("Couldn't save this session - your focus time this round wasn't recorded.")
    }
    transition(restingState)
    router.push(path)
  }

  async function handleMarkDone() {
    if (taskId) {
      await updateTask(taskId, { status: 'done', completed_at: new Date().toISOString() })
    }
    await endAndRoute('/drift-summary', 'DRIFT')
  }

  function handleBackToDashboard() {
    router.push('/')
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
        nextEvent={nextEvent}
        taskHistory={taskHistory}
        onDone={() => void handleMarkDone()}
        onEnd={() => void endAndRoute('/', 'IDLE')}
        onBackToDashboard={handleBackToDashboard}
        onLockIn={handleLockIn}
        onTogglePause={handleTogglePause}
        onRename={taskId ? handleRename : undefined}
      />
      <SoundControl />
    </>
  )
}