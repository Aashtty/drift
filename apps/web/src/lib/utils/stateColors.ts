// apps/web/src/lib/utils/stateColors.ts — only IDLE changes, rest identical
import type { AppState } from '@/types/appState'

interface StateColorSet {
  bg: string
  accent: string
  accentB: string
  textPrimary: string
  ambient1: string
  ambient2: string
  ambient3: string
}

export const STATE_COLORS: Record<AppState, StateColorSet> = {
  IDLE: {
    bg: '#0d0d22',
    accent: '#9977ff',
    accentB: '#7799ff',
    textPrimary: '#e4e2ff',
    ambient1: '#9977ff',
    ambient2: '#5599ff',
    ambient3: '#dd66ff',
  },
  FOCUS: {
    bg: '#060f0e',
    accent: '#00e5cc',
    accentB: '#00e5cc',
    textPrimary: '#b8f0ea',
    ambient1: '#00e5cc',
    ambient2: '#00aaff',
    ambient3: '#33ffbb',
  },
  FLOW: {
    bg: '#06000f',
    accent: '#9f55ff',
    accentB: '#00e5cc',
    textPrimary: '#e0ccff',
    ambient1: '#9f55ff',
    ambient2: '#00e5cc',
    ambient3: '#cc66ff',
  },
  DRIFT: {
    bg: '#100a00',
    accent: '#f0a500',
    accentB: '#f0a500',
    textPrimary: '#f0ddb0',
    ambient1: '#f0a500',
    ambient2: '#ff7a3d',
    ambient3: '#ffcf5c',
  },
  SHUTDOWN: {
    bg: '#120008',
    accent: '#ff4488',
    accentB: '#ff4488',
    textPrimary: '#f0c0d0',
    ambient1: '#ff4488',
    ambient2: '#ff6fa8',
    ambient3: '#cc3366',
  },
}

export function applyState(state: AppState): void {
  const c = STATE_COLORS[state]
  const root = document.documentElement
  root.style.setProperty('--bg', c.bg)
  root.style.setProperty('--accent', c.accent)
  root.style.setProperty('--accent-b', c.accentB)
  root.style.setProperty('--text-primary', c.textPrimary)
  root.style.setProperty('--ambient-1', c.ambient1)
  root.style.setProperty('--ambient-2', c.ambient2)
  root.style.setProperty('--ambient-3', c.ambient3)
}