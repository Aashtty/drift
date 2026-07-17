// apps/web/src/hooks/useOnboarding.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/db/supabase'

function storageKeyFor(userId: string): string {
  return `drift-onboarding-seen:${userId}`
}

/**
 * Real bug fix: this key used to be a single global
 * 'drift-onboarding-seen' with no user scoping - on a shared device,
 * one account finishing onboarding silently skipped it for every OTHER
 * account that ever signed in on that browser. Scoped per user id now.
 */
export function useOnboarding(userId: string | null) {
  const [shouldShow, setShouldShow] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!userId) return
    const currentUserId = userId
    setChecked(false)

    async function check() {
      const seenLocally = localStorage.getItem(storageKeyFor(currentUserId)) === 'true'
      if (seenLocally) {
        setShouldShow(false)
        setChecked(true)
        return
      }

      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', currentUserId)

      const isNew = (sessionCount ?? 0) === 0
      setShouldShow(isNew)
      setChecked(true)
    }
    void check()
  }, [userId])

  function markSeen() {
    if (userId) localStorage.setItem(storageKeyFor(userId), 'true')
    setShouldShow(false)
  }

  return { shouldShow: shouldShow && checked, markSeen }
}