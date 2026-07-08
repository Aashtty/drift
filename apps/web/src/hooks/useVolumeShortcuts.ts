// apps/web/src/hooks/useVolumeShortcuts.ts
import { useEffect } from 'react'
import { useAudioStore } from '@/stores/audioStore'

const STEP = 0.05

export function useVolumeShortcuts() {
  const volume = useAudioStore((s) => s.volume)
  const setVolume = useAudioStore((s) => s.setVolume)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const modifier = e.metaKey || e.ctrlKey
      if (!modifier) return

      if (e.key === '[') {
        e.preventDefault()
        void setVolume(Math.max(0, Math.round((volume - STEP) * 100) / 100))
      } else if (e.key === ']') {
        e.preventDefault()
        void setVolume(Math.min(1, Math.round((volume + STEP) * 100) / 100))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [volume, setVolume])
}