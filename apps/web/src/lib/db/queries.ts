// apps/web/src/lib/db/queries.ts
import { supabase } from './supabase'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'
import type { FocusSession, SessionEndState } from '@/types/session'

export async function fetchTasksRemote(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Task[]
}

export async function upsertTaskRemote(task: Task): Promise<void> {
  const { error } = await supabase.from('tasks').upsert(task)
  if (error) throw error
}

export async function deleteTaskRemote(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

export async function fetchAnchorsRemote(userId: string): Promise<Anchor[]> {
  const { data, error } = await supabase
    .from('anchors')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Anchor[]
}

export async function upsertAnchorRemote(anchor: Anchor): Promise<void> {
  const { error } = await supabase.from('anchors').upsert(anchor)
  if (error) throw error
}

interface InsertSessionArgs {
  userId: string
  taskId: string | null
  startedAt: string
  endedAt: string
  durationSeconds: number
  baseDurationSeconds: number
  exceededBase: boolean
  flowDetected: boolean
  hyperfocus: boolean
  stateAtEnd: SessionEndState
}

export async function insertSessionRemote(args: InsertSessionArgs): Promise<FocusSession> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: args.userId,
      task_id: args.taskId,
      started_at: args.startedAt,
      ended_at: args.endedAt,
      duration_seconds: args.durationSeconds,
      base_duration_seconds: args.baseDurationSeconds,
      exceeded_base: args.exceededBase,
      flow_detected: args.flowDetected,
      hyperfocus: args.hyperfocus,
      state_at_end: args.stateAtEnd,
    })
    .select()
    .single()

  if (error) throw error
  return data as FocusSession
}