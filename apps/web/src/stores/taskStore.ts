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

  loadFromLocal: async (userId) => {
    const local = await db.tasks.filter((t) => !t._deleted && t.user_id === userId).toArray()
    set({ tasks: local, loaded: true })
  },

  // Real bug fix - this was the actual cause of "deleted a task in one
  // browser, still shows in the other." bulkPut only ever ADDS/UPDATES
  // local rows to match what the server returned - it never removes a
  // locally-cached row that's gone missing from that fetch. Since a
  // real Postgres DELETE leaves no tombstone to sync, the only way a
  // client can learn "this was deleted somewhere else" is by absence:
  // if a task is cached locally, isn't waiting on its own pending
  // upload (_dirty), and isn't in the freshest remote fetch, it must
  // have been deleted elsewhere - purge it locally too. Tasks that
  // ARE dirty (just added offline, not yet synced) are deliberately
  // left alone here so a genuinely new local task never gets purged
  // just because the server doesn't know about it yet.
  syncFromRemote: async (userId: string) => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const remote = await fetchTasksRemote(userId)
      const remoteIds = new Set(remote.map((t) => t.id))
      await db.tasks.bulkPut(remote.map((t) => ({ ...t, _dirty: false })))

      const localForUser = await db.tasks.filter((t) => t.user_id === userId).toArray()
      const staleIds = localForUser.filter((t) => !remoteIds.has(t.id) && !t._dirty).map((t) => t.id)
      if (staleIds.length > 0) await db.tasks.bulkDelete(staleIds)

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