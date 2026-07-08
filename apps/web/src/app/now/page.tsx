// apps/web/src/app/now/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useElasticTimer } from '@/hooks/useElasticTimer'
import { NowBar } from '@/components/core/NowBar'
import { HyperfocusLock } from '@/components/session/HyperfocusLock'
import { useAppState } from '@/hooks/useAppState'
import { useSessionStore } from '@/stores/sessionStore'

const BASE_DURATION_SECONDS = 1200
const DEV_USER_ID = 'dev-local-user'

export default function NowPage() {
  const router = useRouter()
  const params = useSearchParams()
  const taskId = params.get('taskId')
  const taskName = params.get('task') ?? 'Untitled task'
  const anchorName = params.get('anchor')

  const { elapsedSeconds, phase, justPulsed } = useElasticTimer({
    baseDurationSeconds: BASE_DURATION_SECONDS,
  })
  const { state, transition } = useAppState()
  const startSession = useSessionStore((s) => s.startSession)
  const endSession = useSessionStore((s) => s.endSession)
  const setHyperfocus = useSessionStore((s) => s.setHyperfocus)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    startSession(taskId, BASE_DURATION_SECONDS)
    transition('FOCUS')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === 'FLOW' && state === 'FOCUS') transition('FLOW')
  }, [phase, state, transition])

  function handleLockIn() {
    setLocked(true)
    setHyperfocus(true)
    // DRIFT suppresses its OWN notifications while locked — see HyperfocusLock's
    // doc comment for the honest scope. No sendNotification() calls happen
    // anywhere while `locked` is true.
  }

  async function endAndRoute(path: string) {
    const stateAtEnd = phase === 'FLOW' ? 'FLOW' : 'FOCUS'
    await endSession(DEV_USER_ID, elapsedSeconds, phase === 'FLOW', stateAtEnd)
    transition('DRIFT')
    router.push(path)
  }

  if (locked) {
    return <HyperfocusLock taskName={taskName} onExit={() => setLocked(false)} />
  }

  return (
    <NowBar
      taskName={taskName}
      anchorName={anchorName}
      elapsedSeconds={elapsedSeconds}
      baseDurationSeconds={BASE_DURATION_SECONDS}
      phase={phase}
      justPulsed={justPulsed}
      appState={state}
      onDone={() => void endAndRoute('/drift-summary')}
      onPause={() => void endAndRoute('/')}
      onLockIn={handleLockIn}
    />
  )
}