// apps/web/src/components/core/EdgeArc.tsx
'use client'

import { useEffect, useState } from 'react'
import { fuzzyTimeLabel, exactTimeLabel } from '@/lib/utils/fuzzyTime'
import { useAppState } from '@/hooks/useAppState'
import { getDayWindow, dayWindowPosition, currentDayProgress } from '@/lib/utils/dayWindow'
import type { CalendarEvent } from '@/types/calendar'

const STATE_ARC_STYLE: Record<string, { color: string; opacity: number }> = {
  IDLE: { color: 'var(--accent)', opacity: 0.55 },
  FOCUS: { color: 'var(--accent)', opacity: 1 },
  FLOW: { color: 'var(--accent-b)', opacity: 1 },
  DRIFT: { color: 'var(--warning)', opacity: 1 },
  SHUTDOWN: { color: 'var(--success)', opacity: 1 },
}

const BAR_WIDTH = 4
const HIT_WIDTH = 16
const PROGRESS_REFRESH_MS = 15_000

interface EdgeArcProps {
  fuzzyTime?: boolean
  dayStart?: string
  dayEnd?: string
  nearEvent?: CalendarEvent | null
  events?: CalendarEvent[]
}

/**
 * Only change from the previous version: progress and tick-position
 * math now goes through lib/utils/dayWindow.ts instead of doing the
 * (buggy, non-overnight-only) subtraction locally. See that file's
 * comment for the actual bug and the fix's reasoning. Nothing else -
 * layout, hover/click behavior, imminent-event styling - changed.
 */
