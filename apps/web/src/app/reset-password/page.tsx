// apps/web/src/app/reset-password/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { supabase } from '@/lib/db/supabase'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AuthMark } from '@/components/auth/AuthMark'

function LockIcon() {
  return (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>)
}
function EyeIcon({ open }: { open: boolean }) {
  if (!open) return (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1.5 8s2.2-4.5 6.5-4.5S14.5 8 14.5 8s-2.2 4.5-6.5 4.5S1.5 8 1.5 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" /></svg>)
  return (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M1.5 8s2.2-4.5 6.5-4.5S14.5 8 14.5 8s-2.2 4.5-6.5 4.5S1.5 8 1.5 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" /><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>)
}
function SpinnerIcon() {
  return (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.25" /><path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>)
}
function CheckIcon() {
  return (<svg width="20" height="20" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
}

type Status = 'checking' | 'ready' | 'invalid' | 'done'

/**
 * New page - the other half of forgot-password. Supabase's client
 * (detectSessionInUrl: true, see lib/db/supabase.ts) auto-parses the
 * recovery token from the email link's URL hash and establishes a
 * temporary session; this page just waits for that, then lets the
 * person set a new password via supabase.auth.updateUser().
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setStatus(data.session ? 'ready' : 'invalid')
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setStatus('done')
    setTimeout(() => router.push('/'), 1800)
  }

  return (
    <main style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassPanel chromatic style={{ padding: 36, width: 380, position: 'relative', zIndex: 1 }}>
        <AuthMark />
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <p className="text-glow" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', margin: 0 }}>DRIFT</p>
          <p className="text-meta" style={{ marginTop: 6, fontSize: 12.5 }}>set a new password.</p>
        </div>

        {status === 'checking' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 0' }}>
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex', color: 'var(--text-secondary)' }}><SpinnerIcon /></motion.span>
            <p className="text-meta" style={{ fontSize: 13 }}>Checking your reset link...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 18 }}>This reset link is invalid or has expired.</p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              data-testid="reset-password-back-to-login"
              style={{ padding: '11px 20px', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
            >
              back to sign in
            </button>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}><LockIcon /></span>
              <input type={showPassword ? 'text' : 'password'} placeholder="new password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" data-testid="reset-password-new-input" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 36px 11px 36px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'hide password' : 'show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}><LockIcon /></span>
              <input type={showPassword ? 'text' : 'password'} placeholder="confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} autoComplete="new-password" data-testid="reset-password-confirm-input" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 12px 11px 36px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
            </div>
            {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }} data-testid="reset-password-error">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              data-testid="reset-password-submit"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg)', fontSize: 14, fontWeight: 500, cursor: loading ? 'default' : 'pointer', boxShadow: 'var(--glow-accent-sm)', marginTop: 4, opacity: loading ? 0.75 : 1 }}
            >
              {loading ? (<motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}><SpinnerIcon /></motion.span>) : 'update password'}
            </button>
          </form>
        )}

        {status === 'done' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CheckIcon />
            <p style={{ color: 'var(--success)', fontSize: 14 }} data-testid="reset-password-done">Password updated - taking you in...</p>
          </motion.div>
        )}
      </GlassPanel>
    </main>
  )
}