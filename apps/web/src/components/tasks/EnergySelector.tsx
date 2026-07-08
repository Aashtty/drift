// apps/web/src/components/tasks/EnergySelector.tsx
'use client'

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
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {OPTIONS.map((opt) => {
        const selected = opt.level === value
        return (
          <button
            key={opt.level}
            type="button"
            aria-label={opt.label}
            data-testid={`energy-${opt.level}`}
            onClick={() => onChange(opt.level)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              background: selected ? 'var(--surface-active)' : 'var(--surface)',
              boxShadow: selected ? '0 0 0 2px var(--accent)' : 'none',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'box-shadow 150ms var(--ease-drift)',
            }}
          >
            {opt.icon}
          </button>
        )
      })}
    </div>
  )
}