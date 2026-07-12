// apps/web/src/components/session/SoundControl.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useAudioStore } from '@/stores/audioStore'
import { useVolumeShortcuts } from '@/hooks/useVolumeShortcuts'
import type { SoundMode, AmbientTrack } from '@/stores/audioStore'

const MODES: { mode: SoundMode; label: string }[] = [
  { mode: 'off', label: 'off' },
  { mode: 'brown', label: 'brown noise' },
  { mode: 'binaural', label: 'binaural' },
  { mode: 'ambient', label: 'ambient' },
]

const TRACKS: { track: AmbientTrack; label: string }[] = [
  { track: 'rain', label: 'rain' },
  { track: 'cafe', label: 'cafe' },
  { track: 'space', label: 'space' },
]

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 6h2.5L8 3v10L4.5 10H2V6Z" fill="currentColor" />
      {!muted && <path d="M10.5 5.5a4 4 0 0 1 0 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
      {muted && <path d="M11 5.5L14 8.5M14 5.5L11 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  )
}

// Redesigned as a collapsed-by-default pill instead of an always-open
// row of four buttons — on /now, the bottom-left corner used to compete
// visually with the bottom-center session dock every time sound was on.
// Now it's a single compact control that expands only when touched, and
// volume is a real drag slider instead of a readout you adjust blind
// via keyboard shortcuts (Cmd/Ctrl+[ and ] still work, unchanged).
export function SoundControl() {
  const mode = useAudioStore((s) => s.mode)
  const setMode = useAudioStore((s) => s.setMode)
  const volume = useAudioStore((s) => s.volume)
  const setVolume = useAudioStore((s) => s.setVolume)
  const ambientTrack = useAudioStore((s) => s.ambientTrack)
  const setAmbientTrack = useAudioStore((s) => s.setAmbientTrack)
  const [expanded, setExpanded] = useState(false)

  useVolumeShortcuts()

  const isOff = mode === 'off'

  return (
    <div
      style={{ position: 'fixed', bottom: 24, left: 48, zIndex: 'var(--z-nav)' as any }}
      data-testid="sound-control"
    >
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="glass"
            style={{
              position: 'absolute',
              bottom: 44,
              left: 0,
              padding: 14,
              width: 208,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {MODES.map((m) => (
                <button
                  key={m.mode}
                  type="button"
                  data-testid={`sound-mode-${m.mode}`}
                  onClick={() => void setMode(m.mode)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: mode === m.mode ? 'var(--surface-active)' : 'transparent',
                    fontSize: 11,
                    color: mode === m.mode ? 'var(--accent)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'ambient' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {TRACKS.map((t) => (
                  <button
                    key={t.track}
                    type="button"
                    data-testid={`ambient-track-${t.track}`}
                    onClick={() => setAmbientTrack(t.track)}
                    style={{
                      padding: '4px 9px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      background: ambientTrack === t.track ? 'var(--surface-active)' : 'transparent',
                      fontSize: 10.5,
                      color: ambientTrack === t.track ? 'var(--accent)' : 'var(--text-tertiary)',
                      cursor: 'pointer',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(volume * 100)}
                onChange={(e) => void setVolume(Number(e.target.value) / 100)}
                data-testid="volume-slider"
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <span className="text-micro-mono" data-testid="volume-readout" style={{ width: 32, textAlign: 'right' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        title="sound"
        data-testid="sound-control-toggle"
        className="glass glass-interactive"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          height: 34,
          padding: '0 12px',
          border: 'none',
          color: isOff ? 'var(--text-tertiary)' : 'var(--accent)',
          fontSize: 11.5,
          cursor: 'pointer',
        }}
      >
        <SpeakerIcon muted={isOff} />
        <span style={{ textTransform: 'capitalize' }}>{isOff ? 'sound' : mode}</span>
      </button>
    </div>
  )
}