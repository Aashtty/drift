// apps/web/src/app/replay/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { fetchSessionsRemote, fetchShutdownsRemote, type ShutdownRecord } from '@/lib/db/queries'
import {
  buildHeatmap,
  peakHoursWindow,
  weeklyAverageSessionLength,
  summarizeSessions,
  weekdayTotals,
  activeDaysInWindow,
  compareWeekWindows,
  topTasksByFocusTime,
  hyperfocusStats,
  anchorTimeBreakdown,
  periodHighlights,
} from '@/lib/analytics/sessionAnalytics'
import { generateInsight } from '@/lib/analytics/insights'
import { HeatmapGrid } from '@/components/replay/HeatmapGrid'
import { SessionTrendLine } from '@/components/replay/SessionTrendLine'
import { WeekdayBar } from '@/components/replay/WeekdayBar'
import { RecentSessionsList } from '@/components/replay/RecentSessionsList'
import { TopTasksList } from '@/components/replay/TopTasksList'
import { AnchorBreakdown } from '@/components/replay/AnchorBreakdown'
import { ShutdownReflection } from '@/components/replay/ShutdownReflection'
import { InsightBanner } from '@/components/replay/InsightBanner'
import type { FocusSession } from '@/types/session'
import { useUser } from '@/hooks/useUser'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { useMomentum } from '@/hooks/useMomentum'
import { useAppState } from '@/hooks/useAppState'

