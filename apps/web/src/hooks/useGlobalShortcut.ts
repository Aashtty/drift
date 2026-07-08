// apps/web/src/hooks/useGlobalShortcut.ts
import { useEffect } from 'react'

/**
 * Works two ways:
 *  - Under `pnpm dev` in a plain browser tab: falls back to a window keydown
 *    listener (only fires while the DRIFT tab is focused — good enough for
 *    local testing per the Local-First Workflow rule).
 *  - Under `pnpm tauri dev` / the packaged app: listens for the real
 *    system-wide shortcut event emitted by main.rs via the global-shortcut
 *    plugin, which fires even when DRIFT isn't the focused window.
 */
export function useGlobalShortcut(onTrigger: () => void) {
  useEffect(() => {
    const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

    if (isTauri) {
      let unlisten: (() => void) | undefined
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen('global-shortcut:brain-dump', () => onTrigger()).then((fn) => {
          unlisten = fn
        })
      })
      return () => unlisten?.()
    }

    function handler(e: KeyboardEvent) {
      const modifier = e.metaKey || e.ctrlKey
      if (modifier && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        onTrigger()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTrigger])
}