// apps/web/src/components/core/Sidebar.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
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

const COLLAPSE_KEY = 'drift:sidebar-collapsed'
const EXPANDED_WIDTH = 232
const COLLAPSED_WIDTH = 68

// Custom SVG gear — the rest of the app already made the deliberate
// choice to replace emoji with hand-drawn icons (NowBar's LockIcon /
// PauseIcon / CheckIcon) specifically because emoji render inconsistently
// across platforms. The settings "⚙" here was the one place that
// decision hadn't been applied yet.
function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.8v1.6M8 12.6v1.6M14.2 8h-1.6M3.4 8H1.8M12.1 3.9l-1.1 1.1M5 10l-1.1 1.1M12.1 12.1L11 11M5 6L3.9 4.9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  )
}
function EndDayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M4 2.5v11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 3.5h6.5l-2 2.3 2 2.2H4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}
function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }}>
      <path d="M10 3L5.5 8L10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { tasksByStatus } = useTaskEngine(user?.id ?? '')
  const { score, trend } = useMomentum(user?.id ?? '', tasksByStatus('done'))
  const limboCount = useTaskStore((s) => s.tasks.filter((t) => t.status === 'limbo').length)

  const [isOnline, setIsOnline] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(COLLAPSE_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      window.localStorage.setItem(COLLAPSE_KEY, String(!prev))
      return !prev
    })
  }

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

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH

  return (
    <nav
      style={{
        position: 'relative',
        zIndex: 1,
        width,
        minWidth: width,
        height: '100vh',
        padding: collapsed ? '32px 12px' : '32px 22px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'rgba(0,0,0,0.2)',
        transition: 'width 220ms var(--ease-out-expo), padding 220ms var(--ease-out-expo)',
      }}
      data-testid="sidebar"
      data-collapsed={collapsed}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginLeft: collapsed ? 0 : 34 }}>
        {!collapsed && (
          <p
            className="text-glow"
            style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.03em', margin: 0 }}
          >
            DRIFT
          </p>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'expand sidebar' : 'collapse sidebar'}
          data-testid="sidebar-collapse-toggle"
          style={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface)',
            border: 'none',
            borderRadius: 8,
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
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
          textAlign: collapsed ? 'center' : 'left',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <span style={{ fontSize: collapsed ? 18 : 24, fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-primary)' }}>{score}</span>
        <span style={{ fontSize: 13, marginLeft: 6, color: TREND_COLOR[trend] }}>{TREND_ARROW[trend]}</span>
        {!collapsed && (
          <p className="text-meta" style={{ marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 10.5, opacity: 0.6 }}>
            momentum
          </p>
        )}
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
              title={collapsed ? link.label : undefined}
              className="sidebar-nav-link"
              style={{
                position: 'relative',
                fontSize: 14,
                padding: collapsed ? '9px 0' : '9px 11px',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'space-between',
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
              <span>{collapsed ? link.label[0] : link.label}</span>
              {showLimboBadge && !collapsed && (
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
              {showLimboBadge && collapsed && (
                <span
                  aria-hidden="true"
                  style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}
                />
              )}
            </Link>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 12px' }} />

        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              data-testid="offline-indicator"
              title="No connection — changes are saved locally and will sync once you're back online"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)', justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
              {!collapsed && 'offline — saving locally'}
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && <p className="text-meta" style={{ opacity: 0.4, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>}

        <button
          type="button"
          data-testid="end-day-button"
          onClick={() => router.push('/shutdown')}
          title={collapsed ? 'end day' : undefined}
          className="sidebar-nav-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            color: 'var(--accent)',
            fontSize: 14,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <EndDayIcon /> {!collapsed && 'end day'}
        </button>
        <Link
          href="/settings"
          title={collapsed ? 'settings' : undefined}
          className="sidebar-nav-link"
          style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start', fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          <GearIcon /> {!collapsed && 'settings'}
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? 'sign out' : undefined}
          style={{
            background: 'none',
            border: 'none',
            textAlign: collapsed ? 'center' : 'left',
            color: 'var(--text-tertiary)',
            fontSize: 12,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {collapsed ? '⏻' : 'sign out'}
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