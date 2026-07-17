// apps/web/src/stores/taskStore.ts
import { create } from 'zustand'
import { db, type LocalTask } from '@/lib/db/dexie'
import { upsertTaskRemote, fetchTasksRemote, deleteTaskRemote } from '@/lib/db/queries'
import type { Task, TaskStatus } from '@/types/task'

interface TaskStoreState {
  tasks: LocalTask[]
  loaded: boolean
  loadFromLocal: (userId: string) => Promise<void>
  syncFromRemote: (userId: string) => Promise<void>
  addTask: (task: Task) => Promise<void>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  setStatus: (id: string, status: TaskStatus) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

async function trySync(task: LocalTask): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    await upsertTaskRemote(task)
    await db.tasks.update(task.id, { _dirty: false })
  } catch (err: any) {
    console.error('[taskStore] task sync failed, staying dirty:', task.id, err?.message ?? err)
  }
}

async function tryDelete(id: string): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    await deleteTaskRemote(id)
    await db.tasks.delete(id)
  } catch (err: any) {
    console.error('[taskStore] task delete failed, staying pending:', id, err?.message ?? err)
  }
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  loaded: false,

  // Real bug fix: this used to load EVERY task in the local cache with
  // no filter by user at all - switching accounts on the same device
  // showed the previous account's tasks until (and unless) a remote
  // sync happened to overwrite them, and anything the old account
  // added while offline would leak into the new account permanently.
  // Now scoped by userId - the real fix (clearLocalUserData, wiping
  // everything on account switch) lives in AuthProvider; this is the
  // defense-in-depth layer underneath it.
  loadFromLocal: async (userId) => {
    const local = await db.tasks.filter((t) => !t._deleted && t.user_id === userId).toArray()
    set({ tasks: local, loaded: true })
  },

  syncFromRemote: async (userId: string) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const remote = await fetchTasksRemote(userId)
      await db.tasks.bulkPut(remote.map((t) => ({ ...t, _dirty: false })))

      const dirty = await db.tasks.filter((t) => Boolean(t._dirty) && t.user_id === userId).toArray()
      for (const t of dirty) {
        if (t._deleted) await tryDelete(t.id)
        else await trySync(t)
      }

      const merged = await db.tasks.filter((t) => !t._deleted && t.user_id === userId).toArray()
      set({ tasks: merged, loaded: true })
    } catch {
      // offline or Supabase unreachable - local state stands
    }
  },

  addTask: async (task) => {
    const local: LocalTask = { ...task, _dirty: true, _deleted: false }
    await db.tasks.put(local)
    set({ tasks: [local, ...get().tasks] })
    void trySync(local)
  },

  updateTask: async (id, patch) => {
    const existing = get().tasks.find((t) => t.id === id)
    if (!existing) return
    const updated: LocalTask = { ...existing, ...patch, updated_at: new Date().toISOString(), _dirty: true }
    await db.tasks.put(updated)
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
    void trySync(updated)
  },

  setStatus: async (id, status) => {
    await get().updateTask(id, { status })
  },

  removeTask: async (id) => {
    await db.tasks.update(id, { _deleted: true, _dirty: true })
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
    void tryDelete(id)
  },
}))