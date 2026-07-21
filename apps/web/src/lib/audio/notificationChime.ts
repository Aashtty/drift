// apps/web/src/lib/audio/notificationChime.ts
'use client'

let sharedCtx: AudioContext | null = null

function getContext(): AudioContext {
  if (!sharedCtx) sharedCtx = new AudioContext()
  return sharedCtx
}

function playTone(ctx: AudioContext, freq: number, startAt: number, durationSec: number, peakGain: number) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + durationSec + 0.02)
}

export async function playNotificationChime(volume: number = 0.3): Promise<void> {
  try {
    const ctx = getContext()
    if (ctx.state === 'suspended') await ctx.resume()
    const now = ctx.currentTime
    const peak = Math.max(0.02, Math.min(0.5, volume * 0.5))
    playTone(ctx, 660, now, 0.22, peak)
    playTone(ctx, 880, now + 0.14, 0.28, peak)
  } catch {
    // Autoplay-blocked or unsupported - fail silently.
  }
}

/**
 * New - the actual fix for "chime works for events but not shutdown."
 * Both features share this module's AudioContext, and browsers block
 * a context from actually producing sound until it's been resumed
 * during (or shortly after) a real user gesture. Event popups usually
 * fire while you're actively clicking around, so that requirement is
 * incidentally already met by the time one shows up. The day-end
 * prompt is much more likely to fire after a stretch of no
 * interaction, or right after a fresh page load - i.e. exactly when
 * the context is still suspended and resume() silently no-ops rather
 * than actually unlocking it. This primes the context on the very
 * first real interaction anywhere in the app (see AppShell.tsx), so
 * by the time ANY popup fires later, audio is already unlocked
 * regardless of how recently you last clicked something.
 */
export function primeNotificationAudio(): void {
  const ctx = getContext()
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
}