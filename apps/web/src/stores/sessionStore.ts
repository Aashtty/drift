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

    await insertSessionRemote({
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

    set({
      active: null,
      lastSummary: { durationSeconds: elapsedSeconds, taskId: active.taskId },
    })
  },

  clearSummary: () => set({ lastSummary: null }),
}))