-- supabase/migrations/001_init.sql
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New Query)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Anchors
CREATE TABLE anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE anchors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their anchors" ON anchors
  FOR ALL USING (auth.uid() = user_id);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  anchor_id UUID REFERENCES anchors ON DELETE SET NULL,
  name TEXT NOT NULL,
  aes_score INT CHECK (aes_score BETWEEN 1 AND 5),
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'done', 'limbo', 'archived')),
  decay_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  task_id UUID REFERENCES tasks ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  base_duration_seconds INT,
  exceeded_base BOOLEAN DEFAULT FALSE,
  flow_detected BOOLEAN DEFAULT FALSE,
  hyperfocus BOOLEAN DEFAULT FALSE,
  state_at_end TEXT CHECK (state_at_end IN ('FOCUS', 'FLOW', 'DRIFT')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their sessions" ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- Shutdown rituals
CREATE TABLE shutdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  completed_task_ids UUID[] DEFAULT '{}',
  carried_task_ids UUID[] DEFAULT '{}',
  anchor_task_id UUID REFERENCES tasks ON DELETE SET NULL,
  notes TEXT
);
ALTER TABLE shutdowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their shutdowns" ON shutdowns
  FOR ALL USING (auth.uid() = user_id);

-- User settings
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  day_start TIME DEFAULT '09:00',
  day_end TIME DEFAULT '19:00',
  base_session_minutes INT DEFAULT 20,
  shutdown_time TIME,
  energy_default TEXT DEFAULT 'medium',
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_volume INT DEFAULT 30,
  fuzzy_time BOOLEAN DEFAULT FALSE,
  distraction_sites TEXT[] DEFAULT ARRAY['twitter.com','x.com','reddit.com','youtube.com','instagram.com'],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();