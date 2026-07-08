
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    geminiKeyPresent: Boolean(process.env.GEMINI_API_KEY),
    googleClientIdPresent: Boolean(process.env.GOOGLE_CLIENT_ID),
    googleClientSecretPresent: Boolean(process.env.GOOGLE_CLIENT_SECRET),
  })
}