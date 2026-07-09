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
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

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
    const t = setTimeout(() => setPulseActive(false), 700)
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
        transform: pulseActive ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 700ms var(--ease-spring)',
        filter: pulseActive
          ? 'drop-shadow(0 0 24px var(--accent)) drop-shadow(0 0 8px var(--accent))'
          : 'drop-shadow(0 0 10px color-mix(in srgb, var(--accent) 55%, transparent))',
      }}
      data-testid="timer-ring"
      data-progress={progress.toFixed(3)}
    >
      <circle cx={100} cy={100} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      {/* Soft under-glow ring, drawn thicker + more transparent, sits
          behind the crisp progress ring for that "bigger glow" feel */}
      <circle
        cx={100}
        cy={100}
        r={RADIUS}
        fill="none"
        stroke="var(--accent)"
        strokeOpacity={0.25}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 1000ms linear' }}
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