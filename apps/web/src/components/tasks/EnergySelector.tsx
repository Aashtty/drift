// apps/web/src/components/tasks/EnergySelector.tsx
'use client'

import { motion } from 'motion/react'
import type { EnergyLevel } from '@/types/task'
import type { ReactElement } from 'react'

interface EnergySelectorProps {
  value: EnergyLevel
  onChange: (level: EnergyLevel) => void
  /**
   * 'property' (default): setting what a single task or routine
   * actually requires — each option means exactly what it says.
   * 'filter': choosing what energy YOU have right now, used on a task
   * list. This one is cumulative — selecting Medium also shows Low
   * tasks, since anyone with medium energy can still do an easy one.
   * That's the actual root of "the user doesn't know what to do here":
   * selecting "High" on a Low/Medium/High control silently means "show
   * everything," which reads as broken filtering unless it's said out
   * loud. The caption below the control says it out loud.
   */
  variant?: 'property' | 'filter'
}

const OPTIONS: { level: EnergyLevel; label: string }[] = [
  { level: 'low', label: 'Low' },
  { level: 'medium', label: 'Medium' },
  { level: 'high', label: 'High' },
]

const FILTER_CAPTION: Record<EnergyLevel, string> = {
  low: 'Showing only low-effort tasks.',
  medium: 'Showing low & medium-effort tasks.',
  high: 'Showing everything, regardless of effort.',
}

function LeafIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M3 13c-1-5 2-9.5 10-10.5C13.5 10.5 9 13.5 3 13Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M3.5 12.5L9 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function HalfBoltIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M8.5 1.5L3.5 9h3.2L6 14.5L12.5 6.5H9.3L8.5 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" fillOpacity={0.35} fill="currentColor" />
    </svg>
  )
}
function BoltIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <path d="M9 1.5L3.5 9h4L6.5 14.5L13 6.5h-4L9 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

const ICONS: Record<EnergyLevel, () => ReactElement> = {
  low: LeafIcon,
  medium: HalfBoltIcon,
  high: BoltIcon,
}

export function EnergySelector({ value, onChange, variant = 'property' }: EnergySelectorProps) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}>
      <div
        role="radiogroup"
        aria-label={variant === 'filter' ? 'Filter by energy' : 'Energy level'}
        className="glass"
        style={{ display: 'inline-flex', padding: 3, gap: 2, borderRadius: 'var(--radius-full)' }}
      >
        {OPTIONS.map((opt) => {
          const selected = opt.level === value
          const Icon = ICONS[opt.level]
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
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
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
                  layoutId={`energy-selector-active-${variant}`}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ position: 'absolute', inset: 0, background: 'var(--accent)', borderRadius: 'var(--radius-full)', zIndex: -1 }}
                />
              )}
              <Icon />
              {opt.label}
            </button>
          )
        })}
      </div>
      {variant === 'filter' && (
        <p className="text-meta" style={{ fontSize: 11, opacity: 0.6, margin: 0, paddingLeft: 4 }}>{FILTER_CAPTION[value]}</p>
      )}
    </div>
  )
}