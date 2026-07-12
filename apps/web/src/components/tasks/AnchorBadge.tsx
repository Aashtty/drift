// apps/web/src/components/tasks/AnchorBadge.tsx
interface AnchorBadgeProps {
  name: string
  color: string
  /** Renders as a selectable filter chip — border ring when selected,
   *  clickable. Used by the Tasks page anchor-filter row and the Task
   *  Detail Sheet's anchor picker; plain inline badges (TaskCard) omit
   *  this entirely. */
  interactive?: boolean
  selected?: boolean
  onClick?: () => void
}

export function AnchorBadge({ name, color, interactive = false, selected = false, onClick }: AnchorBadgeProps) {
  const Tag = interactive ? 'button' : 'span'

  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      data-testid="anchor-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: interactive ? (selected ? 'var(--surface-active)' : 'var(--surface)') : 'transparent',
        border: interactive ? `1px solid ${selected ? color : 'var(--border)'}` : 'none',
        borderRadius: interactive ? 'var(--radius-full)' : 0,
        padding: interactive ? '4px 10px' : 0,
        cursor: interactive ? 'pointer' : 'default',
        transition: 'background 150ms var(--ease-out-expo), border-color 150ms var(--ease-out-expo)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: selected ? `0 0 6px ${color}` : 'none',
        }}
      />
      {name}
    </Tag>
  )
}