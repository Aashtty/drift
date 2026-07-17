// apps/web/src/stores/routineStore.ts
import { create } from 'zustand'
import { fetchRoutinesRemote, upsertRoutineRemote, deleteRoutineRemote } from '@/lib/db/queries'
import type { Routine } from '@/types/routine'

interface RoutineStoreState {
  routines: Routine[]
  loaded: boolean
  loadFromRemote: (userId: string) => Promise<void>
  addRoutine: (routine: Routine) => Promise<void>
  updateRoutine: (id: string, patch: Partial<Routine>) => Promise<void>
  removeRoutine: (id: string) => Promise<void>
  markGeneratedToday: (id: string, dateKey: string) => Promise<void>
}

// Deliberately simpler than taskStore/anchorStore: no Dexie local cache,
// remote-only. Routines are low-frequency edits (create/edit rarely,
// read once per app load) — the added complexity of a full offline-first
// sync layer didn't seem justified for this feature yet. Known
// limitation: creating/editing a routine while offline will fail
// silently to a console.error rather than queue for retry. Worth
// revisiting if routines turn out to be edited often.
export const useRoutineStore = create<RoutineStoreState>((set, get) => ({
  routines: [],
  loaded: false,

  loadFromRemote: async (userId) => {
    try {
      const remote = await fetchRoutinesRemote(userId)
      set({ routines: remote, loaded: true })
    } catch (err: any) {
      console.error('[routineStore] failed to load routines:', err?.message ?? err)
      set({ loaded: true })
    }
  },

  addRoutine: async (routine) => {
    set({ routines: [...get().routines, routine] })
    try {
      await upsertRoutineRemote(routine)
    } catch (err: any) {
      console.error('[routineStore] failed to save new routine:', err?.message ?? err)
    }
  },

  updateRoutine: async (id, patch) => {
    const existing = get().routines.find((r) => r.id === id)
    if (!existing) return
    const updated: Routine = { ...existing, ...patch, updated_at: new Date().toISOString() }
    set({ routines: get().routines.map((r) => (r.id === id ? updated : r)) })
    try {
      await upsertRoutineRemote(updated)
    } catch (err: any) {
      console.error('[routineStore] failed to save routine update:', id, err?.message ?? err)
    }
  },

  markGeneratedToday: async (id, dateKey) => {
    await get().updateRoutine(id, { last_generated_date: dateKey })
  },

  removeRoutine: async (id) => {
    set({ routines: get().routines.filter((r) => r.id !== id) })
    try {
      await deleteRoutineRemote(id)
    } catch (err: any) {
      console.error('[routineStore] failed to delete routine:', id, err?.message ?? err)
    }
  },
}))