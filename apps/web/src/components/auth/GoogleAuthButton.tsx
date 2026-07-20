// apps/web/src/components/auth/GoogleAuthButton.tsx
'use client'

import { motion } from 'motion/react'

function GoogleGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
    </svg>
  )
}
function SpinnerIcon() {
  return (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.25" /><path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>)
}

interface GoogleAuthButtonProps {
  onClick: () => void
  loading: boolean
  testId?: string
}

/**
 * Google's brand guidelines require the "Sign in with Google" button
 * to follow one of their sanctioned appearances - this is their
 * official "neutral/dark" variant (near-black fill, white circular
 * badge behind the multicolor G), which is both compliant and, unlike
 * their plain white default, actually sits well in a dark glass UI.
 */
export function GoogleAuthButton({ onClick, loading, testId }: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      data-testid={testId}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        width: '100%', padding: '10px 0', background: '#131314', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 'var(--radius-md)', color: '#e3e3e3', fontSize: 13.5, fontWeight: 500,
        cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
          <SpinnerIcon />
        </motion.span>
      ) : (
        <>
          <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GoogleGlyph />
          </span>
          Continue with Google
        </>
      )}
    </button>
  )
}