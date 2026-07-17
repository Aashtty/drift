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
  /**
   * If set, the timer begins already paused, with elapsed frozen at
   * this timestamp - this (plus initialTimerState's freezeAtMs) is
   * what actually fixes "comes back not really paused": the recovered
   * timer's very first render already shows the correct frozen value
   * and isn't ticking, instead of computing off Date.now() and then
   * needing a separate correction.
   */
  initialPausedAtMs?: number | null
}

export function useElasticTimer({
  baseDurationSeconds,
  tickMs = 1000,
  autoStart = true,
  startedAtMs,
  initialPausedAtMs = null,
}: UseElasticTimerOptions) {
  const [state, setState] = useState<ElasticTimerState>(() =>
    initialTimerState(startedAtMs, baseDurationSeconds, initialPausedAtMs ?? undefined)
  )
  const startsPaused = initialPausedAtMs != null
  const [running, setRunning] = useState(startsPaused ? false : autoStart)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedAtRef = useRef<number | null>(initialPausedAtMs ?? null)
  const runningRef = useRef(startsPaused ? false : autoStart)

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
      // Works correctly whether pausedAtRef holds "a second ago" (a
      // normal in-session pause) or "yesterday" (a recovered session
      // that sat paused across a reload/navigation) - either way this
      // shifts startedAtMs forward by exactly the real idle duration.
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