// apps/web/src/stores/settingsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { fetchSettingsRemote, upsertSettingsRemote } from '@/lib/db/queries'
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
    updated_at: new Date().toISOString(),
  }
}

interface SettingsStoreState {
  settings: UserSettings | null
  loadSettings: (userId: string) => Promise<void>
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStoreState>()(
  persist(
    (set, get) => ({
      settings: null,

      loadSettings: async (userId) => {
        try {
          const remote = await fetchSettingsRemote(userId)
          set({ settings: remote ?? defaultSettings(userId) })
          if (!remote) {
            await upsertSettingsRemote(defaultSettings(userId))
          }
        } catch {
          // offline — fall back to whatever persist rehydrated, or defaults
          if (!get().settings) set({ settings: defaultSettings(userId) })
        }
      },

      updateSettings: async (patch) => {
        const current = get().settings
        if (!current) return
        const updated = { ...current, ...patch, updated_at: new Date().toISOString() }
        set({ settings: updated }) // instant local update
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