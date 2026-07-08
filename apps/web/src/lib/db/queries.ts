// apps/web/src/lib/db/queries.ts
import { supabase } from './supabase'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'

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