// apps/web/src/components/core/ParticleCanvas.tsx
'use client'

import { useEffect, useRef } from 'react'
import {
  reconcileParticles,
  stepParticle,
  lerpColor,
  type Particle,
} from '@/lib/particles/particleSystem'
import { useAppState } from '@/hooks/useAppState'
import { STATE_COLORS } from '@/lib/utils/stateColors'

const COLOR_TRANSITION_MS = 800

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const { state } = useAppState()

  // Color interpolation state, independent of the particle position loop.
  const currentColorRef = useRef<string>(STATE_COLORS.IDLE.accent)
  const fromColorRef = useRef<string>(STATE_COLORS.IDLE.accent)
  const toColorRef = useRef<string>(STATE_COLORS.IDLE.accent)
  const transitionStartRef = useRef<number>(0)

  // Kick off a new color transition whenever state changes.
  useEffect(() => {
    fromColorRef.current = currentColorRef.current
    toColorRef.current = STATE_COLORS[state].accent
    transitionStartRef.current = performance.now()
  }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function loop(now: number) {
      if (!canvas || !ctx) return

      particlesRef.current = reconcileParticles(particlesRef.current, canvas.width, canvas.height, state)

      const elapsed = now - transitionStartRef.current
      const t = Math.min(1, elapsed / COLOR_TRANSITION_MS)
      currentColorRef.current = lerpColor(fromColorRef.current, toColorRef.current, t)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particlesRef.current) {
        stepParticle(p, canvas.width, canvas.height)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = currentColorRef.current
        ctx.globalAlpha = p.opacity
        ctx.fill()
      }
      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [state])

  return (
    <canvas
      ref={canvasRef}
      data-testid="particle-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}