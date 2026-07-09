// apps/web/src/hooks/useOnboarding.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/db/supabase'

const STORAGE_KEY = 'drift-onboarding-seen'

export function useOnboarding(userId: string | null) {
  const [shouldShow, setShouldShow] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!userId) return

    async function check() {
      // Fast local check first (avoids a flash on every reload for existing users)
      const seenLocally = localStorage.getItem(STORAGE_KEY) === 'true'
      if (seenLocally) {
        setShouldShow(false)
        setChecked(true)
        return
      }

      // Authoritative check: has this user ever completed a shutdown or logged
      // a session? If so, they're clearly not brand-new even on a fresh device.
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

      const isNew = (sessionCount ?? 0) === 0
      setShouldShow(isNew)
      setChecked(true)
    }
    void check()
  }, [userId])

  function markSeen() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShouldShow(false)
  }

  return { shouldShow: shouldShow && checked, markSeen }
}