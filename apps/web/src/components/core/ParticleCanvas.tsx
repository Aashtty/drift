// apps/web/src/components/core/ParticleCanvas.tsx
'use client'

import { useEffect, useRef } from 'react'
import { createParticles, stepParticle, type Particle } from '@/lib/particles/particleSystem'
import type { AppState } from '@/types/appState'

interface ParticleCanvasProps {
  state?: AppState
  accentColor?: string
}

export function ParticleCanvas({ state = 'IDLE', accentColor = '#6655CC' }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particlesRef.current = createParticles(canvas.width, canvas.height, state, accentColor)
    }
    resize()
    window.addEventListener('resize', resize)

    function loop() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particlesRef.current) {
        stepParticle(p, canvas.width, canvas.height)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, accentColor])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}