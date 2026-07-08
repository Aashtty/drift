// apps/web/src/hooks/useElasticTimer.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  initialTimerState,
  tick,
  clearPulse,
  type ElasticTimerState,
} from '@/lib/utils/elasticTimer'

interface UseElasticTimerOptions {
  baseDurationSeconds: number
  tickMs?: number // default 1000; pass e.g. 50 for accelerated dev-mode testing
  autoStart?: boolean
}

export function useElasticTimer({
  baseDurationSeconds,
  tickMs = 1000,
  autoStart = true,
}: UseElasticTimerOptions) {
  const [state, setState] = useState<ElasticTimerState>(initialTimerState())
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setState((prev) => tick(prev, baseDurationSeconds))
    }, tickMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, baseDurationSeconds, tickMs])

  // Consume the one-shot pulse flag shortly after it fires, so a UI
  // animation can key off `justPulsed` without it staying stuck true.
  useEffect(() => {
    if (!state.justPulsed) return
    const t = setTimeout(() => setState((prev) => clearPulse(prev)), 700)
    return () => clearTimeout(t)
  }, [state.justPulsed])

  const pause = useCallback(() => setRunning(false), [])
  const resume = useCallback(() => setRunning(true), [])
  const reset = useCallback(() => setState(initialTimerState()), [])

  return {
    elapsedSeconds: state.elapsedSeconds,
    phase: state.phase,
    justPulsed: state.justPulsed,
    running,
    pause,
    resume,
    reset,
  }
}