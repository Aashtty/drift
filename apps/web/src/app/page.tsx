// apps/web/src/app/page.tsx
import { GlassPanel } from '@/components/ui/GlassPanel'
import { DevStateSwitcher } from '@/components/core/DevStateSwitcher'

export default function DashboardPage() {
  return (
    <main style={{ padding: 48 }}>
      <GlassPanel chromatic style={{ padding: 24, width: 280 }}>
        <p className="text-section-label">DRIFT</p>
        <p style={{ marginTop: 8 }}>Click a state below — everything recolors.</p>
      </GlassPanel>
      <DevStateSwitcher />
    </main>
  )
}