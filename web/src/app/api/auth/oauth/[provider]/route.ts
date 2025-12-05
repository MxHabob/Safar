import { NextRequest, NextResponse } from 'next/server'
import { initiateOAuth } from '@/lib/auth/oauth'
import type { OAuthProvider } from '@/lib/auth/oauth'

/**
 * GET /api/auth/oauth/[provider]
 * Initiates OAuth flow with PKCE
 * Next.js 16: Route Handler with proper redirect handling
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  
  if (!['google', 'apple', 'facebook', 'github'].includes(provider)) {
    return NextResponse.json(
      { error: 'Invalid OAuth provider' },
      { status: 400 }
    )
  }
  
  const searchParams = request.nextUrl.searchParams
  const redirectTo = searchParams.get('redirect') || undefined
  
  try {
    // Get OAuth authorization URL
    const authUrl = await initiateOAuth(provider as OAuthProvider, redirectTo)
    
    // Redirect to OAuth provider
    return NextResponse.redirect(authUrl)
  } catch (error) {
    // On error, redirect to login with error message
    const errorMessage = error instanceof Error ? error.message : 'OAuth initiation failed'
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('error', encodeURIComponent(errorMessage))
    return NextResponse.redirect(loginUrl)
  }
}

