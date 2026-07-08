// apps/web/src/lib/db/dexie.ts
import Dexie, { type Table } from 'dexie'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'

// Local-only bookkeeping fields, never sent to Supabase
export interface LocalTask extends Task {
  _dirty?: boolean
  _deleted?: boolean
}

export interface LocalAnchor extends Anchor {
  _dirty?: boolean
}

class DriftDB extends Dexie {
  tasks!: Table<LocalTask, string>
  anchors!: Table<LocalAnchor, string>

  constructor() {
    super('drift-db')
    this.version(1).stores({
      tasks: 'id, status, anchor_id, updated_at, _dirty',
      anchors: 'id, _dirty',
    })
  }
}

export const db = new DriftDB()