// apps/web/src/components/core/AppShell.tsx
'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BrainDump } from '@/components/tasks/BrainDump'
import { CaptureButton } from '@/components/core/CaptureButton'
import { Sidebar } from '@/components/core/Sidebar'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { ShortcutCheatSheet } from '@/components/core/ShortcutCheatSheet'
import { useCheatSheetShortcut } from '@/hooks/useCheatSheetShortcut'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { organizeBrainDump } from '@/lib/ai/taskOrganizer'
import { useUser } from '@/hooks/useUser'
import { useOnboarding } from '@/hooks/useOnboarding'
import type { Task } from '@/types/task'

const NO_SIDEBAR_ROUTES = ['/now', '/shutdown']
const PUBLIC_ROUTES = ['/login']

// Exact-segment match instead of a raw startsWith — startsWith('/now')
// would also match a hypothetical future route like '/nowhere', hiding
// the sidebar somewhere it shouldn't. Not the cause of the sidebar
// showing up ON /now (that's a route-matching problem in the other
// direction — see tasks/page.tsx), but worth tightening regardless.
function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`)
}

/**
 * organizeBrainDump() failing (network blip, AI API timeout/rate-limit,
 * whatever) used to mean total silent data loss — BrainDump.tsx clears
 * the textarea the instant submit is clicked, before this async call
 * even resolves, so a failure here had nothing left to fall back to.
 * This produces plain, unscored tasks straight from the raw lines
 * instead, so a capture is never fully lost — just less organized than
 * it would've been. aes_score: null already renders as "scoring…" in
 * TaskCard and stays visible under every energy filter.
 *
 * NOTE: field names are a best-effort match to what's used elsewhere in
 * the codebase (id/user_id/name/status/aes_score/anchor_id/created_at/
 * updated_at). Adjust if your actual Task type differs.
 */
function makeFallbackTask(name: string, userId: string): Task {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    user_id: userId,
    name,
    status: 'active',
    aes_score: null,
    anchor_id: null,
    created_at: now,
    updated_at: now,
  } as Task
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const addTask = useTaskStore((s) => s.addTask)
  const anchors = useAnchorStore((s) => s.anchors)
  const { shouldShow: showOnboarding, markSeen } = useOnboarding(user?.id ?? null)
  const [brainDumpOpenFromOnboarding, setBrainDumpOpenFromOnboarding] = useState(false)
  const cheatSheet = useCheatSheetShortcut()

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const hideSidebar = NO_SIDEBAR_ROUTES.some((r) => matchesRoute(pathname, r)) || isPublicRoute
  const showCapture = Boolean(user) && !isPublicRoute && !showOnboarding && !hideSidebar

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) router.push('/login')
  }, [loading, user, isPublicRoute, router])

  function anchorNameToId(name: string | null): string | null {
    if (!name) return null
    return anchors.find((a) => a.name.toLowerCase() === name.toLowerCase())?.id ?? null
  }

  async function handleBrainDumpSubmit(rawText: string) {
    if (!user) return
    try {
      const tasks = await organizeBrainDump(rawText, user.id, anchorNameToId)
      for (const task of tasks) void addTask(task)
    } catch (err: any) {
      console.error('[AppShell] organizeBrainDump failed, falling back to raw capture:', err?.message ?? err)
      const fallbackTasks = rawText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((name) => makeFallbackTask(name, user.id))
      for (const task of fallbackTasks) void addTask(task)
    }
  }

  function finishOnboarding() {
    markSeen()
    setBrainDumpOpenFromOnboarding(true)
  }

  if (loading) return null
  if (!user && !isPublicRoute) return null

  return (
    <>
      {user && showOnboarding && <Onboarding onFinish={finishOnboarding} />}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
        {!hideSidebar && !showOnboarding && <Sidebar />}
        <div style={{ flex: 1 }}>{children}</div>
      </div>
      {user && !isPublicRoute && !showOnboarding && (
        <BrainDump
          onSubmit={handleBrainDumpSubmit}
          forceOpen={brainDumpOpenFromOnboarding}
          onForceOpenHandled={() => setBrainDumpOpenFromOnboarding(false)}
        />
      )}
      {showCapture && <CaptureButton />}
      <ShortcutCheatSheet open={cheatSheet.open} onClose={() => cheatSheet.setOpen(false)} />
    </>
  )
}