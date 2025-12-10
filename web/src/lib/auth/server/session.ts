/**
 * Server Session Management
 * 
 * High-performance session handling for Next.js 16.0.7
 * Uses React cache for optimal performance
 */

'use server'

import { cache } from 'react'
import { getAccessToken, getRefreshToken, getSessionId, validateToken } from '../core/token-manager'
import { sessionStore } from '../core/session-store'
import type { GetCurrentUserInfoApiV1UsersMeGetResponse } from '@/generated/schemas'

export interface ServerSession {
  user: GetCurrentUserInfoApiV1UsersMeGetResponse
  sessionId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

/**
 * Get current server session (cached)
 * 
 * Priority:
 * 1. Session store (fastest, no API call)
 * 2. Token validation (if session not found)
 * 
 * Uses React cache() for automatic deduplication
 */
export const getServerSession = cache(async (): Promise<ServerSession | null> => {
  try {
    // Priority 1: Check session store
    const sessionId = await getSessionId()
    if (sessionId) {
      const storedSession = sessionStore.get(sessionId)
      if (storedSession) {
        const accessToken = await getAccessToken()
        if (accessToken) {
          const validation = validateToken(accessToken)
          if (validation.valid) {
            // Session and token are valid - return immediately
            return {
              user: storedSession.user,
              sessionId: storedSession.sessionId,
              accessToken: storedSession.accessToken,
              refreshToken: storedSession.refreshToken,
              expiresAt: storedSession.expiresAt,
            }
          }
        }
      }
    }

    // Priority 2: Validate tokens
    const accessToken = await getAccessToken()
    const refreshToken = await getRefreshToken()
    
    if (!accessToken || !refreshToken) {
      return null
    }

    const validation = validateToken(accessToken)
    if (!validation.valid) {
      return null
    }

    // Token is valid but no session in store
    // This shouldn't happen if login was successful
    // Return null to force re-authentication
    return null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth] Session error:', error)
    }
    return null
  }
})

/**
 * Get current user (convenience function)
 */
export async function getCurrentUser(): Promise<GetCurrentUserInfoApiV1UsersMeGetResponse | null> {
  const session = await getServerSession()
  return session?.user ?? null
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession()
  return session !== null
}

/**
 * Require authentication (throws or redirects if not authenticated)
 */
export async function requireAuth(): Promise<ServerSession> {
  const session = await getServerSession()
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  return session
}

/**
 * Update session with new user data
 */
export async function updateSession(
  sessionId: string,
  updates: {
    user?: GetCurrentUserInfoApiV1UsersMeGetResponse
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
): Promise<void> {
  sessionStore.update(sessionId, updates)
}

