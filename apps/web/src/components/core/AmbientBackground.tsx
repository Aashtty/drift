// apps/web/src/components/core/AmbientBackground.tsx
'use client'

// Three large, soft, drifting radial-gradient blobs behind everything —
// pure CSS animation (transform + opacity only, GPU-cheap, no canvas/JS
// tick loop needed). This is the original version — back to this per
// feedback, it's the right vibe.
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />
      <div className="ambient-grain" />
    </div>
  )
}