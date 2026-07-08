// apps/web/src/stores/audioStore.ts
import { create } from 'zustand'
import { audioEngine } from '@/lib/audio/audioEngine'
import { ambientSounds } from '@/lib/audio/ambientSounds'

export type SoundMode = 'off' | 'brown' | 'binaural' | 'ambient'
export type AmbientTrack = 'rain' | 'cafe' | 'space'

interface AudioStoreState {
  mode: SoundMode
  volume: number
  ambientTrack: AmbientTrack
  setMode: (mode: SoundMode) => Promise<void>
  setVolume: (volume: number) => Promise<void>
  setAmbientTrack: (track: AmbientTrack) => void
}

async function stopMode(mode: SoundMode): Promise<void> {
  if (mode === 'brown') await audioEngine.stopBrownNoise()
  if (mode === 'binaural') await audioEngine.stopBinaural()
  if (mode === 'ambient') ambientSounds.stop()
}

export const useAudioStore = create<AudioStoreState>((set, get) => ({
  mode: 'off',
  volume: 0.3,
  ambientTrack: 'rain',

  setMode: async (mode) => {
    const prev = get().mode
    if (prev === mode) return

    await stopMode(prev)

    if (mode === 'brown') await audioEngine.startBrownNoise()
    if (mode === 'binaural') await audioEngine.startBinaural()
    if (mode === 'ambient') ambientSounds.play(get().ambientTrack, get().volume)

    set({ mode })
  },

  setVolume: async (volume) => {
    await audioEngine.setMasterVolume(volume)
    ambientSounds.setVolume(volume)
    set({ volume })
  },

  setAmbientTrack: (track) => {
    set({ ambientTrack: track })
    if (get().mode === 'ambient') {
      ambientSounds.play(track, get().volume)
    }
  },
}))