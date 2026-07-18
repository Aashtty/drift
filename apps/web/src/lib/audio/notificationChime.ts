// apps/web/src/lib/audio/notificationChime.ts
'use client'

/**
 * Tiny two-tone chime for notification popups (event-starting-now,
 * day-end prompt) - synthesized via Web Audio rather than an mp3, so
 * there's no asset to deploy and no missing-file failure mode. Reuses
 * the person's existing sound-volume preference so it doesn't sound
 * jarringly loud/quiet relative to whatever ambient sound they may
 * already have running.
 *
 * Autoplay note: browsers block audio that hasn't been preceded by a
 * user gesture on the page. Since these popups can appear at any time
 * (not necessarily right after a click), the very first chime in a
 * fresh tab may be silently blocked - this fails soft (a caught
 * rejection, no visible error, popup still shows normally) rather than
 * surfacing an error toast, since a missed chime isn't worth
 * interrupting someone over.
 */
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
    // Two ascending notes - reads as "gentle notice," not an alarm.
    playTone(ctx, 660, now, 0.22, peak)
    playTone(ctx, 880, now + 0.14, 0.28, peak)
  } catch {
    // Autoplay-blocked or unsupported - fail silently, see file comment.
  }
}