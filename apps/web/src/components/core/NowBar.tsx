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
  /** True while a save is in flight for Done/End — disables both buttons
   *  so a slow connection can't produce a double-submit. */
  ending?: boolean
  onDone: () => void
  /**
   * Ends the session without marking the task complete. Previously
   * called `onPause`, but nothing about it was actually pausable —
   * it called the same `endSession` as onBackToDashboard. Renamed the
   * prop (and the button copy) to match what it really does, rather
   * than implying resumability that doesn't exist.
   */
  onEnd: () => void
  onLockIn: () => void
  onBackToDashboard?: () => void
  onRename?: (newName: string) => void
}

const ENCOURAGEMENT = ['still with it', 'good pace', 'no rush', 'keep going', 'in the zone']
const CONFIRM_AUTO_REVERT_MS = 6000

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function StopIcon() {
  // Square stop glyph replaces the old pause (two bars) icon — matches
  // the honest "this ends the session" semantics instead of implying
  // a resumable pause.
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="1.5" width="11" height="11" rx="2" fill="currentColor" />
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

export function NowBar({
  taskName,
  anchorName,
  elapsedSeconds,
  baseDurationSeconds,
  phase,
  justPulsed,
  appState,
  ending = false,
  onDone,
  onEnd,
  onLockIn,
  onBackToDashboard,
  onRename,
}: NowBarProps) {
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState(taskName)
  const [encouragementIndex, setEncouragementIndex] = useState(0)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const confirmRevertRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

  function openConfirmEnd() {
    setConfirmEnd(true)
    if (confirmRevertRef.current) clearTimeout(confirmRevertRef.current)
    confirmRevertRef.current = setTimeout(() => setConfirmEnd(false), CONFIRM_AUTO_REVERT_MS)
  }
  function closeConfirmEnd() {
    setConfirmEnd(false)
    if (confirmRevertRef.current) clearTimeout(confirmRevertRef.current)
  }
  useEffect(() => () => {
    if (confirmRevertRef.current) clearTimeout(confirmRevertRef.current)
  }, [])

  useEffect(() => {
    if (!inFlow) return
    const t = setInterval(() => {
      setEncouragementIndex((i) => (i + 1) % ENCOURAGEMENT.length)
    }, 90_000)
    return () => clearInterval(t)
  }, [inFlow])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (brainDumpOpen || isEditingName || ending) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      const key = e.key.toLowerCase()
      if (key === 'l' && sessionActive) {
        onLockIn()
      } else if (key === 'd') {
        onDone()
      } else if (e.key === 'Escape' || key === 'p') {
        if (confirmEnd) onEnd()
        else openConfirmEnd()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessionActive, onDone, onLockIn, onEnd, brainDumpOpen, isEditingName, confirmEnd, ending])

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
  const safeLeft = 'max(56px, 260px)'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: safeLeft,
        background: 'color-mix(in srgb, var(--bg) 30%, transparent)',
        pointerEvents: 'none',
      }}
      data-testid="now-bar"
      data-phase={phase}
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        style={{ position: 'fixed', top: 40, left: safeLeft, display: 'flex', gap: 8, pointerEvents: 'auto' }}
      >
        {onBackToDashboard && (
          <button
            type="button"
            data-testid="back-to-dashboard-button"
            onClick={onBackToDashboard}
            disabled={ending}
            className="glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 14px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
              fontSize: 12.5,
              cursor: ending ? 'default' : 'pointer',
              opacity: ending ? 0.5 : 0.8,
            }}
          >
            ← dashboard
          </button>
        )}
        <button
          type="button"
          data-testid="quick-capture-button"
          onClick={() => setBrainDumpOpen(true)}
          title="quick capture"
          className="glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            padding: '0 14px',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            color: 'var(--accent)',
            fontSize: 12.5,
            cursor: 'pointer',
            opacity: 0.9,
          }}
        >
          + capture
        </button>
      </motion.div>

      {anchorName && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.45 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-section-label"
          style={{ letterSpacing: '0.08em', marginBottom: 10 }}
        >
          PART OF {anchorName.toUpperCase()}
        </motion.p>
      )}

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
            fontSize: 'clamp(36px, 5vw, 72px)',
            fontWeight: 600,
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            background: 'transparent',
            border: 'none',
            borderBottom: '2px solid var(--accent)',
            outline: 'none',
            margin: 0,
            maxWidth: '85vw',
            width: '85vw',
            padding: 0,
            pointerEvents: 'auto',
          }}
        />
      ) : (
        <motion.h1
          key={taskName}
          onClick={() => onRename && setIsEditingName(true)}
          title={onRename ? 'click to rename' : undefined}
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            textShadow: inFlow
              ? '0 0 64px color-mix(in srgb, var(--accent) 60%, transparent), 0 0 20px color-mix(in srgb, var(--accent) 40%, transparent)'
              : '0 0 32px color-mix(in srgb, var(--accent) 35%, transparent)',
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 72px)',
            fontWeight: 600,
            lineHeight: 1.1,
            color: 'var(--text-primary)',
            margin: 0,
            maxWidth: '85vw',
            wordBreak: 'break-word',
            cursor: onRename ? 'text' : 'default',
            pointerEvents: onRename ? 'auto' : 'none',
          }}
          data-testid="now-bar-task-name"
        >
          {taskName}
        </motion.h1>
      )}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 24, flexWrap: 'wrap' }}
      >
        <motion.p
          className="text-elapsed"
          animate={inFlow ? { scale: [1, 1.04, 1] } : {}}
          transition={inFlow ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
          style={{ transformOrigin: 'left center', fontSize: 18 }}
        >
          {formatElapsed(elapsedSeconds)}
        </motion.p>
        {inFlow && (
          <>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-micro-mono"
              style={{
                color: 'var(--accent)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-active)',
                boxShadow: 'var(--glow-accent-sm)',
                letterSpacing: '0.06em',
              }}
            >
              IN FLOW {flowElapsedMinutes > 0 && `· +${flowElapsedMinutes}m`}
            </motion.span>
            <AnimatePresence mode="wait">
              <motion.span
                key={encouragementIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="text-meta"
                style={{ fontStyle: 'italic' }}
              >
                {ENCOURAGEMENT[encouragementIndex]}
              </motion.span>
            </AnimatePresence>
          </>
        )}
      </motion.div>

      <div style={{ position: 'fixed', top: 40, right: 56 }}>
        <TimerRing
          elapsedSeconds={elapsedSeconds}
          baseDurationSeconds={baseDurationSeconds}
          justPulsed={justPulsed}
          state={appState}
          size={72}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass"
        style={{
          position: 'fixed',
          bottom: 36,
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
            disabled={ending}
            title="Lock in (L)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              height: 40,
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: inFlow ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13,
              cursor: ending ? 'default' : 'pointer',
              transition: 'background 200ms var(--ease-out-expo), color 200ms var(--ease-out-expo)',
            }}
            onMouseEnter={(e) => {
              if (ending) return
              e.currentTarget.style.background = 'var(--surface-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = inFlow ? 'var(--accent)' : 'var(--text-secondary)'
            }}
          >
            <LockIcon /> Lock in
          </button>
        )}

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        <AnimatePresence mode="wait" initial={false}>
          {!confirmEnd ? (
            <motion.button
              key="end-prompt"
              type="button"
              data-testid="pause-button"
              onClick={openConfirmEnd}
              disabled={ending}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              title="End session (Esc or P) — progress is saved, but you can't resume"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                height: 40,
                padding: '0 16px',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 13,
                cursor: ending ? 'default' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (ending) return
                e.currentTarget.style.background = 'var(--surface-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <StopIcon /> End session
            </motion.button>
          ) : (
            <motion.div
              key="confirm-group"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', gap: 4 }}
            >
              <button
                type="button"
                onClick={closeConfirmEnd}
                disabled={ending}
                style={{
                  height: 40,
                  padding: '0 14px',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                  cursor: ending ? 'default' : 'pointer',
                }}
              >
                back
              </button>
              <button
                type="button"
                onClick={onEnd}
                disabled={ending}
                title="Esc again to confirm"
                style={{
                  height: 40,
                  padding: '0 16px',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-active)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: ending ? 'default' : 'pointer',
                }}
              >
                {ending ? 'ending…' : 'confirm end'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        <button
          type="button"
          data-testid="done-button"
          onClick={onDone}
          disabled={ending}
          title="Mark done (D)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            height: 40,
            padding: '0 20px',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-active)',
            color: 'var(--success)',
            fontSize: 13,
            fontWeight: 500,
            cursor: ending ? 'default' : 'pointer',
            boxShadow: 'var(--glow-success)',
            transition: 'transform 150ms var(--ease-spring)',
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