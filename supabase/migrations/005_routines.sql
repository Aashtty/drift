-- supabase/migrations/005_routines.sql
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'weekly', 'monthly')),
  weekdays INT[] DEFAULT '{}',
  day_of_month INT,
  anchor_id UUID REFERENCES anchors ON DELETE SET NULL,
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  active BOOLEAN DEFAULT TRUE,
  last_generated_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their routines" ON routines
  FOR ALL USING (auth.uid() = user_id);

-- Links a generated task back to the routine that created it.
ALTER TABLE tasks ADD COLUMN routine_id UUID REFERENCES routines ON DELETE SET NULL;