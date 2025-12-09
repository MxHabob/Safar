/**
 * Session Store - Similar to auth.js session management
 * 
 * This module provides session storage similar to auth.js:
 * - In-memory cache for sessions (can be upgraded to Redis)
 * - Session ID management
 * - Session expiration handling
 * - Session invalidation
 */

import type { GetCurrentUserInfoApiV1UsersMeGetResponse } from '@/generated/schemas'

/**
 * Session data structure (similar to auth.js)
 */
export interface SessionData {
  sessionToken: string
  userId: string
  user: GetCurrentUserInfoApiV1UsersMeGetResponse
  expires: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Session Store Implementation
 * 
 * CURRENT: In-memory session store (works for single server)
 * 
 * PRODUCTION UPGRADE REQUIRED:
 * For production with multiple servers or load balancing, you MUST upgrade to Redis:
 * 
 * 1. Install Redis client: npm install ioredis
 * 2. Create Redis session store adapter
 * 3. Replace this class with Redis-backed implementation
 * 
 * Example Redis implementation:
 * ```typescript
 * import Redis from 'ioredis'
 * const redis = new Redis(process.env.REDIS_URL)
 * 
 * async create(sessionToken, userId, user, maxAge) {
 *   const key = `session:${sessionToken}`
 *   await redis.setex(key, maxAge / 1000, JSON.stringify({...}))
 * }
 * ```
 * 
 * SECURITY NOTE:
 * - Current implementation loses sessions on server restart
 * - Not suitable for multi-server deployments
 * - Upgrade to Redis before production deployment
 */
class SessionStore {
  private sessions: Map<string, SessionData> = new Map()
  private userSessions: Map<string, Set<string>> = new Map() // userId -> Set of sessionTokens

  /**
   * Create a new session
   */
  create(
    sessionToken: string,
    userId: string,
    user: GetCurrentUserInfoApiV1UsersMeGetResponse,
    maxAge: number = 30 * 24 * 60 * 60 * 1000 // 30 days default
  ): SessionData {
    const now = new Date()
    const expires = new Date(now.getTime() + maxAge)

    const session: SessionData = {
      sessionToken,
      userId,
      user,
      expires,
      createdAt: now,
      updatedAt: now,
    }

    this.sessions.set(sessionToken, session)

    // Track sessions per user
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set())
    }
    this.userSessions.get(userId)!.add(sessionToken)

    // Clean up expired sessions
    this.cleanup()

    return session
  }

  /**
   * Get session by token
   */
  get(sessionToken: string): SessionData | null {
    const session = this.sessions.get(sessionToken)

    if (!session) {
      return null
    }

    // Check if session is expired
    if (session.expires < new Date()) {
      this.delete(sessionToken)
      return null
    }

    // Update last accessed time
    session.updatedAt = new Date()
    return session
  }

  /**
   * Update session data
   */
  update(sessionToken: string, updates: Partial<Pick<SessionData, 'user' | 'expires'>>): SessionData | null {
    const session = this.sessions.get(sessionToken)

    if (!session) {
      return null
    }

    if (session.expires < new Date()) {
      this.delete(sessionToken)
      return null
    }

    // Update session
    if (updates.user) {
      session.user = updates.user
    }
    if (updates.expires) {
      session.expires = updates.expires
    }
    session.updatedAt = new Date()

    return session
  }

  /**
   * Delete session
   */
  delete(sessionToken: string): boolean {
    const session = this.sessions.get(sessionToken)
    if (!session) {
      return false
    }

    this.sessions.delete(sessionToken)

    // Remove from user sessions
    const userSessions = this.userSessions.get(session.userId)
    if (userSessions) {
      userSessions.delete(sessionToken)
      if (userSessions.size === 0) {
        this.userSessions.delete(session.userId)
      }
    }

    return true
  }

  /**
   * Delete all sessions for a user
   */
  deleteAllForUser(userId: string): number {
    const userSessions = this.userSessions.get(userId)
    if (!userSessions) {
      return 0
    }

    let count = 0
    for (const sessionToken of userSessions) {
      this.sessions.delete(sessionToken)
      count++
    }

    this.userSessions.delete(userId)
    return count
  }

  /**
   * Get all sessions for a user
   */
  getSessionsForUser(userId: string): SessionData[] {
    const userSessions = this.userSessions.get(userId)
    if (!userSessions) {
      return []
    }

    const sessions: SessionData[] = []
    for (const sessionToken of userSessions) {
      const session = this.sessions.get(sessionToken)
      if (session && session.expires >= new Date()) {
        sessions.push(session)
      }
    }

    return sessions
  }

  /**
   * Clean up expired sessions
   */
  private cleanup(): void {
    const now = new Date()
    const expiredTokens: string[] = []

    for (const [token, session] of this.sessions.entries()) {
      if (session.expires < now) {
        expiredTokens.push(token)
      }
    }

    for (const token of expiredTokens) {
      this.delete(token)
    }
  }

  /**
   * Get session count (for monitoring)
   */
  getCount(): number {
    this.cleanup()
    return this.sessions.size
  }

  /**
   * Clear all sessions (for testing)
   */
  clear(): void {
    this.sessions.clear()
    this.userSessions.clear()
  }
}

// Singleton instance
export const sessionStore = new SessionStore()

/**
 * Generate a secure session token
 * Similar to auth.js session token generation
 */
export function generateSessionToken(): string {
  // Generate a secure random token
  // In production, use crypto.randomBytes or similar
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

