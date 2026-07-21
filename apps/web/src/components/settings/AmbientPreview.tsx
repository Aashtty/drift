// apps/web/src/components/settings/AmbientPreview.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

interface AmbientPreviewProps {
  /** Live transition duration in ms - the dot's own crossfade speed
   *  matches this exactly, so dragging the slider changes the dot's
   *  speed in real time. */
  transitionMs: number
}

/**
 * New - replaces a purely textual explanation of the ambient transition
 * setting, which per feedback didn't communicate anything concrete.
 * Instead of describing the effect, this shows it: a small dot
 * cross-fades between the app's two accent colors at exactly the speed
 * the slider is set to, so the setting is self-explanatory by watching
 * it rather than reading about it.
 */
export function AmbientPreview({ transitionMs }: AmbientPreviewProps) {
  const [colors, setColors] = useState<[string, string]>(['#8f6bff', '#4fd8ff'])

  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const accent = style.getPropertyValue('--accent').trim() || '#8f6bff'
    const accentB = style.getPropertyValue('--accent-b').trim() || '#4fd8ff'
    setColors([accent, accentB])
  }, [])

  const durationSec = Math.max(0.3, transitionMs / 1000)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} data-testid="ambient-preview">
      <motion.div
        aria-hidden="true"
        animate={{ backgroundColor: [colors[0], colors[1], colors[0]] }}
        transition={{ duration: durationSec, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 34, height: 34, borderRadius: '50%', boxShadow: `0 0 16px -2px ${colors[0]}`, flexShrink: 0 }}
      />
      <p className="text-micro-mono" style={{ opacity: 0.65, lineHeight: 1.5 }}>
        This dot shifts at the exact speed you just set - that's the same speed Drift uses for its own color and sound changes, everywhere in the app.
      </p>
    </div>
  )
}