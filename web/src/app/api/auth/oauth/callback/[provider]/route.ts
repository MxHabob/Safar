/**
 * OAuth Callback Route
 */

import { NextResponse } from 'next/server'
import { handleOAuthCallback } from '@/lib/auth/oauth/handlers'
import type { OAuthProvider } from '@/lib/auth/oauth/handlers'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/login?error=missing_code_or_state', request.url)
      )
    }

    if (!['google', 'apple', 'facebook', 'github'].includes(provider)) {
      return NextResponse.redirect(
        new URL('/login?error=invalid_provider', request.url)
      )
    }

    // Handle OAuth callback (this will set cookies and create session)
    await handleOAuthCallback(provider as OAuthProvider, code, state)
    
    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error: any) {
    // Handle NEXT_REDIRECT error (this is normal Next.js behavior)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      // Re-throw redirect errors to let Next.js handle them
      throw error
    }
    
    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'oauth_failed'
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}

