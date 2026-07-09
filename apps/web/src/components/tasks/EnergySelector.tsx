// apps/web/src/components/tasks/EnergySelector.tsx
'use client'

import { motion } from 'motion/react'
import type { EnergyLevel } from '@/types/task'

interface EnergySelectorProps {
  value: EnergyLevel
  onChange: (level: EnergyLevel) => void
}

const OPTIONS: { level: EnergyLevel; icon: string; label: string }[] = [
  { level: 'low', icon: '🌑', label: 'Low' },
  { level: 'medium', icon: '🌗', label: 'Medium' },
  { level: 'high', icon: '🌕', label: 'High' },
]

export function EnergySelector({ value, onChange }: EnergySelectorProps) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
      {OPTIONS.map((opt) => {
        const selected = opt.level === value
        return (
          <motion.button
            key={opt.level}
            type="button"
            aria-label={opt.label}
            data-testid={`energy-${opt.level}`}
            onClick={() => onChange(opt.level)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.93 }}
            animate={{
              boxShadow: selected ? 'var(--glow-accent-md)' : '0 0 0 0 transparent',
              borderColor: selected ? 'var(--accent)' : 'var(--border)',
              background: selected ? 'var(--surface-active)' : 'var(--surface)',
              scale: selected ? 1.05 : 1,
            }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              fontSize: 17,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {opt.icon}
          </motion.button>
        )
      })}
    </div>
  )
}