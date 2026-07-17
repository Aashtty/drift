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
  summarizeDay,
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

function CalendarDayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="10.2" r="1.2" fill="currentColor" />
    </svg>
  )
}
function TargetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="0.9" fill="currentColor" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M5.5 4h8M5.5 8h8M5.5 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="2.7" cy="4" r="0.9" fill="currentColor" />
      <circle cx="2.7" cy="8" r="0.9" fill="currentColor" />
      <circle cx="2.7" cy="12" r="0.9" fill="currentColor" />
    </svg>
  )
}
function TagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M2 2h5.5L14 8.5L8.5 14L2 7.5V2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="4.7" cy="4.7" r="1" fill="currentColor" />
    </svg>
  )
}
function BookIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 3.5h5A1.5 1.5 0 0 1 9 5v8.5H4A1.5 1.5 0 0 1 2.5 12V3.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M13.5 3.5h-5A1.5 1.5 0 0 0 7 5v8.5h5A1.5 1.5 0 0 0 13.5 12V3.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
function TrendIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L6 7L9 9.5L14 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 4H14V7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({ label, value, sub, deltaPercent }: { label: string; value: string; sub?: string; deltaPercent?: number | null }) {
  return (
    <div className="glass" style={{ padding: '16px 18px', flex: 1, minWidth: 150, borderTop: '2px solid var(--border-accent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
        <p className="text-section-label" style={{ fontSize: 10.5, letterSpacing: '0.06em', margin: 0 }}>{label}</p>
        {deltaPercent !== undefined && (
          <span className="text-micro-mono" style={{ color: deltaPercent === null ? 'var(--text-tertiary)' : deltaPercent >= 0 ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
            {deltaPercent === null ? '-' : `${deltaPercent >= 0 ? '+' : ''}${deltaPercent}%`}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      {sub && <p className="text-meta" style={{ marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function SectionHeader({ label, icon, action }: { label: string; icon?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      {icon && <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>}
      <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>{label}</p>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      {action}
    </div>
  )
}

function RailCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: 20, borderTop: '2px solid var(--border-accent)' }}>
      <p className="text-section-label" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon && <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>}
        {title}
      </p>
      {children}
    </div>
  )
}

const TREND_LABEL: Record<'up' | 'down' | 'flat', string> = { up: '^', down: 'v', flat: '-' }
const TREND_COLOR: Record<'up' | 'down' | 'flat', string> = { up: 'var(--success)', down: 'var(--danger)', flat: 'var(--text-secondary)' }

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
  const topTasks = topTasksByFocusTime(rangeSessions, 20)
  const hyperfocus = hyperfocusStats(rangeSessions)
  const highlights = periodHighlights(rangeSessions)
  const todaySummary = summarizeDay(recentSessions)
  const todaySessions = recentSessions.filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString())

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
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

          {hasAnyData && (
            <div className="glass" style={{ display: 'flex', padding: 4, borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }} data-testid="replay-range-selector">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  data-testid={`range-${opt.value}`}
                  onClick={() => setRange(opt.value)}
                  style={{
                    padding: '7px 16px', borderRadius: 'var(--radius-full)', border: 'none',
                    background: range === opt.value ? 'var(--surface-active)' : 'transparent',
                    color: range === opt.value ? 'var(--accent)' : 'var(--text-tertiary)',
                    fontSize: 12.5, fontWeight: range === opt.value ? 500 : 400, cursor: 'pointer',
                    boxShadow: range === opt.value ? 'var(--glow-accent-sm)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loaded && !hasAnyData && (
          <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
            <p className="text-meta">
              No sessions in the last 4 weeks yet. Once you run a few focus sessions, Replay fills in with your peak hours, flow rate, and patterns.
            </p>
          </div>
        )}

        {hasAnyData && (
          <>
            <SectionHeader label="TODAY" icon={<CalendarDayIcon />} />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
              <StatCard label="FOCUSED TODAY" value={`${todaySummary.totalMinutes}m`} />
              <StatCard label="SESSIONS TODAY" value={String(todaySummary.sessionCount)} />
              <StatCard label="FLOW RATE TODAY" value={`${todaySummary.flowRate}%`} />
              <StatCard label="HYPERFOCUS TODAY" value={todaySummary.hyperfocusMinutes > 0 ? `${todaySummary.hyperfocusMinutes}m` : '-'} />
            </div>
            {todaySessions.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <RecentSessionsList sessions={todaySessions} taskNameById={taskNameById} anchorForTask={anchorForTask} defaultLimit={5} />
              </div>
            )}

            {insight && (
              <div style={{ marginBottom: 24 }}>
                <InsightBanner text={insight} />
              </div>
            )}

            <SectionHeader label="LAST 7 DAYS" icon={<TrendIcon />} />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
              <StatCard
                label="FOCUSED"
                value={`${Math.floor(summary.totalFocusedMinutes / 60)}h ${summary.totalFocusedMinutes % 60}m`}
                sub={comparison.previousMinutes > 0 ? `${comparison.previousMinutes}m the week before` : undefined}
                deltaPercent={comparison.deltaPercent}
              />
              <StatCard label="SESSIONS" value={String(summary.sessionCount)} sub={summary.sessionCount > 0 ? `avg ${summary.avgSessionMinutes}m each` : undefined} />
              <StatCard label="FLOW RATE" value={`${summary.flowRate}%`} sub="sessions that reached flow" />
              <StatCard label="ACTIVE DAYS" value={`${activeDays}/7`} sub="days with a session this week" />
              <StatCard label="HYPERFOCUS" value={hyperfocus.count > 0 ? `${hyperfocus.totalMinutes}m` : '-'} sub={hyperfocus.count > 0 ? `across ${hyperfocus.count} lock-ins - last ${rangeLabel}` : `no lock-ins in the last ${rangeLabel}`} />
            </div>

            <SectionHeader label="FOCUS HEATMAP - last 7 days" />
            <div style={{ marginBottom: 32 }}>
              <HeatmapGrid cells={cells} peakHours={peak} />
            </div>

            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', marginBottom: 32 }}>
              <div>
                <SectionHeader label="SESSION TREND - avg length, last 4 weeks" />
                <SessionTrendLine weeks={weeks} />
              </div>
              <div>
                <SectionHeader label="BY WEEKDAY - click a day to filter below" />
                <WeekdayBar data={weekdays} selectedWeekday={selectedWeekday} onSelect={setSelectedWeekday} />
              </div>
            </div>

            <SectionHeader
              label={selectedWeekday === null ? `SESSIONS - last ${rangeLabel}` : `SESSIONS - ${WEEKDAY_FULL[selectedWeekday]}S, last 4 weeks`}
              icon={<ListIcon />}
              action={
                selectedWeekday !== null ? (
                  <button type="button" onClick={() => setSelectedWeekday(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11.5, cursor: 'pointer' }}>
                    clear filter
                  </button>
                ) : undefined
              }
            />
            <RecentSessionsList sessions={displayedSessions} taskNameById={taskNameById} anchorForTask={anchorForTask} defaultLimit={10} />
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <RailCard title="MOMENTUM" icon={<TrendIcon />}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--text-primary)' }}>{momentumScore}</span>
            <span style={{ fontSize: 15, color: TREND_COLOR[momentumTrend] }}>{TREND_LABEL[momentumTrend]}</span>
          </div>
          <p className="text-meta" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
            Weighted across the last 14 days - the most recent 3 days count 3x, the last week counts 2x, and everything back to 14 days counts once. One quiet day never resets it.
          </p>
        </RailCard>

        {highlights.longestSessionMinutes > 0 && (
          <RailCard title={`HIGHLIGHTS - last ${rangeLabel}`} icon={<TargetIcon />}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{highlights.longestSessionMinutes}m</p>
                <p className="text-micro-mono" style={{ marginTop: 2 }}>longest session{highlightTaskName ? ` - ${highlightTaskName}` : ''}</p>
              </div>
              {highlights.bestDay && (
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{highlights.bestDay.totalMinutes}m</p>
                  <p className="text-micro-mono" style={{ marginTop: 2 }}>best day - {new Date(highlights.bestDay.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                </div>
              )}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{highlights.activeDays}</p>
                <p className="text-micro-mono" style={{ marginTop: 2 }}>days with at least one session</p>
              </div>
            </div>
          </RailCard>
        )}

        <RailCard title={`TOP TASKS - last ${rangeLabel}`} icon={<ListIcon />}>
          <TopTasksList topTasks={topTasks} taskNameById={taskNameById} anchorForTask={anchorForTask} defaultLimit={5} />
        </RailCard>

        {anchors.length > 0 && (
          <RailCard title={`BY ANCHOR - last ${rangeLabel}`} icon={<TagIcon />}>
            <AnchorBreakdown breakdown={anchorBreakdown} anchors={anchors} />
          </RailCard>
        )}

        <RailCard title="SHUTDOWN LOG" icon={<BookIcon />}>
          <ShutdownReflection shutdowns={shutdowns} taskNameById={taskNameById} />
        </RailCard>
      </div>
    </main>
  )
}

const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']