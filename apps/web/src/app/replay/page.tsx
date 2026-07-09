// apps/web/src/app/replay/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { fetchSessionsRemote } from '@/lib/db/queries'
import { buildHeatmap, peakHoursWindow, weeklyAverageSessionLength } from '@/lib/analytics/sessionAnalytics'
import { HeatmapGrid } from '@/components/replay/HeatmapGrid'
import { SessionTrendLine } from '@/components/replay/SessionTrendLine'
import type { FocusSession } from '@/types/session'
import { useUser } from '@/hooks/useUser'

export default function ReplayPage() {
  const { user } = useUser()
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([])
  const [monthSessions, setMonthSessions] = useState<FocusSession[]>([])

  useEffect(() => {
    if (!user) return
    void fetchSessionsRemote(user.id, 7).then(setRecentSessions).catch(() => setRecentSessions([]))
    void fetchSessionsRemote(user.id, 28).then(setMonthSessions).catch(() => setMonthSessions([]))
  }, [user])

  if (!user) return null

  const cells = buildHeatmap(recentSessions)
  const peak = peakHoursWindow(cells)
  const weeks = weeklyAverageSessionLength(monthSessions)

  return (
    <main style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 40 }}>
      <div>
        <p className="text-section-label" style={{ marginBottom: 16 }}>FOCUS REPLAY — last 7 days</p>
        <HeatmapGrid cells={cells} peakHours={peak} />
      </div>
      <div>
        <p className="text-section-label" style={{ marginBottom: 16 }}>SESSION TREND — avg length, last 4 weeks</p>
        <SessionTrendLine weeks={weeks} />
      </div>
    </main>
  )
}