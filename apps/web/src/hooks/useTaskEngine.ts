// apps/web/src/hooks/useTaskEngine.ts
import { useEffect } from 'react'
import { useTaskStore } from '@/stores/taskStore'
import { useAnchorStore } from '@/stores/anchorStore'
import type { Task, TaskStatus } from '@/types/task'

export function useTaskEngine(userId: string) {
  const tasks = useTaskStore((s) => s.tasks)
  const loaded = useTaskStore((s) => s.loaded)
  const loadFromLocal = useTaskStore((s) => s.loadFromLocal)
  const syncFromRemote = useTaskStore((s) => s.syncFromRemote)
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const setStatus = useTaskStore((s) => s.setStatus)
  const removeTask = useTaskStore((s) => s.removeTask)

  const anchors = useAnchorStore((s) => s.anchors)
  const loadAnchorsLocal = useAnchorStore((s) => s.loadFromLocal)
  const syncAnchorsRemote = useAnchorStore((s) => s.syncFromRemote)

  useEffect(() => {
    if (!userId) return
    void loadFromLocal(userId)
    void loadAnchorsLocal(userId)
    void syncFromRemote(userId)
    void syncAnchorsRemote(userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function anchorFor(task: Task) {
    return anchors.find((a) => a.id === task.anchor_id) ?? null
  }

  function tasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status)
  }

  async function markComplete(task: Task) {
    await updateTask(task.id, { status: 'done', completed_at: new Date().toISOString() })
  }

  async function addCompletedTask(userId: string, name: string): Promise<Task> {
    const task: Task = {
      id: crypto.randomUUID(),
      user_id: userId,
      anchor_id: null,
      name,
      aes_score: null,
      energy_level: null,
      status: 'done',
      decay_started_at: null,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await addTask(task)
    return task
  }

  return { tasks, anchors, loaded, addTask, updateTask, setStatus, removeTask, anchorFor, tasksByStatus, markComplete, addCompletedTask }
}