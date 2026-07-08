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

  const anchors = useAnchorStore((s) => s.anchors)
  const loadAnchorsLocal = useAnchorStore((s) => s.loadFromLocal)
  const syncAnchorsRemote = useAnchorStore((s) => s.syncFromRemote)

  useEffect(() => {
    void loadFromLocal()
    void loadAnchorsLocal()
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

  return { tasks, anchors, loaded, addTask, updateTask, setStatus, anchorFor, tasksByStatus }
}