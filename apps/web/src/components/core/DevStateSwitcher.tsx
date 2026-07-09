// apps/web/src/components/core/DevStateSwitcher.tsx
'use client'

import { useAppState } from '@/hooks/useAppState'
import type { AppState } from '@/types/appState'

const STATES: AppState[] = ['IDLE', 'FOCUS', 'FLOW', 'DRIFT', 'SHUTDOWN']

export function DevStateSwitcher() {
  const { state, setState } = useAppState()

  // Double-gated: this component is also only ever imported behind a
  // `process.env.NODE_ENV !== 'production'` check at the call site (see
  // page.tsx), but gating itself too means it's safe even if some future
  // session accidentally mounts it somewhere else.
  if (process.env.NODE_ENV === 'production') return null

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50, display: 'flex', gap: 8 }}>
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