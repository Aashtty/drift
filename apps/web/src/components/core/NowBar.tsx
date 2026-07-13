// apps/web/src/components/core/NowBar.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TimerRing } from './TimerRing'
import { formatElapsed } from '@/lib/utils/formatElapsed'
import { useBrainDumpUI } from '@/stores/brainDumpUIStore'
import type { AppState } from '@/types/appState'
import type { TimerPhase } from '@/lib/utils/elasticTimer'

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
  onDone: () => void
  onEnd: () => void
  onLockIn: () => void
  onTogglePause: () => void
  onRename?: (newName: string) => void
}

const ENCOURAGEMENT = ['still with it', 'good pace', 'no rush', 'keep going', 'in the zone']
const RING_SIZE = 300

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

/**
 * Complete rebuild of the composition, not just a restyle. The old
 * layout put a 72px ring in a top corner and left everything else
 * (task name, elapsed time, controls) scattered around a mostly-empty
 * screen — the actual visual center of a focus timer had nothing in
 * it. This version puts a large ring dead-center as the literal focal
 * point, with elapsed time and phase state living inside the ring
 * itself, task name below it, and a soft halo behind it that responds
 * to phase (dim while paused, brighter in flow). Top-left/top-right
 * clusters and the bottom dock are now symmetric framing around that
 * center, not the main event.
 */
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
  onDone,
  onEnd,
  onLockIn,
  onTogglePause,
  onRename,
}: NowBarProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(taskName)
  const [encouragementIndex, setEncouragementIndex] = useState(0)
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-nav)' as any,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'color-mix(in srgb, var(--bg) 30%, transparent)',
        pointerEvents: 'none',
      }}
      data-testid="now-bar"
      data-phase={phase}
      data-paused={paused}
    >
      {/* top-left: exit */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ position: 'fixed', top: 40, left: 48, pointerEvents: 'auto' }}
      >
        <button
          type="button"
          data-testid="end-session-button"
          onClick={onEnd}
          disabled={ending}
          title="End session (Esc) — saves your progress, doesn't mark the task done"
          className="glass glass-interactive"
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 15px', border: 'none', color: 'var(--text-secondary)', fontSize: 12.5, cursor: ending ? 'default' : 'pointer', opacity: ending ? 0.5 : 0.85 }}
        >
          <ExitIcon /> end session
        </button>
      </motion.div>

      {/* top-right: today stat + capture */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        style={{ position: 'fixed', top: 40, right: 48, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}
      >
        {todayFocusedSeconds != null && todayFocusedSeconds > 0 && (
          <span className="glass" data-testid="today-focused-readout" style={{ display: 'flex', alignItems: 'center', height: 34, padding: '0 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
            {Math.floor(todayFocusedSeconds / 60)}m today
          </span>
        )}
        <button
          type="button"
          data-testid="quick-capture-button"
          onClick={() => setBrainDumpOpen(true)}
          title="quick capture"
          className="glass glass-interactive"
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 15px', border: 'none', color: 'var(--accent)', fontSize: 12.5, cursor: 'pointer', opacity: 0.9 }}
        >
          + capture
        </button>
      </motion.div>

      {/* center hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, pointerEvents: 'auto', maxWidth: '90vw' }}
      >
        {anchorName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-section-label"
            style={{ letterSpacing: '0.08em', marginBottom: -8 }}
          >
            PART OF {anchorName.toUpperCase()}
          </motion.p>
        )}

        <div style={{ position: 'relative', width: RING_SIZE, height: RING_SIZE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -44,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${inFlow ? 'var(--accent-b)' : 'var(--accent)'}, transparent 68%)`,
              filter: 'blur(50px)',
              opacity: paused ? 0.1 : inFlow ? 0.5 : 0.26,
              transition: 'opacity 700ms var(--ease-focus), background 700ms var(--ease-focus)',
              pointerEvents: 'none',
            }}
          />
          <TimerRing
            elapsedSeconds={elapsedSeconds}
            baseDurationSeconds={baseDurationSeconds}
            justPulsed={justPulsed}
            state={appState}
            paused={paused}
            size={RING_SIZE}
          />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, pointerEvents: 'none' }}>
            <motion.p
              className="text-elapsed"
              animate={inFlow && !paused ? { scale: [1, 1.03, 1] } : {}}
              transition={inFlow && !paused ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' } : {}}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 500, color: 'var(--text-primary)', opacity: paused ? 0.55 : 1, letterSpacing: '0.01em', margin: 0 }}
            >
              {formatElapsed(elapsedSeconds)}
            </motion.p>

            {paused && (
              <span className="text-micro-mono" data-testid="paused-badge" style={{ color: 'var(--text-tertiary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', letterSpacing: '0.06em' }}>
                PAUSED
              </span>
            )}
            {!paused && inFlow && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-micro-mono"
                style={{ color: 'var(--accent)', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', boxShadow: 'var(--glow-accent-sm)', letterSpacing: '0.06em' }}
              >
                IN FLOW{flowElapsedMinutes > 0 && ` · +${flowElapsedMinutes}m`}
              </motion.span>
            )}
            {!paused && !inFlow && (
              <span className="text-micro-mono" style={{ color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-active)', letterSpacing: '0.06em' }}>
                FOCUSING{minutesToFlow > 0 && ` · flow in ~${minutesToFlow}m`}
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
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 3.4vw, 44px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              borderBottom: '2px solid var(--accent)',
              outline: 'none',
              textAlign: 'center',
              maxWidth: '70vw',
              width: 420,
              padding: 0,
            }}
          />
        ) : (
          <motion.h1
            key={taskName}
            onClick={() => onRename && setIsEditingName(true)}
            title={onRename ? 'click to rename' : undefined}
            animate={{ opacity: paused ? 0.7 : 1 }}
            transition={{ duration: 0.4 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(26px, 3.4vw, 44px)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: 0,
              maxWidth: '70vw',
              textAlign: 'center',
              wordBreak: 'break-word',
              cursor: onRename ? 'text' : 'default',
            }}
            data-testid="now-bar-task-name"
          >
            {taskName}
          </motion.h1>
        )}

        {!paused && inFlow && (
          <AnimatePresence mode="wait">
            <motion.p
              key={encouragementIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-meta"
              style={{ fontStyle: 'italic', textAlign: 'center', marginTop: -14 }}
            >
              {ENCOURAGEMENT[encouragementIndex]}
            </motion.p>
          </AnimatePresence>
        )}
      </motion.div>

      {/* bottom dock */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass"
        style={{
          position: 'fixed',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: 6,
          borderRadius: 'var(--radius-full)',
          pointerEvents: 'auto',
          opacity: ending ? 0.6 : 1,
        }}
      >
        {sessionActive && (
          <button
            type="button"
            data-testid="lock-in-button"
            onClick={onLockIn}
            disabled={ending || paused}
            title={paused ? 'resume first to lock in' : 'Lock in (L)'}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, height: 40, padding: '0 16px', border: 'none', borderRadius: 'var(--radius-full)',
              background: 'transparent', color: paused ? 'var(--text-tertiary)' : inFlow ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13, cursor: ending || paused ? 'default' : 'pointer', opacity: paused ? 0.5 : 1,
              transition: 'background 200ms var(--ease-out-expo), color 200ms var(--ease-out-expo)',
            }}
            onMouseEnter={(e) => { if (ending || paused) return; e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = paused ? 'var(--text-tertiary)' : inFlow ? 'var(--accent)' : 'var(--text-secondary)' }}
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
            fontSize: 13, cursor: ending ? 'default' : 'pointer',
            transition: 'background 200ms var(--ease-out-expo), color 200ms var(--ease-out-expo)',
          }}
          onMouseEnter={(e) => { if (ending) return; e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = paused ? 'var(--surface-active)' : 'transparent'; e.currentTarget.style.color = paused ? 'var(--warning)' : 'var(--text-secondary)' }}
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
            cursor: ending ? 'default' : 'pointer', boxShadow: 'var(--glow-success)', transition: 'transform 150ms var(--ease-spring)',
          }}
          onMouseEnter={(e) => { if (!ending) e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <CheckIcon /> {ending ? 'saving…' : 'Mark done'}
        </button>
      </motion.div>
    </div>
  )
}