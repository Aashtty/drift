// apps/web/src/lib/calendar/calendarClient.ts
// Server-side only.
import { createClient } from '@supabase/supabase-js'
import { refreshAccessToken } from './googleAuth'

// Real bug fix: this was using NEXT_PUBLIC_SUPABASE_ANON_KEY. This
// module is called server-to-server with no forwarded user session (no
// cookies, no Authorization header) - so auth.uid() is NULL for every
// query here, and the calendar_tokens RLS policy (auth.uid() = user_id)
// silently filters out the row on SELECT too, not just INSERT. That
// meant getValidAccessToken always saw "no token row," always returned
// null, and fetchUpcomingEvents always returned [] - even with a
// correctly-stored token and even after fixing the callback route,
// since that fix only addressed the WRITE side of this same mistake.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// How far back we'll still accept an event's start time. This is NOT
// "how stale a token can be" - it exists so an event that started a
// few seconds before this function runs (e.g. the poll interval just
// missed it) is still returned, which EventTriggerPopup needs in order
// to fire its "starting now" popup at all. Anything that started
// longer ago than this is treated as "already in progress" and
// excluded - see the filtering comment below for why.
const PAST_BUFFER_MS = 2 * 60 * 1000
// How far forward we look for "upcoming." 24h covers "later today" and
// "first thing tomorrow," which is what NowBar's countdown chip and the
// dashboard's UpcomingEvents list actually need. Widen this if events
// further ahead should show up anywhere in the app.
const FUTURE_WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_RESULTS = 20

async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data: tokenRow, error } = await supabaseAdmin
    .from('calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[calendarClient] failed to read calendar_tokens:', error.message)
    return null
  }
  if (!tokenRow) return null

  const expiresAt = new Date(tokenRow.expires_at).getTime()
  if (Date.now() < expiresAt - 60_000) {
    return tokenRow.access_token // still valid with a minute of buffer
  }

  if (!tokenRow.refresh_token) {
    // No refresh_token on file - can't recover automatically. Fail
    // clearly rather than throwing out of refreshAccessToken with a
    // confusing Google API error.
    console.error('[calendarClient] no refresh_token stored for user - needs reconnect:', userId)
    return null
  }

  try {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token)
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

    await supabaseAdmin
      .from('calendar_tokens')
      .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
      .eq('user_id', userId)

    return refreshed.access_token
  } catch (err: any) {
    // Real bug fix: this used to be a bare unguarded await - a revoked
    // or expired refresh token (person revoked Drift's access in their
    // Google account, or it just went stale from disuse) threw here
    // with nothing catching it, which would 500 the whole
    // /api/calendar/upcoming route on every poll instead of degrading
    // to "not connected right now."
    console.error('[calendarClient] token refresh failed - likely needs reconnect:', err?.message ?? err)
    return null
  }
}

// Honest return type - this function does NOT produce a `source`
// field (that gets patched on by useCalendarBridge after the JSON
// crosses the wire), so it should never have claimed to return
// CalendarEvent[] outright. The previous version got away with the
// mismatch via an `as CalendarEvent[]` cast, which hid a genuine
// shape mismatch instead of catching it at compile time.
export interface FetchedCalendarEvent {
  id: string
  summary: string
  start: string
}

export async function fetchUpcomingEvents(userId: string): Promise<FetchedCalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return []

  const now = Date.now()
  const timeMin = new Date(now - PAST_BUFFER_MS).toISOString()
  const timeMax = new Date(now + FUTURE_WINDOW_MS).toISOString()

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(MAX_RESULTS),
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) {
    console.error('[calendarClient] Google Calendar fetch failed:', res.status, await res.text().catch(() => ''))
    return []
  }

  const data = await res.json()

  return (data.items ?? [])
    .filter((item: any) => {
      // Google's timeMin/timeMax filter is based on whether the event
      // OVERLAPS the window at all (using its END time under the
      // hood) - not whether it STARTS in the window. Once the window
      // is wider than a couple hours (it now is - 24h forward),
      // Google will hand back events that are already in progress:
      // started well before `now`, still running. Nothing in this app
      // has a concept of "a meeting that's currently happening" -
      // NowBar shows a countdown to a future start, EventTriggerPopup
      // fires once at the moment of start. Feeding either an event
      // whose start is already 40 minutes in the past produces a
      // negative countdown or a popup that fires late/never. So: only
      // pass through events whose start is either still ahead of us,
      // or within PAST_BUFFER_MS behind us (that buffer exists purely
      // so an event that started a few seconds before this poll ran
      // can still trigger the "starting now" popup - it is NOT meant
      // to represent "in progress" events more broadly).
      const startRaw = item.start?.dateTime
      const endRaw = item.end?.dateTime
      if (!startRaw) return false // all-day event (date, not dateTime) - excluded, see note below
      const startMs = new Date(startRaw).getTime()
      const endMs = endRaw ? new Date(endRaw).getTime() : startMs
      if (endMs <= now) return false // defensive - fully ended already
      if (startMs < now - PAST_BUFFER_MS) return false // in-progress, started too long ago to be "upcoming" or "just starting"
      return true
    })
    .map((item: any) => ({
      id: item.id,
      summary: item.summary ?? '(no title)',
      start: item.start.dateTime,
    }))

  // Deliberately excluded: all-day events (item.start.date with no
  // .dateTime). They don't have a single meaningful instant - a
  // countdown chip or a "starting now" popup doesn't make sense for
  // "some time today." If all-day events should be represented at
  // all, that needs a genuinely different UI treatment (e.g. a plain
  // badge, no countdown), not a fake instant bolted on.
}