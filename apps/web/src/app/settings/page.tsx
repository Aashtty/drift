// apps/web/src/app/settings/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { supabase } from '@/lib/db/supabase'
import { toast } from '@/stores/toastStore'

const MIN_SESSION_MINUTES = 5
const MAX_SESSION_MINUTES = 90
const DEBOUNCE_MS = 500

export default function SettingsPage() {
  const { user } = useUser()
  const params = useSearchParams()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Local draft state for text-ish fields so every keystroke doesn't
  // trigger its own network write. The distraction-sites textarea in
  // particular used to fire an update per character typed.
  const [sessionMinutesDraft, setSessionMinutesDraft] = useState('')
  const [distractionSitesDraft, setDistractionSitesDraft] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  useEffect(() => {
    if (settings) {
      setSessionMinutesDraft(String(settings.base_session_minutes))
      setDistractionSitesDraft(settings.distraction_sites.join('\n'))
    }
  }, [settings?.base_session_minutes, settings?.distraction_sites.join('\n')])

  useEffect(() => {
    if (!user) return
    void supabase.from('calendar_tokens').select('user_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setCalendarConnected(Boolean(data)))
  }, [user, params])

  function debounced(fn: () => void) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(fn, DEBOUNCE_MS)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  function handleSessionMinutesChange(raw: string) {
    setSessionMinutesDraft(raw)
    debounced(() => {
      // Blank/garbage input used to coerce to 0 via Number(''), which
      // then propagated into elapsedSeconds / baseDurationSeconds on
      // the /now screen — a divide-by-zero that broke the timer ring
      // and edge arc progress. Clamped here instead.
      const parsed = Number(raw)
      const clamped = Number.isFinite(parsed)
        ? Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, Math.round(parsed)))
        : MIN_SESSION_MINUTES
      void updateSettings({ base_session_minutes: clamped })
      if (clamped !== parsed) setSessionMinutesDraft(String(clamped))
    })
  }

  function handleDistractionSitesChange(raw: string) {
    setDistractionSitesDraft(raw)
    debounced(() => {
      void updateSettings({ distraction_sites: raw.split('\n').map((s) => s.trim()).filter(Boolean) })
    })
  }

  async function handleDisconnectCalendar() {
    if (!user || disconnecting) return
    setDisconnecting(true)
    try {
      const { error } = await supabase.from('calendar_tokens').delete().eq('user_id', user.id)
      if (error) throw error
      setCalendarConnected(false)
      toast.success('Google Calendar disconnected.')
    } catch (err: any) {
      console.error('Failed to disconnect calendar:', err?.message ?? err)
      toast.error("Couldn't disconnect — try again.")
    } finally {
      setDisconnecting(false)
    }
  }

  if (!user || !settings) return null

  const calendarStatus = params.get('calendar')

  return (
    <main style={{ padding: 48, maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <p className="text-section-label">SETTINGS</p>

      <div>
        <span className="text-meta">Google Calendar</span>
        <p className="text-meta" style={{ opacity: 0.5, fontSize: 11, marginTop: 4 }}>
          Optional — sync real Google Calendar events into your dashboard's "upcoming" list.
          You can also just add events directly from the dashboard without connecting anything.
        </p>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          {calendarConnected ? (
            <>
              <p style={{ color: 'var(--success)', fontSize: 14, margin: 0 }}>✓ connected</p>
              <button
                type="button"
                onClick={handleDisconnectCalendar}
                disabled={disconnecting}
                data-testid="disconnect-calendar"
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: disconnecting ? 'default' : 'pointer' }}
              >
                {disconnecting ? 'disconnecting…' : 'disconnect'}
              </button>
            </>
          ) : (
            <a
              href={`/api/auth/google?userId=${user.id}`}
              className="glass"
              style={{ display: 'inline-block', padding: '8px 16px', color: 'var(--accent)', fontSize: 14, textDecoration: 'none', border: 'none' }}
              data-testid="connect-calendar"
            >
              connect google calendar
            </a>
          )}
        </div>
        {calendarStatus === 'error' && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>Connection failed — try again.</p>}
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="text-meta">Day start</span>
        <input type="time" value={settings.day_start} onChange={(e) => void updateSettings({ day_start: e.target.value })}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text-primary)' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="text-meta">Day end</span>
        <input type="time" value={settings.day_end} onChange={(e) => void updateSettings({ day_end: e.target.value })}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text-primary)' }} />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="text-meta">Base session length (minutes)</span>
        <input
          type="number"
          min={MIN_SESSION_MINUTES}
          max={MAX_SESSION_MINUTES}
          value={sessionMinutesDraft}
          onChange={(e) => handleSessionMinutesChange(e.target.value)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text-primary)', width: 100 }}
        />
        <span className="text-meta" style={{ fontSize: 10.5, opacity: 0.5 }}>{MIN_SESSION_MINUTES}–{MAX_SESSION_MINUTES} minutes</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.fuzzy_time} onChange={(e) => void updateSettings({ fuzzy_time: e.target.checked })} data-testid="fuzzy-time-toggle" />
        <span className="text-meta">Use fuzzy time instead of exact time on the edge arc</span>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="text-meta">Distraction sites (extension) — one per line</span>
        <textarea
          value={distractionSitesDraft}
          onChange={(e) => handleDistractionSitesChange(e.target.value)}
          rows={5}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }}
        />
      </label>
    </main>
  )
}