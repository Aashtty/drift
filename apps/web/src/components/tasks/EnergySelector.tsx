// apps/web/src/components/tasks/EnergySelector.tsx
'use client'

import { motion } from 'motion/react'
import type { EnergyLevel } from '@/types/task'

interface EnergySelectorProps {
  value: EnergyLevel
  onChange: (level: EnergyLevel) => void
}

const OPTIONS: { level: EnergyLevel; label: string }[] = [
  { level: 'low', label: 'Low' },
  { level: 'medium', label: 'Medium' },
  { level: 'high', label: 'High' },
]

export function EnergySelector({ value, onChange }: EnergySelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Energy level"
      className="glass"
      style={{
        display: 'inline-flex',
        padding: 3,
        gap: 2,
        marginBottom: 4,
        borderRadius: 'var(--radius-full)',
      }}
    >
      {OPTIONS.map((opt) => {
        const selected = opt.level === value
        return (
          <button
            key={opt.level}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`energy-${opt.level}`}
            onClick={() => onChange(opt.level)}
            style={{
              position: 'relative',
              padding: '7px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              color: selected ? 'var(--bg)' : 'var(--text-secondary)',
              cursor: 'pointer',
              zIndex: 1,
              transition: 'color 200ms var(--ease-drift)',
            }}
          >
            {selected && (
              <motion.div
                layoutId="energy-selector-active"
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-full)',
                  zIndex: -1,
                }}
              />
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}