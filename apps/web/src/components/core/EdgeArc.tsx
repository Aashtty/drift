// apps/web/src/components/core/EdgeArc.tsx
'use client'

import { useEffect, useState } from 'react'

function getDayProgressColor(progress: number): string {
  if (progress < 0.33) return 'hsl(210, 70%, 60%)' // blue
  if (progress < 0.66) return 'hsl(38, 90%, 55%)' // amber
  return 'hsl(0, 80%, 55%)' // red
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

export function EdgeArc() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(getDayProgress())
    const interval = setInterval(() => setProgress(getDayProgress()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const color = getDayProgressColor(progress)

  return (
    <div
      data-testid="edge-arc"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 4,
        height: '100vh',
        zIndex: 10,
        background: 'var(--border)',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${progress * 100}%`,
          background: color,
          transition: 'height 800ms var(--ease-focus), background 800ms var(--ease-focus)',
        }}
      />
    </div>
  )
}