// apps/web/src/components/core/ShortcutCheatSheet.tsx
'use client'

import { motion, AnimatePresence } from 'motion/react'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface ShortcutCheatSheetProps {
  open: boolean
  onClose: () => void
}

interface ShortcutGroup {
  title: string
  shortcuts: { keys: string; description: string }[]
}

// Rewritten to match what's actually bound today — the previous list
// was written before the pause/end-session rework (Phase 2) and never
// updated: it still documented a "confirm pause" two-step flow and an
// Esc-twice pattern that no longer exist, and didn't mention Space
// (pause/resume), Cmd/Ctrl+K (Command Palette), or / (task search) at
// all.
const GROUPS: ShortcutGroup[] = [
  {
    title: 'GLOBAL',
    shortcuts: [
      { keys: '⌘/Ctrl K', description: 'Open command palette — jump anywhere, add a task' },
      { keys: '⌘/Ctrl Shift D', description: 'Open Brain Dump, from anywhere' },
      { keys: '?', description: 'Show / hide this cheat sheet' },
      { keys: 'Esc', description: 'Close whatever overlay is open' },
    ],
  },
  {
    title: 'DURING A SESSION',
    shortcuts: [
      { keys: 'Space', description: 'Pause / resume the timer' },
      { keys: 'L', description: 'Lock in (Hyperfocus mode)' },
      { keys: 'D', description: 'Mark the task done' },
      { keys: 'Esc', description: 'End session — saves progress, no confirm needed' },
    ],
  },
  {
    title: 'TASKS PAGE',
    shortcuts: [
      { keys: '/', description: 'Focus the search field' },
      { keys: 'Esc', description: 'Exit selection mode' },
    ],
  },
  {
    title: 'BRAIN DUMP',
    shortcuts: [
      { keys: '⌘/Ctrl Enter', description: 'Submit' },
      { keys: 'Esc', description: 'Close without submitting' },
    ],
  },
  {
    title: 'SOUND',
    shortcuts: [
      { keys: '⌘/Ctrl [', description: 'Decrease volume 5%' },
      { keys: '⌘/Ctrl ]', description: 'Increase volume 5%' },
    ],
  },
  {
    title: 'ACCESSIBILITY',
    shortcuts: [
      { keys: 'Tab / Shift+Tab', description: 'Move between interactive elements' },
      { keys: 'Enter / Space', description: 'Activate the focused button or link' },
    ],
  },
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
          style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-sheet)' as any, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={onClose}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.18 }} onClick={(e) => e.stopPropagation()}>
            <GlassPanel chromatic style={{ padding: 28, width: 460, maxHeight: '80vh', overflowY: 'auto' }} className="scroll-thin">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <p className="text-section-label">KEYBOARD SHORTCUTS</p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="close"
                  style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 15 }}
                >
                  ×
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {GROUPS.map((group) => (
                  <div key={group.title}>
                    <p className="text-micro-mono" style={{ marginBottom: 10, letterSpacing: '0.08em' }}>{group.title}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {group.shortcuts.map((s) => (
                        <div key={s.keys} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                          <span className="text-micro-mono" style={{ opacity: 0.85, fontSize: 11, flexShrink: 0, background: 'var(--surface)', padding: '2px 7px', borderRadius: 'var(--radius-sm)' }}>{s.keys}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{s.description}</span>
                        </div>
                      ))}
                    </div>
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