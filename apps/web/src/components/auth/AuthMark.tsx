// apps/web/src/components/auth/AuthMark.tsx
'use client'

import { motion } from 'motion/react'

/**
 * Shared decorative mark for the login and reset-password screens - a
 * slow-rotating gradient ring echoing the session TimerRing, so the
 * auth screens feel like part of the same product instead of a bare
 * form bolted onto the front of it.
 */
export function AuthMark() {
  return (
    <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 18px' }} aria-hidden="true">
      <motion.svg
        viewBox="0 0 64 64"
        width={64}
        height={64}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{ filter: 'drop-shadow(0 0 14px color-mix(in srgb, var(--accent) 55%, transparent))' }}
      >
        <defs>
          <linearGradient id="auth-mark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-b)" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="url(#auth-mark-gradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="80 84" />
      </motion.svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px 2px var(--accent)' }} />
      </div>
    </div>
  )
}