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
import { CommandPalette } from '@/components/core/CommandPalette'
import { Toast } from '@/components/core/Toast'
import { useCheatSheetShortcut } from '@/hooks/useCheatSheetShortcut'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { organizeBrainDump } from '@/lib/ai/taskOrganizer'
import { useUser } from '@/hooks/useUser'
import { useOnboarding } from '@/hooks/useOnboarding'
import { toast } from '@/stores/toastStore'
import type { Task } from '@/types/task'

const NO_SIDEBAR_ROUTES = ['/now', '/shutdown']
const PUBLIC_ROUTES = ['/login']

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`)
}

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
  // New — Cmd/Ctrl+K opens a global command palette. Kept as local
  // state here (rather than a store) since only this one place needs
  // to know about it; every trigger (sidebar button, keyboard shortcut,
  // the palette's own "keyboard shortcuts" entry) just calls setOpen.
  const [paletteOpen, setPaletteOpen] = useState(false)

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const hideSidebar = NO_SIDEBAR_ROUTES.some((r) => matchesRoute(pathname, r)) || isPublicRoute
  const showCapture = Boolean(user) && !isPublicRoute && !showOnboarding && !hideSidebar

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) router.push('/login')
  }, [loading, user, isPublicRoute, router])

  useEffect(() => {
    if (isPublicRoute || showOnboarding) return
    function handler(e: KeyboardEvent) {
      const modifier = e.metaKey || e.ctrlKey
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPublicRoute, showOnboarding])

  function anchorNameToId(name: string | null): string | null {
    if (!name) return null
    return anchors.find((a) => a.name.toLowerCase() === name.toLowerCase())?.id ?? null
  }

  async function handleBrainDumpSubmit(rawText: string) {
    if (!user) return
    try {
      const tasks = await organizeBrainDump(rawText, user.id, anchorNameToId)
      for (const task of tasks) void addTask(task)
      toast.success(tasks.length === 1 ? 'Captured 1 task.' : `Captured ${tasks.length} tasks.`)
    } catch (err: any) {
      console.error('[AppShell] organizeBrainDump failed, falling back to raw capture:', err?.message ?? err)
      const fallbackTasks = rawText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((name) => makeFallbackTask(name, user.id))
      for (const task of fallbackTasks) void addTask(task)
      toast.info(`Saved ${fallbackTasks.length} task${fallbackTasks.length === 1 ? '' : 's'} — couldn't auto-organize this time, so they're unsorted.`)
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
        {!hideSidebar && !showOnboarding && <Sidebar onOpenPalette={() => setPaletteOpen(true)} onOpenShortcuts={() => cheatSheet.setOpen(true)} />}
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
      {user && !isPublicRoute && !showOnboarding && (
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onOpenShortcuts={() => cheatSheet.setOpen(true)} />
      )}
      <Toast />
    </>
  )
}