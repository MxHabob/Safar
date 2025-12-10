/**
 * Session Store - High-performance session management
 * 
 * Features:
 * - In-memory cache with automatic cleanup
 * - Session expiration handling
 * - User session tracking
 * - Optimized for Next.js 16.0.7
 * 
 * Production: Upgrade to Redis for multi-server deployments
 */

import type { GetCurrentUserInfoApiV1UsersMeGetResponse } from '@/generated/schemas'

export interface SessionData {
  sessionId: string
  userId: string
  user: GetCurrentUserInfoApiV1UsersMeGetResponse
  accessToken: string
  refreshToken: string
  expiresAt: number
  createdAt: number
  lastActivity: number
  deviceInfo?: {
    browser?: string
    os?: string
    device?: string
  }
  ipAddress?: string
  userAgent?: string
}

class SessionStore {
  private sessions = new Map<string, SessionData>()
  private userSessions = new Map<string, Set<string>>() // userId -> Set<sessionId>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval (every 5 minutes)
    this.startCleanup()
  }

  /**
   * Create a new session
   */
  create(data: Omit<SessionData, 'createdAt' | 'lastActivity'>): SessionData {
    const now = Date.now()
    const session: SessionData = {
      ...data,
      createdAt: now,
      lastActivity: now,
    }

    this.sessions.set(data.sessionId, session)

    // Track sessions per user
    if (!this.userSessions.has(data.userId)) {
      this.userSessions.set(data.userId, new Set())
    }
    this.userSessions.get(data.userId)!.add(data.sessionId)

    return session
  }

  /**
   * Get session by ID
   */
  get(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return null
    }

    // Check expiration
    if (session.expiresAt < Date.now()) {
      this.delete(sessionId)
      return null
    }

    // Update last activity
    session.lastActivity = Date.now()
    return session
  }

  /**
   * Update session
   */
  update(sessionId: string, updates: Partial<Pick<SessionData, 'user' | 'accessToken' | 'refreshToken' | 'expiresAt'>>): SessionData | null {
    const session = this.sessions.get(sessionId)
    
    if (!session || session.expiresAt < Date.now()) {
      if (session) this.delete(sessionId)
      return null
    }

    Object.assign(session, updates, { lastActivity: Date.now() })
    return session
  }

  /**
   * Delete session
   */
  delete(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    this.sessions.delete(sessionId)

    // Remove from user sessions
    const userSessions = this.userSessions.get(session.userId)
    if (userSessions) {
      userSessions.delete(sessionId)
      if (userSessions.size === 0) {
        this.userSessions.delete(session.userId)
      }
    }

    return true
  }

  /**
   * Delete all sessions for a user
   */
  deleteAllForUser(userId: string, excludeSessionId?: string): number {
    const userSessions = this.userSessions.get(userId)
    if (!userSessions) return 0

    let count = 0
    for (const sessionId of userSessions) {
      if (sessionId !== excludeSessionId) {
        this.sessions.delete(sessionId)
        count++
      }
    }

    if (excludeSessionId && userSessions.has(excludeSessionId)) {
      // Keep only the excluded session
      userSessions.clear()
      userSessions.add(excludeSessionId)
    } else {
      this.userSessions.delete(userId)
    }

    return count
  }

  /**
   * Get all active sessions for a user
   */
  getSessionsForUser(userId: string): SessionData[] {
    const userSessions = this.userSessions.get(userId)
    if (!userSessions) return []

    const sessions: SessionData[] = []
    const now = Date.now()

    for (const sessionId of userSessions) {
      const session = this.sessions.get(sessionId)
      if (session && session.expiresAt >= now) {
        sessions.push(session)
      }
    }

    return sessions
  }

  /**
   * Cleanup expired sessions
   */
  private cleanup(): void {
    const now = Date.now()
    const expired: string[] = []

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        expired.push(sessionId)
      }
    }

    for (const sessionId of expired) {
      this.delete(sessionId)
    }
  }

  /**
   * Start automatic cleanup
   */
  private startCleanup(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000) // Every 5 minutes
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Get session count
   */
  getCount(): number {
    this.cleanup()
    return this.sessions.size
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear()
    this.userSessions.clear()
  }
}

// Singleton instance
export const sessionStore = new SessionStore()

