// apps/web/src/hooks/useCalendarBridge.ts
import { useEffect, useState, useCallback } from 'react'
import type { CalendarEvent } from '@/types/calendar'
import { fetchEventsRemote } from '@/lib/db/queries'

const POLL_MS = 60_000
const PULSE_WINDOW_MS = 15 * 60 * 1000

export function useCalendarBridge(userId: string | null) {
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([])
  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([])
  const [nearEvent, setNearEvent] = useState<CalendarEvent | null>(null)

  const refreshManualEvents = useCallback(async () => {
    if (!userId) return
    try {
      const rows = await fetchEventsRemote(userId)
      setManualEvents(
        rows.map((r) => ({
          id: r.id,
          summary: r.title,
          start: r.start_time,
          end: r.start_time,
          source: 'manual' as const,
        }))
      )
    } catch {
      // offline — keep last known events
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    async function poll() {
      try {
        const res = await fetch(`/api/calendar/upcoming?userId=${userId}`)
        const data = await res.json()
        setGoogleEvents((data.events ?? []).map((e: any) => ({ ...e, source: 'google' as const })))
      } catch {
        // offline — keep last known events
      }
    }
    void poll()
    const interval = setInterval(poll, POLL_MS)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    void refreshManualEvents()
    const interval = setInterval(refreshManualEvents, POLL_MS)
    return () => clearInterval(interval)
  }, [refreshManualEvents])

  useEffect(() => {
    function checkProximity() {
      const now = Date.now()
      const allEvents = [...googleEvents, ...manualEvents]
      const upcoming = allEvents.find((e) => {
        const start = new Date(e.start).getTime()
        return start > now && start - now <= PULSE_WINDOW_MS
      })
      setNearEvent(upcoming ?? null)
    }
    checkProximity()
    const interval = setInterval(checkProximity, 10_000)
    return () => clearInterval(interval)
  }, [googleEvents, manualEvents])

  const allEventsSorted = [...googleEvents, ...manualEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  return {
    events: allEventsSorted,
    nearEvent,
    refreshManualEvents,
  }
}