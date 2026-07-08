// apps/web/src/stores/appStore.ts
import { create } from 'zustand'
import type { AppState } from '@/types/appState'

interface AppStoreState {
  state: AppState
  setState: (next: AppState) => void
}

export const useAppStore = create<AppStoreState>((set) => ({
  state: 'IDLE',
  setState: (next) => set({ state: next }),
}))