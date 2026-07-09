// apps/web/src/stores/sessionStore.ts
import { create } from 'zustand'
import { insertSessionRemote } from '@/lib/db/queries'
import type { SessionEndState } from '@/types/session'

interface ActiveSession {
  taskId: string | null
  startedAt: string
  baseDurationSeconds: number
  hyperfocus: boolean
}

interface SessionStoreState {
  active: ActiveSession | null
  lastSummary: { durationSeconds: number; taskId: string | null } | null
  startSession: (taskId: string | null, baseDurationSeconds: number) => void
  setHyperfocus: (on: boolean) => void
  endSession: (
    userId: string,
    elapsedSeconds: number,
    flowDetected: boolean,
    stateAtEnd: SessionEndState
  ) => Promise<void>
  clearSummary: () => void
}

// Supabase's FK error code — can fire if a task was just created locally
// and its background upsertTaskRemote() (fire-and-forget in
// taskStore.addTask) hasn't landed yet by the time a session references
// it. Short retry resolves this timing race without failing the write.
const FK_VIOLATION = '23503'
const RETRY_DELAYS_MS = [400, 900, 1600] // ~3s total worst case

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function insertSessionWithRetry(
  args: Parameters<typeof insertSessionRemote>[0]
): Promise<void> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await insertSessionRemote(args)
      return
    } catch (err: any) {
      const isFkRace = err?.code === FK_VIOLATION
      const hasRetriesLeft = attempt < RETRY_DELAYS_MS.length
      if (!isFkRace || !hasRetriesLeft) throw err
      await delay(RETRY_DELAYS_MS[attempt])
    }
  }
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  active: null,
  lastSummary: null,

  startSession: (taskId, baseDurationSeconds) => {
    set({
      active: {
        taskId,
        startedAt: new Date().toISOString(),
        baseDurationSeconds,
        hyperfocus: false,
      },
    })
  },

  setHyperfocus: (on) => {
    const active = get().active
    if (!active) return
    set({ active: { ...active, hyperfocus: on } })
  },

  endSession: async (userId, elapsedSeconds, flowDetected, stateAtEnd) => {
    const active = get().active
    if (!active) return

    const endedAt = new Date().toISOString()

    try {
      await insertSessionWithRetry({
        userId,
        taskId: active.taskId,
        startedAt: active.startedAt,
        endedAt,
        durationSeconds: elapsedSeconds,
        baseDurationSeconds: active.baseDurationSeconds,
        exceededBase: elapsedSeconds > active.baseDurationSeconds,
        flowDetected,
        hyperfocus: active.hyperfocus,
        stateAtEnd,
      })
    } finally {
      // Always clear active + set summary, even if the remote write
      // ultimately failed after retries — a lost analytics row should
      // never trap the user on /now unable to end their session.
      set({
        active: null,
        lastSummary: { durationSeconds: elapsedSeconds, taskId: active.taskId },
      })
    }
  },

  clearSummary: () => set({ lastSummary: null }),
}))