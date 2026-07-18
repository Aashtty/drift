// apps/extension/components/InterventionPanel.tsx
import { useEffect, useState } from 'react'
import { formatDuration } from '~lib/formatDuration'

interface InterventionPanelProps {
  distractionStartedAt: number
  currentTaskName: string | null
  onBackToDrift: () => void
  onFiveMoreMinutes: () => void
  onDismiss: () => void
}

export function InterventionPanel({
  distractionStartedAt,
  currentTaskName,
  onBackToDrift,
  onFiveMoreMinutes,
  onDismiss,
}: InterventionPanelProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const elapsed = now - distractionStartedAt

  return (
    <div
      data-testid="intervention-panel"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 200,
        height: '100vh',
        zIndex: 2147483647, // max — must sit above any host page content
        pointerEvents:'auto',
        background: 'rgba(10,10,26,0.85)',
        backdropFilter: 'blur(30px) saturate(180%)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        color: '#c8c8e8',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: 24,
        boxSizing: 'border-box',
        animation: 'drift-slide-in 400ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <style>{`
        @keyframes drift-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="dismiss"
        style={{
          alignSelf: 'flex-end', background: 'none', border: 'none',
          color: 'rgba(200,200,232,0.4)', fontSize: 16, cursor: 'pointer',
        }}
      >
        ×
      </button>

      <p style={{ fontSize: 11, opacity: 0.4, marginTop: 24 }}>
        {new Date(now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </p>

      {currentTaskName && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 10, opacity: 0.4, margin: 0 }}>YOUR TASK</p>
          <p style={{ fontSize: 14, margin: '4px 0 0' }}>{currentTaskName}</p>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 10, opacity: 0.4, margin: 0 }}>DRIFTING FOR</p>
        <p style={{ fontSize: 20, fontFamily: 'ui-monospace, monospace', margin: '4px 0 0' }} data-testid="elapsed-readout">
          {formatDuration(elapsed)}
        </p>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          data-testid="back-to-drift"
          onClick={onBackToDrift}
          style={{
            padding: '10px 0', background: 'rgba(102,85,204,0.25)',
            border: '1px solid rgba(102,85,204,0.4)', borderRadius: 8,
            color: '#a89cff', fontSize: 13, cursor: 'pointer',
          }}
        >
          back to drift
        </button>
        <button
          type="button"
          data-testid="five-more-minutes"
          onClick={onFiveMoreMinutes}
          style={{
            padding: '10px 0', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            color: 'rgba(200,200,232,0.6)', fontSize: 13, cursor: 'pointer',
          }}
        >
          5 more min
        </button>
      </div>
    </div>
  )
}