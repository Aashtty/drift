// apps/web/src/components/tasks/QuickAddTask.tsx
'use client'

import { useMemo, useState } from 'react'
import type { Anchor } from '@/types/anchor'

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

interface QuickAddTaskProps {
  onAdd: (name: string, anchorId: string | null) => void
  placeholder?: string
  anchors?: Anchor[]
}

const HASHTAG_RE = /#(\S+)/

export function QuickAddTask({ onAdd, placeholder = 'quick add a task...', anchors = [] }: QuickAddTaskProps) {
  const [value, setValue] = useState('')

  const matchedAnchor = useMemo(() => {
    const match = value.match(HASHTAG_RE)
    if (!match) return null
    const token = match[1].toLowerCase()
    return anchors.find((a) => a.name.toLowerCase() === token) ?? null
  }, [value, anchors])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    const cleanName = trimmed.replace(HASHTAG_RE, '').replace(/\s+/g, ' ').trim()
    if (!cleanName) return
    onAdd(cleanName, matchedAnchor?.id ?? null)
    setValue('')
  }

  return (
    // Was `maxWidth: 480` — same fix as TaskList, for the same reason:
    // the quick-add bar was narrower than its own container regardless
    // of available width.
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={anchors.length > 0 ? `${placeholder} (try #${anchors[0].name})` : placeholder}
          data-testid="quick-add-input"
          style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none' }}
        />
        <button
          type="submit"
          title="add task"
          data-testid="quick-add-submit"
          disabled={!value.trim()}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'var(--surface-active)',
            color: value.trim() ? 'var(--accent)' : 'var(--text-tertiary)', cursor: value.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'color 150ms var(--ease-drift)',
          }}
        >
          <PlusIcon />
        </button>
      </div>
      {matchedAnchor && (
        <span className="text-micro-mono" style={{ paddingLeft: 16, color: matchedAnchor.color }}>→ tagged to {matchedAnchor.name}</span>
      )}
    </form>
  )
}