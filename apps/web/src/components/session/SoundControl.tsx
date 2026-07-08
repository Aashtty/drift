// apps/web/src/components/session/SoundControl.tsx
'use client'

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

export function SoundControl() {
  const mode = useAudioStore((s) => s.mode)
  const setMode = useAudioStore((s) => s.setMode)
  const volume = useAudioStore((s) => s.volume)
  const ambientTrack = useAudioStore((s) => s.ambientTrack)
  const setAmbientTrack = useAudioStore((s) => s.setAmbientTrack)

  useVolumeShortcuts()

  return (
    <div
      style={{ position: 'fixed', bottom: 24, left: 48, display: 'flex', flexDirection: 'column', gap: 8 }}
      data-testid="sound-control"
    >
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            data-testid={`sound-mode-${m.mode}`}
            onClick={() => void setMode(m.mode)}
            className="glass"
            style={{
              padding: '6px 12px',
              fontSize: 11,
              border: 'none',
              color: mode === m.mode ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {m.label}
          </button>
        ))}
        <span className="text-micro-mono" data-testid="volume-readout" style={{ marginLeft: 8 }}>
          {Math.round(volume * 100)}%
        </span>
      </div>
      {mode === 'ambient' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {TRACKS.map((t) => (
            <button
              key={t.track}
              type="button"
              data-testid={`ambient-track-${t.track}`}
              onClick={() => setAmbientTrack(t.track)}
              className="glass"
              style={{
                padding: '4px 10px',
                fontSize: 10,
                border: 'none',
                color: ambientTrack === t.track ? 'var(--accent)' : 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}