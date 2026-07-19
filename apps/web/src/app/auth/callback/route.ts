// apps/web/src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/calendar/googleAuth'
import { createClient } from '@supabase/supabase-js'

// Real bug fix: this was using NEXT_PUBLIC_SUPABASE_ANON_KEY with a
// comment claiming it "bypasses RLS deliberately" — it does not. The
// anon key is still subject to every RLS policy; only the service_role
// key actually bypasses RLS. This route runs with zero Supabase user
// session (no cookies, no Authorization header — it's a bare redirect
// hop from Google), so auth.uid() evaluates to NULL for this request.
// The calendar_tokens policy is `FOR ALL USING (auth.uid() = user_id)`,
// and Postgres reuses that same expression as the INSERT check when no
// explicit WITH CHECK is given — so `NULL = user_id` is never true, and
// every single upsert here was being silently rejected by RLS. That
// rejection landed in the catch block below and redirected to
// ?calendar=error with no visible detail — exactly the symptom
// reported ("calendar thing isn't working").
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state')

  if (!code || !userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`)
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // If Google didn't return a refresh_token this time (happens on
    // any consent after the very first, unless you force prompt=consent
    // in buildGoogleAuthUrl), don't let an upsert with refresh_token:
    // undefined null out a previously-stored good one. Preserve
    // whatever's already on the row in that case.
    const { data: existing } = await supabaseAdmin
      .from('calendar_tokens')
      .select('refresh_token')
      .eq('user_id', userId)
      .maybeSingle()

    const { error } = await supabaseAdmin.from('calendar_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? existing?.refresh_token ?? null,
      expires_at: expiresAt,
    })
    if (error) throw error

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=connected`)
  } catch (err) {
    console.error('Calendar OAuth callback failed:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`)
  }
}