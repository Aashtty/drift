// apps/web/src/components/tasks/QuickAddTask.tsx
'use client'

import { useMemo, useRef, useState } from 'react'
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

const HASHTAG_TOKEN_RE = /#(\S*)$/

/**
 * New: as you type "#" followed by letters, a dropdown appears showing
 * matching anchors - previously the only feedback was a caption after
 * you'd already finished typing the exact name, with no discovery aid
 * for what anchors even exist or how they're spelled.
 */
export function QuickAddTask({ onAdd, placeholder = 'quick add a task...', anchors = [] }: QuickAddTaskProps) {
  const [value, setValue] = useState('')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeToken = value.match(HASHTAG_TOKEN_RE)?.[1] ?? null
  const suggestions = useMemo(() => {
    if (activeToken == null) return []
    const q = activeToken.toLowerCase()
    return anchors.filter((a) => a.name.toLowerCase().startsWith(q)).slice(0, 6)
  }, [activeToken, anchors])

  const matchedAnchor = useMemo(() => {
    const match = value.match(/#(\S+)/)
    if (!match) return null
    const token = match[1].toLowerCase()
    return anchors.find((a) => a.name.toLowerCase() === token) ?? null
  }, [value, anchors])

  function handleChange(next: string) {
    setValue(next)
    setHighlightIndex(0)
    setSuggestOpen(HASHTAG_TOKEN_RE.test(next))
  }

  function applySuggestion(anchor: Anchor) {
    const replaced = value.replace(HASHTAG_TOKEN_RE, `#${anchor.name} `)
    setValue(replaced)
    setSuggestOpen(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(suggestions.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Tab' || (e.key === 'Enter' && suggestOpen)) {
      e.preventDefault()
      applySuggestion(suggestions[highlightIndex])
    } else if (e.key === 'Escape') {
      setSuggestOpen(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (suggestOpen && suggestions.length > 0) {
      // Enter while a suggestion list is open selects it rather than
      // submitting a half-typed hashtag as part of the task name.
      applySuggestion(suggestions[highlightIndex])
      return
    }
    const trimmed = value.trim()
    if (!trimmed) return
    const cleanName = trimmed.replace(/#(\S+)/, '').replace(/\s+/g, ' ').trim()
    if (!cleanName) return
    onAdd(cleanName, matchedAnchor?.id ?? null)
    setValue('')
    setSuggestOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestOpen(false), 120)}
            placeholder={anchors.length > 0 ? `${placeholder} (try #${anchors[0].name})` : placeholder}
            data-testid="quick-add-input"
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '9px 16px', color: 'var(--text-primary)', fontSize: 13.5, outline: 'none' }}
          />
          {suggestOpen && suggestions.length > 0 && (
            <div
              data-testid="quick-add-anchor-suggestions"
              className="glass-chromatic"
              style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, width: 220, padding: 6, zIndex: 'var(--z-popover)' as any }}
            >
              {suggestions.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applySuggestion(a)}
                  data-testid={`quick-add-suggestion-${a.id}`}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-sm)',
                    border: 'none', background: i === highlightIndex ? 'var(--surface-active)' : 'transparent', color: 'var(--text-primary)',
                    fontSize: 12.5, textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                  {a.name}
                </button>
              ))}
            </div>
          )}
        </div>
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
      {matchedAnchor && !suggestOpen && (
        <span className="text-micro-mono" style={{ paddingLeft: 16, color: matchedAnchor.color }}>-&gt; tagged to {matchedAnchor.name}</span>
      )}
    </form>
  )
}