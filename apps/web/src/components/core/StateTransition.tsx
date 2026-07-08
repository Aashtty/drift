// apps/web/src/components/core/StateTransition.tsx
'use client'

import { useEffect } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { applyState } from '@/lib/utils/stateColors'

/**
 * Mounted once at the root. Applies the current AppState's colors to the
 * document root as CSS custom properties any time the state changes.
 * Renders nothing itself.
 */
export function StateTransition() {
  const { state } = useAppState()

  useEffect(() => {
    applyState(state)
  }, [state])

  return null
}