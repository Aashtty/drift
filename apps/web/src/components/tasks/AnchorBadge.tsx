// apps/web/src/components/tasks/AnchorBadge.tsx
interface AnchorBadgeProps {
  name: string
  color: string
}

export function AnchorBadge({ name, color }: AnchorBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {name}
    </span>
  )
}