type RangeDays = 7 | 30 | 90
const RANGE_OPTIONS: { value: RangeDays; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

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
    <div className="glass" style={{ padding: '16px 18px', flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <p className="text-section-label" style={{ fontSize: 10.5, letterSpacing: '0.06em', margin: 0 }}>{label}</p>
        {deltaPercent !== undefined && (
          <span className="text-micro-mono" style={{ color: deltaPercent === null ? 'var(--text-tertiary)' : deltaPercent >= 0 ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
            {deltaPercent === null ? '—' : `${deltaPercent >= 0 ? '+' : ''}${deltaPercent}%`}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      {sub && <p className="text-meta" style={{ marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {action}
    </div>
  )
}

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: 20 }}>
      <p className="text-section-label" style={{ marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  )
}

const TREND_ARROW: Record<'up' | 'down' | 'flat', string> = { up: '↑', down: '↓', flat: '→' }
const TREND_COLOR: Record<'up' | 'down' | 'flat', string> = { up: 'var(--success)', down: 'var(--danger)', flat: 'var(--text-secondary)' }

/**
 * Complete rebuild. Previous version: fixed 920px column, no way to
 * look at anything but a hardcoded last-7-days / last-4-weeks window,
 * and three real widgets' worth of already-collected data (hyperfocus,
 * anchor time, shutdown reflections) sitting unused in the database.
 *
 * New structure: full-width grid (matches Dashboard/Tasks). The
 * "this week" stat cards, trend line, and weekday chart stay on their
 * original fixed windows deliberately — changing what "focused this
 * week" or the week-over-week comparison means based on an unrelated
 * range picker would make those numbers lie. The date-range selector
 * instead governs the exploratory widgets (top tasks, anchor
 * breakdown, period highlights, hyperfocus stats, and the default
 * recent-sessions view) where "look further back" is exactly the
 * point. Clicking a weekday bar still filters against the fixed
 * 28-day set the chart itself summarizes, same reasoning as before.
 */
export default function ReplayPage() {
  const { user } = useUser()
  const tasks = useTaskStore((s) => s.tasks)
  const anchors = useAnchorStore((s) => s.anchors)
  const { score: momentumScore, trend: momentumTrend } = useMomentum(user?.id ?? '', tasks.filter((t) => t.status === 'done'))
  const { setState } = useAppState()

  const [range, setRange] = useState<RangeDays>(30)
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([])
  const [monthSessions, setMonthSessions] = useState<FocusSession[]>([])
  const [rangeSessions, setRangeSessions] = useState<FocusSession[]>([])
  const [shutdowns, setShutdowns] = useState<ShutdownRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null)

  useEffect(() => {
    setState('IDLE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetchSessionsRemote(user.id, 7).then(setRecentSessions).catch(() => setRecentSessions([])),
      fetchSessionsRemote(user.id, 28).then(setMonthSessions).catch(() => setMonthSessions([])),
      fetchShutdownsRemote(user.id, 90).then(setShutdowns).catch(() => setShutdowns([])),
    ]).finally(() => setLoaded(true))
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchSessionsRemote(user.id, range).then(setRangeSessions).catch(() => setRangeSessions([]))
  }, [user, range])

  if (!user) return null

  const cells = buildHeatmap(recentSessions)
  const peak = peakHoursWindow(cells)
  const weeks = weeklyAverageSessionLength(monthSessions)
  const summary = summarizeSessions(recentSessions)
  const weekdays = weekdayTotals(monthSessions)
  const activeDays = activeDaysInWindow(recentSessions, 7)
  const comparison = compareWeekWindows(monthSessions)
  const topTasks = topTasksByFocusTime(rangeSessions, 5)
  const hyperfocus = hyperfocusStats(rangeSessions)
  const highlights = periodHighlights(rangeSessions)

  const taskNameById = new Map(tasks.map((t) => [t.id, t.name]))
  const anchorForTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task?.anchor_id) return null
    return anchors.find((a) => a.id === task.anchor_id) ?? null
  }
  const anchorIdForTask = (taskId: string) => tasks.find((t) => t.id === taskId)?.anchor_id ?? null
  const anchorBreakdown = anchorTimeBreakdown(rangeSessions, anchorIdForTask)

  const hasAnyData = monthSessions.length > 0
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)?.label ?? `${range}d`

  const insight = hasAnyData
    ? generateInsight({ weekdays, comparison, flowRate: summary.flowRate, peakHours: peak })
    : null

  const displayedSessions =
    selectedWeekday === null
      ? rangeSessions
      : monthSessions.filter((s) => new Date(s.started_at).getDay() === selectedWeekday)

  const highlightTaskName = highlights.longestSessionTaskId ? taskNameById.get(highlights.longestSessionTaskId) ?? 'untitled task' : null

  return (
    <main style={{ padding: 56, maxWidth: 1360, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 40, alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
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
        </div>

        {loaded && !hasAnyData && (
          <div className="glass" style={{ padding: 32, textAlign: 'center', marginTop: 20 }}>
            <p className="text-meta">
              No sessions in the last 4 weeks yet. Once you run a few focus sessions, Replay fills in with your peak hours, flow rate, and patterns.
            </p>
          </div>
        )}

        {hasAnyData && (
          <>
            {insight && (
              <div style={{ marginTop: 20, marginBottom: 24 }}>
                <InsightBanner text={insight} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
              <StatCard
                label="FOCUSED — LAST 7D"
                value={`${Math.floor(summary.totalFocusedMinutes / 60)}h ${summary.totalFocusedMinutes % 60}m`}
                sub={comparison.previousMinutes > 0 ? `${comparison.previousMinutes}m the week before` : undefined}
                deltaPercent={comparison.deltaPercent}
              />
              <StatCard label="SESSIONS — LAST 7D" value={String(summary.sessionCount)} sub={summary.sessionCount > 0 ? `avg ${summary.avgSessionMinutes}m each` : undefined} />
              <StatCard label="FLOW RATE" value={`${summary.flowRate}%`} sub="sessions that reached flow" />
              <StatCard label="ACTIVE DAYS" value={`${activeDays}/7`} sub="days with a session this week" />
              <StatCard label="HYPERFOCUS" value={hyperfocus.count > 0 ? `${hyperfocus.totalMinutes}m` : '—'} sub={hyperfocus.count > 0 ? `across ${hyperfocus.count} lock-ins · last ${rangeLabel}` : `no lock-ins in the last ${rangeLabel}`} />
            </div>

            <SectionHeader label="FOCUS HEATMAP — last 7 days" />
            <div style={{ marginBottom: 32 }}>
              <HeatmapGrid cells={cells} peakHours={peak} />
            </div>

            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginBottom: 32 }}>
              <div>
                <SectionHeader label="SESSION TREND — avg length, last 4 weeks" />
                <SessionTrendLine weeks={weeks} />
              </div>
              <div>
                <SectionHeader label="BY WEEKDAY — click a day to filter below" />
                <WeekdayBar data={weekdays} selectedWeekday={selectedWeekday} onSelect={setSelectedWeekday} />
              </div>
            </div>

            <SectionHeader
              label={selectedWeekday === null ? `SESSIONS — last ${rangeLabel}` : `SESSIONS — ${WEEKDAY_FULL[selectedWeekday]}S, last 4 weeks`}
              action={
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {selectedWeekday !== null && (
                    <button type="button" onClick={() => setSelectedWeekday(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11.5, cursor: 'pointer', marginRight: 8 }}>
                      clear filter
                    </button>
                  )}
                  {selectedWeekday === null &&
                    RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        data-testid={`range-${opt.value}`}
                        onClick={() => setRange(opt.value)}
                        style={{
                          padding: '4px 10px', borderRadius: 'var(--radius-full)', border: 'none',
                          background: range === opt.value ? 'var(--surface-active)' : 'transparent',
                          color: range === opt.value ? 'var(--accent)' : 'var(--text-tertiary)', fontSize: 11, cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                </div>
              }
            />
            <RecentSessionsList sessions={displayedSessions} taskNameById={taskNameById} anchorForTask={anchorForTask} limit={10} />
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <RailCard title="MOMENTUM">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text-primary)' }}>{momentumScore}</span>
            <span style={{ fontSize: 15, color: TREND_COLOR[momentumTrend] }}>{TREND_ARROW[momentumTrend]}</span>
          </div>
          <p className="text-meta" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
            Weighted across the last 14 days — the most recent 3 days count 3×, the last week counts 2×, and everything back to 14 days counts once. One quiet day never resets it.
          </p>
        </RailCard>

        {highlights.longestSessionMinutes > 0 && (
          <RailCard title={`HIGHLIGHTS — last ${rangeLabel}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{highlights.longestSessionMinutes}m</p>
                <p className="text-micro-mono" style={{ marginTop: 2 }}>longest session{highlightTaskName ? ` · ${highlightTaskName}` : ''}</p>
              </div>
              {highlights.bestDay && (
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{highlights.bestDay.totalMinutes}m</p>
                  <p className="text-micro-mono" style={{ marginTop: 2 }}>best day · {new Date(highlights.bestDay.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                </div>
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{highlights.activeDays}</p>
                <p className="text-micro-mono" style={{ marginTop: 2 }}>days with at least one session</p>
              </div>
            </div>
          </RailCard>
        )}

        <RailCard title={`TOP TASKS — last ${rangeLabel}`}>
          <TopTasksList topTasks={topTasks} taskNameById={taskNameById} anchorForTask={anchorForTask} />
        </RailCard>

        {anchors.length > 0 && (
          <RailCard title={`BY ANCHOR — last ${rangeLabel}`}>
            <AnchorBreakdown breakdown={anchorBreakdown} anchors={anchors} />
          </RailCard>
        )}

        <RailCard title="SHUTDOWN LOG">
          <ShutdownReflection shutdowns={shutdowns} taskNameById={taskNameById} />
        </RailCard>
      </div>
    </main>
  )
}

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']