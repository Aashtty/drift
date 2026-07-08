// apps/web/src/stores/anchorStore.ts
import { create } from 'zustand'
import { db, type LocalAnchor } from '@/lib/db/dexie'
import { upsertAnchorRemote, fetchAnchorsRemote } from '@/lib/db/queries'
import type { Anchor } from '@/types/anchor'

const MAX_ANCHORS = 6

interface AnchorStoreState {
  anchors: LocalAnchor[]
  loaded: boolean
  loadFromLocal: () => Promise<void>
  syncFromRemote: (userId: string) => Promise<void>
  addAnchor: (anchor: Anchor) => Promise<{ ok: boolean; reason?: string }>
}

export const useAnchorStore = create<AnchorStoreState>((set, get) => ({
  anchors: [],
  loaded: false,

  loadFromLocal: async () => {
    const local = await db.anchors.toArray()
    set({ anchors: local, loaded: true })
  },

  syncFromRemote: async (userId: string) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const remote = await fetchAnchorsRemote(userId)
      await db.anchors.bulkPut(remote.map((a) => ({ ...a, _dirty: false })))
      const merged = await db.anchors.toArray()
      set({ anchors: merged, loaded: true })
    } catch {
      // offline — local stands
    }
  },

  addAnchor: async (anchor) => {
    if (get().anchors.length >= MAX_ANCHORS) {
      return { ok: false, reason: `Max ${MAX_ANCHORS} anchors — ADHD constraint, no exceptions.` }
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
}))