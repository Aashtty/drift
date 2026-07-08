// apps/web/src/components/core/AppShell.tsx
'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BrainDump } from '@/components/tasks/BrainDump'
import { Sidebar } from '@/components/core/Sidebar'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { organizeBrainDump } from '@/lib/ai/taskOrganizer'

const DEV_USER_ID = 'dev-local-user'

// Fullscreen, chrome-free routes — no sidebar, matches §6's NowBar/Shutdown layouts.
const NO_SIDEBAR_ROUTES = ['/now', '/shutdown']

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const addTask = useTaskStore((s) => s.addTask)
  const anchors = useAnchorStore((s) => s.anchors)
  const hideSidebar = NO_SIDEBAR_ROUTES.some((r) => pathname.startsWith(r))

  function anchorNameToId(name: string | null): string | null {
    if (!name) return null
    const match = anchors.find((a) => a.name.toLowerCase() === name.toLowerCase())
    return match?.id ?? null
  }

  async function handleBrainDumpSubmit(rawText: string) {
    const tasks = await organizeBrainDump(rawText, DEV_USER_ID, anchorNameToId)
    for (const task of tasks) void addTask(task)
  }

  return (
    <>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex' }}>
        {!hideSidebar && <Sidebar />}
        <div style={{ flex: 1 }}>{children}</div>
      </div>
      <BrainDump onSubmit={handleBrainDumpSubmit} />
    </>
  )
}