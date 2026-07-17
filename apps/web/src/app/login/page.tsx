// apps/web/src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { supabase } from '@/lib/db/supabase'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { AuthMark } from '@/components/auth/AuthMark'

type Mode = 'signin' | 'signup' | 'reset'

function MailIcon() {
  return (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2.2 4.3L8 8.5l5.8-4.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>)
}
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
function ArrowLeftIcon() {
  return (<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M10.5 3L5 8l5.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>)
}

function passwordStrength(password: string): { label: string; color: string; score: number } {
  if (!password) return { label: '', color: 'var(--text-tertiary)', score: 0 }
  let raw = 0
  if (password.length >= 6) raw++
  if (password.length >= 10) raw++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) raw++
  if (/[0-9]/.test(password)) raw++
  if (/[^A-Za-z0-9]/.test(password)) raw++
  if (raw <= 1) return { label: 'weak', color: 'var(--danger)', score: 1 }
  if (raw <= 3) return { label: 'fair', color: 'var(--warning)', score: 2 }
  return { label: 'strong', color: 'var(--success)', score: 3 }
}

/**
 * Complete redesign: shared AuthMark for brand consistency with the
 * rest of the app, a segmented sign-in/sign-up toggle instead of a
 * bottom text link, a real forgot-password flow (previously missing
 * entirely - a locked-out person had no recovery path), and a simple
 * password strength meter on sign-up.
 *
 * Real bug carried over from the previous version, still fixed here:
 * signUp() can return {error: null, data: {session: null}} when
 * Supabase's email-confirmation setting is on - unconditionally
 * routing to '/' in that case sends someone who isn't actually
 * authenticated to a protected route that just bounces them back.
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

  const strength = mode === 'signup' ? passwordStrength(password) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (mode === 'reset') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      setLoading(false)
      if (resetError) {
        setError(resetError.message)
        setShakeKey((k) => k + 1)
        return
      }
      setMode('signin')
      setInfo("If that email has an account, we've sent a reset link.")
      return
    }

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

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
    if (next === 'reset') setPassword('')
  }

  return (
    <main style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div key={shakeKey} initial={{ opacity: 0, y: 16 }} animate={error ? { opacity: 1, y: 0, x: [0, -8, 8, -6, 6, 0] } : { opacity: 1, y: 0 }} transition={{ duration: error ? 0.4 : 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ position: 'relative', zIndex: 1 }}>
        <GlassPanel chromatic style={{ padding: 36, width: 380 }}>
          <AuthMark />
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <p className="text-glow" style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em', margin: 0 }}>DRIFT</p>
            <p className="text-meta" style={{ marginTop: 6, fontSize: 12.5 }}>
              {mode === 'signin' && 'welcome back.'}
              {mode === 'signup' && 'start your focus practice.'}
              {mode === 'reset' && "we'll send you a reset link."}
            </p>
          </div>

          {mode !== 'reset' && (
            <div className="glass" style={{ display: 'flex', padding: 3, borderRadius: 'var(--radius-full)', marginBottom: 18 }}>
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  data-testid={`login-mode-${m}`}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 'var(--radius-full)', border: 'none', background: mode === m ? 'var(--surface-active)' : 'transparent', color: mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize: 12.5, fontWeight: mode === m ? 500 : 400, cursor: 'pointer' }}
                >
                  {m === 'signin' ? 'sign in' : 'sign up'}
                </button>
              ))}
            </div>
          )}

          {mode === 'reset' && (
            <button type="button" onClick={() => switchMode('signin')} data-testid="login-back-to-signin" style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 12, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
              <ArrowLeftIcon /> back to sign in
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}><MailIcon /></span>
                <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" data-testid="login-email-input" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 12px 11px 36px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
              </div>

              {mode !== 'reset' && (
                <div>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', display: 'flex' }}><LockIcon /></span>
                    <input type={showPassword ? 'text' : 'password'} placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} data-testid="login-password-input" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '11px 36px 11px 36px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'hide password' : 'show password'} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>

                  {mode === 'signup' && password.length > 0 && strength && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7 }}>
                      <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                        {[1, 2, 3].map((i) => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: i <= strength.score ? strength.color : 'var(--border)', transition: 'background 200ms var(--ease-out-expo)' }} />
                        ))}
                      </div>
                      <span className="text-micro-mono" style={{ color: strength.color, textTransform: 'capitalize', width: 40 }}>{strength.label}</span>
                    </div>
                  )}

                  {mode === 'signin' && (
                    <button type="button" onClick={() => switchMode('reset')} data-testid="login-forgot-password" style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 11.5, cursor: 'pointer', padding: 0 }}>
                      forgot password?
                    </button>
                  )}
                </div>
              )}

              <AnimatePresence>
                {error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }} data-testid="login-error">{error}</motion.p>}
                {info && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ color: 'var(--success)', fontSize: 12, margin: 0 }} data-testid="login-info">{info}</motion.p>}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', background: 'var(--accent-gradient)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg)', fontSize: 14, fontWeight: 500, cursor: loading ? 'default' : 'pointer', boxShadow: 'var(--glow-accent-sm)', marginTop: 4, opacity: loading ? 0.75 : 1 }}
              >
                {loading ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}><SpinnerIcon /></motion.span>
                ) : mode === 'signin' ? 'sign in' : mode === 'signup' ? 'create account' : 'send reset link'}
              </button>
            </motion.form>
          </AnimatePresence>
        </GlassPanel>
      </motion.div>
    </main>
  )
}