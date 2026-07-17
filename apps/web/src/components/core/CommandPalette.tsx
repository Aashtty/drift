// apps/web/src/components/core/CommandPalette.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { useBrainDumpUI } from '@/stores/brainDumpUIStore'
import { useAudioStore } from '@/stores/audioStore'
import { useUser } from '@/hooks/useUser'
import { createScoredTask } from '@/lib/tasks/createScoredTask'
import { toast } from '@/stores/toastStore'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onOpenShortcuts: () => void
}

interface Command {
  id: string
  label: string
  hint?: string
  group: 'navigate' | 'act' | 'help'
  run: () => void
}

function NavIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function BoltIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M9 1.5L3.5 9h4L6.5 14.5L13 6.5h-4L9 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}
function HelpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.2 6.3a1.9 1.9 0 1 1 2.9 1.6c-.5.35-.9.7-.9 1.3v.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11.6" r="0.75" fill="currentColor" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const GROUP_LABEL: Record<Command['group'], string> = { navigate: 'GO TO', act: 'ACTIONS', help: 'HELP' }
const GROUP_ICON: Record<Command['group'], React.ReactNode> = { navigate: <NavIcon />, act: <BoltIcon />, help: <HelpIcon /> }

export function CommandPalette({ open, onClose, onOpenShortcuts }: CommandPaletteProps) {
  const router = useRouter()
  const { user } = useUser()
  const setBrainDumpOpen = useBrainDumpUI((s) => s.setOpen)
  const audioMode = useAudioStore((s) => s.mode)
  const setAudioMode = useAudioStore((s) => s.setMode)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  function quickAddTask(name: string) {
    if (!user) return
    const trimmed = name.trim()
    if (!trimmed) return
    createScoredTask({ userId: user.id, name: trimmed })
    toast.success(`Added "${trimmed}".`)
  }

  const commands: Command[] = useMemo(
    () => [
      { id: 'nav-dashboard', label: 'Dashboard', hint: 'go to the daily glance', group: 'navigate', run: () => router.push('/') },
      { id: 'nav-tasks', label: 'Tasks', hint: 'search, sort, and manage everything', group: 'navigate', run: () => router.push('/tasks') },
      { id: 'nav-routines', label: 'Routines', hint: 'recurring tasks', group: 'navigate', run: () => router.push('/routines') },
      { id: 'nav-replay', label: 'Replay', hint: 'patterns and history', group: 'navigate', run: () => router.push('/replay') },
      { id: 'nav-settings', label: 'Settings', group: 'navigate', run: () => router.push('/settings') },
      { id: 'act-capture', label: 'Quick capture', hint: 'open the Brain Dump modal', group: 'act', run: () => setBrainDumpOpen(true) },
      { id: 'act-endday', label: 'End day', hint: 'start the shutdown ritual', group: 'act', run: () => router.push('/shutdown') },
      {
        id: 'act-sound',
        label: audioMode === 'off' ? 'Turn on last sound' : 'Mute sound',
        hint: audioMode === 'off' ? undefined : `currently ${audioMode}`,
        group: 'act',
        run: () => void setAudioMode(audioMode === 'off' ? 'brown' : 'off'),
      },
      { id: 'help-shortcuts', label: 'Keyboard shortcuts', hint: 'press ? anytime', group: 'help', run: onOpenShortcuts },
    ],
    [router, setBrainDumpOpen, audioMode, setAudioMode, onOpenShortcuts]
  )

  const filtered = query.trim()
    ? commands.filter((c) => c.label.toLowerCase().includes(query.trim().toLowerCase()))
    : commands

  const showQuickAdd = query.trim().length > 0
  const totalRows = filtered.length + (showQuickAdd ? 1 : 0)

  function runAt(index: number) {
    if (showQuickAdd && index === filtered.length) {
      quickAddTask(query)
    } else if (filtered[index]) {
      filtered[index].run()
    }
    onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(totalRows - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runAt(activeIndex)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let rowCursor = -1
  const groups: Command['group'][] = ['navigate', 'act', 'help']

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-modal)' as any, background: 'color-mix(in srgb, var(--bg) 45%, transparent)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh' }}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-chromatic"
            data-testid="command-palette"
            style={{ width: 'min(560px, 92vw)', maxHeight: '60vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search commands, or type to add a task..."
              data-testid="command-palette-input"
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', outline: 'none', color: 'var(--text-primary)', fontSize: 15, padding: '16px 20px' }}
            />
            <div style={{ overflowY: 'auto', padding: '8px 8px 12px' }} className="scroll-thin">
              {filtered.length === 0 && !showQuickAdd && (
                <p className="text-meta" style={{ padding: '20px 12px', textAlign: 'center' }}>No matching commands.</p>
              )}

              {groups.map((group) => {
                const rows = filtered.filter((c) => c.group === group)
                if (rows.length === 0) return null
                return (
                  <div key={group} style={{ marginBottom: 6 }}>
                    <p className="text-micro-mono" style={{ padding: '8px 12px 4px', letterSpacing: '0.08em' }}>{GROUP_LABEL[group]}</p>
                    {rows.map((cmd) => {
                      rowCursor += 1
                      const isActive = rowCursor === activeIndex
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          onClick={() => runAt(rowCursor)}
                          onMouseEnter={() => setActiveIndex(rowCursor)}
                          data-testid={`command-${cmd.id}`}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-md)',
                            border: 'none', background: isActive ? 'var(--surface-active)' : 'transparent', color: 'var(--text-primary)', fontSize: 13.5, textAlign: 'left', cursor: 'pointer',
                          }}
                        >
                          <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0, display: 'flex' }}>{GROUP_ICON[group]}</span>
                          <span style={{ flex: 1 }}>{cmd.label}</span>
                          {cmd.hint && <span className="text-meta" style={{ fontSize: 11 }}>{cmd.hint}</span>}
                        </button>
                      )
                    })}
                  </div>
                )
              })}

              {showQuickAdd && (
                <>
                  <p className="text-micro-mono" style={{ padding: '8px 12px 4px', letterSpacing: '0.08em' }}>CAPTURE</p>
                  <button
                    type="button"
                    onClick={() => runAt(filtered.length)}
                    onMouseEnter={() => setActiveIndex(filtered.length)}
                    data-testid="command-quick-add"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--radius-md)', border: 'none',
                      background: activeIndex === filtered.length ? 'var(--surface-active)' : 'transparent', color: 'var(--accent)', fontSize: 13.5, textAlign: 'left', cursor: 'pointer',
                    }}
                  >
                    <PlusIcon />
                    <span>Add task: "{query.trim()}"</span>
                  </button>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14, padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
              <span className="text-micro-mono">↑↓ navigate</span>
              <span className="text-micro-mono">↵ select</span>
              <span className="text-micro-mono">esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}