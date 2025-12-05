/**
 * Authentication Types
 * 
 * Central type definitions for the authentication system.
 * Ensures type safety across all auth modules.
 */

/**
 * User object returned from authentication
 */
export interface AuthUser {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  is_email_verified: boolean
  is_phone_verified: boolean
  role: string
  status: string
  is_active: boolean
  avatar?: string | null
  name?: string | null
}

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string // user ID
  email: string
  jti: string // JWT ID for blacklisting
  exp: number // expiration timestamp
  iat: number // issued at timestamp
  type: 'access' | 'refresh'
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean
  payload?: JWTPayload
  error?: 'expired' | 'invalid' | 'blacklisted' | 'malformed'
}

/**
 * Refresh token family data stored in Redis
 */
export interface RefreshTokenFamily {
  currentToken: string
  familyId: string
  userId: string
  createdAt: number
  lastUsed: number
}

/**
 * CSRF token data
 */
export interface CSRFTokenData {
  token: string
  expiresAt: number
}

/**
 * Rate limit data
 */
export interface RateLimitData {
  count: number
  resetAt: number
}

/**
 * Login result type
 */
export type LoginResult = 
  | { type: 'success' }
  | { type: '2fa_required'; userId: string | null; email: string }

/**
 * Auth context type for client-side
 */
export interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  updateUser: (user: AuthUser | null) => void
}

/**
 * Server session result
 */
export interface ServerSession {
  user: AuthUser
  accessToken: string
  expiresAt: number
}

