import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    // New — this was the actual missing piece. Its absence (or the
    // callback route using the wrong key instead of this one) is what
    // caused every calendar connection attempt to silently fail RLS.
    supabaseServiceRoleKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    // New — if this is missing/wrong, every redirect URI built for the
    // Google OAuth flow (both the initial auth request and the
    // registered callback) breaks silently, since it's interpolated
    // directly into a URL string with no runtime validation anywhere.
    appUrlPresent: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    appUrlValue: process.env.NEXT_PUBLIC_APP_URL ?? null,
    geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY),
    googleClientIdPresent: Boolean(process.env.GOOGLE_CLIENT_ID),
    googleClientSecretPresent: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  })
}