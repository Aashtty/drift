// apps/web/src/components/core/Toast.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useToastStore, type ToastItem } from '@/stores/toastStore'

// This is the single most important addition to the whole app: before
// this existed, every failed save (a session that didn't record, an
// event that didn't delete, a shutdown that didn't persist) just logged
// to a console nobody opens and then acted as if it had succeeded. Now
// every one of those call sites surfaces here instead of vanishing.

function ToastIcon({ variant }: { variant: ToastItem['variant'] }) {
  if (variant === 'success') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5L6.5 12L13 4.5" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (variant === 'error') {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="var(--danger)" strokeWidth="1.4" />
        <path d="M8 4.5V9" stroke="var(--danger)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.2" r="0.9" fill="var(--danger)" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="var(--accent)" strokeWidth="1.4" />
      <path d="M8 7V11.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="4.8" r="0.9" fill="var(--accent)" />
    </svg>
  )
}

function ToastRow({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => dismiss(toast.id), toast.duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id])

  const borderColor =
    toast.variant === 'error' ? 'var(--danger)' : toast.variant === 'success' ? 'var(--success)' : 'var(--border-accent)'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="glass"
      data-testid="toast"
      data-variant={toast.variant}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        minWidth: 220,
        maxWidth: 360,
        boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
      }}
    >
      <span style={{ flexShrink: 0, display: 'flex' }}>
        <ToastIcon variant={toast.variant} />
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label="dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-tertiary)',
          fontSize: 14,
          cursor: 'pointer',
          padding: 2,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </motion.div>
  )
}

export function Toast() {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastRow toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}