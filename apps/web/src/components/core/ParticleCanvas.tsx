// apps/web/src/components/core/ParticleCanvas.tsx
'use client'

import { useEffect, useRef } from 'react'
import { reconcileParticles, stepParticle, lerpColor, type Particle } from '@/lib/particles/particleSystem'
import { useAppState } from '@/hooks/useAppState'
import { useTransitionStore } from '@/stores/transitionStore'
import { STATE_COLORS } from '@/lib/utils/stateColors'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

const SPRITE_SIZE = 64

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

/**
 * Color crossfade duration was a hardcoded 800ms constant — now reads
 * from transitionStore (driven by Settings' Ambient Transition Speed
 * slider), the same source every other ambient system reads from. Kept
 * as a ref with a manual subscription rather than a React value, since
 * this is consumed inside a requestAnimationFrame loop and shouldn't
 * trigger a React re-render on every settings change.
 */
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
  const transitionMsRef = useRef<number>(useTransitionStore.getState().transitionMs)

  useEffect(() => {
    return useTransitionStore.subscribe((s) => {
      transitionMsRef.current = s.transitionMs
    })
  }, [])

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
        const drawSize = p.size * 4
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
      const t = Math.min(1, elapsed / transitionMsRef.current)
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