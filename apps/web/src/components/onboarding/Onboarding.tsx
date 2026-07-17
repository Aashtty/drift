// apps/web/src/components/onboarding/Onboarding.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { fadeUp } from '@/lib/utils/motionVariants'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'

interface OnboardingProps {
  onFinish: () => void
}

const MIN_SESSION_MINUTES = 5
const MAX_SESSION_MINUTES = 90

type TextScreen = { kind: 'text'; title: string; body: string }
type SetupScreen = { kind: 'setup'; title: string; body: string }
type Screen = TextScreen | SetupScreen

const SCREENS: Screen[] = [
  { kind: 'text', title: 'welcome to DRIFT.', body: "a focus tool built around how your mind actually works - not against it." },
  { kind: 'text', title: 'catch your flow.', body: 'start a task, and the timer counts up - never down. no pressure, no deadline pulling at you. when you\'re deep in it, DRIFT notices and gets out of your way.' },
  { kind: 'text', title: 'built for keyboard, too.', body: 'press Ctrl/Cmd K anytime to jump anywhere or add a task without touching the mouse. Ctrl/Cmd Shift D dumps whatever\'s on your mind - DRIFT sorts it. press ? whenever you want the full shortcut list.' },
  { kind: 'setup', title: 'set your rhythm.', body: 'when do you actually work? this shapes the light strip on both edges of the screen, and how long a focus session runs before DRIFT calls it "flow."' },
  { kind: 'text', title: 'one thing at a time.', body: "let's capture your first thought now - one line per thing, we'll sort it." },
]

function formatHour(h: number): string {
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}${h < 12 ? 'am' : 'pm'}`
}

/**
 * New "setup" step: previously onboarding was purely a slideshow and
 * every new account silently got hardcoded defaults (9am-7pm, 20min
 * sessions) with no chance to actually choose. This step lets the
 * person set day_start/day_end/base_session_minutes right here, with a
 * live one-sentence preview of what those numbers mean, saved directly
 * to settingsStore using the same field styling as the real Settings
 * page so it doesn't feel like a separate, disconnected UI.
 */
export function Onboarding({ onFinish }: OnboardingProps) {
  const { user } = useUser()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [index, setIndex] = useState(0)
  const [sessionDraft, setSessionDraft] = useState('20')
  const isLast = index === SCREENS.length - 1
  const screen = SCREENS[index]

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  useEffect(() => {
    if (settings) setSessionDraft(String(settings.base_session_minutes))
  }, [settings?.base_session_minutes])

  function commitSessionMinutes(raw: string) {
    const parsed = Number(raw)
    const clamped = Number.isFinite(parsed) ? Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, Math.round(parsed))) : MIN_SESSION_MINUTES
    void updateSettings({ base_session_minutes: clamped })
    setSessionDraft(String(clamped))
  }

  const dayStartHour = settings ? Number(settings.day_start.split(':')[0]) : 9
  const dayEndHour = settings ? Number(settings.day_end.split(':')[0]) : 19

  return (
    <div data-testid="onboarding" style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-onboarding)' as any, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '50%', width: 600, height: 600, borderRadius: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, var(--accent), transparent 70%)', filter: 'blur(120px)', opacity: 0.16 }} />
      </div>

      <button type="button" data-testid="onboarding-skip" onClick={onFinish} style={{ position: 'fixed', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer' }}>
        skip
      </button>

      <div style={{ position: 'relative', width: 'min(480px, 92vw)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 36 }}>
          {SCREENS.map((_, i) => (
            <span key={i} aria-hidden="true" style={{ width: i === index ? 24 : 8, height: 4, borderRadius: 999, background: i <= index ? 'var(--accent)' : 'var(--border)', boxShadow: i === index ? 'var(--glow-accent-sm)' : 'none', transition: 'width 300ms var(--ease-spring), background 300ms var(--ease-focus)' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={index} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
            <h1 className="text-glow" style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--text-primary)', margin: 0 }}>
              {screen.title}
            </h1>
            <p style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{screen.body}</p>

            {screen.kind === 'setup' && (
              <div className="glass" style={{ textAlign: 'left', padding: 22, marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!settings ? (
                  <p className="text-meta" style={{ fontSize: 12.5, textAlign: 'center' }}>loading your defaults...</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>Day starts at</span>
                        <input
                          type="time"
                          value={settings.day_start}
                          onChange={(e) => void updateSettings({ day_start: e.target.value })}
                          data-testid="onboarding-day-start"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 8, color: 'var(--text-primary)' }}
                        />
                      </label>
                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>Day ends at</span>
                        <input
                          type="time"
                          value={settings.day_end}
                          onChange={(e) => void updateSettings({ day_end: e.target.value })}
                          data-testid="onboarding-day-end"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 8, color: 'var(--text-primary)' }}
                        />
                      </label>
                    </div>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-primary)' }}>Base session length - {sessionDraft} min</span>
                      <input
                        type="range"
                        min={MIN_SESSION_MINUTES}
                        max={MAX_SESSION_MINUTES}
                        value={sessionDraft}
                        onChange={(e) => setSessionDraft(e.target.value)}
                        onMouseUp={(e) => commitSessionMinutes((e.target as HTMLInputElement).value)}
                        onTouchEnd={(e) => commitSessionMinutes((e.target as HTMLInputElement).value)}
                        data-testid="onboarding-session-minutes"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                    </label>

                    <p className="text-micro-mono" style={{ opacity: 0.7, lineHeight: 1.5 }} data-testid="onboarding-setup-preview">
                      You'll focus in {sessionDraft}-minute blocks, active from {formatHour(dayStartHour)} to {formatHour(dayEndHour)}. All of this is changeable later in Settings.
                    </p>
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              data-testid="onboarding-next"
              onClick={() => (isLast ? onFinish() : setIndex(index + 1))}
              className="glass glass-interactive"
              style={{ marginTop: screen.kind === 'setup' ? 22 : 34, padding: '11px 26px', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', boxShadow: 'var(--glow-accent-sm)' }}
            >
              {isLast ? "let's go ->" : 'next ->'}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}