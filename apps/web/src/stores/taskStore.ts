// apps/web/src/stores/taskStore.ts
import { create } from 'zustand'
import { db, type LocalTask } from '@/lib/db/dexie'
import { upsertTaskRemote, fetchTasksRemote, deleteTaskRemote } from '@/lib/db/queries'
import type { Task, TaskStatus } from '@/types/task'

interface TaskStoreState {
  tasks: LocalTask[]
  loaded: boolean
  loadFromLocal: () => Promise<void>
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
    // Kept minimal but non-silent on purpose — a fully-empty catch here
    // previously hid a real PGRST204 schema bug for a long time.
    console.error('[taskStore] task sync failed, staying dirty:', task.id, err?.message ?? err)
  }
}

async function tryDelete(id: string): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    await deleteTaskRemote(id)
    await db.tasks.delete(id) // fully gone locally once remote confirms it
  } catch (err: any) {
    console.error('[taskStore] task delete failed, staying pending:', id, err?.message ?? err)
  }
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  loaded: false,

  loadFromLocal: async () => {
    const local = await db.tasks.filter((t) => !t._deleted).toArray()
    set({ tasks: local, loaded: true })
  },

  syncFromRemote: async (userId: string) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const remote = await fetchTasksRemote(userId)
      await db.tasks.bulkPut(remote.map((t) => ({ ...t, _dirty: false })))

      // retry any locally-dirty tasks that didn't make it up yet —
      // pending deletes and pending upserts need different remote calls
      const dirty = await db.tasks.filter((t) => Boolean(t._dirty)).toArray()
      for (const t of dirty) {
        if (t._deleted) await tryDelete(t.id)
        else await trySync(t)
      }

      const merged = await db.tasks.filter((t) => !t._deleted).toArray()
      set({ tasks: merged, loaded: true })
    } catch {
      // offline or Supabase unreachable — local state stands
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
    const updated: LocalTask = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString(),
      _dirty: true,
    }
    await db.tasks.put(updated)
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
    void trySync(updated)
  },

  setStatus: async (id, status) => {
    await get().updateTask(id, { status })
  },

  removeTask: async (id) => {
    // _dirty stays true so a failed/offline delete gets retried by
    // syncFromRemote's dirty-loop above instead of silently vanishing
    // only locally and resurrecting on the next remote fetch.
    await db.tasks.update(id, { _deleted: true, _dirty: true })
    set({ tasks: get().tasks.filter((t) => t.id !== id) })
    void tryDelete(id)
  },
}))