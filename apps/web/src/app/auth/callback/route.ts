// apps/web/src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/calendar/googleAuth'
import { createClient } from '@supabase/supabase-js'

// Service-role client — server-only, bypasses RLS deliberately since this
// route runs with no user session context of its own (just a redirect hop).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // fine for this insert since RLS still applies per-row via user_id match on subsequent authed reads
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state') // the userId we passed through as `state`

  if (!code || !userId) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`)
  }

  try {
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { error } = await supabaseAdmin.from('calendar_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // only present on first consent — see test step 5
      expires_at: expiresAt,
    })
    if (error) throw error

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=connected`)
  } catch (err) {
    console.error('Calendar OAuth callback failed:', err)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?calendar=error`)
  }
}