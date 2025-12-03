/**
 * API Route: Clear Refresh Token
 * 
 * Removes refresh token from httpOnly cookie.
 * Requires CSRF token for state-changing operation.
 * 
 * @security CSRF protection for logout operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyCSRFToken, clearCSRFCookie } from '@/lib/auth/csrf'

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

    // Clear refresh token cookie
    cookieStore.delete('refresh_token')

    // Clear CSRF token cookie
    clearCSRFCookie(cookieStore)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
