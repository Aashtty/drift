// apps/web/src/stores/settingsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchSettingsRemote, upsertSettingsRemote } from '@/lib/db/queries'
import { useTransitionStore } from './transitionStore'
import type { UserSettings } from '@/types/settings'

function defaultSettings(userId: string): UserSettings {
  return {
    user_id: userId,
    day_start: '09:00',
    day_end: '19:00',
    base_session_minutes: 20,
    shutdown_time: null,
    energy_default: 'medium',
    sound_enabled: true,
    sound_volume: 30,
    fuzzy_time: false,
    distraction_sites: ['twitter.com', 'x.com', 'reddit.com', 'youtube.com', 'instagram.com'],
    ambient_transition_seconds: 30,
    limbo_decay_days: 7,
    updated_at: new Date().toISOString(),
  }
}

interface SettingsStoreState {
  settings: UserSettings | null
  loadSettings: (userId: string) => Promise<void>
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>
}

function syncTransitionStore(settings: UserSettings) {
  useTransitionStore.getState().setTransitionMs((settings.ambient_transition_seconds ?? 30) * 1000)
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set, get) => ({
      settings: null,

      loadSettings: async (userId) => {
        try {
          const remote = await fetchSettingsRemote(userId)
          const resolved = remote ?? defaultSettings(userId)
          if (resolved.ambient_transition_seconds == null) resolved.ambient_transition_seconds = 30
          if (resolved.limbo_decay_days == null) resolved.limbo_decay_days = 7
          set({ settings: resolved })
          syncTransitionStore(resolved)
          if (!remote) await upsertSettingsRemote(resolved)
        } catch {
          const fallback = get().settings ?? defaultSettings(userId)
          set({ settings: fallback })
          syncTransitionStore(fallback)
        }
      },

      updateSettings: async (patch) => {
        const current = get().settings
        if (!current) return
        const updated = { ...current, ...patch, updated_at: new Date().toISOString() }
        set({ settings: updated })
        syncTransitionStore(updated)
        try {
          await upsertSettingsRemote(updated)
        } catch {
          // stays locally updated; next loadSettings() call will reconcile once online
        }
      },
    }),
    { name: 'drift-settings' }
  )
)