// apps/web/src/app/layout.tsx
'use client'

import '@/styles/globals.css'
import { AmbientBackground } from '@/components/core/AmbientBackground'
import { ParticleCanvas } from '@/components/core/ParticleCanvas'
import { EdgeArc } from '@/components/core/EdgeArc'
import { StateTransition } from '@/components/core/StateTransition'
import { AppShell } from '@/components/core/AppShell'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { useUser } from '@/hooks/useUser'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { useSettingsStore } from '@/stores/settingsStore'

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const { nearEvent, events } = useCalendarBridge(user?.id ?? null)
  const settings = useSettingsStore((s) => s.settings)

  return (
    <>
      <AmbientBackground />
      <StateTransition />
      <ParticleCanvas />
      <EdgeArc
        fuzzyTime={settings?.fuzzy_time ?? false}
        dayStart={settings?.day_start ?? '09:00'}
        dayEnd={settings?.day_end ?? '19:00'}
        nearEvent={nearEvent}
        events={events}
      />
      <AppShell>{children}</AppShell>
    </>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/npm/@fontsource/cal-sans@0.1.0/index.min.css" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <LayoutInner>{children}</LayoutInner>
        </AuthProvider>
      </body>
    </html>
  )
}