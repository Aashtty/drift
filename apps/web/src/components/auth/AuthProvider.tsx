// apps/web/src/components/auth/AuthProvider.tsx
'use client'

import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/db/supabase'
import { clearLocalUserData } from '@/lib/auth/clearLocalUserData'

interface AuthContextValue {
  user: User | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

const LAST_USER_ID_KEY = 'drift:last-user-id'

/**
 * Real bug fix: logging out and signing into a DIFFERENT account on
 * the same browser used to show the previous account's tasks - local
 * caches were never scoped by user or cleared on account switch. This
 * tracks the last signed-in user id in localStorage (survives full
 * reloads, not just in-memory state) and wipes every local cache
 * BEFORE the new user is published to the rest of the app, whenever it
 * detects either (a) a different account signed in, or (b) a sign-out.
 * Every store's own load function is also scoped by user id now as a
 * second layer (see taskStore.ts, anchorStore.ts) in case anything
 * reads state in the brief window before this resolves.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function reconcileUser(currentUserId: string | null) {
      const lastUserId = window.localStorage.getItem(LAST_USER_ID_KEY)
      const switchedAccounts = Boolean(lastUserId) && Boolean(currentUserId) && lastUserId !== currentUserId
      const signedOut = Boolean(lastUserId) && !currentUserId

      if (switchedAccounts || signedOut) {
        await clearLocalUserData()
      }

      if (currentUserId) window.localStorage.setItem(LAST_USER_ID_KEY, currentUserId)
      else window.localStorage.removeItem(LAST_USER_ID_KEY)
    }

    async function init() {
      const { data } = await supabase.auth.getSession()
      const currentUserId = data.session?.user?.id ?? null
      await reconcileUser(currentUserId)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }
    void init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id ?? null
      void reconcileUser(currentUserId).then(() => {
        setUser(session?.user ?? null)
        setLoading(false)
      })
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}