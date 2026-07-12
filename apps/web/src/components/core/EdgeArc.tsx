// apps/web/src/components/core/EdgeArc.tsx
'use client'

import { useEffect, useState } from 'react'
import { fuzzyTimeLabel, exactTimeLabel } from '@/lib/utils/fuzzyTime'
import { useAppState } from '@/hooks/useAppState'
import type { CalendarEvent } from '@/types/calendar'

const STATE_ARC_COLOR: Record<string, string> = {
  IDLE: 'var(--text-tertiary)',
  FOCUS: 'var(--accent)',
  FLOW: 'var(--accent-b)',
  DRIFT: 'var(--warning)',
  SHUTDOWN: 'var(--success)',
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

/**
 * Fixes a real hydration mismatch: the fill height and the aria-label
 * both depended on `new Date()` / `toLocaleTimeString()`, evaluated once
 * during the server render and again during the client's first render —
 * two different instants. On top of that, Node's ICU data can format
 * "AM"/"PM" with different casing than the browser's ("12:45 AM" vs
 * "12:45 am"), which is exactly what Next's hydration warning caught.
 * Fix: `progress` and `label` both start at time-independent defaults
 * (0 and a static string) on every render until a `mounted` flag flips
 * true inside a useEffect — which only ever runs on the client, after
 * hydration is already done. The real values land a frame later
 * (imperceptible), but strictly after hydration, so React never
 * compares a server-rendered string against a different client one.
 */
export function EdgeArc({
  fuzzyTime = false,
  dayStartHour = 9,
  dayEndHour = 19,
  nearEvent = null,
  events = [],
}: EdgeArcProps) {
  const { state } = useAppState()
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [hoverY, setHoverY] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    setMounted(true)
    setProgress(getDayProgress(dayStartHour, dayEndHour))
    const interval = setInterval(() => setProgress(getDayProgress(dayStartHour, dayEndHour)), 60_000)
    return () => clearInterval(interval)
  }, [dayStartHour, dayEndHour])

  useEffect(() => {
    if (nearEvent) setPulseKey((k) => k + 1)
  }, [nearEvent?.id])

  const color = nearEvent ? 'var(--accent)' : STATE_ARC_COLOR[state] ?? 'var(--text-tertiary)'
  const now = new Date()
  const label = !mounted
    ? 'Day progress'
    : nearEvent
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
      return { id: e.id, pos, summary: e.summary, start: e.start }
    })
    .filter((t): t is { id: string; pos: number; summary: string; start: string } => t !== null)

  const remainingToday = events
    .filter((e) => new Date(e.start).toDateString() === now.toDateString() && new Date(e.start).getTime() > Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  return (
    <div
      data-testid="edge-arc"
      role="button"
      aria-label={`${label}. Click to view today's schedule.`}
      tabIndex={0}
      onClick={() => setAgendaOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setAgendaOpen((o) => !o)
        }
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onMouseMove={(e) => setHoverY(e.clientY)}
      style={{ position: 'fixed', left: 0, top: 0, width: 10, height: '100vh', zIndex: 'var(--z-arc)' as any, cursor: 'pointer', paddingRight: 8 }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: 'rgba(255,255,255,0.04)' }}>
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

        {mounted && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: -2.5,
              top: `${progress * 100}%`,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: color,
              transform: 'translateY(-50%)',
              boxShadow: `0 0 10px 2px ${color}`,
              animation: 'pulse-soft 2.4s var(--ease-focus) infinite',
            }}
          />
        )}

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
      </div>

      <style>{`
        @keyframes edge-arc-event-pulse {
          0% { box-shadow: 0 0 0 0 var(--accent); }
          50% { box-shadow: 3px 0 10px 2px var(--accent); }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>

      {hovering && !agendaOpen && mounted && (
        <div data-testid="edge-arc-tooltip" className="glass" style={{ position: 'fixed', left: 16, top: hoverY - 12, padding: '4px 10px', fontSize: 12, color: 'var(--text-primary)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {label}
        </div>
      )}

      {agendaOpen && (
        <div
          data-testid="edge-arc-agenda"
          className="glass-chromatic"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', left: 16, top: 40, padding: 16, width: 240, zIndex: 'var(--z-popover)' as any }}
        >
          <p className="text-section-label" style={{ marginBottom: 10 }}>TODAY</p>
          {remainingToday.length === 0 ? (
            <p className="text-meta" style={{ fontSize: 12 }}>Nothing left on the calendar today.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {remainingToday.map((e) => (
                <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>{e.summary}</span>
                  <span className="text-micro-mono">{new Date(e.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}