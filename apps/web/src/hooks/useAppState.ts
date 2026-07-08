// apps/web/src/hooks/useAppState.ts
import { useAppStore } from '@/stores/appStore'
import type { AppState } from '@/types/appState'

export function useAppState(): {
  state: AppState
  setState: (next: AppState) => void
  transition: (to: AppState) => void
} {
  const state = useAppStore((s) => s.state)
  const setState = useAppStore((s) => s.setState)
  const transition = useAppStore((s) => s.transition)
  return { state, setState, transition }
}