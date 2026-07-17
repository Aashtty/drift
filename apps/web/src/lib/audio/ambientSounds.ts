// apps/web/src/lib/audio/ambientSounds.ts
'use client'

import { Howl } from 'howler'
import type { AmbientTrack } from '@/stores/audioStore'

const TRACK_PATHS: Record<AmbientTrack, string> = {
  rain: '/audio/rain.mp3',
  cafe: '/audio/cafe.aiff',
  space: '/audio/space.ogg',
}

// Same fix as audioEngine.ts — fixed, short, no longer tied to Settings'
// Ambient Transition Speed.
const FADE_MS = 500
const IMMEDIATE_FADE_MS = 80

class AmbientSounds {
  private current: Howl | null = null
  private currentTrack: AmbientTrack | null = null

  play(track: AmbientTrack, volume: number): void {
    if (this.current && this.currentTrack === track) {
      this.current.fade(this.current.volume(), volume, FADE_MS)
      return
    }

    const previous = this.current
    if (previous) {
      previous.fade(previous.volume(), 0, FADE_MS)
      setTimeout(() => previous.unload(), FADE_MS + 100)
    }

    const howl = new Howl({
      src: [TRACK_PATHS[track]],
      loop: true,
      volume: 0,
      html5: false,
    })
    howl.play()
    howl.fade(0, volume, FADE_MS)

    this.current = howl
    this.currentTrack = track
  }

  setVolume(volume: number): void {
    if (!this.current) return
    this.current.fade(this.current.volume(), volume, 300)
  }

  stop(): void {
    if (!this.current) return
    const howl = this.current
    howl.fade(howl.volume(), 0, FADE_MS)
    setTimeout(() => howl.unload(), FADE_MS + 100)
    this.current = null
    this.currentTrack = null
  }

  /** Used only when leaving /now — near-instant silence instead of up
   *  to FADE_MS of audible tail bleeding into the dashboard. This is the
   *  direct fix for "stays on in dashboard too." */
  stopImmediate(): void {
    if (!this.current) return
    const howl = this.current
    howl.fade(howl.volume(), 0, IMMEDIATE_FADE_MS)
    setTimeout(() => howl.unload(), IMMEDIATE_FADE_MS + 50)
    this.current = null
    this.currentTrack = null
  }
}

export const ambientSounds = new AmbientSounds()