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
    title: 'built for keyboard, too.',
    body: 'press ⌘/Ctrl K anytime to jump anywhere or add a task without touching the mouse. ⌘/Ctrl Shift D dumps whatever\'s on your mind — DRIFT sorts it. press ? whenever you want the full shortcut list.',
  },
  {
    title: 'one thing at a time.',
    body: "let's capture your first thought now — one line per thing, we'll sort it.",
  },
]

/**
 * Visual pass + a new screen: the old three-screen version never
 * mentioned the command palette or the shortcut cheat sheet, both of
 * which are genuinely useful and otherwise undiscoverable on first
 * use. Progress dots became a proper connected step bar so where you
 * are in the sequence reads at a glance rather than as loose dots.
 */
export function Onboarding({ onFinish }: OnboardingProps) {
  const [index, setIndex] = useState(0)
  const isLast = index === SCREENS.length - 1

  return (
    <div
      data-testid="onboarding"
      style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-onboarding)' as any, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute', top: '20%', left: '50%', width: 600, height: 600, borderRadius: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, var(--accent), transparent 70%)', filter: 'blur(120px)', opacity: 0.16,
          }}
        />
      </div>

      <button
        type="button"
        data-testid="onboarding-skip"
        onClick={onFinish}
        style={{ position: 'fixed', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer' }}
      >
        skip
      </button>

      <div style={{ position: 'relative', width: 480, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 36 }}>
          {SCREENS.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                width: i === index ? 24 : 8, height: 4, borderRadius: 999,
                background: i <= index ? 'var(--accent)' : 'var(--border)',
                boxShadow: i === index ? 'var(--glow-accent-sm)' : 'none',
                transition: 'width 300ms var(--ease-spring), background 300ms var(--ease-focus)',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
            <h1 className="text-glow" style={{ fontFamily: 'var(--font-display)', fontSize: 34, color: 'var(--text-primary)', margin: 0 }}>
              {SCREENS[index].title}
            </h1>
            <p style={{ marginTop: 18, fontSize: 15, lineHeight: 1.65, color: 'var(--text-secondary)' }}>{SCREENS[index].body}</p>
            <button
              type="button"
              data-testid="onboarding-next"
              onClick={() => (isLast ? onFinish() : setIndex(index + 1))}
              className="glass glass-interactive"
              style={{ marginTop: 34, padding: '11px 26px', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', boxShadow: 'var(--glow-accent-sm)' }}
            >
              {isLast ? "let's go →" : 'next →'}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}