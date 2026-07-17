-- supabase/migrations/006_ambient_transition.sql
ALTER TABLE user_settings ADD COLUMN ambient_transition_seconds INT DEFAULT 30;