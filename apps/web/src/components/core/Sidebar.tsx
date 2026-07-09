// apps/web/src/components/core/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMomentum } from '@/hooks/useMomentum'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/db/supabase'

const TREND_ARROW: Record<'up' | 'down' | 'flat', string> = { up: '↑', down: '↓', flat: '→' }
const TREND_COLOR: Record<'up' | 'down' | 'flat', string> = {
  up: 'var(--success)',
  down: 'var(--danger)',
  flat: 'var(--text-secondary)',
}
const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/replay', label: 'Replay' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { tasksByStatus } = useTaskEngine(user?.id ?? '')
  const { score, trend } = useMomentum(user?.id ?? '', tasksByStatus('done'))

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav
      style={{
        position: 'relative',
        zIndex: 1,
        width: 232,
        minWidth: 232,
        height: '100vh',
        padding: '32px 22px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.2)',
      }}
      data-testid="sidebar"
    >
      <p
        className="text-glow"
        style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.03em' }}
      >
        DRIFT
      </p>

      <div style={{ marginTop: 30, marginBottom: 4 }} data-testid="momentum-display">
        <span style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>{score}</span>
        <span style={{ fontSize: 13, marginLeft: 6, color: TREND_COLOR[trend] }}>{TREND_ARROW[trend]}</span>
        <p className="text-meta" style={{ marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10.5, opacity: 0.6 }}>
          momentum
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '26px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: 14,
                padding: '9px 11px',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--surface-active)' : 'transparent',
                boxShadow: isActive ? 'var(--glow-accent-sm)' : 'none',
                textDecoration: 'none',
                transition: 'background 220ms var(--ease-out-expo), box-shadow 220ms var(--ease-out-expo)',
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 12px' }} />
        <p className="text-meta" style={{ opacity: 0.4, fontSize: 12 }}>{user?.email}</p>
        <button
          type="button"
          data-testid="end-day-button"
          onClick={() => router.push('/shutdown')}
          style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', padding: 0 }}
        >
          end day
        </button>
        <Link href="/settings" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
          ⚙ settings
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer', padding: 0 }}
        >
          sign out
        </button>
      </div>
    </nav>
  )
}