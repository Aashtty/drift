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
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'

export default function NowPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { user } = useUser()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)

  const taskId = params.get('taskId')
  const taskName = params.get('task') ?? 'Untitled task'
  const anchorName = params.get('anchor')

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  const baseDurationSeconds = (settings?.base_session_minutes ?? 20) * 60

  const { elapsedSeconds, phase, justPulsed } = useElasticTimer({ baseDurationSeconds })
  const { state, transition } = useAppState()
  const startSession = useSessionStore((s) => s.startSession)
  const endSession = useSessionStore((s) => s.endSession)
  const setHyperfocus = useSessionStore((s) => s.setHyperfocus)
  const [locked, setLocked] = useState(false)
  const [started, setStarted] = useState(false)
  // Ref guard, not state — survives React 18 dev-mode double-invoke of
  // effects without cleanup. A state-based guard can be read stale by a
  // second synchronous invocation before the first setState commits.
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

  function handleLockIn() {
    setLocked(true)
    setHyperfocus(true)
  }

  async function endAndRoute(path: string) {
    if (!user) return
    const stateAtEnd = phase === 'FLOW' ? 'FLOW' : 'FOCUS'
    try {
      await endSession(user.id, elapsedSeconds, phase === 'FLOW', stateAtEnd)
    } catch (err: any) {
      // Session row failed to save remotely even after retries (offline,
      // real DB error, etc). Don't trap the user here — route them out
      // regardless; the session record is just lost this once.
      console.error('Session failed to save:', err?.message ?? err)
    }
    transition('DRIFT')
    router.push(path)
  }

  if (!user || !settings || !started) return null
  if (locked) return <HyperfocusLock taskName={taskName} onExit={() => setLocked(false)} />

  return (
    <>
      <NowBar
        taskName={taskName}
        anchorName={anchorName}
        elapsedSeconds={elapsedSeconds}
        baseDurationSeconds={baseDurationSeconds}
        phase={phase}
        justPulsed={justPulsed}
        appState={state}
        onDone={() => void endAndRoute('/drift-summary')}
        onPause={() => void endAndRoute('/')}
        onLockIn={handleLockIn}
      />
      <SoundControl />
    </>
  )
}