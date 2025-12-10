/**
 * OAuth Initiation Route
 */

import { NextResponse } from 'next/server'
import { initiateOAuth } from '@/lib/auth/oauth/handlers'
import type { OAuthProvider } from '@/lib/auth/oauth/handlers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const { searchParams } = new URL(request.url)
    const redirectTo = searchParams.get('redirect') || undefined

    if (!['google', 'apple', 'facebook', 'github'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid OAuth provider' },
        { status: 400 }
      )
    }

    const authUrl = await initiateOAuth(provider as OAuthProvider, redirectTo)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    return NextResponse.json(
      { error: 'OAuth initiation failed' },
      { status: 500 }
    )
  }
}

