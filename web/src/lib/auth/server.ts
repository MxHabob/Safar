'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decodeJwt } from 'jose'
import { cache } from 'react'
import type { TokenResponse, GetCurrentUserInfoApiV1UsersMeGetResponse } from '@/generated/schemas'
import { apiClient } from '@/generated/client'
import { sessionStore, generateSessionToken, type SessionData } from './session-store'

/**
 * Cookie names for authentication tokens
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'auth-token',
  REFRESH_TOKEN: 'refresh-token',
  SESSION_TOKEN: 'session-token', // Session token similar to auth.js
} as const

/**
 * Session data structure (similar to auth.js)
 */
export interface ServerSession {
  user: GetCurrentUserInfoApiV1UsersMeGetResponse
  accessToken: string
  sessionToken: string
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
 * Get session token from cookies
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAMES.SESSION_TOKEN)?.value ?? null
}

/**
 * Set session token in cookie
 * This can only be called from Server Actions or Route Handlers
 * Exported for use in actions.ts
 */
export async function setSessionTokenCookie(sessionToken: string, maxAge: number = 30 * 24 * 60 * 60): Promise<void> {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production'
  
  cookieStore.set(COOKIE_NAMES.SESSION_TOKEN, sessionToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
}

/**
 * Clear session token
 */
async function clearSessionToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAMES.SESSION_TOKEN)
}

/**
 * Set authentication tokens in cookies
 * Follows Next.js 16 and OAuth 2026 best practices:
 * - httpOnly cookies for XSS protection
 * - Secure flag in production
 * - SameSite=lax for CSRF protection
 * - Proper expiration handling
 * 
 * @returns Session token if user data was provided, null otherwise
 */
export async function setAuthTokens(
  tokens: TokenResponse,
  user?: GetCurrentUserInfoApiV1UsersMeGetResponse
): Promise<string | null> {
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

  // Create and store session in store (similar to auth.js)
  // Note: Session cookie will be set by Server Actions or Route Handlers when needed
  if (user) {
    const sessionToken = generateSessionToken()
    const decoded = await validateToken(tokens.access_token)
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + expiresIn * 1000
    
    sessionStore.create(
      sessionToken,
      user.id,
      user,
      expiresAt - Date.now()
    )
    
    // Return session token so caller can set the cookie if needed
    return sessionToken
  }
  
  return null
}

/**
 * Clear authentication tokens and session
 */
export async function clearAuthTokens(): Promise<void> {
  const cookieStore = await cookies()
  
  // Delete session from store
  const sessionToken = await getSessionToken()
  if (sessionToken) {
    sessionStore.delete(sessionToken)
  }
  
  // Clear cookies
  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN)
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN)
  await clearSessionToken()
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
 * Fetch user data from API - DISABLED
 * 
 * This function is NO LONGER USED to prevent unnecessary API calls.
 * User data should always be available from:
 * - Login/OAuth/2FA responses (always include user data)
 * - Session store (caches user data after login)
 * 
 * If no session exists, we return null instead of fetching from API.
 */
async function fetchUserFromAPI(): Promise<GetCurrentUserInfoApiV1UsersMeGetResponse | null> {
  // DISABLED: Never fetch from API to prevent /api/v1/users/me calls
  // User data should always be available from session store or login responses
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Auth] fetchUserFromAPI called but disabled - session should exist in store')
  }
  return null
}

/**
 * Get current session from server with caching
 * Uses React Cache and session store (similar to auth.js)
 * 
 * Priority:
 * 1. Check session store FIRST (fast, cached, no API call)
 * 2. Validate JWT token and fetch from API ONLY if session not found
 * 3. Refresh token if expired
 * 
 * IMPORTANT: This function should NOT call /api/v1/users/me if session exists in store
 */
