// apps/web/src/stores/sessionStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { insertSessionRemote } from '@/lib/db/queries'
import type { SessionEndState } from '@/types/session'

export interface ActiveSession {
  taskId: string | null
  startedAt: string
  baseDurationSeconds: number
  hyperfocus: boolean
  /** Set the instant the session is paused, cleared on resume. This is
   *  the actual fix for the pause bug: previously ONLY the local
   *  useElasticTimer hook inside NowSession knew a session was paused -
   *  this global store (which Dashboard reads for its "session in
   *  progress" card, and which NowPage reads on recovery) had no idea,
   *  so it kept counting real wall-clock time regardless. */
  pausedAt: string | null
}

interface SessionStoreState {
  active: ActiveSession | null
  lastSummary: { durationSeconds: number; taskId: string | null } | null
  startSession: (taskId: string | null, baseDurationSeconds: number) => void
  setHyperfocus: (on: boolean) => void
  pauseSession: () => void
  resumeSession: () => void
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

const noopStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }

export const useSessionStore = create<SessionStoreState>()(
  persist(
    (set, get) => ({
      active: null,
      lastSummary: null,

      startSession: (taskId, baseDurationSeconds) => {
        set({
          active: { taskId, startedAt: new Date().toISOString(), baseDurationSeconds, hyperfocus: false, pausedAt: null },
        })
      },

      setHyperfocus: (on) => {
        const active = get().active
        if (!active) return
        set({ active: { ...active, hyperfocus: on } })
      },

      pauseSession: () => {
        const active = get().active
        if (!active || active.pausedAt) return
        set({ active: { ...active, pausedAt: new Date().toISOString() } })
      },

      resumeSession: () => {
        const active = get().active
        if (!active || !active.pausedAt) return
        // Mirrors elasticTimer's shiftStart exactly: shift startedAt
        // forward by however long the pause actually lasted, so future
        // elapsed calculations against startedAt correctly exclude it.
        const pauseDurationMs = Date.now() - new Date(active.pausedAt).getTime()
        const shiftedStartedAt = new Date(new Date(active.startedAt).getTime() + pauseDurationMs).toISOString()
        set({ active: { ...active, startedAt: shiftedStartedAt, pausedAt: null } })
      },

      endSession: async (userId, elapsedSeconds, flowDetected, stateAtEnd) => {
        const active = get().active
        if (!active) return
        const endedAt = new Date().toISOString()
        try {
          await insertSessionWithRetry({
            userId, taskId: active.taskId, startedAt: active.startedAt, endedAt,
            durationSeconds: elapsedSeconds, baseDurationSeconds: active.baseDurationSeconds,
            exceededBase: elapsedSeconds > active.baseDurationSeconds, flowDetected,
            hyperfocus: active.hyperfocus, stateAtEnd,
          })
        } finally {
          set({ active: null, lastSummary: { durationSeconds: elapsedSeconds, taskId: active.taskId } })
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

/** Pure - used by useLiveSessionElapsed (Dashboard's ticking display)
 *  and available anywhere else that needs "how long has this session
 *  really run, excluding paused time." Freezes at pausedAt while
 *  paused rather than continuing to advance against `nowMs`. */
export function computeActiveElapsedSeconds(active: ActiveSession, nowMs: number = Date.now()): number {
  const startedAtMs = new Date(active.startedAt).getTime()
  const referenceMs = active.pausedAt ? new Date(active.pausedAt).getTime() : nowMs
  return Math.max(0, Math.floor((referenceMs - startedAtMs) / 1000))
}