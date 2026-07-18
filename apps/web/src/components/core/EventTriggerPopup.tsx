// apps/web/src/components/core/EventTriggerPopup.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useUser } from '@/hooks/useUser'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { useAudioStore } from '@/stores/audioStore'
import { playNotificationChime } from '@/lib/audio/notificationChime'
import { GlassPanel } from '@/components/ui/GlassPanel'
import type { CalendarEvent } from '@/types/calendar'

const CHECK_INTERVAL_MS = 5_000
const TRIGGER_WINDOW_MS = 60_000
const FIRED_KEY = 'drift:event-triggered-ids'
// New - each fired id is now stored with a timestamp and pruned past
// this age. Fixes a real (if minor) unbounded-growth bug: the old
// version stored ids forever with no cleanup, so a long-lived tab
// (most plausible on the Tauri desktop build, which can stay open for
// days) would accumulate an ever-growing array in sessionStorage.
const FIRED_RETENTION_MS = 24 * 60 * 60 * 1000

interface FiredEntry {
  id: string
  at: number
}

function loadFired(): FiredEntry[] {
  try {
    const raw = window.sessionStorage.getItem(FIRED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Backward-compat: earlier version stored a plain string array with
    // no timestamps. Treat those as "just fired" rather than dropping
    // them, so an in-progress session doesn't immediately re-fire.
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return (parsed as string[]).map((id) => ({ id, at: Date.now() }))
    }
    return parsed as FiredEntry[]
  } catch {
    return []
  }
}

function saveFired(entries: FiredEntry[]) {
  try {
    const cutoff = Date.now() - FIRED_RETENTION_MS
    const pruned = entries.filter((e) => e.at >= cutoff)
    window.sessionStorage.setItem(FIRED_KEY, JSON.stringify(pruned))
  } catch {
    // ignore - non-critical
  }
}

export function EventTriggerPopup() {
  const { user } = useUser()
  const { events } = useCalendarBridge(user?.id ?? null)
  const volume = useAudioStore((s) => s.volume)
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null)
  const firedRef = useRef<FiredEntry[]>([])

  useEffect(() => {
    firedRef.current = loadFired()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const firedIds = new Set(firedRef.current.map((e) => e.id))
      for (const e of events) {
        const startMs = new Date(e.start).getTime()
        const sinceStart = now - startMs
        if (sinceStart >= 0 && sinceStart <= TRIGGER_WINDOW_MS && !firedIds.has(e.id)) {
          firedRef.current = [...firedRef.current, { id: e.id, at: now }]
          saveFired(firedRef.current)
          setActiveEvent(e)
          void playNotificationChime(volume)
          break
        }
      }
    }, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [events, volume])

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
          <motion.div initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()}>
            <GlassPanel chromatic style={{ padding: 26, width: 360, textAlign: 'center' }}>
              <p className="text-section-label" style={{ marginBottom: 10, color: 'var(--accent)' }}>STARTING NOW</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', margin: '0 0 20px' }}>{activeEvent.summary}</p>
              <button type="button" data-testid="event-trigger-dismiss" onClick={dismiss} className="glass glass-interactive" style={{ width: '100%', padding: '11px 0', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', boxShadow: 'var(--glow-accent-sm)' }}>
                Got it
              </button>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}