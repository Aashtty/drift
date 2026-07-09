// apps/web/src/app/api/auth/google/route.ts
import { NextResponse } from 'next/server'
import { buildGoogleAuthUrl } from '@/lib/calendar/googleAuth'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'missing userId' }, { status: 400 })

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  const url = buildGoogleAuthUrl(redirectUri, userId) // userId passed as `state`, verified on callback
  return NextResponse.redirect(url)
}