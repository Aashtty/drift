// apps/web/src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/db/supabase'
import { GlassPanel } from '@/components/ui/GlassPanel'

type Mode = 'signin' | 'signup'

function MailIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.2 4.3L8 8.5l5.8-4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
function EyeIcon({ open }: { open: boolean }) {
  if (!open) {
    return (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M1.5 8s2.2-4.5 6.5-4.5S14.5 8 14.5 8s-2.2 4.5-6.5 4.5S1.5 8 1.5 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 8s2.2-4.5 6.5-4.5S14.5 8 14.5 8s-2.2 4.5-6.5 4.5S1.5 8 1.5 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
function SpinnerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.25" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/**
 * Complete redesign - animated ambient glow behind the card (matches
 * the app's onboarding/vault visual language instead of a bare form on
 * black), a crossfade between sign-in/sign-up fields, an error shake,
 * and a real spinner during submission instead of a bare "...".
 *
 * Real bug fixed: signUp() can return {error: null, data: {session:
 * null}} when Supabase's email-confirmation setting is on - the old
 * code unconditionally called router.push('/') in that case, sending a
 * person who isn't actually authenticated yet to a protected route
 * that would just immediately bounce them back here with no
 * explanation of what happened. Now detects that case explicitly and
 * shows a clear "check your email" message instead.
 */
export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const { data, error: authError } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      setShakeKey((k) => k + 1)
      return
    }

    if (mode === 'signup' && !data.session) {
      setInfo('Account created - check your email to confirm it, then sign in.')
      setMode('signin')
      setPassword('')
      return
    }

    router.push('/')
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setError(null)
    setInfo(null)
  }

  return (
    <main style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '10%', left: '15%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent), transparent 70%)', filter: 'blur(110px)', opacity: 0.32 }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', bottom: '10%', right: '15%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, var(--accent-b), transparent 70%)', filter: 'blur(110px)', opacity: 0.26 }}
        />
      </div>

      <motion.div
        key={shakeKey}
        initial={{ opacity: 0, y: 16 }}
        animate={error ? { opacity: 1, y: 0, x: [0, -8, 8, -6, 6, 0] } : { opacity: 1, y: 0 }}
        transition={{ duration: error ? 0.4 : 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <GlassPanel chromatic style={{ padding: 36, width: 380 }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <p className="text-glow" style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', margin: 0 }}>
              DRIFT
            </p>
            <p className="text-meta" style={{ marginTop: 6, fontSize: 12.5 }}>
              {mode === 'signin' ? 'welcome back.' : 'start your focus practice.'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'signin' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'signin' ? 12 : -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
                  <MailIcon />
                </span>
                <input
                  type="email"
                  placeholder="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  data-testid="login-email-input"
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 12px 11px 36px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}>
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  data-testid="login-password-input"
                  style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 36px 11px 36px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'hide password' : 'show password'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }} data-testid="login-error">
                    {error}
                  </motion.p>
                )}
                {info && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: 'var(--success)', fontSize: 12, margin: 0 }} data-testid="login-info">
                    {info}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 0', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)',
                  color: 'var(--bg)', fontSize: 14, fontWeight: 500, cursor: loading ? 'default' : 'pointer',
                  boxShadow: 'var(--glow-accent-sm)', marginTop: 4, opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                    <SpinnerIcon />
                  </motion.span>
                ) : mode === 'signin' ? (
                  'sign in'
                ) : (
                  'create account'
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <button
            type="button"
            onClick={switchMode}
            data-testid="login-switch-mode"
            style={{ marginTop: 18, width: '100%', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
          >
            {mode === 'signin' ? "don't have an account? sign up" : 'already have an account? sign in'}
          </button>
        </GlassPanel>
      </motion.div>
    </main>
  )
}