// apps/web/src/stores/sessionStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
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

const FK_VIOLATION = '23503'
const RETRY_DELAYS_MS = [400, 900, 1600]

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

// SSR-safe storage: `persist` reads storage as soon as the module loads,
// which for a 'use client' page can still happen during a server render
// pass. Referencing window.localStorage unguarded there throws. This
// no-op fallback makes rehydration a harmless zero-op on the server and
// the real thing once `window` exists in the browser.
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
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
          set({
            active: null,
            lastSummary: { durationSeconds: elapsedSeconds, taskId: active.taskId },
          })
        }
      },

      clearSummary: () => set({ lastSummary: null }),
    }),
    {
      name: 'drift-active-session',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : noopStorage)),
      partialize: (state) => ({ active: state.active }),
    }
  )
)