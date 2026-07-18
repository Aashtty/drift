// apps/web/src/components/core/DayEndPrompt.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { useUser } from '@/hooks/useUser'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAudioStore } from '@/stores/audioStore'
import { playNotificationChime } from '@/lib/audio/notificationChime'
import { parseHHMM } from '@/lib/utils/dayWindow'
import { isDayEndSnoozed, snoozeDayEndForMinutes } from '@/lib/utils/dayEndSnooze'

const CHECK_INTERVAL_MS = 30_000
const STALE_AFTER_MINUTES = 240

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

export function DayEndPrompt() {
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const settings = useSettingsStore((s) => s.settings)
  const loadSettings = useSettingsStore((s) => s.loadSettings)
  const volume = useAudioStore((s) => s.volume)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user) void loadSettings(user.id)
  }, [user, loadSettings])

  useEffect(() => {
    if (pathname === '/shutdown') {
      setOpen(false)
      return
    }
    function check() {
      if (!settings?.day_end) return
      const now = new Date()
      const dayEndMin = parseHHMM(settings.day_end, -1)
      if (dayEndMin < 0) return
      const nowMin = minutesSinceMidnight(now)
      const pastEnd = nowMin - dayEndMin
      if (pastEnd < 0 || pastEnd > STALE_AFTER_MINUTES) {
        setOpen(false)
        return
      }
      if (isDayEndSnoozed()) {
        setOpen(false)
        return
      }
      // Chime only fires on the transition into "open" - guarded by
      // functional setOpen so a re-run of check() every 30s while
      // already open doesn't replay the sound on every poll.
      setOpen((prevOpen) => {
        if (!prevOpen) void playNotificationChime(volume)
        return true
      })
    }
    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [settings, pathname, volume])

  function snooze(minutes: number) {
    snoozeDayEndForMinutes(minutes)
    setOpen(false)
  }

  function startShutdown() {
    setOpen(false)
    router.push('/shutdown')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="day-end-prompt-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-sheet)' as any, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <motion.div initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.2 }}>
            <GlassPanel chromatic style={{ padding: 26, width: 380, textAlign: 'center' }}>
              <p className="text-section-label" style={{ marginBottom: 10 }}>YOUR DAY IS WRAPPING UP</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 22 }}>
                It's past the day-end time you set - want to run the shutdown ritual now, or later?
              </p>
              <button type="button" data-testid="day-end-start-now" onClick={startShutdown} className="glass glass-interactive" style={{ width: '100%', padding: '11px 0', border: 'none', color: 'var(--accent)', fontSize: 14, cursor: 'pointer', boxShadow: 'var(--glow-accent-sm)', marginBottom: 12 }}>
                End day now
              </button>
              <div style={{ display: 'flex', gap: 6 }}>
                {[5, 10, 30].map((minutes) => (
                  <button key={minutes} type="button" data-testid={`day-end-snooze-${minutes}`} onClick={() => snooze(minutes)} style={{ flex: 1, padding: '9px 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 12.5, cursor: 'pointer' }}>
                    remind in {minutes}m
                  </button>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}