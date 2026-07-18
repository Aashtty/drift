// apps/extension/lib/scrollVelocity.ts
//
// NOTE ON THE FILENAME: this used to track scroll *velocity* (px/min). That model
// was scrapped — see below — but the file wasn't renamed to avoid touching the
// import graph. What it tracks now is session continuity, not speed.
//
// Doom scrolling isn't defined by how fast someone scrolls. Real doom-scroll
// behavior includes fast flicks through a feed, slow deliberate reading of every
// post, and everything in between — scroll speed tells you almost nothing about
// whether someone's stuck in a scroll hole. What actually characterizes it is
// *sustained, repeated engagement with no real break* over an extended stretch
// of time. So instead of measuring px/min velocity against a threshold, this
// tracks a scrolling "session": the session stays alive as long as scroll
// events keep happening with no gap longer than MAX_PAUSE_MS between them. A
// genuine pause (they stopped, switched tabs, got interrupted) breaks the
// session and the 8-minute clock has to start over.

export interface ScrollSample {
  scrollY: number
  timestampMs: number
}

const MAX_PAUSE_MS = 45 * 1000 // a gap longer than this between scroll events breaks the session
const SUSTAINED_MS = 15 * 1000 // TEMP for testing — revert to `8 * 60 * 1000` (8 minutes) before shipping

export interface VelocityState {
  sessionStartedAt: number | null
  lastScrollAt: number | null
}

export function initialVelocityState(): VelocityState {
  return { sessionStartedAt: null, lastScrollAt: null }
}

/**
 * Pure state update — call on every scroll event (throttled by the caller).
 * Returns the new state plus whether this update should trigger the
 * intervention (crossed 8 continuous minutes of scrolling with no gap longer
 * than MAX_PAUSE_MS).
 */
export function recordScrollSample(
  state: VelocityState,
  sample: ScrollSample
): { state: VelocityState; shouldIntervene: boolean } {
  const { timestampMs } = sample

  const gapSinceLastScroll =
    state.lastScrollAt === null ? Infinity : timestampMs - state.lastScrollAt

  // A gap bigger than MAX_PAUSE_MS means the previous session ended — start a
  // fresh one anchored on this sample. Otherwise the session (however it
  // started) just keeps running.
  const sessionStartedAt =
    gapSinceLastScroll > MAX_PAUSE_MS ? timestampMs : state.sessionStartedAt ?? timestampMs

  const shouldIntervene = timestampMs - sessionStartedAt >= SUSTAINED_MS

  return {
    state: { sessionStartedAt, lastScrollAt: timestampMs },
    shouldIntervene,
  }
}