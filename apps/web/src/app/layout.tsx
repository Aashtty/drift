// apps/web/src/app/layout.tsx
'use client'

import '@/styles/globals.css'
import { usePathname } from 'next/navigation'
import { AmbientBackground } from '@/components/core/AmbientBackground'
import { ParticleCanvas } from '@/components/core/ParticleCanvas'
import { EdgeArc } from '@/components/core/EdgeArc'
import { StateTransition } from '@/components/core/StateTransition'
import { AppShell } from '@/components/core/AppShell'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { useUser } from '@/hooks/useUser'
import { useCalendarBridge } from '@/hooks/useCalendarBridge'
import { useSettingsStore } from '@/stores/settingsStore'

// Real bug fix: EdgeArc (and the ambient blobs/particles) were mounted
// unconditionally here with zero route awareness - they rendered on
// every page including /login, which is exactly the "I don't want to
// see the edge arc on login" report. Auth routes now render their own
// dedicated AuthHeroBackground (see login/page.tsx and
// reset-password/page.tsx) instead of the app's dashboard ambient
// system - keeping both mounted at once would just double up and look
// cluttered underneath a purpose-built visual.
const AUTH_ROUTES = ['/login', '/reset-password']

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const { nearEvent, events } = useCalendarBridge(user?.id ?? null)
  const settings = useSettingsStore((s) => s.settings)
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  return (
    <>
      {!isAuthRoute && (
        <>
          <AmbientBackground />
          <ParticleCanvas />
          <EdgeArc
            fuzzyTime={settings?.fuzzy_time ?? false}
            dayStart={settings?.day_start ?? '09:00'}
            dayEnd={settings?.day_end ?? '19:00'}
            nearEvent={nearEvent}
            events={events}
          />
        </>
      )}
      {/* Stays mounted everywhere - it just writes CSS custom
          properties onto the document root, which auth pages still
          need for var(--accent) etc to resolve correctly. */}
      <StateTransition />
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