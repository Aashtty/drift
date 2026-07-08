// apps/web/src/lib/particles/particleSystem.ts
import type { AppState } from '@/types/appState'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
}

interface ParticleConfig {
  count: number
  opacityMax: number
  speedMax: number
  sizeMax: number
}

export const PARTICLE_CONFIG: Record<AppState, ParticleConfig> = {
  IDLE: { count: 40, opacityMax: 0.04, speedMax: 0.15, sizeMax: 4 },
  FOCUS: { count: 50, opacityMax: 0.06, speedMax: 0.20, sizeMax: 4 },
  FLOW: { count: 60, opacityMax: 0.08, speedMax: 0.25, sizeMax: 5 },
  DRIFT: { count: 30, opacityMax: 0.03, speedMax: 0.10, sizeMax: 3 },
  SHUTDOWN: { count: 20, opacityMax: 0.02, speedMax: 0.08, sizeMax: 3 },
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function createParticle(
  width: number,
  height: number,
  config: ParticleConfig,
  color: string
): Particle {
  return {
    x: rand(0, width),
    y: rand(0, height),
    vx: rand(-config.speedMax, config.speedMax),
    vy: rand(-config.speedMax, config.speedMax),
    size: rand(1.5, config.sizeMax),
    opacity: rand(0.03, config.opacityMax),
    color,
  }
}

export function createParticles(
  width: number,
  height: number,
  state: AppState,
  color: string
): Particle[] {
  const config = PARTICLE_CONFIG[state]
  return Array.from({ length: config.count }, () => createParticle(width, height, config, color))
}

export function stepParticle(p: Particle, width: number, height: number): void {
  p.x += p.vx
  p.y += p.vy
  // wrap off-screen particles to the opposite edge
  if (p.x < 0) p.x = width
  if (p.x > width) p.x = 0
  if (p.y < 0) p.y = height
  if (p.y > height) p.y = 0
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