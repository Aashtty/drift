// apps/web/src/components/session/SessionSummaryCard.tsx
'use client'

import { motion } from 'motion/react'
import { fadeUp } from '@/lib/utils/motionVariants'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface SessionSummaryCardProps {
  minutes: number
  onContinue: () => void
}

export function SessionSummaryCard({ minutes, onContinue }: SessionSummaryCardProps) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <GlassPanel chromatic style={{ padding: 32, width: 360, textAlign: 'center' }}>
        <p className="text-section-label">SESSION COMPLETE</p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            color: 'var(--text-primary)',
            margin: '16px 0',
          }}
          data-testid="summary-minutes"
        >
          You focused for {minutes} minute{minutes === 1 ? '' : 's'}
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="glass"
          style={{
            marginTop: 16,
            padding: '10px 24px',
            border: 'none',
            color: 'var(--accent)',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          continue →
        </button>
      </GlassPanel>
    </motion.div>
  )
}