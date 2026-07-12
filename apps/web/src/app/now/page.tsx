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
import { toast } from '@/stores/toastStore'

// A session shorter than this never gets clamped up — it's just the
// floor we protect against a bad/blank settings value (e.g. someone
// clears the "base session length" field, which would otherwise coerce
// to 0 and divide-by-zero every progress calc downstream in TimerRing).
const MIN_SESSION_MINUTES = 5

export default function NowPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useUser()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateTask = useTaskStore((s) => s.updateTask)

  const taskId = params.get('taskId')
  const anchorName = params.get('anchor')

  const [displayName, setDisplayName] = useState(params.get('task') ?? 'Untitled task')

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  const baseDurationSeconds = Math.max(MIN_SESSION_MINUTES, settings?.base_session_minutes ?? 20) * 60

  const { elapsedSeconds, phase, justPulsed } = useElasticTimer({ baseDurationSeconds })
  const { state, transition } = useAppState()
  const startSession = useSessionStore((s) => s.startSession)
  const endSession = useSessionStore((s) => s.endSession)
  const setHyperfocus = useSessionStore((s) => s.setHyperfocus)
  const [locked, setLocked] = useState(false)
  const [started, setStarted] = useState(false)
  const [ending, setEnding] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!settings || startedRef.current) return
    startedRef.current = true
    startSession(taskId, baseDurationSeconds)
    transition('FOCUS')
    setStarted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  useEffect(() => {
    if (phase === 'FLOW' && state === 'FOCUS') transition('FLOW')
  }, [phase, state, transition])

  // Warn on an actual tab close / hard refresh mid-session, not just
  // in-app navigation (which already routes through endAndRoute below).
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!started || locked) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [started, locked])

  function handleLockIn() {
    setLocked(true)
    setHyperfocus(true)
  }

  function handleRename(newName: string) {
    setDisplayName(newName)
    if (taskId) void updateTask(taskId, { name: newName })
  }

  // Renamed from "endAndRoute" only in spirit: this always ends the
  // session for real (there is no resumable pause in this build — see
  // NowBar's "End session" copy). What changed is that a failed save
  // is no longer swallowed silently: the person sees a toast telling
  // them the record didn't make it, instead of just losing the minutes
  // with zero indication anything went wrong.
  async function endAndRoute(path: string) {
    if (!user || ending) return
    setEnding(true)
    const stateAtEnd = phase === 'FLOW' ? 'FLOW' : 'FOCUS'
    try {
      await endSession(user.id, elapsedSeconds, phase === 'FLOW', stateAtEnd)
    } catch (err: any) {
      console.error('Session failed to save:', err?.message ?? err)
      toast.error("Couldn't save this session — your focus time this round wasn't recorded.")
    }
    transition('DRIFT')
    router.push(path)
  }

  if (!user || !settings || !started) return null
  if (locked) return <HyperfocusLock taskName={displayName} onExit={() => setLocked(false)} />

  return (
    <>
      <NowBar
        taskName={displayName}
        anchorName={anchorName}
        elapsedSeconds={elapsedSeconds}
        baseDurationSeconds={baseDurationSeconds}
        phase={phase}
        justPulsed={justPulsed}
        appState={state}
        ending={ending}
        onDone={() => void endAndRoute('/drift-summary')}
        onEnd={() => void endAndRoute('/')}
        onLockIn={handleLockIn}
        onBackToDashboard={() => void endAndRoute('/')}
        onRename={taskId ? handleRename : undefined}
      />
      <SoundControl />
    </>
  )
}