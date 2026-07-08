// apps/web/src/stores/appStore.ts
import { create } from 'zustand'
import type { AppState } from '@/types/appState'
import { isValidTransition } from '@/lib/utils/sessionStateMachine'

interface AppStoreState {
  state: AppState
  /** Guarded — the real product flow uses this. Silently no-ops on an invalid move and logs a warning, rather than throwing inside UI event handlers. */
  transition: (to: AppState) => void
  /** Unguarded — dev-state-switcher only (Session 0.5). Never call this from real product code paths. */
  setState: (next: AppState) => void
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  state: 'IDLE',
  transition: (to) => {
    const from = get().state
    if (!isValidTransition(from, to)) {
      console.warn(`Blocked invalid transition: ${from} -> ${to}`)
      return
    }
    set({ state: to })
  },
  setState: (next) => set({ state: next }),
}))