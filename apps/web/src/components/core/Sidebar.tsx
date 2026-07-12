// apps/web/src/components/core/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useMomentum } from '@/hooks/useMomentum'
import { useTaskEngine } from '@/hooks/useTaskEngine'
import { useUser } from '@/hooks/useUser'
import { useTaskStore } from '@/stores/taskStore'
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
  const limboCount = useTaskStore((s) => s.tasks.filter((t) => t.status === 'limbo').length)

  // taskStore/sessionStore/settingsStore all have real offline-first
  // sync (dirty flags, retry-on-reconnect) but none of it was visible
  // anywhere — if the connection drops mid-session there was no signal
  // that anything had changed. This is the first UI surface for it.
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

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
      {/*
        Best-guess mitigation only: something rendered outside this file
        (a fixed user-avatar circle, based on it appearing identically
        positioned even on routes where Sidebar doesn't mount at all)
        overlaps this logo. Nudging it clear of the likely avatar
        footprint until that component's source is available to fix
        properly at the source.
      */}
      <div style={{ marginLeft: 34 }}>
        <p
          className="text-glow"
          style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0 }}
        >
          DRIFT
        </p>
      </div>

      <button
        type="button"
        data-testid="momentum-display"
        onClick={() => router.push('/replay')}
        title="momentum · based on the last 14 days · click for details"
        style={{
          marginTop: 30,
          marginBottom: 4,
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>{score}</span>
        <span style={{ fontSize: 13, marginLeft: 6, color: TREND_COLOR[trend] }}>{TREND_ARROW[trend]}</span>
        <p className="text-meta" style={{ marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10.5, opacity: 0.6 }}>
          momentum
        </p>
      </button>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '26px 0' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href
          const showLimboBadge = link.href === '/tasks' && limboCount > 0
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className="sidebar-nav-link"
              style={{
                position: 'relative',
                fontSize: 14,
                padding: '9px 11px',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                zIndex: 1,
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-nav-active"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--surface-active)',
                    boxShadow: 'var(--glow-accent-sm)',
                    borderRadius: 'var(--radius-sm)',
                    zIndex: -1,
                  }}
                />
              )}
              <span>{link.label}</span>
              {showLimboBadge && (
                <span
                  className="text-micro-mono"
                  title={`${limboCount} task${limboCount === 1 ? '' : 's'} in limbo`}
                  style={{
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: 'var(--surface-active)',
                    color: 'var(--text-tertiary)',
                    fontSize: 10.5,
                  }}
                >
                  {limboCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 12px' }} />

        {!isOnline && (
          <div
            data-testid="offline-indicator"
            title="No connection — changes are saved locally and will sync once you're back online"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)' }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
            offline — saving locally
          </div>
        )}

        <p className="text-meta" style={{ opacity: 0.4, fontSize: 12 }}>{user?.email}</p>
        <button
          type="button"
          data-testid="end-day-button"
          onClick={() => router.push('/shutdown')}
          className="sidebar-nav-link"
          style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', padding: 0 }}
        >
          end day
        </button>
        <Link href="/settings" className="sidebar-nav-link" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}>
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

      <style>{`
        .sidebar-nav-link {
          transition: background 180ms var(--ease-out-expo), color 180ms var(--ease-out-expo), opacity 180ms;
        }
        .sidebar-nav-link:hover {
          color: var(--text-primary) !important;
          opacity: 0.9;
        }
        [data-testid="momentum-display"]:hover {
          opacity: 0.85;
        }
      `}</style>
    </nav>
  )
}