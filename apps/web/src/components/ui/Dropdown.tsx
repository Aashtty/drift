// apps/web/src/components/ui/Dropdown.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

interface DropdownOption<T extends string> {
  value: T
  label: string
}

interface DropdownProps<T extends string> {
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  testId?: string
  minWidth?: number
}

function ChevronDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * New shared component - replaces every raw <select> in the app, whose
 * native styling can't be themed consistently across browsers and
 * always looked out of place next to the rest of the glass UI.
 */
export function Dropdown<T extends string>({ value, options, onChange, testId, minWidth = 150 }: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative', minWidth }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid={testId}
        className="glass glass-interactive"
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 14px', border: 'none', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', fontSize: 12.5, cursor: 'pointer' }}
      >
        <span>{current?.label ?? value}</span>
        <span aria-hidden="true" style={{ display: 'flex', color: 'var(--text-tertiary)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms var(--ease-out-expo)' }}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div className="glass-chromatic" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, padding: 6, minWidth: '100%', zIndex: 'var(--z-popover)' as any }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              data-testid={testId ? `${testId}-option-${opt.value}` : undefined}
              style={{ width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: 'none', background: opt.value === value ? 'var(--surface-active)' : 'transparent', color: opt.value === value ? 'var(--accent)' : 'var(--text-primary)', fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}