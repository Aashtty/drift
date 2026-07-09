-- supabase/migrations/002_calendar.sql
CREATE TABLE calendar_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE calendar_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their calendar tokens" ON calendar_tokens
  FOR ALL USING (auth.uid() = user_id);