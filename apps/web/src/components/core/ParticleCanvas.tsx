// apps/web/src/components/core/ParticleCanvas.tsx
'use client'

import { useEffect, useRef } from 'react'
import { reconcileParticles, stepParticle, lerpColor, type Particle } from '@/lib/particles/particleSystem'
import { useAppState } from '@/hooks/useAppState'
import { STATE_COLORS } from '@/lib/utils/stateColors'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const COLOR_TRANSITION_MS = 800
const SPRITE_SIZE = 64 // pre-rendered glow sprite dimensions (px)

// Builds a soft radial-gradient "glow dot" once, as an offscreen canvas.
// Drawing this via drawImage() per particle is dramatically cheaper than
// setting ctx.shadowBlur per particle per frame — shadowBlur forces the
// browser to do a real-time blur pass on every draw call, which was the
// actual source of the lag. This sprite approach gets the same soft
// look essentially for free.
function buildGlowSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = SPRITE_SIZE
  sprite.height = SPRITE_SIZE
  const sctx = sprite.getContext('2d')!
  const grad = sctx.createRadialGradient(
    SPRITE_SIZE / 2, SPRITE_SIZE / 2, 0,
    SPRITE_SIZE / 2, SPRITE_SIZE / 2, SPRITE_SIZE / 2
  )
  grad.addColorStop(0, color)
  grad.addColorStop(0.4, color)
  grad.addColorStop(1, 'transparent')
  sctx.fillStyle = grad
  sctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)
  return sprite
}

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const spriteRef = useRef<HTMLCanvasElement | null>(null)
  const spriteColorRef = useRef<string>('')
  const { state } = useAppState()
  const reducedMotion = usePrefersReducedMotion()

  const currentColorRef = useRef<string>(STATE_COLORS.IDLE.accent)
  const fromColorRef = useRef<string>(STATE_COLORS.IDLE.accent)
  const toColorRef = useRef<string>(STATE_COLORS.IDLE.accent)
  const transitionStartRef = useRef<number>(0)

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
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw(color: string) {
      if (!canvas || !ctx) return
      // Rebuild the glow sprite only when the color actually changes
      // (not every frame) — this keeps the hot path to just drawImage
      // calls, which are cheap.
      if (color !== spriteColorRef.current) {
        spriteRef.current = buildGlowSprite(color)
        spriteColorRef.current = color
      }
      const sprite = spriteRef.current
      if (!sprite) return

      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)
      for (const p of particlesRef.current) {
        const px = p.x * w
        const py = p.y * h
        const drawSize = p.size * 4 // sprite has soft falloff, needs to be bigger than the "core" dot size
        ctx.globalAlpha = p.opacity
        ctx.drawImage(sprite, px - drawSize / 2, py - drawSize / 2, drawSize, drawSize)
      }
      ctx.globalAlpha = 1
    }

    if (reducedMotion) {
      particlesRef.current = reconcileParticles(particlesRef.current, state)
      draw(STATE_COLORS[state].accent)
      return () => window.removeEventListener('resize', resize)
    }

    function loop(now: number) {
      particlesRef.current = reconcileParticles(particlesRef.current, state)

      const elapsed = now - transitionStartRef.current
      const t = Math.min(1, elapsed / COLOR_TRANSITION_MS)
      currentColorRef.current = lerpColor(fromColorRef.current, toColorRef.current, t)

      for (const p of particlesRef.current) stepParticle(p)
      draw(currentColorRef.current)

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [state, reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      data-testid="particle-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}