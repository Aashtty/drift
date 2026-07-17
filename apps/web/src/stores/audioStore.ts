// apps/web/src/stores/audioStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { audioEngine } from '@/lib/audio/audioEngine'
import { ambientSounds } from '@/lib/audio/ambientSounds'
import { toast } from '@/stores/toastStore'

export type SoundMode = 'off' | 'brown' | 'binaural' | 'ambient'
export type AmbientTrack = 'rain' | 'cafe' | 'space'

interface AudioStoreState {
  mode: SoundMode
  volume: number
  ambientTrack: AmbientTrack
  lastNonOffMode: SoundMode
  /**
   * True only when the person explicitly clicked "off" in SoundControl.
   * This is the actual fix for "turn sound off and leave, it turns back
   * on next task" - lastNonOffMode alone couldn't distinguish "I muted
   * it on purpose" from "nothing was ever playing," so auto-resume
   * (see now/page.tsx) would happily undo an explicit off. hardStop()
   * (our own cleanup when leaving /now) deliberately does NOT touch
   * this flag, since that's an automatic action, not the person's choice.
   */
  manuallyMuted: boolean
  setMode: (mode: SoundMode) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  setAmbientTrack: (track: AmbientTrack) => void
  hardStop: () => Promise<void>
}

async function stopMode(mode: SoundMode): Promise<void> {
  if (mode === 'brown') await audioEngine.stopBrownNoise()
  if (mode === 'binaural') await audioEngine.stopBinaural()
  if (mode === 'ambient') ambientSounds.stop()
}

const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

export const useAudioStore = create<AudioStoreState>()(
  persist(
    (set, get) => ({
      mode: 'off',
      volume: 0.3,
      ambientTrack: 'rain',
      lastNonOffMode: 'brown',
      manuallyMuted: false,

      setMode: async (mode) => {
        const prev = get().mode
        if (prev === mode) return
        await stopMode(prev)
        try {
          if (mode === 'brown') await audioEngine.startBrownNoise()
          if (mode === 'binaural') await audioEngine.startBinaural()
          if (mode === 'ambient') ambientSounds.play(get().ambientTrack, get().volume)
          set({
            mode,
            lastNonOffMode: mode === 'off' ? get().lastNonOffMode : mode,
            manuallyMuted: mode === 'off',
          })
        } catch (err: any) {
          console.error('[audioStore] failed to start sound mode:', mode, err?.message ?? err)
          toast.error("Couldn't start that sound - the audio file might be missing.")
          set({ mode: 'off' })
        }
      },

      setVolume: async (volume) => {
        await audioEngine.setMasterVolume(volume)
        ambientSounds.setVolume(volume)
        set({ volume })
      },

      setAmbientTrack: (track) => {
        set({ ambientTrack: track })
        if (get().mode === 'ambient') ambientSounds.play(track, get().volume)
      },

      hardStop: async () => {
        const prev = get().mode
        if (prev === 'off') return
        await stopMode(prev)
        set({ mode: 'off' })
      },
    }),
    {
      name: 'drift-audio-prefs',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : noopStorage)),
      partialize: (state) => ({ volume: state.volume, ambientTrack: state.ambientTrack, lastNonOffMode: state.lastNonOffMode, manuallyMuted: state.manuallyMuted }),
    }
  )
)