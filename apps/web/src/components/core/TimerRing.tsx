// apps/web/src/components/core/TimerRing.tsx
'use client'

import { useEffect, useState } from 'react'
import type { AppState } from '@/types/appState'

interface TimerRingProps {
  elapsedSeconds: number
  baseDurationSeconds: number
  justPulsed: boolean
  state: AppState
  /** Dims and desaturates the ring, stops the glow pulse, and overlays a
   *  small pause glyph — the ring should visibly read "not moving"
   *  the instant the clock actually stops. */
  paused?: boolean
  size?: number
}

const RADIUS = 88
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GRADIENT_ID = 'timer-ring-flow-gradient'

export function TimerRing({
  elapsedSeconds,
  baseDurationSeconds,
  justPulsed,
  state,
  paused = false,
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
  const inFlow = state === 'FLOW'
  // Ring shifts from a single accent hue during FOCUS to a violet→cyan
  // gradient once FLOW kicks in — a visual payoff of the accent/accent-b
  // duotone from the token system, reinforcing the phase change beyond
  // the glow pulse alone, without adding any new UI chrome.
  const strokeColor = inFlow ? `url(#${GRADIENT_ID})` : 'var(--accent)'

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{
        transform: pulseActive ? 'scale(1.1)' : 'scale(1)',
        transition:
          'transform 700ms var(--ease-spring), opacity 400ms var(--ease-focus), filter 400ms var(--ease-focus)',
        filter: paused
          ? 'none'
          : pulseActive
          ? 'drop-shadow(0 0 24px var(--accent)) drop-shadow(0 0 8px var(--accent))'
          : 'drop-shadow(0 0 10px color-mix(in srgb, var(--accent) 55%, transparent))',
        opacity: paused ? 0.5 : 1,
      }}
      data-testid="timer-ring"
      data-progress={progress.toFixed(3)}
      data-paused={paused}
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-b)" />
        </linearGradient>
      </defs>

      <circle cx={100} cy={100} r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <circle
        cx={100}
        cy={100}
        r={RADIUS}
        fill="none"
        stroke={strokeColor}
        strokeOpacity={0.25}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 1000ms linear, stroke 800ms var(--ease-focus)' }}
      />
      <circle
        cx={100}
        cy={100}
        r={RADIUS}
        fill="none"
        stroke={strokeColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 100 100)"
        style={{ transition: 'stroke-dashoffset 1000ms linear, stroke 800ms var(--ease-focus)' }}
      />

      {paused && (
        <g transform="translate(100 100)" aria-hidden="true">
          <rect x={-9} y={-10} width={6} height={20} rx={2} fill="var(--text-primary)" opacity={0.85} />
          <rect x={3} y={-10} width={6} height={20} rx={2} fill="var(--text-primary)" opacity={0.85} />
        </g>
      )}
    </svg>
  )
}