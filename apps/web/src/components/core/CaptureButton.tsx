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
      title="quick capture"
      aria-label="quick capture"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.08, boxShadow: '0 8px 30px color-mix(in srgb, var(--accent) 55%, transparent)' }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 50,
        width: 52,
        height: 52,
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 65%, black))',
        color: 'var(--bg)',
        fontSize: 26,
        fontWeight: 300,
        lineHeight: 1,
        cursor: 'pointer',
        boxShadow: '0 6px 24px color-mix(in srgb, var(--accent) 40%, transparent)',
      }}
    >
      +
    </motion.button>
  )
}