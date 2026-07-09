// apps/web/src/components/core/ShortcutCheatSheet.tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface ShortcutCheatSheetProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: '?', description: 'Show / hide this cheat sheet' },
  { keys: 'Cmd/Ctrl + Shift + D', description: 'Open Brain Dump, from anywhere' },
  { keys: 'Cmd/Ctrl + Enter', description: 'Submit Brain Dump' },
  { keys: 'Esc', description: 'Close overlay, or reveal done/pause during a session' },
  { keys: 'Cmd/Ctrl + [', description: 'Decrease sound volume 5%' },
  { keys: 'Cmd/Ctrl + ]', description: 'Increase sound volume 5%' },
  { keys: 'Tab / Shift+Tab', description: 'Move between all interactive elements' },
  { keys: 'Enter / Space', description: 'Activate the focused button or link' },
]

export function ShortcutCheatSheet({ open, onClose }: ShortcutCheatSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="cheat-sheet-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={onClose}
        >
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
            <GlassPanel chromatic style={{ padding: 32, width: 420 }}>
              <p className="text-section-label" style={{ marginBottom: 16 }}>KEYBOARD SHORTCUTS</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SHORTCUTS.map((s) => (
                  <div key={s.keys} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span className="text-micro-mono" style={{ opacity: 0.8, fontSize: 11 }}>{s.keys}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{s.description}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}