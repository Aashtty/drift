// apps/web/src/components/ui/GlassPanel.tsx
import type { ReactNode, CSSProperties } from 'react'

interface GlassPanelProps {
  children: ReactNode
  chromatic?: boolean
  className?: string
  style?: CSSProperties
}

export function GlassPanel({ children, chromatic = false, className = '', style }: GlassPanelProps) {
  const base = chromatic ? 'glass-chromatic' : 'glass'
  return (
    <div className={`${base} ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}