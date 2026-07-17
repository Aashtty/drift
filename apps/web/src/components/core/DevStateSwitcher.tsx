// apps/web/src/components/core/DevStateSwitcher.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAppState } from '@/hooks/useAppState'
import type { AppState } from '@/types/appState'

const STATES: AppState[] = ['IDLE', 'FOCUS', 'FLOW', 'DRIFT', 'SHUTDOWN']

/**
 * Was always-rendered as five prominent pills, bottom-right, on every
 * page in dev — visible enough that it kept reading as a real product
 * feature rather than a debug tool. Hidden by default behind a tiny
 * unlabeled dot; Ctrl/Cmd+Shift+S or clicking the dot reveals it.
 */
export function DevStateSwitcher() {
  const { state, setState } = useAppState()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    function handler(e: KeyboardEvent) {
      const modifier = e.metaKey || e.ctrlKey
      if (modifier && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (process.env.NODE_ENV === 'production') return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="dev: state switcher (Ctrl/Cmd+Shift+S)"
        aria-label="open dev state switcher"
        data-testid="dev-state-switcher-dot"
        style={{
          position: 'fixed', bottom: 12, right: 12, zIndex: 50,
          width: 8, height: 8, borderRadius: '50%', border: 'none',
          background: 'var(--text-tertiary)', opacity: 0.35, cursor: 'pointer', padding: 0,
        }}
      />
    )
  }

  return (
    <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 50, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span className="text-micro-mono" style={{ opacity: 0.5 }}>DEV</span>
      {STATES.map((s) => (
        <button
          key={s}
          type="button"
          data-testid={`state-switch-${s}`}
          onClick={() => setState(s)}
          className="glass"
          style={{
            padding: '6px 10px', fontSize: 11, fontFamily: 'var(--font-mono)',
            color: s === state ? 'var(--accent)' : 'var(--text-secondary)',
            border: s === state ? '1px solid var(--accent)' : undefined, cursor: 'pointer',
          }}
        >
          {s}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="close dev state switcher"
        style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 6, color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 12 }}
      >
        ×
      </button>
    </div>
  )
}