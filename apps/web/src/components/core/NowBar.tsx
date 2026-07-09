// apps/web/src/components/core/NowBar.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TimerRing } from './TimerRing'
import { formatElapsed } from '@/lib/utils/formatElapsed'
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
}: NowBarProps) {
  const [confirmExit, setConfirmExit] = useState(false)
  const inFlow = phase === 'FLOW'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 56,
      }}
      data-testid="now-bar"
      data-phase={phase}
    >
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

      <motion.h1
        key={taskName}
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
          maxWidth: '90vw',
          wordBreak: 'break-word',
        }}
        data-testid="now-bar-task-name"
      >
        {taskName}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 24 }}
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
            IN FLOW
          </motion.span>
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

      {/* Single unified control dock — replaces the three separate
          floating fragments (lock-in / esc / done+pause) that had no
          shared anchor and inconsistent spacing. Everything now lives
          in one glass pill, bottom-center, so it reads as one
          deliberate control surface instead of scattered corner UI. */}
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
        }}
      >
        {appState === 'FOCUS' && (
          <button
            type="button"
            data-testid="lock-in-button"
            onClick={onLockIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 40,
              padding: '0 16px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              background: 'transparent',
              color: 'var(--text-secondary)',
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
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            🔒 Lock in
          </button>
        )}

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        <AnimatePresence mode="wait" initial={false}>
          {!confirmExit ? (
            <motion.button
              key="pause-prompt"
              type="button"
              data-testid="pause-button"
              onClick={() => setConfirmExit(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
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
              Pause
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
                onClick={() => setConfirmExit(false)}
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
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
          ✓ Mark done
        </button>
      </motion.div>
    </div>
  )
}