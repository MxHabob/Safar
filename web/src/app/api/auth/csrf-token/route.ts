/**
 * API Route: Get CSRF Token
 * 
 * Returns CSRF token for client-side use.
 * Token is also stored in httpOnly cookie for verification.
 * 
 * @security Implements Double Submit Cookie Pattern for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateCSRFToken, setCSRFCookie } from '@/lib/auth/csrf'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    // Generate new CSRF token
    const csrfToken = generateCSRFToken()

    // Set in httpOnly cookie
    setCSRFCookie(csrfToken, cookieStore)

    // Return in response body (for client-side use)
    return NextResponse.json({ csrfToken })
  } catch (error) {
    console.error('CSRF token generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

