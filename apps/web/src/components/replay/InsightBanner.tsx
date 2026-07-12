// apps/web/src/components/replay/InsightBanner.tsx
'use client'

function LightbulbIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-2.5 8.24c.3.2.5.55.5.94V11h4v-.32c0-.39.2-.74.5-.94A4.5 4.5 0 0 0 8 1.5Z"
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M6.25 13h3.5M6.75 14.5h2.5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function InsightBanner({ text }: { text: string }) {
  return (
    <div
      className="glass"
      data-testid="insight-banner"
      style={{
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderLeft: '2px solid var(--accent)',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>
        <LightbulbIcon />
      </span>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-primary)' }}>{text}</p>
    </div>
  )
}