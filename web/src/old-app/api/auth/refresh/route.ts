/**
 * API Route: Refresh Access Token
 * 
 * Handles refresh token exchange with token rotation.
 * Implements refresh token rotation and reuse detection.
 * 
 * @security
 * - Validates refresh token from httpOnly cookie
 * - Rotates refresh token on every use
 * - Detects and invalidates token family on reuse
 * - Requires CSRF token for state-changing operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyCSRFToken } from '@/lib/auth/csrf'
import { generateCSRFToken, setCSRFCookie } from '@/lib/auth/csrf'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://safar.mulverse.com'

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

    // Get refresh token from httpOnly cookie
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      )
    }

    // Call backend refresh endpoint
    const response = await fetch(`${API_BASE_URL}/api/v1/users/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: 'no-store',
    })

    const data = await response.json()

    if (!response.ok) {
      // If refresh fails, clear the refresh token cookie
      cookieStore.delete('refresh_token')
      cookieStore.delete('csrf_token')

      return NextResponse.json(
        { error: data.detail || 'Token refresh failed' },
        { status: response.status }
      )
    }

    // Store new refresh token in httpOnly cookie
    if (data.refresh_token) {
      cookieStore.set('refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    // Generate and set new CSRF token (rotate on refresh)
    const newCsrfToken = generateCSRFToken()
    setCSRFCookie(newCsrfToken, cookieStore)

    // Return new access token and CSRF token
    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: data.token_type || 'bearer',
      csrfToken: newCsrfToken, // Return new CSRF token
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
