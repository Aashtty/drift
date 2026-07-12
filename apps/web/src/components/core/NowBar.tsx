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
  onDone: () => void
  onPause: () => void
  onLockIn: () => void
  /** Optional — renders a subtle "← dashboard" link, top-left. */
  onBackToDashboard?: () => void
  /** Optional — makes the task title clickable to rename in place. */
  onRename?: (newName: string) => void
}

const ENCOURAGEMENT = ['still with it', 'good pace', 'no rush', 'keep going', 'in the zone']
const CONFIRM_AUTO_REVERT_MS = 6000

// Small inline icon set — replaces emoji (🔒 ✓), which render wildly
// inconsistently across OS/browser combos and looked out of place next
// to the rest of the custom UI here.
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
  onDone,
  onPause,
  onLockIn,
  onBackToDashboard,
  onRename,
}: NowBarProps) {
  const [confirmExit, setConfirmExit] = useState(false)
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

  // Confirm-pause used to stay open indefinitely if the person clicked
  // "Pause" and then got pulled away before clicking "confirm pause" or
  // "back" — a very plausible interruption for exactly the people this
  // app is built for. Auto-revert after a few seconds of no action.
  function openConfirmExit() {
    setConfirmExit(true)
    if (confirmRevertRef.current) clearTimeout(confirmRevertRef.current)
    confirmRevertRef.current = setTimeout(() => setConfirmExit(false), CONFIRM_AUTO_REVERT_MS)
  }
  function closeConfirmExit() {
    setConfirmExit(false)
    if (confirmRevertRef.current) clearTimeout(confirmRevertRef.current)
  }
  useEffect(() => () => {
    if (confirmRevertRef.current) clearTimeout(confirmRevertRef.current)
  }, [])

  // Quiet rotation through short encouragement phrases while in flow —
  // not a nag, not a notification, just something to glance at.
  useEffect(() => {
    if (!inFlow) return
    const t = setInterval(() => {
      setEncouragementIndex((i) => (i + 1) % ENCOURAGEMENT.length)
    }, 90_000)
    return () => clearInterval(t)
  }, [inFlow])

  // Keyboard shortcuts:
  //   L        lock in (available through FOCUS and FLOW)
  //   D        mark done
  //   Esc / P  open the pause confirm — pressing Esc again while it's
  //            already open confirms the pause, so the whole flow is
  //            keyboard-only if you want it to be.
  // Bails out while the rename input or the brain dump modal has
  // focus/is open, so typing "d" while renaming a task doesn't also
  // fire "mark done".
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (brainDumpOpen || isEditingName) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return

      const key = e.key.toLowerCase()
      if (key === 'l' && sessionActive) {
        onLockIn()
      } else if (key === 'd') {
        onDone()
      } else if (e.key === 'Escape' || key === 'p') {
        if (confirmExit) onPause()
        else openConfirmExit()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sessionActive, onDone, onLockIn, onPause, brainDumpOpen, isEditingName, confirmExit])

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
  // Guards against a sidebar unexpectedly coexisting with this screen
  // (e.g. a focus session started from somewhere that doesn't do a real
  // route change to /now) — these buttons physically cannot land inside
  // a ~232px sidebar column regardless of what's rendered behind them.
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
        // Soft scrim, not a solid fill — still lets the ambient
        // background glow through, but gives this screen real visual
        // separation from anything that might be rendered underneath it
        // (belt-and-suspenders alongside the z-index bump above; the
        // real fix for sidebar coexistence lives wherever a session is
        // actually started outside the dashboard, e.g. /tasks).
        background: 'color-mix(in srgb, var(--bg) 30%, transparent)',
        // CRITICAL: this wrapper covers the entire viewport for layout
        // purposes only. Without pointer-events: none it silently eats
        // clicks meant for anything rendered as a sibling underneath it
        // in the same fixed-positioning context (e.g. SoundControl,
        // mounted alongside NowBar in now/page.tsx). Interactive
        // children below opt back in explicitly with pointerEvents: 'auto'.
        pointerEvents: 'none',
      }}
      data-testid="now-bar"
      data-phase={phase}
    >
      {/* Top-left wayfinding + quick-capture cluster. Mirrors the
          TimerRing's top:40/right:56 placement on the opposite corner
          so the screen reads as intentionally framed, not empty. */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        style={{
          position: 'fixed',
          top: 40,
          left: safeLeft,
          display: 'flex',
          gap: 8,
          pointerEvents: 'auto',
        }}
      >
        {onBackToDashboard && (
          <button
            type="button"
            data-testid="back-to-dashboard-button"
            onClick={onBackToDashboard}
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
              cursor: 'pointer',
              opacity: 0.8,
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

      {/* Single unified control dock — one glass pill, bottom-center.
          Lock in is now available through FOCUS *and* FLOW (previously
          it disappeared the instant flow kicked in, which was backwards
          — flow is exactly when shielding against interruption matters
          most). Icons are custom SVG instead of emoji for a consistent
          look across platforms. */}
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
          pointerEvents: 'auto', // opt back in — parent wrapper is pointer-events: none
        }}
      >
        {sessionActive && (
          <button
            type="button"
            data-testid="lock-in-button"
            onClick={onLockIn}
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
              cursor: 'pointer',
              transition: 'background 200ms var(--ease-out-expo), color 200ms var(--ease-out-expo)',
            }}
            onMouseEnter={(e) => {
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
          {!confirmExit ? (
            <motion.button
              key="pause-prompt"
              type="button"
              data-testid="pause-button"
              onClick={openConfirmExit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              title="Pause (Esc or P)"
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
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <PauseIcon /> Pause
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
                onClick={closeConfirmExit}
                style={{
                  height: 40,
                  padding: '0 14px',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  background: 'transparent',
                  color: 'var(--text-tertiary)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                back
              </button>
              <button
                type="button"
                onClick={onPause}
                title="Esc again to confirm"
                style={{
                  height: 40,
                  padding: '0 16px',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--surface-active)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                confirm pause
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        <button
          type="button"
          data-testid="done-button"
          onClick={onDone}
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
            cursor: 'pointer',
            boxShadow: 'var(--glow-success)',
            transition: 'transform 150ms var(--ease-spring)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <CheckIcon /> Mark done
        </button>
      </motion.div>
    </div>
  )
}