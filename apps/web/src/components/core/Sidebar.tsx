// apps/web/src/components/core/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMomentum } from '@/hooks/useMomentum'
import { useTaskEngine } from '@/hooks/useTaskEngine'

const DEV_USER_ID = 'dev-local-user'

const TREND_ARROW: Record<'up' | 'down' | 'flat', string> = {
  up: '↑',
  down: '↓',
  flat: '→',
}

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/replay', label: 'Replay' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { tasksByStatus } = useTaskEngine(DEV_USER_ID)
  const { score, trend } = useMomentum(DEV_USER_ID, tasksByStatus('done'))

  return (
    <nav
      style={{
        width: 220,
        minWidth: 220,
        height: '100vh',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid="sidebar"
    >
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-primary)' }}>
        DRIFT
      </p>

      <div style={{ marginTop: 24 }} data-testid="momentum-display">
        <span style={{ fontSize: 18, color: 'var(--text-primary)' }}>{score}</span>
        <span style={{ fontSize: 14, marginLeft: 4, color: 'var(--text-secondary)' }}>
          {TREND_ARROW[trend]}
        </span>
        <p className="text-meta" style={{ marginTop: 2 }}>momentum</p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: 14,
              color: pathname === link.href ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 12px' }} />
        <button
          type="button"
          data-testid="end-day-button"
          onClick={() => router.push('/shutdown')}
          style={{
            background: 'none', border: 'none', textAlign: 'left',
            color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', padding: 0,
          }}
        >
          end day
        </button>
        <Link href="/settings" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          ⚙ settings
        </Link>
      </div>
    </nav>
  )
}