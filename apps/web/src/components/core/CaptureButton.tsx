// apps/web/src/components/core/CaptureButton.tsx
'use client'

import { motion } from 'motion/react'
import { useBrainDumpUI } from '@/stores/brainDumpUIStore'

export function CaptureButton() {
  const setOpen = useBrainDumpUI((s) => s.setOpen)

  return (
    <motion.button
      type="button"
      data-testid="capture-button"
      onClick={() => setOpen(true)}
      aria-label="open brain dump"
      title="Capture a thought (⌘/Ctrl + Shift + D)"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      style={{
        position: 'fixed',
        bottom: 28,
        left: 28,
        zIndex: 40,
        width: 52,
        height: 52,
        borderRadius: '50%',
        border: 'none',
        background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, black))',
        boxShadow: '0 8px 28px color-mix(in srgb, var(--accent) 45%, transparent), 0 0 0 1px var(--border-accent)',
        color: 'var(--bg)',
        fontSize: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 800ms var(--ease-focus), box-shadow 800ms var(--ease-focus)',
      }}
    >
      +
    </motion.button>
  )
}