// apps/web/src/components/auth/AuthHeroBackground.tsx
'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

const PARTICLE_COUNT = 55
const LINK_DISTANCE_FRACTION = 0.14
const DRIFT_SPEED = 0.00018

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: rand(0, 1),
    y: rand(0, 1),
    vx: rand(-DRIFT_SPEED, DRIFT_SPEED),
    vy: rand(-DRIFT_SPEED, DRIFT_SPEED),
  }))
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace('#', '')
  const num = parseInt(clean, 16)
  if (Number.isNaN(num)) return [143, 107, 255] // fallback to the default --accent
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

/**
 * New - a purpose-built, more elaborate visual exclusively for the
 * login/reset-password screens (distinct from the app's dashboard
 * ambient system, which is now suppressed on these routes - see
 * layout.tsx). A drifting particle constellation (nodes + connecting
 * lines that fade with distance) over three large slow-rotating glow
 * rings. Colors are read from the live --accent/--accent-b CSS vars at
 * mount, converted to plain rgb() for the canvas context - deliberately
 * NOT using color-mix()/CSS var strings directly in fillStyle/
 * strokeStyle, since Canvas 2D's support for those is inconsistent
 * across browsers; plain rgba() is universally safe.
 */
export function AuthHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>(makeParticles())
  const rafRef = useRef<number | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas || !ctx) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const rootStyle = getComputedStyle(document.documentElement)
    const [ar, ag, ab] = hexToRgb(rootStyle.getPropertyValue('--accent') || '#8f6bff')
    const [br, bg, bb] = hexToRgb(rootStyle.getPropertyValue('--accent-b') || '#4fd8ff')

    function draw() {
      if (!canvas || !ctx) return
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      const particles = particlesRef.current
      const linkDist = Math.min(w, h) * LINK_DISTANCE_FRACTION

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i]
          const p2 = particles[j]
          const dx = (p1.x - p2.x) * w
          const dy = (p1.y - p2.y) * h
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < linkDist) {
            const opacity = (1 - dist / linkDist) * 0.16
            ctx.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${opacity})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(p1.x * w, p1.y * h)
            ctx.lineTo(p2.x * w, p2.y * h)
            ctx.stroke()
          }
        }
      }

      for (const p of particles) {
        ctx.beginPath()
        ctx.fillStyle = `rgba(${br}, ${bg}, ${bb}, 0.55)`
        ctx.arc(p.x * w, p.y * h, 1.7, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function step() {
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = 1
        if (p.x > 1) p.x = 0
        if (p.y < 0) p.y = 1
        if (p.y > 1) p.y = 0
      }
    }

    if (reducedMotion) {
      draw()
      return () => window.removeEventListener('resize', resize)
    }

    function loop() {
      step()
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [reducedMotion])

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div className="auth-hero-ring auth-hero-ring-1" />
      <div className="auth-hero-ring auth-hero-ring-2" />
      <div className="auth-hero-ring auth-hero-ring-3" />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
      <style>{`
        .auth-hero-ring {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
        }
        .auth-hero-ring-1 {
          width: 640px; height: 640px; top: -160px; left: -120px; opacity: 0.35;
          background: radial-gradient(circle, var(--accent), transparent 70%);
          animation: auth-ring-drift-1 26s ease-in-out infinite alternate;
        }
        .auth-hero-ring-2 {
          width: 560px; height: 560px; bottom: -180px; right: -100px; opacity: 0.32;
          background: radial-gradient(circle, var(--accent-b), transparent 70%);
          animation: auth-ring-drift-2 32s ease-in-out infinite alternate;
        }
        .auth-hero-ring-3 {
          width: 420px; height: 420px; top: 40%; left: 60%; opacity: 0.2;
          background: radial-gradient(circle, #c060ff, transparent 70%);
          animation: auth-ring-drift-3 24s ease-in-out infinite alternate;
        }
        @keyframes auth-ring-drift-1 { from { transform: translate(0,0) scale(1); } to { transform: translate(60px,40px) scale(1.15); } }
        @keyframes auth-ring-drift-2 { from { transform: translate(0,0) scale(1); } to { transform: translate(-50px,-60px) scale(1.1); } }
        @keyframes auth-ring-drift-3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-40px,50px) scale(0.9); } }
        @media (prefers-reduced-motion: reduce) {
          .auth-hero-ring { animation: none; }
        }
      `}</style>
    </div>
  )
}