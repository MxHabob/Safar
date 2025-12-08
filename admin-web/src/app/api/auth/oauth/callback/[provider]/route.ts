import { NextRequest, NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/auth/oauth'
import type { OAuthProvider } from '@/lib/auth/oauth'

/**
 * GET /api/auth/oauth/callback/[provider]
 * Handles OAuth callback with PKCE verification
 * Next.js 16: Route Handler with proper redirect handling
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  
  if (!['google', 'apple', 'facebook', 'github'].includes(provider)) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent('Invalid OAuth provider')}`, request.url)
    )
  }
  
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Handle OAuth provider errors
  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
    )
  }
  
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/auth/login?error=missing_oauth_params', request.url)
    )
  }
  
  try {
    // Handle OAuth callback and get redirect URL
    const redirectTo = await handleOAuthCallback(provider as OAuthProvider, code, state)
    
    // Redirect to intended destination
    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (error) {
    // On error, redirect to login with error message
    const errorMessage = error instanceof Error ? error.message : 'OAuth callback failed'
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}

