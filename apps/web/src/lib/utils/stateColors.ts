// apps/web/src/lib/utils/stateColors.ts
import type { AppState } from '@/types/appState'

interface StateColorSet {
  bg: string
  accent: string
  accentB: string
  textPrimary: string
}

export const STATE_COLORS: Record<AppState, StateColorSet> = {
  IDLE: { bg: '#0a0a1a', accent: '#6655CC', accentB: '#6655CC', textPrimary: '#c8c8e8' },
  FOCUS: { bg: '#060f0e', accent: '#00e5cc', accentB: '#00e5cc', textPrimary: '#b8f0ea' },
  FLOW: { bg: '#06000f', accent: '#9f55ff', accentB: '#00e5cc', textPrimary: '#e0ccff' },
  DRIFT: { bg: '#100a00', accent: '#f0a500', accentB: '#f0a500', textPrimary: '#f0ddb0' },
  SHUTDOWN: { bg: '#120008', accent: '#ff4488', accentB: '#ff4488', textPrimary: '#f0c0d0' },
}

export function applyState(state: AppState): void {
  const c = STATE_COLORS[state]
  const root = document.documentElement
  root.style.setProperty('--bg', c.bg)
  root.style.setProperty('--accent', c.accent)
  root.style.setProperty('--accent-b', c.accentB)
  root.style.setProperty('--text-primary', c.textPrimary)
}