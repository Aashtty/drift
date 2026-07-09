// apps/web/src/types/calendar.ts
export interface CalendarTokens {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: string
  connected_at: string
}

export interface CalendarEvent {
  id: string
  summary: string
  start: string // ISO
  end: string // ISO
  source: 'google' | 'manual'
}

export interface ManualEvent {
  id: string
  user_id: string
  title: string
  start_time: string // ISO
  created_at: string
}