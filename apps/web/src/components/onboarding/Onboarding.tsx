// apps/web/src/components/onboarding/Onboarding.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeUp } from '@/lib/utils/motionVariants'

interface OnboardingProps {
  onFinish: () => void
}

const SCREENS = [
  {
    title: 'welcome to DRIFT.',
    body: "a focus tool built around how your mind actually works — not against it.",
  },
  {
    title: 'catch your flow.',
    body: 'start a task, and the timer counts up — never down. no pressure, no deadline pulling at you. when you\'re deep in it, DRIFT notices and gets out of your way.',
  },
  {
    title: 'one thing at a time.',
    body: 'press Cmd+Shift+D anywhere to dump what\'s on your mind. we\'ll sort it. let\'s capture your first one now.',
  },
]

export function Onboarding({ onFinish }: OnboardingProps) {
  const [index, setIndex] = useState(0)
  const isLast = index === SCREENS.length - 1

  return (
    <div
      data-testid="onboarding"
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'var(--bg)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button
        type="button"
        data-testid="onboarding-skip"
        onClick={onFinish}
        style={{ position: 'fixed', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer' }}
      >
        skip
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
          style={{ width: 480, textAlign: 'center' }}
        >
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text-primary)', margin: 0 }}>
            {SCREENS[index].title}
          </h1>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {SCREENS[index].body}
          </p>
          <button
            type="button"
            data-testid="onboarding-next"
            onClick={() => (isLast ? onFinish() : setIndex(index + 1))}
            style={{
              marginTop: 32, padding: '10px 24px', background: 'var(--surface-active)',
              border: 'none', borderRadius: 8, color: 'var(--accent)', fontSize: 14, cursor: 'pointer',
            }}
          >
            {isLast ? "let's go →" : 'next →'}
          </button>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {SCREENS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: i === index ? 'var(--accent)' : 'var(--border)',
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}