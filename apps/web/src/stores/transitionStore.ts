// apps/web/src/stores/transitionStore.ts
import { create } from 'zustand'

interface TransitionStoreState {
  /** How long ambient shifts take, in milliseconds — particle color
   *  crossfade, sound fade-in/out, and the CSS background/glow
   *  transitions all read from this one value instead of each having
   *  its own hardcoded constant. Settings writes to it via
   *  settingsStore; every ambient system reads from it. */
  transitionMs: number
  setTransitionMs: (ms: number) => void
}

const DEFAULT_TRANSITION_MS = 30_000

export const useTransitionStore = create<TransitionStoreState>((set) => ({
  transitionMs: DEFAULT_TRANSITION_MS,
  setTransitionMs: (ms) => set({ transitionMs: Math.max(1000, ms) }),
}))