-- supabase/migrations/003_events.sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their events" ON events
  FOR ALL USING (auth.uid() = user_id);