// apps/web/src/lib/db/queries.ts
import { supabase } from './supabase'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'
import type { FocusSession, SessionEndState } from '@/types/session'
import type { UserSettings } from '@/types/settings'
import type { ManualEvent } from '@/types/calendar'

export async function fetchTasksRemote(userId: string): Promise<Task[]> {
  const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data as Task[]
}

export async function upsertTaskRemote(task: Task): Promise<void> {
  const { _dirty, _deleted, ...cleanTask } = task as Task & { _dirty?: boolean; _deleted?: boolean }
  const { error } = await supabase.from('tasks').upsert(cleanTask)
  if (error) throw error
}

export async function deleteTaskRemote(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function fetchAnchorsRemote(userId: string): Promise<Anchor[]> {
  const { data, error } = await supabase.from('anchors').select('*').eq('user_id', userId).order('created_at', { ascending: true })
  if (error) throw error
  return data as Anchor[]
}

export async function upsertAnchorRemote(anchor: Anchor): Promise<void> {
  const { _dirty, ...cleanAnchor } = anchor as Anchor & { _dirty?: boolean }
  const { error } = await supabase.from('anchors').upsert(cleanAnchor)
  if (error) throw error
}

/**
 * New — anchors had a create path (`addAnchor`) but no way to remove
 * one, anywhere in the app. Needed for the new Anchor Manager UI.
 */
export async function deleteAnchorRemote(id: string): Promise<void> {
  const { error } = await supabase.from('anchors').delete().eq('id', id)
  if (error) throw error
}

interface InsertSessionArgs {
  userId: string; taskId: string | null; startedAt: string; endedAt: string
  durationSeconds: number; baseDurationSeconds: number; exceededBase: boolean
  flowDetected: boolean; hyperfocus: boolean; stateAtEnd: SessionEndState
}
export async function insertSessionRemote(args: InsertSessionArgs): Promise<FocusSession> {
  const { data, error } = await supabase.from('sessions').insert({
    user_id: args.userId, task_id: args.taskId, started_at: args.startedAt, ended_at: args.endedAt,
    duration_seconds: args.durationSeconds, base_duration_seconds: args.baseDurationSeconds,
    exceeded_base: args.exceededBase, flow_detected: args.flowDetected, hyperfocus: args.hyperfocus,
    state_at_end: args.stateAtEnd,
  }).select().single()
  if (error) throw error
  return data as FocusSession
}

export async function fetchSessionsRemote(userId: string, sinceDaysAgo: number): Promise<FocusSession[]> {
  const since = new Date()
  since.setDate(since.getDate() - sinceDaysAgo)
  const { data, error } = await supabase.from('sessions').select('*').eq('user_id', userId).gte('started_at', since.toISOString()).order('started_at', { ascending: true })
  if (error) throw error
  return data as FocusSession[]
}

interface InsertShutdownArgs {
  userId: string; completedTaskIds: string[]; carriedTaskIds: string[]
  anchorTaskId: string | null; notes: string | null
}
export async function insertShutdownRemote(args: InsertShutdownArgs): Promise<void> {
  const { error } = await supabase.from('shutdowns').insert({
    user_id: args.userId, completed_at: new Date().toISOString(),
    completed_task_ids: args.completedTaskIds, carried_task_ids: args.carriedTaskIds,
    anchor_task_id: args.anchorTaskId, notes: args.notes,
  })
  if (error) throw error
}

export async function fetchSettingsRemote(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data as UserSettings | null
}
export async function upsertSettingsRemote(settings: UserSettings): Promise<void> {
  const { error } = await supabase.from('user_settings').upsert(settings)
  if (error) throw error
}

export async function fetchEventsRemote(userId: string): Promise<ManualEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order('start_time', { ascending: true })
  if (error) throw error
  return data as ManualEvent[]
}

export async function insertEventRemote(userId: string, title: string, startTime: string): Promise<ManualEvent> {
  const { data, error } = await supabase
    .from('events')
    .insert({ user_id: userId, title, start_time: startTime })
    .select()
    .single()
  if (error) throw error
  return data as ManualEvent
}

export async function deleteEventRemote(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}