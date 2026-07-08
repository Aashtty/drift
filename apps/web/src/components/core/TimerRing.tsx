// apps/web/src/components/core/TimerRing.tsx
'use client'

import { useEffect, useState } from 'react'
import type { AppState } from '@/types/appState'

interface TimerRingProps {
  elapsedSeconds: number
  baseDurationSeconds: number
  justPulsed: boolean
  state: AppState
  size?: number
}

const RADIUS = 88
const CIRCUMFERENCE = 2 * Math.PI * RADIUS // ≈ 552.92

export function TimerRing({
  elapsedSeconds,
  baseDurationSeconds,
  justPulsed,
  state,
  size = 200,
}: TimerRingProps) {
  const [pulseActive, setPulseActive] = useState(false)

  useEffect(() => {
    if (!justPulsed) return
    setPulseActive(true)
    const t = setTimeout(() => setPulseActive(false), 600)
    return () => clearTimeout(t)
  }, [justPulsed])

  const progress = Math.min(1, elapsedSeconds / baseDurationSeconds)
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{
        transform: pulseActive ? 'scale(1.08)' : 'scale(1)',
        transition: pulseActive
          ? 'transform 600ms var(--ease-spring)'
          : 'transform 600ms var(--ease-spring)',
      }}
      data-testid="timer-ring"
      data-progress={progress.toFixed(3)}
    >
      <circle
        cx={100}
        cy={100}
        r={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={3}
      />
      <circle
        cx={100}
        cy={100}
        r={RADIUS}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 1000ms linear, stroke 800ms var(--ease-focus)' }}
      />
    </svg>
  )
}