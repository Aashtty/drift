// apps/web/src/lib/particles/particleSystem.ts
import type { AppState } from '@/types/appState'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

interface ParticleConfig {
  count: number
  opacityMax: number
  speedMax: number
  sizeMax: number
}

// Softer pass: fewer, slower, smaller-max particles, rendered with blur
// in ParticleCanvas (glow instead of hard dots) — see softBlurPx there.
// apps/web/src/lib/particles/particleSystem.ts — only PARTICLE_CONFIG changes, rest identical
export const PARTICLE_CONFIG: Record<AppState, ParticleConfig> = {
  IDLE: { count: 55, opacityMax: 0.28, speedMax: 0.16, sizeMax: 6 },
  FOCUS: { count: 65, opacityMax: 0.32, speedMax: 0.2, sizeMax: 7 },
  FLOW: { count: 75, opacityMax: 0.38, speedMax: 0.25, sizeMax: 8 },
  DRIFT: { count: 40, opacityMax: 0.22, speedMax: 0.12, sizeMax: 5 },
  SHUTDOWN: { count: 26, opacityMax: 0.15, speedMax: 0.1, sizeMax: 4 },
}
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// x/y stored as 0–1 fractions of canvas size, not raw pixels — this is
// what makes particles reposition correctly and smoothly on window
// resize instead of bunching in a corner (see ParticleCanvas's resize
// handler, which now just re-reads these fractions against the new
// width/height rather than needing to regenerate or rescale anything).
export function createParticle(config: ParticleConfig): Particle {
  return {
    x: rand(0, 1),
    y: rand(0, 1),
    vx: rand(-config.speedMax, config.speedMax) / 1000,
    vy: rand(-config.speedMax, config.speedMax) / 1000,
    size: rand(2, config.sizeMax),
    opacity: rand(0.06, config.opacityMax),
  }
}

export function createParticles(state: AppState): Particle[] {
  const config = PARTICLE_CONFIG[state]
  return Array.from({ length: config.count }, () => createParticle(config))
}

export function reconcileParticles(current: Particle[], state: AppState): Particle[] {
  const config = PARTICLE_CONFIG[state]
  if (current.length === config.count) return current
  if (current.length < config.count) {
    const toAdd = config.count - current.length
    return [...current, ...Array.from({ length: toAdd }, () => createParticle(config))]
  }
  return current.slice(0, config.count)
}

// Operates on fractional coordinates now — width/height no longer
// needed here at all, which is what makes resize "live": the canvas can
// change size every frame and particles are already in the right place.
export function stepParticle(p: Particle): void {
  p.x += p.vx
  p.y += p.vy
  if (p.x < 0) p.x = 1
  if (p.x > 1) p.x = 0
  if (p.y < 0) p.y = 1
  if (p.y > 1) p.y = 0
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

export function lerpColor(from: string, to: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(from)
  const [r2, g2, b2] = hexToRgb(to)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}