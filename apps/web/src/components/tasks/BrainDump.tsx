// apps/web/src/components/tasks/BrainDump.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useGlobalShortcut } from '@/hooks/useGlobalShortcut'
import { useBrainDumpUI } from '@/stores/brainDumpUIStore'

interface BrainDumpProps {
  onSubmit: (rawText: string) => void
  forceOpen?: boolean
  onForceOpenHandled?: () => void
}

export function BrainDump({ onSubmit, forceOpen, onForceOpenHandled }: BrainDumpProps) {
  const open = useBrainDumpUI((s) => s.open)
  const setOpen = useBrainDumpUI((s) => s.setOpen)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useGlobalShortcut(() => setOpen(true))

  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      onForceOpenHandled?.()
    }
  }, [forceOpen, onForceOpenHandled, setOpen])

  function handleSubmit() {
    const trimmed = textRef.current?.value.trim() ?? ''
    if (trimmed.length > 0) onSubmit(trimmed)
    if (textRef.current) textRef.current.value = ''
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="brain-dump-backdrop"
            data-testid="brain-dump-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              // lighter + blurrier, not a black-out — page stays faintly
              // visible/blurred behind the modal instead of vanishing
              background: 'color-mix(in srgb, var(--bg) 40%, transparent)',
              backdropFilter: 'blur(22px)',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: 'min(620px, 100%)',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(120deg,
                    color-mix(in srgb, var(--accent) 30%, var(--bg)) 0%,
                    color-mix(in srgb, var(--bg) 92%, black) 40%,
                    color-mix(in srgb, var(--accent) 20%, var(--bg)) 75%,
                    color-mix(in srgb, var(--bg) 94%, black) 100%)`,
                  backgroundSize: '260% 260%',
                  animation: 'braindump-gradient-shift 10s ease infinite',
                }}
              />
              {/* inner card — deliberately MORE opaque than the outer backdrop,
                  so typed text stays legible regardless of what's behind it */}
              <div
                style={{
                  position: 'relative',
                  background: 'color-mix(in srgb, var(--bg) 88%, black)',
                  backdropFilter: 'blur(20px) saturate(140%)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: 20,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0 }}>
                    BRAIN DUMP
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="close"
                    style={{
                      width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--surface)', border: 'none', borderRadius: 8,
                      color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 15,
                    }}
                  >
                    ×
                  </button>
                </div>

                <textarea
                  ref={textRef}
                  autoFocus
                  onKeyDown={handleKeyDown}
                  placeholder="what's on your mind... (one thought per line)"
                  rows={5}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 16,
                    lineHeight: 1.6,
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
                    ⌘/Ctrl + Enter to send · Esc to close
                  </p>
                  <button
                    type="button"
                    data-testid="brain-dump-submit"
                    onClick={handleSubmit}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: `linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 65%, black))`,
                      color: 'var(--bg)',
                      fontSize: 13.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px color-mix(in srgb, var(--accent) 40%, transparent)',
                    }}
                  >
                    capture →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes braindump-gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  )
}