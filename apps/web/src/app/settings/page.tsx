// apps/web/src/app/settings/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { supabase } from '@/lib/db/supabase'

export default function SettingsPage() {
  const { user } = useUser()
  const params = useSearchParams()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const [calendarConnected, setCalendarConnected] = useState(false)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  useEffect(() => {
    if (!user) return
    void supabase.from('calendar_tokens').select('user_id').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setCalendarConnected(Boolean(data)))
  }, [user, params])

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
        <div style={{ marginTop: 8 }}>
          {calendarConnected ? (
            <p style={{ color: 'var(--success)', fontSize: 14 }}>✓ connected</p>
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
          {calendarStatus === 'error' && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>Connection failed — try again.</p>}
        </div>
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
        <input type="number" min={5} max={90} value={settings.base_session_minutes}
          onChange={(e) => void updateSettings({ base_session_minutes: Number(e.target.value) })}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text-primary)', width: 100 }} />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={settings.fuzzy_time} onChange={(e) => void updateSettings({ fuzzy_time: e.target.checked })} data-testid="fuzzy-time-toggle" />
        <span className="text-meta">Use fuzzy time instead of exact time on the edge arc</span>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span className="text-meta">Distraction sites (extension) — one per line</span>
        <textarea value={settings.distraction_sites.join('\n')}
          onChange={(e) => void updateSettings({ distraction_sites: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
          rows={5}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
      </label>
    </main>
  )
}