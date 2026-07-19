// apps/web/src/types/calendar.ts
export interface CalendarTokens {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  connected_at: string
}

// `end` removed - confirmed dead everywhere it's produced or consumed
// (UpcomingEvents, useCalendarBridge, NowBar all only ever read
// `.start`). The app's whole event model is single-instant based
// (countdowns, "starting now" triggers), so carrying a range field
// nothing uses was just an invitation for something to eventually read
// it and silently do the wrong thing with a ranged event.
export interface CalendarEvent {
  id: string
  summary: string
  start: string // ISO
  source: 'google' | 'manual'
}

export interface ManualEvent {
  id: string
  user_id: string
  title: string
  start_time: string // ISO
  created_at: string
}