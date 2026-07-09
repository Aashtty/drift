// apps/web/src/components/events/UpcomingEvents.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { CalendarEvent } from '@/types/calendar'
import { deleteEventRemote } from '@/lib/db/queries'
import { EventForm } from './EventForm'

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

export function UpcomingEvents({ userId, events, onRefresh }: UpcomingEventsProps) {
  const [showForm, setShowForm] = useState(false)
  const upcoming = events.filter((e) => new Date(e.start).getTime() > Date.now()).slice(0, 5)

  async function handleDelete(event: CalendarEvent) {
    if (event.source !== 'manual') return
    await deleteEventRemote(event.id)
    onRefresh()
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
          {upcoming.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              whileHover={{ borderColor: 'var(--border-accent)', boxShadow: 'var(--glow-accent-sm)' }}
              className="glass"
              style={{ padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <p style={{ fontSize: 13.5, color: 'var(--text-primary)', margin: 0 }}>{e.summary}</p>
                <p className="text-meta" style={{ marginTop: 3 }}>
                  {formatEventTime(e.start)} {e.source === 'google' && '· from Google Calendar'}
                </p>
              </div>
              {e.source === 'manual' && (
                <button
                  type="button"
                  onClick={() => handleDelete(e)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11.5, cursor: 'pointer' }}
                >
                  Remove
                </button>
              )}
            </motion.div>
          ))}
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