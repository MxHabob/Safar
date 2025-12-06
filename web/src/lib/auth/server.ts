'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { decodeJwt } from 'jose'
import type { TokenResponse, GetCurrentUserInfoApiV1UsersMeGetResponse } from '@/generated/schemas'
import { apiClient } from '@/generated/client'

/**
 * Cookie names for authentication tokens
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
} as const

/**
 * Session data structure
 */
export interface ServerSession {
  user: GetCurrentUserInfoApiV1UsersMeGetResponse
  accessToken: string
  expiresAt: number
}

/**
 * Decoded JWT token structure
 */
interface DecodedToken {
  sub?: string
  exp?: number
  iat?: number
  [key: string]: unknown
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
 * Set authentication tokens in cookies
 * Follows Next.js 16 and OAuth 2026 best practices:
 * - httpOnly cookies for XSS protection
 * - Secure flag in production
 * - SameSite=lax for CSRF protection
 * - Proper expiration handling
 */
export async function setAuthTokens(tokens: TokenResponse): Promise<void> {
  const cookieStore = await cookies()
  const expiresIn = tokens.expires_in || 1800 // Default 30 minutes
  const isProduction = process.env.NODE_ENV === 'production'
  
  // Set access token (short-lived, httpOnly for security)
  // Next.js 16: cookies() API handles async properly
  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax', // CSRF protection while allowing OAuth redirects
    maxAge: expiresIn,
    path: '/',
    // Partition cookies for better security (if supported)
    ...(isProduction && { partitioned: false }), // Set to true when browser support is better
  })

  // Set refresh token (long-lived, httpOnly for security)
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    ...(isProduction && { partitioned: false }),
  })
}

/**
 * Clear authentication tokens
 */
export async function clearAuthTokens(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN)
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN)
}

/**
 * Validate and decode JWT token
 */
async function validateToken(token: string): Promise<DecodedToken | null> {
  try {
    const decoded = decodeJwt<DecodedToken>(token)
    
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Get current session from server
 * Validates token and fetches user data
 * Next.js 16: Uses async cookies() API and proper error handling
 */
export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const accessToken = await getAccessToken()
    
    if (!accessToken) {
      return null
    }

    // Validate token structure and expiration
    const decoded = await validateToken(accessToken)
    if (!decoded) {
      // Token is invalid or expired, try to refresh
      const refreshToken = await getRefreshToken()
      if (refreshToken) {
        // Attempt automatic token refresh
        try {
          const { refreshTokenAction } = await import('./actions')
          await refreshTokenAction()
          // Retry getting token after refresh
          const newToken = await getAccessToken()
          if (newToken) {
            const newDecoded = await validateToken(newToken)
            if (newDecoded) {
              // Fetch user with new token using API client directly (avoid circular dependency)
              try {
                const response = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
                  config: {
                    timeout: 10000,
                    retries: 1,
                  }
                })
                if (response.data) {
                  return {
                    user: response.data as GetCurrentUserInfoApiV1UsersMeGetResponse,
                    accessToken: newToken,
                    expiresAt: newDecoded.exp ? newDecoded.exp * 1000 : Date.now() + 1800000,
                  }
                }
              } catch (error) {
                // API call failed, clear tokens
                await clearAuthTokens()
                return null
              }
            }
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens
          await clearAuthTokens()
          return null
        }
      } else {
        // No refresh token, clear access token
        await clearAuthTokens()
        return null
      }
      return null
    }

    // Token is valid, fetch user data using API client directly (avoid circular dependency)
    // Using API client instead of Server Action prevents infinite loop when action requires auth
    let user: GetCurrentUserInfoApiV1UsersMeGetResponse
    try {
      const response = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
        config: {
          timeout: 10000,
          retries: 1,
        }
      })
      
      if (!response.data) {
        await clearAuthTokens()
        return null
      }
      
      user = response.data as GetCurrentUserInfoApiV1UsersMeGetResponse
    } catch (error) {
      // API call failed, clear tokens and return null
      if (process.env.NODE_ENV === 'development') {
        console.error('[Auth] Failed to fetch user data:', error)
      }
      await clearAuthTokens()
      return null
    }

    return {
      user,
      accessToken,
      expiresAt: decoded.exp ? decoded.exp * 1000 : Date.now() + 1800000, // 30 min default
    }
  } catch (error) {
    // If there's an error, clear tokens and return null
    // Next.js 16: Proper error handling without exposing sensitive info
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth] Session error:', error)
    }
    await clearAuthTokens()
    return null
  }
}

/**
 * Require authentication - throws error or redirects if not authenticated
 */
export async function requireAuth(): Promise<ServerSession> {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }
  
  return session
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession()
  return session !== null
}

/**
 * Get current user (for use in server actions)
 */
export async function getCurrentUser(): Promise<GetCurrentUserInfoApiV1UsersMeGetResponse | null> {
  const session = await getServerSession()
  return session?.user ?? null
}

