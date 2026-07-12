// apps/web/src/components/core/DevStateSwitcher.tsx
'use client'

import { useAppState } from '@/hooks/useAppState'
import type { AppState } from '@/types/appState'

const STATES: AppState[] = ['IDLE', 'FOCUS', 'FLOW', 'DRIFT', 'SHUTDOWN']

export function DevStateSwitcher() {
  const { state, setState } = useAppState()

  if (process.env.NODE_ENV === 'production') return null

  return (
    <div
      style={{
        position: 'fixed',
        // Sits directly above CaptureButton (bottom:32, height:52, so it
        // spans 32-84px from the bottom) with a real gap, right-aligned
        // to the same edge instead of both competing for the same
        // bottom-right 16-46px band. Fixed here means CaptureButton
        // doesn't need to know this dev-only tool exists at all.
        bottom: 100,
        right: 32,
        zIndex: 50,
        display: 'flex',
        gap: 8,
      }}
    >
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
    </div>
  )
}