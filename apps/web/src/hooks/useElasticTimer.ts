// apps/web/src/hooks/useElasticTimer.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  initialTimerState,
  tick,
  clearPulse,
  shiftStart,
  type ElasticTimerState,
} from '@/lib/utils/elasticTimer'

interface UseElasticTimerOptions {
  baseDurationSeconds: number
  tickMs?: number
  autoStart?: boolean
  startedAtMs?: number
}

export function useElasticTimer({
  baseDurationSeconds,
  tickMs = 1000,
  autoStart = true,
  startedAtMs,
}: UseElasticTimerOptions) {
  const [state, setState] = useState<ElasticTimerState>(() =>
    initialTimerState(startedAtMs, baseDurationSeconds)
  )
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedAtRef = useRef<number | null>(null)
  // Mirrors `running` synchronously so pause()/resume() never need to
  // read it through a setState updater. THIS IS THE PAUSE FIX: the
  // previous version put side effects (writing pausedAtRef, calling
  // setState) INSIDE a `setRunning(prev => { ...side effects...;
  // return next })` updater. React 18 Strict Mode deliberately
  // double-invokes updater functions in dev to catch exactly this —
  // so pausedAtRef could get stamped twice, and the resume-time clock
  // shift could get applied twice, silently corrupting the elapsed
  // time on resume. Side effects now run exactly once, outside any
  // updater, gated by this ref instead.
  const runningRef = useRef(autoStart)

  useEffect(() => {
    runningRef.current = running
  }, [running])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setState((prev) => tick(prev, baseDurationSeconds))
    }, tickMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, baseDurationSeconds, tickMs])

  useEffect(() => {
    if (!state.justPulsed) return
    const t = setTimeout(() => setState((prev) => clearPulse(prev)), 700)
    return () => clearTimeout(t)
  }, [state.justPulsed])

  const pause = useCallback(() => {
    if (!runningRef.current) return
    pausedAtRef.current = Date.now()
    runningRef.current = false
    setRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (runningRef.current) return
    if (pausedAtRef.current != null) {
      const pauseDurationMs = Date.now() - pausedAtRef.current
      setState((prev) => shiftStart(prev, pauseDurationMs))
      pausedAtRef.current = null
    }
    runningRef.current = true
    setRunning(true)
  }, [])

  const reset = useCallback(() => setState(initialTimerState()), [])

  return {
    elapsedSeconds: state.elapsedSeconds,
    phase: state.phase,
    justPulsed: state.justPulsed,
    running,
    paused: !running,
    pause,
    resume,
    reset,
  }
}