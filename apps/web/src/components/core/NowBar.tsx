// apps/web/src/components/core/NowBar.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { TimerRing } from './TimerRing'
import { formatElapsed } from '@/lib/utils/formatElapsed'
import { fadeUp } from '@/lib/utils/motionVariants'
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
  const [showExit, setShowExit] = useState(false)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        paddingLeft: 48,
      }}
      data-testid="now-bar"
      data-phase={phase}
    >
      <h1
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
      </h1>

      <p className="text-elapsed" style={{ marginTop: 24 }}>
        {formatElapsed(elapsedSeconds)}
      </p>

      {anchorName && (
        <p className="text-meta" style={{ opacity: 0.3, marginTop: 4 }}>
          Part of: {anchorName}
        </p>
      )}

      <div style={{ position: 'fixed', top: 32, right: 48 }}>
        <TimerRing
          elapsedSeconds={elapsedSeconds}
          baseDurationSeconds={baseDurationSeconds}
          justPulsed={justPulsed}
          state={appState}
          size={72}
        />
      </div>

      {appState === 'FOCUS' && (
        <button
          type="button"
          data-testid="lock-in-button"
          onClick={onLockIn}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 96,
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            opacity: 0.4,
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          lock in 🔒
        </button>
      )}

      <div style={{ position: 'fixed', bottom: 24, right: 24 }}>
        <AnimatePresence mode="wait">
          {!showExit ? (
            <motion.button
              key="esc-label"
              type="button"
              onClick={() => setShowExit(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                opacity: 0.25,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              esc
            </motion.button>
          ) : (
            <motion.div
              key="exit-buttons"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', gap: 8 }}
            >
              <button
                type="button"
                data-testid="done-button"
                onClick={onDone}
                className="glass"
                style={{ height: 48, width: 80, border: 'none', color: 'var(--success)', fontSize: 14, cursor: 'pointer' }}
              >
                done
              </button>
              <button
                type="button"
                data-testid="pause-button"
                onClick={onPause}
                className="glass"
                style={{ height: 48, width: 80, border: 'none', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}
              >
                pause
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}