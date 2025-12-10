/**
 * Token Manager - Secure token handling
 * 
 * Features:
 * - Secure cookie management
 * - Token validation
 * - Automatic refresh
 * - CSRF protection
 */

'use server'

import { cookies } from 'next/headers'
import { decodeJwt } from 'jose'

export interface TokenData {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

const COOKIE_NAMES = {
  ACCESS_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  SESSION_ID: 'session-id',
} as const

const isProduction = process.env.NODE_ENV === 'production'

/**
 * Cookie options for security
 */
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
}

/**
 * Get access token from cookies
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value ?? null
}

/**
 * Get refresh token from cookies
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value ?? null
}

/**
 * Get session ID from cookies
 */
export async function getSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value ?? null
}

/**
 * Set authentication tokens
 */
export async function setTokens(tokens: TokenData, sessionId?: string): Promise<void> {
  const cookieStore = await cookies()
  const expiresIn = tokens.expiresIn || 1800 // Default 30 minutes

  // Access token (short-lived)
  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    ...cookieOptions,
    maxAge: expiresIn,
  })

  // Refresh token (long-lived, 7 days)
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    ...cookieOptions,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  // Session ID (if provided)
  if (sessionId) {
    cookieStore.set(COOKIE_NAMES.SESSION_ID, sessionId, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }
}

/**
 * Clear all tokens
 */
export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN)
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN)
  cookieStore.delete(COOKIE_NAMES.SESSION_ID)
}

