// apps/web/src/app/drift-summary/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SessionSummaryCard } from '@/components/session/SessionSummaryCard'
import { useSessionStore } from '@/stores/sessionStore'
import { useAppState } from '@/hooks/useAppState'

export default function DriftSummaryPage() {
  const router = useRouter()
  const lastSummary = useSessionStore((s) => s.lastSummary)
  const clearSummary = useSessionStore((s) => s.clearSummary)
  const { transition } = useAppState()

  useEffect(() => {
    if (!lastSummary) router.push('/')
  }, [lastSummary, router])

  if (!lastSummary) return null

  const minutes = Math.round(lastSummary.durationSeconds / 60)

  function handleContinue() {
    clearSummary()
    transition('IDLE')
    router.push('/')
  }

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SessionSummaryCard minutes={minutes} onContinue={handleContinue} />
    </main>
  )
}