// apps/web/src/components/core/EdgeArc.tsx
'use client'

import { useEffect, useState } from 'react'
import { fuzzyTimeLabel, exactTimeLabel } from '@/lib/utils/fuzzyTime'
import type { CalendarEvent } from '@/types/calendar'

// Was blue → amber → RED as the day went on, based purely on
// time-of-day, unrelated to any actual urgency. That fights the app's
// own stated philosophy elsewhere (elasticTimer counts UP, not down,
// specifically to avoid deadline pressure — see Onboarding copy). A
// persistent red bar creeping up the screen every afternoon sends the
// opposite signal. Swapped the top end for a warmer amber instead of
// alarm-red; still communicates "later in the day" without reading as
// a warning.
function getDayProgressColor(progress: number): string {
  if (progress < 0.33) return 'hsl(210, 70%, 60%)'
  if (progress < 0.66) return 'hsl(38, 90%, 55%)'
  return 'hsl(28, 85%, 58%)'
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
  events?: CalendarEvent[]
}

export function EdgeArc({
  fuzzyTime = false,
  dayStartHour = 9,
  dayEndHour = 19,
  nearEvent = null,
  events = [],
}: EdgeArcProps) {
  const [progress, setProgress] = useState(() => getDayProgress(dayStartHour, dayEndHour))
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

  const dayTicks = events
    .map((e) => {
      const d = new Date(e.start)
      const minutes = d.getHours() * 60 + d.getMinutes()
      const startMinutes = dayStartHour * 60
      const endMinutes = dayEndHour * 60
      const total = endMinutes - startMinutes
      if (total <= 0) return null
      const pos = (minutes - startMinutes) / total
      if (pos < 0 || pos > 1) return null
      return { id: e.id, pos, summary: e.summary }
    })
    .filter((t): t is { id: string; pos: number; summary: string } => t !== null)

  return (
    <div
      data-testid="edge-arc"
      role="img"
      aria-label={`Day progress: ${label}`}
      tabIndex={0}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={(e) => setHoverY(e.clientY)}
      onFocus={(e) => {
        setHovering(true)
        setHoverY(e.currentTarget.getBoundingClientRect().top + 60)
      }}
      onBlur={() => setHovering(false)}
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

      {dayTicks.map((t) => (
        <div
          key={t.id}
          data-testid="edge-arc-tick"
          title={t.summary}
          style={{
            position: 'absolute',
            left: -1.5,
            top: `${t.pos * 100}%`,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--text-primary)',
            opacity: 0.9,
            boxShadow: '0 0 6px 1px rgba(255,255,255,0.55)',
            transform: 'translateY(-3px)',
            pointerEvents: 'none',
          }}
        />
      ))}

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