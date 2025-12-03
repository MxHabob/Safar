/**
 * API Route: Set Refresh Token
 * 
 * Sets refresh token in httpOnly cookie with secure settings.
 * Requires CSRF token for state-changing operation.
 * 
 * @security
 * - httpOnly cookie prevents XSS attacks
 * - Secure flag in production
 * - SameSite=Strict prevents CSRF
 * - CSRF token verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyCSRFToken } from '@/lib/auth/csrf'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Verify CSRF token
    const csrfValid = await verifyCSRFToken(request, cookieStore)
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    const { refresh_token } = await request.json()

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    // Set refresh token in httpOnly cookie with secure settings
    cookieStore.set('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Set refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
