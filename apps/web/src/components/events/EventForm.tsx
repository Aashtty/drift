// apps/web/src/components/events/EventForm.tsx
'use client'

import { useState } from 'react'
import { insertEventRemote } from '@/lib/db/queries'
import { GlassPanel } from '@/components/ui/GlassPanel'

interface EventFormProps {
  userId: string
  onAdded: () => void
  onClose: () => void
}

function defaultDateTimeLocalValue(minutesFromNow: number): string {
  const d = new Date(Date.now() + minutesFromNow * 60 * 1000)
  d.setSeconds(0, 0)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function tomorrowAtLocalValue(hour: number): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(hour, 0, 0, 0)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

const QUICK_PICKS: { label: string; value: () => string }[] = [
  { label: 'in 1h', value: () => defaultDateTimeLocalValue(60) },
  { label: 'in 3h', value: () => defaultDateTimeLocalValue(180) },
  { label: 'tomorrow 9am', value: () => tomorrowAtLocalValue(9) },
]

export function EventForm({ userId, onAdded, onClose }: EventFormProps) {
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState(() => defaultDateTimeLocalValue(60))
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !when) return
    setLoading(true)
    await insertEventRemote(userId, title.trim(), new Date(when).toISOString())
    setLoading(false)
    onAdded()
    onClose()
  }

  return (
    <GlassPanel chromatic style={{ padding: 24, width: 360 }}>
      <p className="text-section-label" style={{ marginBottom: 16 }}>ADD EVENT</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="event title"
          autoFocus
          required
          data-testid="event-title-input"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
        />
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          required
          data-testid="event-time-input"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
        />

        {/* Quick-pick chips — most calendar entries during a focus
            session are "later today" or "tomorrow morning," not a
            precise datetime someone wants to type/scroll to. */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {QUICK_PICKS.map((qp) => (
            <button
              key={qp.label}
              type="button"
              onClick={() => setWhen(qp.value())}
              style={{
                padding: '5px 10px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                fontSize: 11.5,
                cursor: 'pointer',
              }}
            >
              {qp.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            type="submit"
            disabled={loading}
            data-testid="event-submit"
            style={{ flex: 1, padding: '10px 0', background: 'var(--surface-active)', border: 'none', borderRadius: 8, color: 'var(--accent)', fontSize: 14, cursor: 'pointer' }}
          >
            {loading ? 'adding...' : 'add event'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer' }}
          >
            cancel
          </button>
        </div>
      </form>
    </GlassPanel>
  )
}