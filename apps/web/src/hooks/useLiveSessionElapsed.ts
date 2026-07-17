// apps/web/src/hooks/useLiveSessionElapsed.ts
import { useEffect, useState } from 'react'
import { useSessionStore, computeActiveElapsedSeconds } from '@/stores/sessionStore'

/**
 * New. Fixes "the running session's time isn't shown live on
 * Dashboard" - the old code computed elapsed ONCE at render time with
 * no ticking mechanism at all, so the resume card's clock was frozen
 * until something else happened to re-render the page. This ticks
 * every second while the session is actually running, and correctly
 * stops ticking (freezes the display) while paused.
 */
export function useLiveSessionElapsed(): { elapsedSeconds: number; paused: boolean } {
  const active = useSessionStore((s) => s.active)
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!active || active.pausedAt) return
    const interval = setInterval(() => forceTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [active?.startedAt, active?.pausedAt])

  if (!active) return { elapsedSeconds: 0, paused: false }
  return { elapsedSeconds: computeActiveElapsedSeconds(active), paused: Boolean(active.pausedAt) }
}