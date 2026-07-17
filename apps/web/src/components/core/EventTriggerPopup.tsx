// apps/web/src/components/core/EventTriggerPopup.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUser } from '@/hooks/useUser'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { GlassPanel } from '@/components/ui/GlassPanel'
import type { CalendarEvent } from '@/types/calendar'

const CHECK_INTERVAL_MS = 5_000
// An event only counts as "just started" within this window after its
// start time - past this, it's stale (missed while the tab was closed,
// etc.) and shouldn't suddenly pop up.
const TRIGGER_WINDOW_MS = 60_000
const FIRED_KEY = 'drift:event-triggered-ids'

function loadFired(): Set<string> {
  try {
    const raw = window.sessionStorage.getItem(FIRED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}
function saveFired(ids: Set<string>) {
  try {
    window.sessionStorage.setItem(FIRED_KEY, JSON.stringify(Array.from(ids)))
  } catch {
    // ignore - non-critical
  }
}

/**
 * New feature: previously the only event notification was a 15-minute
 * heads-up chip inside NowBar. This is a separate, distinct thing - a
 * real popup that fires exactly when an event's start time is reached,
 * on any page (mounted once, globally, in AppShell). Deduplicated via
 * sessionStorage so a page reload right after an event starts doesn't
 * re-trigger it, and bounded to a 60s window so a stale/missed event
 * from hours ago can't suddenly appear.
 */
export function EventTriggerPopup() {
  const { user } = useUser()
  const { events } = useCalendarBridge(user?.id ?? null)
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    firedRef.current = loadFired()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      for (const e of events) {
        const startMs = new Date(e.start).getTime()
        const sinceStart = now - startMs
        if (sinceStart >= 0 && sinceStart <= TRIGGER_WINDOW_MS && !firedRef.current.has(e.id)) {
          firedRef.current.add(e.id)
          saveFired(firedRef.current)
          setActiveEvent(e)
          break
        }
      }
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [events])

  function dismiss() {
    setActiveEvent(null)
  }

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="event-trigger-popup-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-sheet)' as any, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.94, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel chromatic style={{ padding: 26, width: 360, textAlign: 'center' }}>
              <p className="text-section-label" style={{ marginBottom: 10, color: 'var(--accent)' }}>STARTING NOW</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', margin: '0 0 20px' }}>{activeEvent.summary}</p>
              <button
                type="button"
                data-testid="event-trigger-dismiss"
                onClick={dismiss}
                className="glass glass-interactive"
                style={{ width: '100%', padding: '11px 0', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', boxShadow: 'var(--glow-accent-sm)' }}
              >
                Got it
              </button>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}