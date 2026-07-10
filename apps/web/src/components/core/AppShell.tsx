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

const NO_SIDEBAR_ROUTES = ['/now', '/shutdown']
const PUBLIC_ROUTES = ['/login']

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
  const hideSidebar = NO_SIDEBAR_ROUTES.some((r) => pathname.startsWith(r)) || isPublicRoute
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
    const tasks = await organizeBrainDump(rawText, user.id, anchorNameToId)
    for (const task of tasks) void addTask(task)
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