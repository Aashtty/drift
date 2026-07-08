// apps/web/src/components/core/AppShell.tsx
'use client'

import type { ReactNode } from 'react'
import { BrainDump } from '@/components/tasks/BrainDump'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import { organizeBrainDump } from '@/lib/ai/taskOrganizer'

const DEV_USER_ID = 'dev-local-user'

export function AppShell({ children }: { children: ReactNode }) {
  const addTask = useTaskStore((s) => s.addTask)
  const anchors = useAnchorStore((s) => s.anchors)

  function anchorNameToId(name: string | null): string | null {
    if (!name) return null
    const match = anchors.find((a) => a.name.toLowerCase() === name.toLowerCase())
    return match?.id ?? null
  }

  async function handleBrainDumpSubmit(rawText: string) {
    const tasks = await organizeBrainDump(rawText, DEV_USER_ID, anchorNameToId)
    for (const task of tasks) {
      void addTask(task)
    }
  }

  return (
    <>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
      <BrainDump onSubmit={handleBrainDumpSubmit} />
    </>
  )
}