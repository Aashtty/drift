// apps/web/src/components/tasks/BulkActionBar.tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'

interface BulkActionBarProps {
  count: number
  onComplete: () => void
  onLimbo: () => void
  onArchive: () => void
  onClear: () => void
}

/** Appears only in Tasks' selection mode — mirrors the fixed bottom-dock
 *  language NowBar already established, so it reads as "the same kind
 *  of control" rather than a new pattern. */
export function BulkActionBar({ count, onComplete, onLimbo, onArchive, onClear }: BulkActionBarProps) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="glass"
          data-testid="bulk-action-bar"
          style={{
            position: 'fixed',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 6,
            borderRadius: 'var(--radius-full)',
            zIndex: 'var(--z-floating)' as any,
            boxShadow: 'var(--glow-accent-sm)',
          }}
        >
          <span className="text-micro-mono" style={{ padding: '0 12px', color: 'var(--text-secondary)' }}>
            {count} selected
          </span>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <BarButton label="done" color="var(--success)" onClick={onComplete} testId="bulk-complete" />
          <BarButton label="limbo" color="var(--text-secondary)" onClick={onLimbo} testId="bulk-limbo" />
          <BarButton label="archive" color="var(--text-secondary)" onClick={onArchive} testId="bulk-archive" />
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <BarButton label="clear" color="var(--text-tertiary)" onClick={onClear} testId="bulk-clear" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BarButton({ label, color, onClick, testId }: { label: string; color: string; onClick: () => void; testId?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      style={{ height: 36, padding: '0 14px', border: 'none', borderRadius: 'var(--radius-full)', background: 'transparent', color, fontSize: 12.5, cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  )
}