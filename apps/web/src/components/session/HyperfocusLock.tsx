// apps/web/src/components/session/HyperfocusLock.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface HyperfocusLockProps {
  taskName: string
  onExit: () => void
}

/**
 * Honest scope (§4.12): this suppresses DRIFT's OWN notifications only —
 * there is no cross-platform Tauri API to silence other apps' notifications.
 * It does not claim to. The onboarding copy elsewhere should nudge users to
 * turn on their OS's own focus mode separately.
 */
export function HyperfocusLock({ taskName, onExit }: HyperfocusLockProps) {
  const [exitText, setExitText] = useState('')
  const [pulseKey, setPulseKey] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Gentle confirmation pulse every 30 minutes, per spec.
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
    <div
      data-testid="hyperfocus-lock"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        background: 'var(--bg)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 56px)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          maxWidth: '80vw',
        }}
      >
        {taskName}
      </p>

      <div
        key={pulseKey}
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'hyperfocus-pulse 2s var(--ease-spring)',
        }}
      />
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
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          outline: 'none',
          color: 'var(--text-secondary)',
          fontSize: 13,
          textAlign: 'center',
          padding: 4,
          opacity: 0.5,
        }}
      />
    </div>
  )
}