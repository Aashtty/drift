// apps/web/src/app/api/calendar/upcoming/route.ts
import { NextResponse } from 'next/server'
import { fetchUpcomingEvents } from '@/lib/calendar/calendarClient'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ events: [] })

  const events = await fetchUpcomingEvents(userId)
  return NextResponse.json({ events })
}