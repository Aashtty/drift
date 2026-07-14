// apps/web/src/app/settings/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAudioStore } from '@/stores/audioStore'
import { useAppState } from '@/hooks/useAppState'
import { supabase } from '@/lib/db/supabase'
import { toast } from '@/stores/toastStore'

const MIN_SESSION_MINUTES = 5
const MAX_SESSION_MINUTES = 90
const DEBOUNCE_MS = 500

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <p className="text-section-label">{title}</p>
        {description && <p className="text-meta" style={{ marginTop: 4, fontSize: 11.5, opacity: 0.6 }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="text-meta" style={{ fontSize: 12.5 }}>{label}</span>
      {children}
    </label>
  )
}

function Toggle({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      style={{
        width: 40, height: 22, borderRadius: 999, border: 'none', padding: 2, cursor: 'pointer',
        background: checked ? 'var(--accent)' : 'var(--surface-active)', transition: 'background 180ms var(--ease-out-expo)', flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'block', width: 18, height: 18, borderRadius: '50%', background: 'var(--bg)',
          transform: checked ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 180ms var(--ease-spring)',
        }}
      />
    </button>
  )
}

/**
 * Complete rebuild: sectioned cards in a two-column grid instead of a
 * single narrow stacked form, and two settings that have existed on
 * UserSettings since Phase 1 (sound_enabled, sound_volume) finally get
 * a UI — they previously had no way to be changed except by directly
 * editing the database. Distraction sites moved from a raw newline
 * textarea to a proper chip/tag input, which also prevents the silent
 * failure mode where a stray blank line became an empty "distraction
 * site" entry.
 */
export default function SettingsPage() {
  const { user } = useUser()
  const params = useSearchParams()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const audioVolume = useAudioStore((s) => s.volume)
  const setAudioVolume = useAudioStore((s) => s.setVolume)
  const { setState } = useAppState()

  const [calendarConnected, setCalendarConnected] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [siteDraft, setSiteDraft] = useState('')

  const [sessionMinutesDraft, setSessionMinutesDraft] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setState('IDLE')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  useEffect(() => {
    if (settings) setSessionMinutesDraft(String(settings.base_session_minutes))
  }, [settings?.base_session_minutes])

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
      const parsed = Number(raw)
      const clamped = Number.isFinite(parsed) ? Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, Math.round(parsed))) : MIN_SESSION_MINUTES
      void updateSettings({ base_session_minutes: clamped })
      if (clamped !== parsed) setSessionMinutesDraft(String(clamped))
    })
  }

  function addSite() {
    if (!settings) return
    const trimmed = siteDraft.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!trimmed || settings.distraction_sites.includes(trimmed)) {
      setSiteDraft('')
      return
    }
    void updateSettings({ distraction_sites: [...settings.distraction_sites, trimmed] })
    setSiteDraft('')
  }

  function removeSite(site: string) {
    if (!settings) return
    void updateSettings({ distraction_sites: settings.distraction_sites.filter((s) => s !== site) })
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
    <main style={{ padding: 56, maxWidth: 1000, margin: '0 auto' }}>
      <p className="text-section-label" style={{ marginBottom: 4 }}>SETTINGS</p>
      <p className="text-meta" style={{ marginBottom: 28, fontSize: 13 }}>How DRIFT works, tuned to how you actually work.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20 }}>
        <SectionCard title="SESSION" description="Controls what /now looks like when a focus session starts.">
          <Field label="Day starts at">
            <input
              type="time"
              value={settings.day_start}
              onChange={(e) => void updateSettings({ day_start: e.target.value })}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 8, color: 'var(--text-primary)' }}
            />
          </Field>
          <Field label="Day ends at">
            <input
              type="time"
              value={settings.day_end}
              onChange={(e) => void updateSettings({ day_end: e.target.value })}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 8, color: 'var(--text-primary)' }}
            />
          </Field>
          <Field label={`Base session length — ${MIN_SESSION_MINUTES}–${MAX_SESSION_MINUTES} min`}>
            <input
              type="number"
              min={MIN_SESSION_MINUTES}
              max={MAX_SESSION_MINUTES}
              value={sessionMinutesDraft}
              onChange={(e) => handleSessionMinutesChange(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 8, color: 'var(--text-primary)', width: 100 }}
            />
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-meta" style={{ fontSize: 12.5 }}>Fuzzy time on the edge arc</span>
            <Toggle checked={settings.fuzzy_time} onChange={(v) => void updateSettings({ fuzzy_time: v })} testId="fuzzy-time-toggle" />
          </div>
        </SectionCard>

        <SectionCard title="SOUND" description="Default volume and whether sound autoplays on new sessions.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-meta" style={{ fontSize: 12.5 }}>Sound enabled by default</span>
            <Toggle checked={settings.sound_enabled} onChange={(v) => void updateSettings({ sound_enabled: v })} testId="sound-enabled-toggle" />
          </div>
          <Field label="Default volume">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(audioVolume * 100)}
                onChange={(e) => {
                  const pct = Number(e.target.value)
                  void setAudioVolume(pct / 100)
                  void updateSettings({ sound_volume: pct })
                }}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
                data-testid="settings-volume-slider"
              />
              <span className="text-micro-mono" style={{ width: 32, textAlign: 'right' }}>{Math.round(audioVolume * 100)}%</span>
            </div>
          </Field>
          <p className="text-meta" style={{ fontSize: 11, opacity: 0.5 }}>
            Which sound mode plays (brown noise, binaural, ambient) is chosen per-session from the sound control on /now — this just sets the starting volume.
          </p>
        </SectionCard>

        <SectionCard title="GOOGLE CALENDAR" description="Sync real events into your dashboard's upcoming list. Fully optional — you can add events manually instead.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {calendarConnected ? (
              <>
                <p style={{ color: 'var(--success)', fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} /> connected
                </p>
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
                className="glass glass-interactive"
                style={{ display: 'inline-block', padding: '8px 16px', color: 'var(--accent)', fontSize: 13, textDecoration: 'none', border: 'none' }}
                data-testid="connect-calendar"
              >
                connect google calendar
              </a>
            )}
          </div>
          {calendarStatus === 'error' && <p style={{ color: 'var(--danger)', fontSize: 12 }}>Connection failed — try again.</p>}
        </SectionCard>

        <SectionCard title="DISTRACTION SITES" description="Used by the browser extension to gently flag distracting sites during a session.">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={siteDraft}
              onChange={(e) => setSiteDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addSite()
                }
              }}
              placeholder="add a site... (e.g. reddit.com)"
              data-testid="distraction-site-input"
              style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
            />
            <button
              type="button"
              onClick={addSite}
              disabled={!siteDraft.trim()}
              style={{ padding: '8px 16px', background: 'var(--surface-active)', border: 'none', borderRadius: 'var(--radius-md)', color: siteDraft.trim() ? 'var(--accent)' : 'var(--text-tertiary)', fontSize: 13, cursor: siteDraft.trim() ? 'pointer' : 'default' }}
            >
              add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {settings.distraction_sites.length === 0 && <p className="text-meta" style={{ fontSize: 11.5, opacity: 0.5 }}>No sites added yet.</p>}
            {settings.distraction_sites.map((site) => (
              <span key={site} className="text-micro-mono" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px 4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {site}
                <button
                  type="button"
                  onClick={() => removeSite(site)}
                  aria-label={`remove ${site}`}
                  style={{ width: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 11, borderRadius: '50%' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  )
}