// apps/web/src/lib/utils/motionVariants.ts
import type { Variants } from 'motion/react'

/**
 * Shared Motion variants used across BrainDump, NowBar's esc->exit-buttons
 * reveal, and SessionSummaryCard. Matches motion.css's .animate-fade-up
 * timing/easing (300ms, ease-out-expo) so CSS-only and Motion-driven
 * fade-ups feel identical.
 */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
  },
}