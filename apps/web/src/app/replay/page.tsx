// apps/web/src/app/replay/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fetchSessionsRemote } from '@/lib/db/queries'
import {
  buildHeatmap,
  peakHoursWindow,
  weeklyAverageSessionLength,
  summarizeSessions,
  weekdayTotals,
  activeDaysInWindow,
  compareWeekWindows,
  topTasksByFocusTime,
} from '@/lib/analytics/sessionAnalytics'
import { generateInsight } from '@/lib/analytics/insights'
import { HeatmapGrid } from '@/components/replay/HeatmapGrid'
import { SessionTrendLine } from '@/components/replay/SessionTrendLine'
import { WeekdayBar } from '@/components/replay/WeekdayBar'
import { RecentSessionsList } from '@/components/replay/RecentSessionsList'
import { TopTasksList } from '@/components/replay/TopTasksList'
import { InsightBanner } from '@/components/replay/InsightBanner'
import type { FocusSession } from '@/types/session'
import { useUser } from '@/hooks/useUser'
import { useTaskStore } from '@/stores/taskStore'

function StatCard({
  label,
  value,
  sub,
  deltaPercent,
}: {
  label: string
  value: string
  sub?: string
  deltaPercent?: number | null
}) {
  return (
    <div className="glass" style={{ padding: '16px 18px', flex: 1, minWidth: 130 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <p className="text-section-label" style={{ fontSize: 10.5, letterSpacing: '0.06em', margin: 0 }}>
          {label}
        </p>
        {deltaPercent !== undefined && (
          <span
            className="text-micro-mono"
            style={{
              color: deltaPercent === null ? 'var(--text-tertiary)' : deltaPercent >= 0 ? 'var(--success)' : 'var(--danger)',
              flexShrink: 0,
            }}
          >
            {deltaPercent === null ? '—' : `${deltaPercent >= 0 ? '+' : ''}${deltaPercent}%`}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
        {value}
      </p>
      {sub && <p className="text-meta" style={{ marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function ReplayPage() {
  const { user } = useUser()
  const tasks = useTaskStore((s) => s.tasks)
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([])
  const [monthSessions, setMonthSessions] = useState<FocusSession[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchSessionsRemote(user.id, 7).then(setRecentSessions).catch(() => setRecentSessions([])),
      fetchSessionsRemote(user.id, 28).then(setMonthSessions).catch(() => setMonthSessions([])),
    ]).finally(() => setLoaded(true))
  }, [user])

  if (!user) return null

  const cells = buildHeatmap(recentSessions)
  const peak = peakHoursWindow(cells)
  const weeks = weeklyAverageSessionLength(monthSessions)
  const summary = summarizeSessions(recentSessions)
  const weekdays = weekdayTotals(monthSessions)
  const activeDays = activeDaysInWindow(recentSessions, 7)
  const comparison = compareWeekWindows(monthSessions)
  const topTasks = topTasksByFocusTime(monthSessions, 5)
  const taskNameById = new Map(tasks.map((t) => [t.id, t.name]))
  const hasAnyData = monthSessions.length > 0

  const insight = hasAnyData
    ? generateInsight({ weekdays, comparison, flowRate: summary.flowRate, peakHours: peak })
    : null

  // Selecting a weekday bar filters against the full 4-week window
  // (monthSessions), not just the last 7 days — matches what the bar
  // chart itself is summarizing.
  const displayedSessions =
    selectedWeekday === null
      ? recentSessions
      : monthSessions.filter((s) => new Date(s.started_at).getDay() === selectedWeekday)

  return (
    <main style={{ padding: '64px 56px', display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 920 }}>
      <div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-glow"
          style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}
        >
          replay.
        </motion.p>
        <p className="text-meta" style={{ fontSize: 13.5 }}>
          {hasAnyData ? 'a look at how and when you actually work' : 'complete a few sessions and your patterns will show up here'}
        </p>
      </div>

      {loaded && !hasAnyData && (
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <p className="text-meta">
            No sessions in the last 4 weeks yet. Once you run a few focus sessions, Replay fills in with your peak
            hours, flow rate, and patterns.
          </p>
        </div>
      )}

      {hasAnyData && (
        <>
          {insight && <InsightBanner text={insight} />}

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <StatCard
              label="FOCUSED — LAST 7D"
              value={`${Math.floor(summary.totalFocusedMinutes / 60)}h ${summary.totalFocusedMinutes % 60}m`}
              sub={comparison.previousMinutes > 0 ? `${comparison.previousMinutes}m the week before` : undefined}
              deltaPercent={comparison.deltaPercent}
            />
            <StatCard
              label="SESSIONS — LAST 7D"
              value={String(summary.sessionCount)}
              sub={summary.sessionCount > 0 ? `avg ${summary.avgSessionMinutes}m each` : undefined}
            />
            <StatCard label="FLOW RATE" value={`${summary.flowRate}%`} sub="sessions that reached flow" />
            <StatCard label="ACTIVE DAYS" value={`${activeDays}/7`} sub="days with a session this week" />
          </div>

          <div>
            <SectionHeader label="FOCUS HEATMAP — last 7 days" />
            <HeatmapGrid cells={cells} peakHours={peak} />
          </div>

          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
            <div>
              <SectionHeader label="SESSION TREND — avg length, last 4 weeks" />
              <SessionTrendLine weeks={weeks} />
            </div>

            <div>
              <SectionHeader label="BY WEEKDAY — click a day to filter below" />
              <WeekdayBar data={weekdays} selectedWeekday={selectedWeekday} onSelect={setSelectedWeekday} />
            </div>

            <div style={{ minWidth: 240, flex: 1 }}>
              <SectionHeader label="TOP TASKS — last 4 weeks" />
              <TopTasksList topTasks={topTasks} taskNameById={taskNameById} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>
                {selectedWeekday === null ? 'RECENT SESSIONS' : `SESSIONS — ${WEEKDAY_FULL[selectedWeekday]}S, last 4 weeks`}
              </p>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              {selectedWeekday !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedWeekday(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11.5, cursor: 'pointer' }}
                >
                  clear filter
                </button>
              )}
            </div>
            <RecentSessionsList sessions={displayedSessions} taskNameById={taskNameById} />
          </div>
        </>
      )}
    </main>
  )
}

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']