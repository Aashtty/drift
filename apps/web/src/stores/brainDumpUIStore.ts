// apps/web/src/stores/brainDumpUIStore.ts
import { create } from 'zustand'

interface BrainDumpUIState {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useBrainDumpUI = create<BrainDumpUIState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}))