// apps/web/src/components/core/NowBar.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TimerRing } from './TimerRing'
import { formatElapsed } from '@/lib/utils/formatElapsed'
import { useBrainDumpUI } from '@/stores/brainDumpUIStore'
import type { AppState } from '@/types/appState'
import type { TimerPhase } from '@/lib/utils/elasticTimer'
import type { CalendarEvent } from '@/types/calendar'

interface NowBarProps {
  taskName: string
  anchorName: string | null
  elapsedSeconds: number
  baseDurationSeconds: number
  phase: TimerPhase
  justPulsed: boolean
  appState: AppState
  paused: boolean
  ending?: boolean
  todayFocusedSeconds?: number | null
  nextEvent?: CalendarEvent | null
  taskHistory?: { sessionCount: number; totalMinutes: number } | null
  onDone: () => void
  onEnd: () => void
  onBackToDashboard: () => void
  onLockIn: () => void
  onTogglePause: () => void
  onRename?: (newName: string) => void
}

const ENCOURAGEMENT = ['still with it', 'good pace', 'no rush', 'keep going', 'in the zone']
const RING_SIZE = 300
const IMMINENT_MINUTES = 15
const LOCK_IN_EXPLAINER = 'Hides everything but this task and shields you from Drift\'s own alerts, until you type "done". It can\'t silence other apps.'

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 14 16" fill="none">
      <rect x="2" y="1.5" width="3.2" height="13" rx="1" fill="currentColor" />
      <rect x="8.8" y="1.5" width="3.2" height="13" rx="1" fill="currentColor" />
    </svg>
  )
}
function PlayIcon() {
  return (
    <svg width="12" height="13" viewBox="0 0 14 16" fill="none">
      <path d="M2.5 1.8v12.4a1 1 0 0 0 1.5.87l10.5-6.2a1 1 0 0 0 0-1.74L4 .93a1 1 0 0 0-1.5.87Z" fill="currentColor" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ExitIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M6.5 3L2.5 8L6.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.8 8H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function HomeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 7.5L8 2.5l5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 6.5V13h8V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function BarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 13V8M8 13V3M13 13V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
function ClockDotIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5.5V8.5L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function eventCountdownLabel(startIso: string): string {
  const mins = Math.round((new Date(startIso).getTime() - Date.now()) / 60000)
  if (mins <= 0) return 'now'
  if (mins < 60) return `in ${mins}m`
  const h = Math.floor(mins / 60)
  const r = mins % 60
  return r === 0 ? `in ${h}h` : `in ${h}h ${r}m`
}

/** Reusable "dot + label" chip - replaces the old colored-text-on-tinted-
 *  background pills, which had genuinely poor contrast (see the
 *  screenshot: teal text on a teal-tinted background at 10px). The dot
 *  carries the color now; the text stays high-contrast var(--text-primary)
 *  at a readable 13px, and every chip states what it's a number OF
 *  instead of a bare number. */
function InfoChip({ dotColor, icon, children, glow, testId }: { dotColor: string; icon?: React.ReactNode; children: React.ReactNode; glow?: boolean; testId?: string }) {
  return (
    <span
      className="glass"
      data-testid={testId}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px', fontSize: 13,
        color: 'var(--text-primary)', boxShadow: glow ? 'var(--glow-accent-sm)' : undefined,
      }}
    >
      {icon ? <span style={{ display: 'flex', color: dotColor }}>{icon}</span> : <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />}
      {children}
    </span>
  )
}

function formatTaskHistory(h: { sessionCount: number; totalMinutes: number }): string | null {
  if (h.sessionCount === 0) return "First session on this task"
  const hours = Math.floor(h.totalMinutes / 60)
  const mins = h.totalMinutes % 60
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return `${h.sessionCount} earlier session${h.sessionCount === 1 ? '' : 's'}, ${timeStr} total on this task`
}

