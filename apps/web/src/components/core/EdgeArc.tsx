// apps/web/src/components/core/EdgeArc.tsx
'use client'

import { useEffect, useState } from 'react'
import { fuzzyTimeLabel, exactTimeLabel } from '@/lib/utils/fuzzyTime'

function getDayProgressColor(progress: number): string {
  if (progress < 0.33) return 'hsl(210, 70%, 60%)'
  if (progress < 0.66) return 'hsl(38, 90%, 55%)'
  return 'hsl(0, 80%, 55%)'
}

function getDayProgress(dayStartHour = 9, dayEndHour = 19): number {
  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const startMinutes = dayStartHour * 60
  const endMinutes = dayEndHour * 60
  const total = endMinutes - startMinutes
  if (total <= 0) return 0
  const elapsed = minutesNow - startMinutes
  return Math.min(1, Math.max(0, elapsed / total))
}

interface EdgeArcProps {
  /** Wired to real user_settings in Phase 6 — defaults to exact time for now. */
  fuzzyTime?: boolean
}

export function EdgeArc({ fuzzyTime = false }: EdgeArcProps) {
  const [progress, setProgress] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [hoverY, setHoverY] = useState(0)

  useEffect(() => {
    setProgress(getDayProgress())
    const interval = setInterval(() => setProgress(getDayProgress()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const color = getDayProgressColor(progress)
  const now = new Date()
  const label = fuzzyTime ? fuzzyTimeLabel(now) : exactTimeLabel(now)

  return (
    <div
      data-testid="edge-arc"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={(e) => setHoverY(e.clientY)}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 4,
        height: '100vh',
        zIndex: 10,
        background: 'var(--border)',
        cursor: 'pointer',
        // widen the hit area slightly without widening the visual bar
        boxShadow: '4px 0 0 0 transparent',
        paddingRight: 8,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: `${progress * 100}%`,
          background: color,
          transition: 'height 800ms var(--ease-focus), background 800ms var(--ease-focus)',
        }}
      />
      {hovering && (
        <div
          data-testid="edge-arc-tooltip"
          className="glass"
          style={{
            position: 'fixed',
            left: 12,
            top: hoverY - 12,
            padding: '4px 10px',
            fontSize: 12,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}