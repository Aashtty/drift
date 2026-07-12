// apps/web/src/components/tasks/QuickAddTask.tsx
'use client'

import { useState } from 'react'

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface QuickAddTaskProps {
  onAdd: (name: string) => void
  placeholder?: string
}

export function QuickAddTask({ onAdd, placeholder = 'quick add a task...' }: QuickAddTaskProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        data-testid="quick-add-input"
        style={{
          flex: 1,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-full)',
          padding: '9px 16px',
          color: 'var(--text-primary)',
          fontSize: 13.5,
          outline: 'none',
        }}
      />
      <button
        type="submit"
        title="add task"
        data-testid="quick-add-submit"
        disabled={!value.trim()}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--surface-active)',
          color: value.trim() ? 'var(--accent)' : 'var(--text-tertiary)',
          cursor: value.trim() ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 150ms var(--ease-drift)',
        }}
      >
        <PlusIcon />
      </button>
    </form>
  )
}