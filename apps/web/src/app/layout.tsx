// apps/web/src/app/layout.tsx
import type { Metadata } from 'next'
import '@/styles/globals.css'
import { ParticleCanvas } from '@/components/core/ParticleCanvas'
import { EdgeArc } from '@/components/core/EdgeArc'
import { StateTransition } from '@/components/core/StateTransition'
import { AppShell } from '@/components/core/AppShell'

export const metadata: Metadata = {
  title: 'DRIFT — Catch your flow. Ride it.',
  description: 'A focus operating system for the ADHD mind.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://cdn.jsdelivr.net/npm/@fontsource/cal-sans@0.1.0/index.min.css"
          rel="stylesheet"
        />
      </head>
      <body>
        <StateTransition />
        <ParticleCanvas />
        <EdgeArc />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}