export const getServerSession = cache(async (): Promise<ServerSession | null> => {
  try {
    // PRIORITY 1: Check session store FIRST (this avoids API calls)
    const sessionToken = await getSessionToken()
    if (sessionToken) {
      const storedSession = sessionStore.get(sessionToken)
      if (storedSession) {
        // Session found in store, validate access token
        const accessToken = await getAccessToken()
        if (accessToken) {
          const decoded = await validateToken(accessToken)
          if (decoded) {
            // Both session and token are valid - RETURN IMMEDIATELY (no API call)
            if (process.env.NODE_ENV === 'development') {
              console.log('[Auth] Session found in store, using cached user data (no API call)')
            }
            return {
              user: storedSession.user,
              accessToken,
              sessionToken: storedSession.sessionToken,
              expiresAt: storedSession.expires.getTime(),
            }
          }
          // Token expired but session exists - try to refresh token
          // But keep using session data (don't fetch from API yet)
          const refreshToken = await getRefreshToken()
          if (refreshToken) {
            try {
              const { refreshTokenAction } = await import('./actions')
              await refreshTokenAction()
              // After refresh, return session with updated token
              const newToken = await getAccessToken()
              if (newToken) {
                return {
                  user: storedSession.user, // Use cached user data
                  accessToken: newToken,
                  sessionToken: storedSession.sessionToken,
                  expiresAt: storedSession.expires.getTime(),
                }
              }
            } catch (refreshError) {
              // Refresh failed, but we still have valid session data
              // Return it anyway - token refresh can happen on next request
              return {
                user: storedSession.user,
                accessToken, // May be expired, but better than nothing
                sessionToken: storedSession.sessionToken,
                expiresAt: storedSession.expires.getTime(),
              }
            }
          }
        }
      }
    }

    // PRIORITY 2: No session in store, check JWT token
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
        try {
          const { refreshTokenAction } = await import('./actions')
          await refreshTokenAction()
          // Retry getting token after refresh
          const newToken = await getAccessToken()
          if (newToken) {
            const newDecoded = await validateToken(newToken)
            if (newDecoded) {
              // Check session store again after refresh (may have been created)
              const newSessionToken = await getSessionToken()
              if (newSessionToken) {
                const refreshedSession = sessionStore.get(newSessionToken)
                if (refreshedSession) {
                  return {
                    user: refreshedSession.user,
                    accessToken: newToken,
                    sessionToken: refreshedSession.sessionToken,
                    expiresAt: refreshedSession.expires.getTime(),
                  }
                }
              }
              
              // No session in store after refresh
              // refreshTokenAction should preserve user data from session, so this shouldn't happen
              // If it does, we can't fetch from API - return null and let caller handle it
              if (process.env.NODE_ENV === 'development') {
                console.warn('[Auth] No session after token refresh - session should have been preserved')
              }
              return null
            }
          }
        } catch (refreshError) {
          // Don't call clearAuthTokens here - it can only be called from Server Actions
          // Just return null and let the caller handle it
          return null
        }
      }
      // Don't call clearAuthTokens here - it can only be called from Server Actions
      return null
    }

    // Token is valid, check session store again
    if (sessionToken) {
      const storedSession = sessionStore.get(sessionToken)
      if (storedSession) {
        // Session exists - use it (no API call)
        return {
          user: storedSession.user,
          accessToken,
          sessionToken: storedSession.sessionToken,
          expiresAt: storedSession.expires.getTime(),
        }
      }
    }

    // PRIORITY 3: No session in store and token is valid
    // This should only happen in these rare cases:
    // 1. First request after login (before session cookie is set) - SHOULD NOT HAPPEN if session cookie is set correctly
    // 2. After session expiry but token is still valid
    // 3. Server restart (session store cleared but tokens still in cookies)
    // 
    // IMPORTANT: If session cookie was set correctly after OAuth/login, this should NOT happen
    // The session should be found in PRIORITY 1 above
    // 
    // If we reach here, it means:
    // - Session cookie is missing (not set or expired)
    // - Session store doesn't have the session (in-memory store cleared or different server instance)
    // 
    // We CANNOT fetch user data from API - return null instead
    // The session should have been created during login/OAuth, so this indicates a problem
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Auth] No session found in store - session should have been created during login/OAuth. Returning null to prevent API call.')
    }
    
    // Return null instead of fetching from API
    // This prevents unnecessary /api/v1/users/me calls
    // The session should exist if login/OAuth was successful
    return null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth] Session error:', error)
    }
    // Don't call clearAuthTokens here - it can only be called from Server Actions
    // Just return null and let the caller handle it
    return null
  }
})

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

/**
 * Update session with new user data
 * Useful when user profile is updated
 * This invalidates the React cache to force refresh
 */
export async function updateSession(user: GetCurrentUserInfoApiV1UsersMeGetResponse): Promise<void> {
  const sessionToken = await getSessionToken()
  if (sessionToken) {
    sessionStore.update(sessionToken, { user })
    // Note: React cache will be invalidated on next getServerSession call
    // Client-side cache should be updated via updateUser() in AuthProvider
  }
}

/**
 * Invalidate session cache
 * Call this when user data changes to force refresh
 */
export async function invalidateSessionCache(): Promise<void> {
  // React cache will be cleared on next getServerSession call
  // This is handled automatically by React's cache() function
}

/**
 * Invalidate all sessions for a user
 * Useful for logout from all devices or security events
 */
export async function invalidateUserSessions(userId: string): Promise<number> {
  return sessionStore.deleteAllForUser(userId)
}

/**
 * Get all active sessions for current user
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  return sessionStore.getSessionsForUser(userId)
}

