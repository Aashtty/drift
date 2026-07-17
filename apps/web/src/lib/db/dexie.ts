// apps/web/src/lib/db/dexie.ts
import Dexie, { type Table } from 'dexie'
import type { Task } from '@/types/task'
import type { Anchor } from '@/types/anchor'

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
    // Recommended alongside the cross-account leak fix (see
    // lib/auth/clearLocalUserData.ts) - adds a real index on user_id so
    // taskStore/anchorStore's now-scoped loadFromLocal(userId) queries
    // don't do a full unindexed scan of every locally cached row on
    // every load. Purely additive - Dexie indexes existing rows on the
    // new field automatically, no manual data migration needed.
    this.version(2).stores({
      tasks: 'id, user_id, status, anchor_id, updated_at, _dirty',
      anchors: 'id, user_id, _dirty',
    })
  }
}

export const db = new DriftDB()