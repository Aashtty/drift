// apps/web/src/components/core/EdgeArc.tsx
'use client'

import { useEffect, useState } from 'react'
import { fuzzyTimeLabel, exactTimeLabel } from '@/lib/utils/fuzzyTime'
import type { CalendarEvent } from '@/types/calendar'

function getDayProgressColor(progress: number): string {
  if (progress < 0.33) return 'hsl(210, 70%, 60%)'
  if (progress < 0.66) return 'hsl(38, 90%, 55%)'
  return 'hsl(0, 80%, 55%)'
}

function getDayProgress(dayStartHour: number, dayEndHour: number): number {
  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const startMinutes = dayStartHour * 60
  const endMinutes = dayEndHour * 60
  const total = endMinutes - startMinutes
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, (minutesNow - startMinutes) / total))
}

interface EdgeArcProps {
  fuzzyTime?: boolean
  dayStartHour?: number
  dayEndHour?: number
  nearEvent?: CalendarEvent | null
}

export function EdgeArc({ fuzzyTime = false, dayStartHour = 9, dayEndHour = 19, nearEvent = null }: EdgeArcProps) {
  const [progress, setProgress] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [hoverY, setHoverY] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    setProgress(getDayProgress(dayStartHour, dayEndHour))
    const interval = setInterval(() => setProgress(getDayProgress(dayStartHour, dayEndHour)), 60_000)
    return () => clearInterval(interval)
  }, [dayStartHour, dayEndHour])

  useEffect(() => {
    if (nearEvent) setPulseKey((k) => k + 1)
  }, [nearEvent?.id])

  const color = nearEvent ? 'var(--accent)' : getDayProgressColor(progress)
  const now = new Date()
  const label = nearEvent
    ? `${nearEvent.summary} soon`
    : fuzzyTime
    ? fuzzyTimeLabel(now)
    : exactTimeLabel(now)

  return (
    <div
      data-testid="edge-arc"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={(e) => setHoverY(e.clientY)}
      style={{ position: 'fixed', left: 0, top: 0, width: 3, height: '100vh', zIndex: 10, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', paddingRight: 8 }}
    >
      <div
        key={pulseKey}
        style={{
          position: 'absolute', top: 0, left: 0, width: 3,
          height: `${progress * 100}%`, background: color,
          boxShadow: `0 0 8px -1px ${color}`,
          transition: 'height 800ms var(--ease-focus), background 800ms var(--ease-focus)',
          animation: nearEvent ? 'edge-arc-event-pulse 1s var(--ease-spring) 3' : 'none',
        }}
      />
      <style>{`
        @keyframes edge-arc-event-pulse {
          0% { box-shadow: 0 0 0 0 var(--accent); }
          50% { box-shadow: 3px 0 10px 2px var(--accent); }
          100% { box-shadow: 0 0 0 0 var(--accent); }
        }
      `}</style>
      {hovering && (
        <div data-testid="edge-arc-tooltip" className="glass" style={{ position: 'fixed', left: 12, top: hoverY - 12, padding: '4px 10px', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {label}
        </div>
      )}
    </div>
  )
}