// apps/web/src/lib/db/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Explicit rather than relying on the (already-true) default -
    // this is what lets the /reset-password page pick up the recovery
    // token from the email link's URL automatically.
    detectSessionInUrl: true,
  },
})