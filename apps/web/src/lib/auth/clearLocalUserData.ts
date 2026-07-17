// apps/web/src/lib/auth/clearLocalUserData.ts
import { db } from '@/lib/db/dexie'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { useRoutineStore } from '@/stores/routineStore'
import { useSessionStore } from '@/stores/sessionStore'
import { useSettingsStore } from '@/stores/settingsStore'

// audioStore (volume, last-used sound mode) is deliberately NOT cleared
// here - those are device preferences, not per-account data, so
// carrying them across accounts on the same device is intentional.
const LOCAL_STORAGE_KEYS_TO_CLEAR = [
  'drift-active-session',
  'drift-settings',
  'drift:dayend-snoozed-until',
]

/**
 * The actual fix for "old account's tasks show up under the new
 * account" - wipes every local cache that could leak account-specific
 * data, called by AuthProvider the moment it detects the signed-in
 * user has changed (see AuthProvider.tsx for when/why this fires).
 */
export async function clearLocalUserData(): Promise<void> {
  try {
    await db.tasks.clear()
    await db.anchors.clear()
  } catch (err) {
    console.error('[clearLocalUserData] failed to clear Dexie tables:', err)
  }

  useTaskStore.setState({ tasks: [], loaded: false })
  useAnchorStore.setState({ anchors: [], loaded: false })
  useRoutineStore.setState({ routines: [], loaded: false })
  useSessionStore.setState({ active: null, lastSummary: null })
  useSettingsStore.setState({ settings: null })

  if (typeof window === 'undefined') return

  for (const key of LOCAL_STORAGE_KEYS_TO_CLEAR) {
    window.localStorage.removeItem(key)
  }

  // Onboarding-seen keys are now per-user (drift-onboarding-seen:<id> -
  // see useOnboarding.ts) - sweep all of them defensively since we
  // don't reliably know the OLD user's id at this point.
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i)
    if (key && key.startsWith('drift-onboarding-seen')) window.localStorage.removeItem(key)
  }

  window.sessionStorage.removeItem('drift:event-triggered-ids')
}