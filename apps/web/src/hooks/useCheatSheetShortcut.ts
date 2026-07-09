// apps/web/src/hooks/useCheatSheetShortcut.ts
import { useEffect, useState } from 'react'

export function useCheatSheetShortcut() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping = ['INPUT', 'TEXTAREA'].includes(target.tagName)
      if (isTyping) return

      if (e.key === '?') {
        e.preventDefault()
        setOpen((prev) => !prev)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return { open, setOpen }
}