// apps/web/src/hooks/useCalendarBridge.ts
import { useEffect, useState, useCallback } from 'react'
import type { CalendarEvent } from '@/types/calendar'
import { fetchEventsRemote } from '@/lib/db/queries'

const POLL_MS = 20_000
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
        // Real bug fix: this never checked res.ok before touching
        // state. A non-2xx response that still parses as JSON (e.g. an
        // error body, or a transient 500 returning `{}`) would fall
        // through to `data.events ?? []` → `[]`, wiping every event
        // from the UI even though this isn't the "genuinely offline"
        // case the surrounding catch block's comment claims to cover.
        // Now a bad response is treated the same as a network failure:
        // last-known events are preserved instead of cleared.
        if (!res.ok) {
          console.error('[useCalendarBridge] /api/calendar/upcoming returned', res.status)
          return
        }
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

  // Computed once here and reused by both nearEvent detection and the
  // returned `events` list, instead of each place separately trying
  // (or forgetting) to merge-and-sort googleEvents/manualEvents itself.
  const allEventsSorted = [...googleEvents, ...manualEvents].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  useEffect(() => {
    function checkProximity() {
      const now = Date.now()
      // Real bug fix: this used to `.find()` over the raw, unsorted
      // concatenation of googleEvents + manualEvents. googleEvents
      // happens to come back sorted from Google's own orderBy:
      // startTime, but manualEvents never gets sorted at all, and
      // concatenating two arrays doesn't interleave them by time -
      // it's just googleEvents followed by manualEvents in whatever
      // order each arrived. `.find()` returns the first element in
      // that array to satisfy the predicate, which is "first by array
      // position," not "earliest in time." A manual event genuinely 2
      // minutes away could lose to a Google event 14 minutes away
      // just because Google events were listed first - the opposite
      // of what "nearEvent" claims to be. Now searches the properly
      // time-sorted list instead.
      const upcoming = allEventsSorted.find((e) => {
        const start = new Date(e.start).getTime()
        return start > now && start - now <= PULSE_WINDOW_MS
      })
      setNearEvent(upcoming ?? null)
    }
    checkProximity()
    const interval = setInterval(checkProximity, 10_000)
    return () => clearInterval(interval)
  }, [allEventsSorted])

  return {
    events: allEventsSorted,
    nearEvent,
    refreshManualEvents,
  }
}