export function NowBar({
  taskName,
  anchorName,
  elapsedSeconds,
  baseDurationSeconds,
  phase,
  justPulsed,
  appState,
  paused,
  ending = false,
  todayFocusedSeconds = null,
  nextEvent = null,
  taskHistory = null,
  onDone,
  onEnd,
  onBackToDashboard,
  onLockIn,
  onTogglePause,
  onRename,
}: NowBarProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(taskName)
  const [encouragementIndex, setEncouragementIndex] = useState(0)
  const [lockInHover, setLockInHover] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const brainDumpOpen = useBrainDumpUI((s) => s.open)
  const setBrainDumpOpen = useBrainDumpUI((s) => s.setOpen)
  const inFlow = phase === 'FLOW'
  const sessionActive = appState === 'FOCUS' || appState === 'FLOW'

  useEffect(() => {
    if (!isEditingName) setDraftName(taskName)
  }, [taskName, isEditingName])

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus()
  }, [isEditingName])

  useEffect(() => {
    if (!inFlow || paused) return
    const t = setInterval(() => {
      setEncouragementIndex((i) => (i + 1) % ENCOURAGEMENT.length)
    }, 90_000)
    return () => clearInterval(t)
  }, [inFlow, paused])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (brainDumpOpen || isEditingName || ending) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      if (e.key === ' ') {
        e.preventDefault()
        onTogglePause()
      } else if (e.key.toLowerCase() === 'l' && sessionActive && !paused) {
        onLockIn()
      } else if (e.key.toLowerCase() === 'd') {
        onDone()
      } else if (e.key === 'Escape') {
        onEnd()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessionActive, paused, onDone, onLockIn, onEnd, onTogglePause, brainDumpOpen, isEditingName, ending])

  function commitRename() {
    const trimmed = draftName.trim()
    setIsEditingName(false)
    if (!trimmed || trimmed === taskName) {
      setDraftName(taskName)
      return
    }
    onRename?.(trimmed)
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setDraftName(taskName)
      setIsEditingName(false)
    }
  }

  const flowElapsedMinutes = inFlow ? Math.max(0, Math.floor((elapsedSeconds - baseDurationSeconds) / 60)) : 0
  const minutesToFlow = !inFlow ? Math.max(0, Math.ceil((baseDurationSeconds - elapsedSeconds) / 60)) : 0
  const eventMinutesAway = nextEvent ? Math.round((new Date(nextEvent.start).getTime() - Date.now()) / 60000) : null
  const eventImminent = eventMinutesAway != null && eventMinutesAway <= IMMINENT_MINUTES && eventMinutesAway >= 0
  const historyLabel = taskHistory ? formatTaskHistory(taskHistory) : null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-nav)' as any, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--bg) 30%, transparent)', pointerEvents: 'none',
      }}
      data-testid="now-bar"
      data-phase={phase}
      data-paused={paused}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ position: 'fixed', top: 40, left: 48, display: 'flex', gap: 8, pointerEvents: 'auto' }}
      >
        <button
          type="button"
          data-testid="back-to-dashboard-button"
          onClick={onBackToDashboard}
          disabled={ending}
          title="Back to dashboard - your session keeps running in the background"
          className="glass glass-interactive"
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 15px', border: 'none', color: 'var(--text-secondary)', fontSize: 12.5, cursor: ending ? 'default' : 'pointer', opacity: ending ? 0.5 : 0.85 }}
        >
          <HomeIcon /> dashboard
        </button>
        <button
          type="button"
          data-testid="end-session-button"
          onClick={onEnd}
          disabled={ending}
          title="End session (Esc) - saves your progress, doesn't mark the task done"
          className="glass glass-interactive"
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 15px', border: 'none', color: 'var(--text-secondary)', fontSize: 12.5, cursor: ending ? 'default' : 'pointer', opacity: ending ? 0.5 : 0.85 }}
        >
          <ExitIcon /> end session
        </button>
      </motion.div>

      {/* Stats cluster - each chip now states clearly what it's a
          number of ("focused today", "earlier sessions on this task"),
          uses a dot for color instead of tinting the whole text, and
          sits at a legible 13px instead of the previous 10-11px. */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        style={{ position: 'fixed', top: 40, right: 48, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, pointerEvents: 'auto', maxWidth: '44vw' }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {todayFocusedSeconds != null && todayFocusedSeconds > 0 && (
            <InfoChip dotColor="var(--accent)" icon={<ClockDotIcon />} testId="today-focused-readout">
              {Math.floor(todayFocusedSeconds / 60)}m focused today
            </InfoChip>
          )}
          {historyLabel && (
            <InfoChip dotColor="var(--accent-b)" icon={<BarIcon />} testId="now-bar-task-history">
              {historyLabel}
            </InfoChip>
          )}
          <button
            type="button"
            data-testid="quick-capture-button"
            onClick={() => setBrainDumpOpen(true)}
            title="quick capture"
            className="glass glass-interactive"
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 15px', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}
          >
            + capture
          </button>
        </div>

        {nextEvent && (
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={eventImminent ? 'glass animate-pulse-soft' : 'glass'}
            data-testid="now-bar-next-event"
            title={nextEvent.summary}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, height: 36, padding: '0 14px', fontSize: 13,
              color: eventImminent ? 'var(--accent)' : 'var(--text-primary)',
              border: eventImminent ? '1.5px solid var(--accent)' : undefined,
              boxShadow: eventImminent ? 'var(--glow-accent-md)' : undefined,
            }}
          >
            <span aria-hidden="true" style={{ display: 'flex', color: eventImminent ? 'var(--accent)' : 'var(--text-tertiary)' }}><CalendarIcon /></span>
            <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextEvent.summary}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: eventImminent ? 600 : 400 }}>{eventCountdownLabel(nextEvent.start)}</span>
          </motion.span>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, pointerEvents: 'auto', maxWidth: '90vw' }}
      >
        {anchorName && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 0.15, duration: 0.5 }} className="text-section-label" style={{ letterSpacing: '0.08em', marginBottom: -8 }}>
            PART OF {anchorName.toUpperCase()}
          </motion.p>
        )}

        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: -44, borderRadius: '50%',
              background: `radial-gradient(circle, ${inFlow ? 'var(--accent-b)' : 'var(--accent)'}, transparent 68%)`,
              filter: 'blur(50px)', opacity: paused ? 0.1 : inFlow ? 0.5 : 0.26,
              transition: 'opacity 700ms var(--ease-focus), background 700ms var(--ease-focus)', pointerEvents: 'none',
            }}
          />
          <TimerRing elapsedSeconds={elapsedSeconds} baseDurationSeconds={baseDurationSeconds} justPulsed={justPulsed} state={appState} paused={paused} size={RING_SIZE} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, pointerEvents: 'none' }}>
            <motion.p
              className="text-elapsed"
              animate={inFlow && !paused ? { scale: [1, 1.03, 1] } : {}}
              transition={inFlow && !paused ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } : {}}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 500, color: 'var(--text-primary)', opacity: paused ? 0.55 : 1, letterSpacing: '0.01em', margin: 0 }}
            >
              {formatElapsed(elapsedSeconds)}
            </motion.p>

            {/* Badge redesign: dot + readable text instead of the old
                small colored-text pill (this is the exact "IN FLOW -
                +33m" from the screenshot). */}
            {paused && (
              <span
                data-testid="paused-badge"
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', fontSize: 13, color: 'var(--text-primary)', letterSpacing: '0.02em' }}
              >
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-tertiary)' }} />
                Paused
              </span>
            )}
            {!paused && inFlow && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', boxShadow: 'var(--glow-accent-sm)', fontSize: 13, color: 'var(--text-primary)', letterSpacing: '0.02em' }}
              >
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
                In flow{flowElapsedMinutes > 0 && ` - ${flowElapsedMinutes}m past your usual`}
              </motion.span>
            )}
            {!paused && !inFlow && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', fontSize: 13, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
                Focusing{minutesToFlow > 0 && ` - flow in ~${minutesToFlow}m`}
              </span>
            )}
          </div>
        </div>

        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={commitRename}
            data-testid="now-bar-task-name-input"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.4vw, 44px)', fontWeight: 600, color: 'var(--text-primary)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none', textAlign: 'center', maxWidth: '70vw', width: 420, padding: 0 }}
          />
        ) : (
          <motion.h1
            key={taskName}
            onClick={() => onRename && setIsEditingName(true)}
            title={onRename ? 'click to rename' : undefined}
            animate={{ opacity: paused ? 0.7 : 1 }}
            transition={{ duration: 0.4 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 3.4vw, 44px)', fontWeight: 600, color: 'var(--text-primary)', margin: 0, maxWidth: '70vw', textAlign: 'center', wordBreak: 'break-word', cursor: onRename ? 'text' : 'default' }}
            data-testid="now-bar-task-name"
          >
            {taskName}
          </motion.h1>
        )}

        {!paused && inFlow && (
          <AnimatePresence mode="wait">
            <motion.p key={encouragementIndex} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="text-meta" style={{ fontStyle: 'italic', textAlign: 'center' }}>
              {ENCOURAGEMENT[encouragementIndex]}
            </motion.p>
          </AnimatePresence>
        )}

        <div style={{ position: 'relative' }}>
          {/* New: hovering Lock In shows what it actually does, rather
              than leaving it as an unexplained button. This is the
              justification for the feature - not buried in a tooltip
              nobody hovers by accident, but a real caption that
              appears right where you're already looking. */}
          <AnimatePresence>
            {lockInHover && sessionActive && !paused && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.85, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                data-testid="lock-in-explainer"
                style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 10, width: 260, textAlign: 'center', fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}
              >
                {LOCK_IN_EXPLAINER}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="glass"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 6, borderRadius: 'var(--radius-full)', opacity: ending ? 0.6 : 1, marginTop: 6 }}
          >
            {sessionActive && (
              <button
                type="button"
                data-testid="lock-in-button"
                onClick={onLockIn}
                onMouseEnter={() => setLockInHover(true)}
                onMouseLeave={() => setLockInHover(false)}
                disabled={ending || paused}
                title={paused ? 'resume first to lock in' : 'Lock in (L)'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', border: 'none', borderRadius: 'var(--radius-full)',
                  background: 'transparent', color: paused ? 'var(--text-tertiary)' : inFlow ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 13, cursor: ending || paused ? 'default' : 'pointer', opacity: paused ? 0.5 : 1,
                  transition: 'background 200ms var(--ease-out-expo), color 200ms var(--ease-out-expo)',
                }}
              >
                <LockIcon /> Lock in
              </button>
            )}

            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

            <button
              type="button"
              data-testid="pause-toggle-button"
              onClick={onTogglePause}
              disabled={ending}
              title={paused ? 'Resume (Space)' : 'Pause (Space)'}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', border: 'none', borderRadius: 'var(--radius-full)',
                background: paused ? 'var(--surface-active)' : 'transparent', color: paused ? 'var(--warning)' : 'var(--text-secondary)',
                fontSize: 13, cursor: ending ? 'default' : 'pointer', transition: 'background 200ms var(--ease-out-expo), color 200ms var(--ease-out-expo)',
              }}
            >
              {paused ? <PlayIcon /> : <PauseIcon />} {paused ? 'Resume' : 'Pause'}
            </button>

            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

            <button
              type="button"
              data-testid="done-button"
              onClick={onDone}
              disabled={ending}
              title="Mark done (D)"
              style={{
                display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 20px', border: 'none', borderRadius: 'var(--radius-full)',
                background: 'var(--surface-active)', color: 'var(--success)', fontSize: 13, fontWeight: 500,
                cursor: ending ? 'default' : 'pointer', boxShadow: 'var(--glow-success)',
              }}
            >
              <CheckIcon /> {ending ? 'saving...' : 'Mark done'}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}