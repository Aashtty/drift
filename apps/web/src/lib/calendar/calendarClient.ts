// apps/web/src/lib/calendar/calendarClient.ts
// Server-side only.
import { createClient } from '@supabase/supabase-js'
import { refreshAccessToken } from './googleAuth'
import type { CalendarEvent } from '@/types/calendar'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data: tokenRow } = await supabaseAdmin
    .from('calendar_tokens')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (!tokenRow) return null

  const expiresAt = new Date(tokenRow.expires_at).getTime()
  if (Date.now() < expiresAt - 60_000) {
    return tokenRow.access_token // still valid with a minute of buffer
  }

  const refreshed = await refreshAccessToken(tokenRow.refresh_token)
  const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

  await supabaseAdmin
    .from('calendar_tokens')
    .update({ access_token: refreshed.access_token, expires_at: newExpiresAt })
    .eq('user_id', userId)

  return refreshed.access_token
}

export async function fetchUpcomingEvents(userId: string): Promise<CalendarEvent[]> {
  const accessToken = await getValidAccessToken(userId)
  if (!accessToken) return []

  const now = new Date()
  const twoHoursOut = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: twoHoursOut.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  })

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return []

  const data = await res.json()
  return (data.items ?? []).map((item: any) => ({
    id: item.id,
    summary: item.summary ?? '(no title)',
    start: item.start?.dateTime ?? item.start?.date,
    end: item.end?.dateTime ?? item.end?.date,
  }))
}