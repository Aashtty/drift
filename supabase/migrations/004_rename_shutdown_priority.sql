-- supabase/migrations/004_rename_shutdown_priority.sql
-- Renames shutdowns.anchor_task_id -> shutdowns.priority_task_id.
-- Purely a naming fix: this column was never related to the Anchor
-- (task category/tag) feature — it stores which task was chosen as
-- tomorrow's single most important thing during the Shutdown Ritual.
-- Sharing the word "anchor" with the unrelated Anchor tagging system
-- was confusing in both the UI and the schema. No data or behavior
-- change, only the column name.
ALTER TABLE shutdowns RENAME COLUMN anchor_task_id TO priority_task_id;