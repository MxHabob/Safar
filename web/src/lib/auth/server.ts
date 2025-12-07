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
 */
async function setSessionToken(sessionToken: string, maxAge: number = 30 * 24 * 60 * 60): Promise<void> {
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
 */
export async function setAuthTokens(
  tokens: TokenResponse,
  user?: GetCurrentUserInfoApiV1UsersMeGetResponse
): Promise<void> {
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

  // Create and store session (similar to auth.js)
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
    
    await setSessionToken(sessionToken, Math.floor((expiresAt - Date.now()) / 1000))
  }
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
 * Fetch user data from API (uncached)
 * This is called only when needed (token refresh or cache miss)
 */
async function fetchUserFromAPI(): Promise<GetCurrentUserInfoApiV1UsersMeGetResponse | null> {
  try {
    const response = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
      config: {
        timeout: 10000,
        retries: 1,
      }
    })
    return response.data as GetCurrentUserInfoApiV1UsersMeGetResponse | null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth] Failed to fetch user data:', error)
    }
    return null
  }
}

/**
 * Get current session from server with caching
 * Uses React Cache and session store (similar to auth.js)
 * 
 * Priority:
 * 1. Check session store (fast, cached)
 * 2. Validate JWT token and fetch from API if needed
 * 3. Refresh token if expired
 */
export const getServerSession = cache(async (): Promise<ServerSession | null> => {
  try {
    // First, try to get session from session store (similar to auth.js)
    const sessionToken = await getSessionToken()
    if (sessionToken) {
      const storedSession = sessionStore.get(sessionToken)
      if (storedSession) {
        // Session found in store, validate access token
        const accessToken = await getAccessToken()
        if (accessToken) {
          const decoded = await validateToken(accessToken)
          if (decoded) {
            // Both session and token are valid
            return {
              user: storedSession.user,
              accessToken,
              sessionToken: storedSession.sessionToken,
              expiresAt: storedSession.expires.getTime(),
            }
          }
        }
      }
    }

    // Fallback to JWT token validation (for backward compatibility)
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
              // Fetch user with new token
              const user = await fetchUserFromAPI()
              if (user) {
                // Create new session in store
                const newSessionToken = generateSessionToken()
                const expiresAt = newDecoded.exp ? newDecoded.exp * 1000 : Date.now() + 1800000
                
                sessionStore.create(
                  newSessionToken,
                  user.id,
                  user,
                  expiresAt - Date.now()
                )
                
                await setSessionToken(newSessionToken, Math.floor((expiresAt - Date.now()) / 1000))
                
                return {
                  user,
                  accessToken: newToken,
                  sessionToken: newSessionToken,
                  expiresAt,
                }
              }
              // API call failed, clear tokens
              await clearAuthTokens()
              return null
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

    // Token is valid, check if we have session or need to fetch user
    if (sessionToken) {
      const storedSession = sessionStore.get(sessionToken)
      if (storedSession) {
        // Update session with fresh token
        return {
          user: storedSession.user,
          accessToken,
          sessionToken: storedSession.sessionToken,
          expiresAt: storedSession.expires.getTime(),
        }
      }
    }

    // Fetch user data from API (only if not in session store)
    const user = await fetchUserFromAPI()
    
    if (!user) {
      await clearAuthTokens()
      return null
    }

    // Create session in store
    const newSessionToken = generateSessionToken()
    const expiresAt = decoded.exp ? decoded.exp * 1000 : Date.now() + 1800000
    
    sessionStore.create(
      newSessionToken,
      user.id,
      user,
      expiresAt - Date.now()
    )
    
    await setSessionToken(newSessionToken, Math.floor((expiresAt - Date.now()) / 1000))

    return {
      user,
      accessToken,
      sessionToken: newSessionToken,
      expiresAt,
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
 */
export async function updateSession(user: GetCurrentUserInfoApiV1UsersMeGetResponse): Promise<void> {
  const sessionToken = await getSessionToken()
  if (sessionToken) {
    sessionStore.update(sessionToken, { user })
  }
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