export function EdgeArc({
  fuzzyTime = false,
  dayStart = '09:00',
  dayEnd = '19:00',
  nearEvent = null,
  events = [],
}: EdgeArcProps) {
  const { state } = useAppState()
  const [mounted, setMounted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [hoverSide, setHoverSide] = useState<'left' | 'right'>('left')
  const [agendaOpen, setAgendaOpen] = useState(false)
  const [hoverY, setHoverY] = useState(0)
  const [pulseKey, setPulseKey] = useState(0)

  useEffect(() => {
    setMounted(true)
    setProgress(currentDayProgress(dayStart, dayEnd))
    const interval = setInterval(() => setProgress(currentDayProgress(dayStart, dayEnd)), PROGRESS_REFRESH_MS)
    return () => clearInterval(interval)
  }, [dayStart, dayEnd])

  useEffect(() => {
    if (nearEvent) setPulseKey((k) => k + 1)
  }, [nearEvent?.id])

  const style = nearEvent ? { color: 'var(--accent)', opacity: 1 } : STATE_ARC_STYLE[state] ?? { color: 'var(--text-tertiary)', opacity: 0.5 }
  const now = new Date()
  const label = !mounted ? 'Day progress' : nearEvent ? `${nearEvent.summary} soon` : fuzzyTime ? fuzzyTimeLabel(now) : exactTimeLabel(now)

  const window = getDayWindow(dayStart, dayEnd)
  const dayTicks = events
    .map((e) => {
      const d = new Date(e.start)
      const atMinutes = d.getHours() * 60 + d.getMinutes()
      const pos = dayWindowPosition(window, atMinutes)
      if (pos == null) return null
      return { id: e.id, pos, summary: e.summary, start: e.start }
    })
    .filter((t): t is { id: string; pos: number; summary: string; start: string } => t !== null)

  const remainingToday = events
    .filter((e) => new Date(e.start).toDateString() === now.toDateString() && new Date(e.start).getTime() > Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

  const nextTickId = remainingToday[0]?.id ?? null

  function openAgenda(side: 'left' | 'right') {
    setHoverSide(side)
    setAgendaOpen((prev) => !prev)
  }

  function renderEdge(side: 'left' | 'right') {
    const sideAnchor: React.CSSProperties = side === 'left' ? { left: 0 } : { right: 0 }
    const dotAnchor: React.CSSProperties = side === 'left' ? { left: -2.5 } : { right: -2.5 }

    return (
      <div
        data-testid={side === 'left' ? 'edge-arc' : 'edge-arc-right'}
        role="button"
        aria-label={`${label}. Click to view today's schedule.`}
        tabIndex={0}
        onClick={() => openAgenda(side)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openAgenda(side)
          }
        }}
        onMouseEnter={() => {
          setHovering(true)
          setHoverSide(side)
        }}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={(e) => setHoverY(e.clientY)}
        style={{ position: 'fixed', top: 0, width: HIT_WIDTH, height: '100vh', zIndex: 'var(--z-arc)' as any, cursor: 'pointer', ...sideAnchor }}
      >
        <div style={{ position: 'absolute', top: 0, width: BAR_WIDTH, height: '100%', background: 'rgba(255,255,255,0.09)', ...sideAnchor }}>
          <div
            key={`${side}-fill-${pulseKey}`}
            style={{
              position: 'absolute',
              top: 0,
              width: BAR_WIDTH,
              height: `${progress * 100}%`,
              background: style.color,
              opacity: style.opacity,
              boxShadow: `0 0 12px -1px ${style.color}`,
              transition: 'height 800ms var(--ease-focus), background 800ms var(--ease-focus), opacity 500ms var(--ease-focus)',
              animation: nearEvent ? 'edge-arc-event-pulse 1s var(--ease-spring) 3' : 'none',
              ...sideAnchor,
            }}
          />

          {mounted && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: `${progress * 100}%`,
                width: 9,
                height: 9,
                borderRadius: '50%',
                background: style.color,
                opacity: nearEvent ? 1 : Math.max(0.6, style.opacity),
                transform: 'translateY(-50%)',
                boxShadow: `0 0 12px 2px ${style.color}`,
                animation: 'pulse-soft 2.4s var(--ease-focus) infinite',
                ...dotAnchor,
              }}
            />
          )}

          {dayTicks.map((t) => {
            const isNext = t.id === nextTickId
            return (
              <div
                key={`${side}-${t.id}`}
                data-testid="edge-arc-tick"
                data-side={side}
                title={`${t.summary} - ${new Date(t.start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                style={{
                  position: 'absolute',
                  top: `${t.pos * 100}%`,
                  width: isNext ? 9 : 7,
                  height: isNext ? 9 : 7,
                  borderRadius: '50%',
                  background: isNext ? 'var(--accent)' : 'var(--text-primary)',
                  opacity: isNext ? 1 : 0.9,
                  boxShadow: isNext ? '0 0 10px 3px var(--accent)' : '0 0 6px 1px rgba(255,255,255,0.55)',
                  transform: 'translateY(-4px)',
                  pointerEvents: 'none',
                  ...dotAnchor,
                }}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      {renderEdge('left')}
      {renderEdge('right')}

      <style>{`
        @keyframes edge-arc-event-pulse {
          0% { box-shadow: 0 0 0 0 var(--accent); }
          50% { box-shadow: 4px 0 14px 3px var(--accent); }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>

      {hovering && !agendaOpen && mounted && (
        <div
          data-testid="edge-arc-tooltip"
          className="glass"
          style={{
            position: 'fixed',
            top: hoverY - 12,
            padding: '4px 10px',
            fontSize: 12,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 'var(--z-popover)' as any,
            ...(hoverSide === 'left' ? { left: HIT_WIDTH + 6 } : { right: HIT_WIDTH + 6 }),
          }}
        >
          {label}
        </div>
      )}

      {agendaOpen && (
        <div
          data-testid="edge-arc-agenda"
          className="glass-chromatic"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 40,
            padding: 16,
            width: 240,
            zIndex: 'var(--z-popover)' as any,
            ...(hoverSide === 'left' ? { left: HIT_WIDTH + 6 } : { right: HIT_WIDTH + 6 }),
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <p className="text-section-label" style={{ margin: 0 }}>TODAY</p>
            <button
              type="button"
              onClick={() => setAgendaOpen(false)}
              aria-label="close"
              style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}
            >
              x
            </button>
          </div>
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
    </>
  )
}