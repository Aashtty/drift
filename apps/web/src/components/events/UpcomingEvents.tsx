// apps/web/src/components/events/UpcomingEvents.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { CalendarEvent } from '@/types/calendar'
import { deleteEventRemote } from '@/lib/db/queries'
import { EventForm } from './EventForm'
import { toast } from '@/stores/toastStore'

interface UpcomingEventsProps {
  userId: string
  events: CalendarEvent[]
  onRefresh: () => void
}

function formatEventTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today, ${time}`
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`
}

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
}

function relativeChip(minutes: number): string {
  if (minutes < 1) return 'now'
  if (minutes < 60) return `in ${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem === 0 ? `in ${hours}h` : `in ${hours}h ${rem}m`
}

export function UpcomingEvents({ userId, events, onRefresh }: UpcomingEventsProps) {
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const upcoming = events
    .filter((e) => new Date(e.start).getTime() > Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5)

  async function handleDelete(event: CalendarEvent) {
    if (event.source !== 'manual') return
    setDeletingId(event.id)
    try {
      await deleteEventRemote(event.id)
      onRefresh()
    } catch (err: any) {
      console.error('Failed to delete event:', err?.message ?? err)
      toast.error("Couldn't remove that event — try again.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p className="text-section-label" style={{ letterSpacing: '0.06em' }}>UPCOMING</p>
        <motion.button
          type="button"
          data-testid="add-event-button"
          onClick={() => setShowForm(true)}
          whileHover={{ opacity: 1 }}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', opacity: 0.85, fontSize: 12, cursor: 'pointer' }}
        >
          + Add event
        </motion.button>
      </div>

      {upcoming.length === 0 && (
        <p className="text-meta" style={{ padding: '8px 0' }}>
          Nothing on the calendar yet.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="upcoming-events-list">
        <AnimatePresence mode="popLayout">
          {upcoming.map((e, i) => {
            const isNext = i === 0
            const mins = minutesUntil(e.start)
            const imminent = isNext && mins <= 15
            const isDeleting = deletingId === e.id
            return (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: isDeleting ? 0.5 : 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{ borderColor: 'var(--border-accent)', boxShadow: 'var(--glow-accent-sm)' }}
                className="glass"
                style={{
                  padding: '11px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: imminent ? '1px solid var(--accent)' : undefined,
                  boxShadow: imminent ? 'var(--glow-accent-sm)' : undefined,
                }}
              >
                <div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0 }}>{e.summary}</p>
                  <p className="text-meta" style={{ marginTop: 3 }}>
                    {formatEventTime(e.start)} {e.source === 'google' && '· from Google Calendar'}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  {isNext && (
                    <span
                      className="text-micro-mono"
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: imminent ? 'var(--accent)' : 'var(--surface-active)',
                        color: imminent ? 'var(--bg)' : 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {relativeChip(mins)}
                    </span>
                  )}
                  {e.source === 'manual' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(e)}
                      disabled={isDeleting}
                      style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11.5, cursor: isDeleting ? 'default' : 'pointer' }}
                    >
                      {isDeleting ? 'removing…' : 'Remove'}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowForm(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <EventForm userId={userId} onAdded={onRefresh} onClose={() => setShowForm(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}