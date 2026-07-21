// apps/web/src/stores/anchorStore.ts
import { create } from 'zustand'
import { db, type LocalAnchor } from '@/lib/db/dexie'
import { upsertAnchorRemote, fetchAnchorsRemote, deleteAnchorRemote } from '@/lib/db/queries'
import type { Anchor } from '@/types/anchor'

const MAX_ANCHORS = 6

interface AnchorStoreState {
  anchors: LocalAnchor[]
  loaded: boolean
  loadFromLocal: (userId: string) => Promise<void>
  syncFromRemote: (userId: string) => Promise<void>
  addAnchor: (anchor: Anchor) => Promise<{ ok: boolean; reason?: string }>
  updateAnchor: (id: string, patch: Partial<Pick<Anchor, 'name' | 'color'>>) => Promise<void>
  removeAnchor: (id: string) => Promise<void>
}

export const useAnchorStore = create<AnchorStoreState>((set, get) => ({
  anchors: [],
  loaded: false,

  loadFromLocal: async (userId) => {
    const local = await db.anchors.filter((a) => a.user_id === userId).toArray()
    set({ anchors: local, loaded: true })
  },

  // Same fix as taskStore.syncFromRemote - anchors deleted on another
  // device/browser previously stayed cached locally forever.
  syncFromRemote: async (userId: string) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const remote = await fetchAnchorsRemote(userId)
      const remoteIds = new Set(remote.map((a) => a.id))
      await db.anchors.bulkPut(remote.map((a) => ({ ...a, _dirty: false })))

      const localForUser = await db.anchors.filter((a) => a.user_id === userId).toArray()
      const staleIds = localForUser.filter((a) => !remoteIds.has(a.id) && !a._dirty).map((a) => a.id)
      if (staleIds.length > 0) await db.anchors.bulkDelete(staleIds)

      const merged = await db.anchors.filter((a) => a.user_id === userId).toArray()
      set({ anchors: merged, loaded: true })
    } catch {
      // offline - local stands
    }
  },

  addAnchor: async (anchor) => {
    if (get().anchors.length >= MAX_ANCHORS) {
      return { ok: false, reason: `Max ${MAX_ANCHORS} anchors - ADHD constraint, no exceptions.` }
    }
    const local: LocalAnchor = { ...anchor, _dirty: true }
    await db.anchors.put(local)
    set({ anchors: [...get().anchors, local] })
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await upsertAnchorRemote(anchor)
        await db.anchors.update(anchor.id, { _dirty: false })
      }
    } catch {
      // stays dirty, retried on next sync
    }
    return { ok: true }
  },

  updateAnchor: async (id, patch) => {
    const existing = get().anchors.find((a) => a.id === id)
    if (!existing) return
    const updated: LocalAnchor = { ...existing, ...patch, _dirty: true }
    await db.anchors.put(updated)
    set({ anchors: get().anchors.map((a) => (a.id === id ? updated : a)) })
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await upsertAnchorRemote(updated)
        await db.anchors.update(id, { _dirty: false })
      }
    } catch {
      // stays dirty, retried on next sync
    }
  },

  removeAnchor: async (id) => {
    await db.anchors.delete(id)
    set({ anchors: get().anchors.filter((a) => a.id !== id) })
    try {
      await deleteAnchorRemote(id)
    } catch (err: any) {
      console.error('[anchorStore] anchor delete failed:', id, err?.message ?? err)
    }
  },
}))