// apps/web/src/components/tasks/TaskDetailSheet.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { EnergySelector } from './EnergySelector'
import { AnchorBadge } from './AnchorBadge'
import { useUser } from '@/hooks/useUser'
import { fetchSessionsRemote } from '@/lib/db/queries'
import type { Task, EnergyLevel } from '@/types/task'
import type { Anchor } from '@/types/anchor'

interface TaskDetailSheetProps {
  task: Task | null
  anchors: Anchor[]
  isPriority?: boolean
  onClose: () => void
  onRename: (id: string, name: string) => void
  onSetAnchor: (id: string, anchorId: string | null) => void
  onSetEnergy: (id: string, level: EnergyLevel) => void
  onStart: (task: Task) => void
  onMarkDone: (task: Task) => void
  onSendToLimbo: (task: Task) => void
  onArchive: (task: Task) => void
  onRestore: (task: Task) => void
  onDelete: (task: Task) => void
}

const STATS_LOOKBACK_DAYS = 3650

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function PlayIcon() { return (<svg width="13" height="13" viewBox="0 0 14 16" fill="none"><path d="M2.5 1.8v12.4a1 1 0 0 0 1.5.87l10.5-6.2a1 1 0 0 0 0-1.74L4 .93a1 1 0 0 0-1.5.87Z" fill="currentColor" /></svg>) }
function CheckIcon() { return (<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>) }
function ClockIcon() { return (<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5.5V8.5L10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 1.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>) }
function ArchiveIcon() { return (<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="3" rx="1" stroke="currentColor" strokeWidth="1.3" /><path d="M3 6.5V12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6.5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>) }
function RestoreIcon() { return (<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 1 1.6 3.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M3 11.5V8h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>) }
function BarChartIcon() { return (<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 13V8M8 13V3M13 13V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>) }
function TargetIcon() { return (<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>) }

interface ActionDescriptor { label: string; icon: React.ReactNode; tone: 'accent' | 'success' | 'neutral'; onClick: () => void; testId?: string }

function ActionTile({ label, icon, tone, onClick, testId }: ActionDescriptor) {
  const color = tone === 'accent' ? 'var(--accent)' : tone === 'success' ? 'var(--success)' : 'var(--text-secondary)'
  return (
    <button type="button" onClick={onClick} data-testid={testId} className="glass glass-interactive" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', border: 'none', color, fontSize: 11.5, cursor: 'pointer' }}>
      {icon}
      <span style={{ textAlign: 'center' }}>{label}</span>
    </button>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
      <p className="text-micro-mono" style={{ marginTop: 2 }}>{label}</p>
    </div>
  )
}

export function TaskDetailSheet({
  task, anchors, isPriority = false, onClose, onRename, onSetAnchor, onSetEnergy, onStart, onMarkDone, onSendToLimbo, onArchive, onRestore, onDelete,
}: TaskDetailSheetProps) {
  const { user } = useUser()
  const [draftName, setDraftName] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [stats, setStats] = useState<{ sessionCount: number; totalMinutes: number; lastAt: string | null } | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    if (task) setDraftName(task.name)
    setConfirmingDelete(false)
  }, [task?.id])

  useEffect(() => {
    if (!task || !user) {
      setStats(null)
      return
    }
    let cancelled = false
    setStatsLoading(true)
    fetchSessionsRemote(user.id, STATS_LOOKBACK_DAYS)
      .then((sessions) => {
        if (cancelled) return
        const relevant = sessions.filter((s) => s.task_id === task.id)
        const totalSeconds = relevant.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
        setStats({ sessionCount: relevant.length, totalMinutes: Math.round(totalSeconds / 60), lastAt: relevant.length > 0 ? relevant[relevant.length - 1].started_at : null })
      })
      .catch(() => setStats(null))
      .finally(() => { if (!cancelled) setStatsLoading(false) })
    return () => { cancelled = true }
  }, [task?.id, user])

  function commitRename() {
    if (!task) return
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== task.name) onRename(task.id, trimmed)
  }

  const anchor = task ? anchors.find((a) => a.id === task.anchor_id) ?? null : null

  const actions: ActionDescriptor[] = !task
    ? []
    : task.status === 'active'
    ? [
        { label: 'Start Task', icon: <PlayIcon />, tone: 'accent', onClick: () => onStart(task), testId: 'detail-start' },
        { label: 'Mark Done', icon: <CheckIcon />, tone: 'success', onClick: () => onMarkDone(task), testId: 'detail-done' },
        { label: 'Send To Limbo', icon: <ClockIcon />, tone: 'neutral', onClick: () => onSendToLimbo(task), testId: 'detail-limbo' },
        { label: 'Archive', icon: <ArchiveIcon />, tone: 'neutral', onClick: () => onArchive(task), testId: 'detail-archive-active' },
      ]
    : task.status === 'limbo'
    ? [
        { label: 'Restore To Active', icon: <RestoreIcon />, tone: 'accent', onClick: () => onRestore(task), testId: 'detail-restore' },
        { label: 'Archive', icon: <ArchiveIcon />, tone: 'neutral', onClick: () => onArchive(task), testId: 'detail-archive' },
      ]
    : task.status === 'done'
    ? [{ label: 'Reopen Task', icon: <RestoreIcon />, tone: 'accent', onClick: () => onRestore(task), testId: 'detail-reopen' }]
    : [{ label: 'Restore To Active', icon: <RestoreIcon />, tone: 'accent', onClick: () => onRestore(task), testId: 'detail-restore' }]

  return (
    <AnimatePresence>
      {task && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 'var(--z-panel)' as any, background: 'color-mix(in srgb, var(--bg) 45%, transparent)', backdropFilter: 'blur(10px)' }} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 34 }}
            data-testid="task-detail-sheet"
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(400px, 100vw)', zIndex: 'var(--z-panel)' as any, background: 'color-mix(in srgb, var(--bg) 90%, black)', backdropFilter: 'blur(24px) saturate(140%)', borderLeft: '1px solid var(--border-accent)', padding: 24, display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden' }}
            className="scroll-thin"
          >
            <div aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: -80, width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${anchor?.color ?? 'var(--accent)'}, transparent 70%)`, filter: 'blur(80px)', opacity: 0.14, transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 0 }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p className="text-section-label">TASK</p>
                <button type="button" onClick={onClose} aria-label="close" style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: 'none', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 15 }}>x</button>
              </div>

              {isPriority && (
                <div className="glass" data-testid="task-detail-priority-badge" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1px solid var(--accent)', boxShadow: 'var(--glow-accent-sm)' }}>
                  <span style={{ color: 'var(--accent)', display: 'flex' }}><TargetIcon /></span>
                  <span style={{ fontSize: 12, color: 'var(--accent)' }}>Today's priority - chosen last night</span>
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {anchor && <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: anchor.color, boxShadow: `0 0 8px ${anchor.color}`, flexShrink: 0 }} />}
                  <input value={draftName} onChange={(e) => setDraftName(e.target.value)} onBlur={commitRename} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} data-testid="task-detail-name-input" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-accent)', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontSize: 20, padding: '4px 0' }} />
                </div>
                <p className="text-meta" style={{ marginTop: 8, fontSize: 11 }}>
                  created {relativeTime(task.created_at)} - updated {relativeTime(task.updated_at)}
                  {task.aes_score != null && ` - AES ${task.aes_score}`}
                  {task.routine_id && ' - from a routine'}
                </p>
              </div>

              <div className="glass" style={{ padding: '14px 16px' }}>
                <p className="text-section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}><BarChartIcon /> SESSIONS</p>
                {statsLoading && !stats && <p className="text-meta" style={{ fontSize: 12 }}>Loading...</p>}
                {stats && stats.sessionCount === 0 && <p className="text-meta" style={{ fontSize: 12 }}>No focus sessions yet - start this task to begin tracking time.</p>}
                {stats && stats.sessionCount > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <MiniStat label="sessions" value={String(stats.sessionCount)} />
                    <MiniStat label="total time" value={stats.totalMinutes >= 60 ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m` : `${stats.totalMinutes}m`} />
                    <MiniStat label="last worked" value={stats.lastAt ? relativeTime(stats.lastAt) : '-'} />
                  </div>
                )}
              </div>

              <div>
                <p className="text-section-label" style={{ marginBottom: 10 }}>ANCHOR</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <AnchorBadge name="none" color="var(--text-tertiary)" interactive selected={!task.anchor_id} onClick={() => onSetAnchor(task.id, null)} />
                  {anchors.map((a) => (
                    <AnchorBadge key={a.id} name={a.name} color={a.color} interactive selected={task.anchor_id === a.id} onClick={() => onSetAnchor(task.id, a.id)} />
                  ))}
                </div>
                {anchors.length === 0 && <p className="text-meta" style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>No anchors yet - create one from the Tasks toolbar.</p>}
              </div>

              <div>
                <p className="text-section-label" style={{ marginBottom: 10 }}>ENERGY</p>
                <EnergySelector value={task.energy_level ?? 'medium'} onChange={(level) => onSetEnergy(task.id, level)} />
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {actions.map((a) => <ActionTile key={a.label} {...a} />)}
              </div>

              <div>
                {!confirmingDelete ? (
                  <button type="button" data-testid="detail-delete-prompt" onClick={() => setConfirmingDelete(true)} style={{ width: '100%', padding: '10px 0', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)', fontSize: 12.5, cursor: 'pointer' }}>
                    Delete Task
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setConfirmingDelete(false)} style={{ flex: 1, padding: '10px 0', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: 12.5, cursor: 'pointer' }}>Cancel</button>
                    <button type="button" data-testid="detail-delete-confirm" onClick={() => { onDelete(task); onClose() }} style={{ flex: 1, padding: '10px 0', background: 'color-mix(in srgb, var(--danger) 14%, transparent)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: 12.5, cursor: 'pointer' }}>Confirm Delete</button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}