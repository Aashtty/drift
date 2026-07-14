// apps/web/src/components/core/FocusPathWidget.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useAppState } from '@/hooks/useAppState'
import { STATE_META, nextStatesFrom } from '@/lib/utils/sessionStateMachine'
import type { AppState } from '@/types/appState'

function PillChip({
  state,
  current,
  reachable,
  onClick,
}: {
  state: AppState
  current: boolean
  reachable: boolean
  onClick?: () => void
}) {
  const meta = STATE_META[state]
  const clickable = reachable && !current

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={clickable ? onClick : undefined}
      title={current ? meta.description : clickable ? `Click to start — ${meta.description.toLowerCase()}` : meta.howReached}
      data-testid={`focus-path-${state.toLowerCase()}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 'var(--radius-full)',
        border: `1px solid ${current ? meta.colorVar : 'var(--border)'}`,
        background: current ? 'var(--surface-active)' : 'var(--surface)',
        color: current ? meta.colorVar : clickable ? 'var(--text-secondary)' : 'var(--text-tertiary)',
        opacity: !current && !clickable ? 0.45 : 1,
        fontSize: 12, cursor: clickable ? 'pointer' : 'default',
        boxShadow: current ? `0 0 10px -2px ${meta.colorVar}` : 'none',
        transition: 'opacity 150ms var(--ease-out-expo)',
        flexShrink: 0,
      }}
    >
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: current || clickable ? meta.colorVar : 'var(--text-tertiary)', flexShrink: 0 }} />
      {meta.label}
    </button>
  )
}

function Connector() {
  return <span aria-hidden="true" style={{ color: 'var(--text-tertiary)', fontSize: 12, flexShrink: 0 }}>→</span>
}

function LoopBack() {
  return <span className="text-micro-mono" style={{ opacity: 0.4, marginLeft: 2, flexShrink: 0 }}>↺ idle</span>
}

/**
 * A guarded, honest alternative to a free 5-state picker. The dev-only
 * DevStateSwitcher (bottom-right pills in dev builds) lets any state be
 * force-set for debugging — exposing that same freedom to real users
 * would defeat the entire point of a guarded state machine. Instead:
 * this draws the actual graph as two small loops (the main focus loop,
 * and the shutdown loop, since SHUTDOWN branches off IDLE rather than
 * sitting after DRIFT in a single line), highlights where you actually
 * are, and only makes the states that are legitimately reachable RIGHT
 * NOW clickable. Locked states explain how they're really reached on
 * hover instead of just looking greyed out for no stated reason.
 *
 * On the dashboard specifically, current state is always IDLE (the page
 * forces it on mount — see app/page.tsx), so in practice this renders
 * as: IDLE highlighted, FOCUS and SHUTDOWN clickable, FLOW/DRIFT locked.
 * That's not a limitation of the widget — it's an accurate reflection of
 * "these are your two real options from here."
 */
export function FocusPathWidget() {
  const router = useRouter()
  const { state } = useAppState()
  const reachable = nextStatesFrom(state)

  function handlePillClick(target: AppState) {
    if (target === 'FOCUS') router.push('/now')
    else if (target === 'SHUTDOWN') router.push('/shutdown')
  }

  return (
    <div className="glass" style={{ padding: 18 }} data-testid="focus-path-widget">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <p className="text-section-label" style={{ letterSpacing: '0.08em' }}>FOCUS PATH</p>
        <p className="text-meta" style={{ fontSize: 11.5, margin: 0 }}>{STATE_META[state].description}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PillChip state="IDLE" current={state === 'IDLE'} reachable={reachable.includes('IDLE')} onClick={() => handlePillClick('IDLE')} />
          <Connector />
          <PillChip state="FOCUS" current={state === 'FOCUS'} reachable={reachable.includes('FOCUS')} onClick={() => handlePillClick('FOCUS')} />
          <Connector />
          <PillChip state="FLOW" current={state === 'FLOW'} reachable={reachable.includes('FLOW')} onClick={() => handlePillClick('FLOW')} />
          <Connector />
          <PillChip state="DRIFT" current={state === 'DRIFT'} reachable={reachable.includes('DRIFT')} onClick={() => handlePillClick('DRIFT')} />
          <LoopBack />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PillChip state="IDLE" current={state === 'IDLE'} reachable={reachable.includes('IDLE')} onClick={() => handlePillClick('IDLE')} />
          <Connector />
          <PillChip state="SHUTDOWN" current={state === 'SHUTDOWN'} reachable={reachable.includes('SHUTDOWN')} onClick={() => handlePillClick('SHUTDOWN')} />
          <LoopBack />
        </div>
      </div>
    </div>
  )
}