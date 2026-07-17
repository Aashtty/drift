// apps/web/src/components/core/StateTransition.tsx
'use client'

import { useEffect } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { useTransitionStore } from '@/stores/transitionStore'
import { applyState } from '@/lib/utils/stateColors'

/**
 * Now also writes --ambient-transition-duration onto the document root
 * whenever the Settings-controlled speed changes, so every CSS rule
 * that references that variable (tokens.css's body background
 * transition, ambient.css's blob color transition) picks it up
 * app-wide. applyState(state) itself is untouched — this doesn't need
 * to know what CSS properties that function sets, only that whatever it
 * changes will transition using this duration wherever a rule opts in.
 */
export function StateTransition() {
  const { state } = useAppState()
  const transitionMs = useTransitionStore((s) => s.transitionMs)

  useEffect(() => {
    applyState(state)
  }, [state])

  useEffect(() => {
    document.documentElement.style.setProperty('--ambient-transition-duration', `${transitionMs}ms`)
  }, [transitionMs])

  return null
}