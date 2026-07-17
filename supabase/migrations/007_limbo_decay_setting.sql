-- supabase/migrations/007_limbo_decay_setting.sql
ALTER TABLE user_settings ADD COLUMN limbo_decay_days INT DEFAULT 7;