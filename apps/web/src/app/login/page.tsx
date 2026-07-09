// apps/web/src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db/supabase'
import { GlassPanel } from '@/components/ui/GlassPanel'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    router.push('/')
  }

  return (
    <main style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassPanel chromatic style={{ padding: 32, width: 360 }}>
        <p className="text-section-label" style={{ marginBottom: 16 }}>
          {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
              padding: '10px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 0', background: 'var(--surface-active)', border: 'none', borderRadius: 8,
              color: 'var(--accent)', fontSize: 14, cursor: 'pointer',
            }}
          >
            {loading ? '...' : mode === 'signin' ? 'sign in' : 'sign up'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
        >
          {mode === 'signin' ? "don't have an account? sign up" : 'already have an account? sign in'}
        </button>
      </GlassPanel>
    </main>
  )
}