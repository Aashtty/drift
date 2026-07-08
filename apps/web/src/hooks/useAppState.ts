// apps/web/src/hooks/useAppState.ts
import { useAppStore } from '@/stores/appStore'
import type { AppState } from '@/types/appState'

export function useAppState(): { state: AppState; setState: (next: AppState) => void } {
  const state = useAppStore((s) => s.state)
  const setState = useAppStore((s) => s.setState)
  return { state, setState }
}