// apps/web/src/hooks/usePrefersReducedMotion.ts
import { useEffect, useState } from 'react'

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)
    function handler(e: MediaQueryListEvent) {
      setReduced(e.matches)
    }
    query.addEventListener('change', handler)
    return () => query.removeEventListener('change', handler)
  }, [])

  return reduced
}