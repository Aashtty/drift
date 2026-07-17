// apps/web/src/components/session/HyperfocusLock.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { formatElapsed } from '@/lib/utils/formatElapsed'

interface HyperfocusLockProps {
  taskName: string
  elapsedSeconds: number
  onExit: () => void
}

const SECONDARY_EXIT_DELAY_MS = 15_000

export function HyperfocusLock({ taskName, elapsedSeconds, onExit }: HyperfocusLockProps) {
  const [exitText, setExitText] = useState('')
  const [pulseKey, setPulseKey] = useState(0)
  const [showSecondaryExit, setShowSecondaryExit] = useState(false)
  const [confirmingSecondaryExit, setConfirmingSecondaryExit] = useState(false)
  const [showJustification, setShowJustification] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // New: a brief, self-dismissing line confirming what just happened -
  // this is the "on-arrival" half of justifying the feature (NowBar's
  // hover explainer is the "before you click" half).
  useEffect(() => {
    const t = setTimeout(() => setShowJustification(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setShowSecondaryExit(true), SECONDARY_EXIT_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setPulseKey((k) => k + 1), 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setExitText(value)
    if (value.trim().toLowerCase() === 'done') {
      onExit()
    }
  }

  return (
    <div data-testid="hyperfocus-lock" style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-fullscreen)' as any, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, background: 'var(--bg)' }}>
      <p aria-hidden="true" style={{ position: 'fixed', top: 28, right: 32, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', opacity: 0.4, letterSpacing: '0.04em' }}>
        {formatElapsed(elapsedSeconds)}
      </p>

      <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--text-primary)', textAlign: 'center', maxWidth: '80vw' }}>
        {taskName}
      </p>

      <div key={pulseKey} aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'hyperfocus-pulse 2s var(--ease-spring)' }} />
      <style>{`
        @keyframes hyperfocus-pulse {
          0% { box-shadow: 0 0 0 0 var(--accent); }
          50% { box-shadow: 0 0 0 24px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>

      <input
        ref={inputRef}
        type="text"
        value={exitText}
        onChange={handleChange}
        placeholder='type "done" to exit'
        data-testid="hyperfocus-exit-input"
        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', outline: 'none', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', padding: 4, opacity: 0.5 }}
      />

      {showJustification && (
        <p style={{ position: 'fixed', bottom: 80, fontSize: 11.5, color: 'var(--text-tertiary)', maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }} data-testid="hyperfocus-justification">
          Distraction shield on - Drift's own alerts are held back until you're done here.
        </p>
      )}

      {showSecondaryExit && (
        <div style={{ position: 'fixed', bottom: 28, opacity: 0.55 }}>
          {!confirmingSecondaryExit ? (
            <button type="button" data-testid="hyperfocus-secondary-exit-prompt" onClick={() => setConfirmingSecondaryExit(true)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11.5, cursor: 'pointer' }}>
              need to step away?
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>exit without finishing?</span>
              <button type="button" data-testid="hyperfocus-secondary-exit-confirm" onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 11.5, cursor: 'pointer' }}>
                yes, exit
              </button>
              <button type="button" onClick={() => setConfirmingSecondaryExit(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11.5, cursor: 'pointer' }}>
                stay
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}