// apps/web/src/components/tasks/BrainDump.tsx
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useGlobalShortcut } from '@/hooks/useGlobalShortcut'
//import { fadeUp } from '@/lib/utils/motionVariants'

interface BrainDumpProps {
  onSubmit: (rawText: string) => void
}

export function BrainDump({ onSubmit }: BrainDumpProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const openOverlay = useCallback(() => setOpen(true), [])
  useGlobalShortcut(openOverlay)

  function handleSubmit() {
    const trimmed = text.trim()
    if (trimmed.length > 0) onSubmit(trimmed)
    setText('')
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          data-testid="brain-dump-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="glass-chromatic"
            //variants={fadeUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ width: 600, height: 200, padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="what's on your mind..."
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: 'var(--text-primary)',
                fontSize: 16,
                fontFamily: 'var(--font-body)',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}