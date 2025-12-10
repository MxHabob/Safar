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
    const cookieSessionId = await getSessionId()
    if (cookieSessionId) {
      const storedSession = sessionStore.get(cookieSessionId)
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

    // Token is valid but no session in store.
    // Fallback: hydrate a minimal session from JWT claims (stateless strategy).
    // Treat JWT payload as loose claims to allow optional profile fields
    const claims = (validation.payload ?? {}) as Record<string, any>
    const sessionIdFromCookie = await getSessionId()
    const fallbackSessionId = sessionIdFromCookie || claims.session_id || crypto.randomUUID()
    const expMs = claims.exp ? claims.exp * 1000 : Date.now() + 15 * 60 * 1000

    const user = {
      id: claims.sub ?? '',
      first_name: claims.first_name ?? '',
      last_name: claims.last_name ?? '',
      avatar_url: claims.avatar_url ?? '',
      email: claims.email ?? '',
      role: claims.role ?? 'guest',
      is_email_verified: claims.mfa_verified ?? false,
      is_phone_verified: false,
      is_active: true,
      status: 'active',
      locale: 'en',
      language: 'en',
      currency: 'USD',
      created_at: new Date().toISOString(),
    } as any

    const session = sessionStore.create({
      sessionId: fallbackSessionId,
      userId: user.id,
      user,
      accessToken,
      refreshToken,
      expiresAt: expMs,
    })

    return {
      user: session.user,
      sessionId: session.sessionId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    }
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
    throw new Error('Unauthorized')
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

