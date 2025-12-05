/**
 * Authentication Library - Main Exports
 * 
 * Central export point for all authentication functionality.
 */

// Server-side utilities
export {
  getServerSession,
  validateToken,
  extractAccessToken,
} from './server'

// Client-side hooks
export { useAuth, useLogin, useLogout } from './client'

// CSRF utilities
export {
  generateCSRFToken,
  setCSRFCookie,
  getCSRFCookie,
  verifyCSRFToken,
  clearCSRFCookie,
  CSRF_HEADER,
} from './csrf'

// Refresh queue utilities
export {
  queueRefresh,
  queueRetry,
  clearRetryQueue,
} from './refresh-queue'

// Rate limiter utilities
export {
  checkRateLimit,
  resetRateLimit,
  getRateLimitConfig,
} from './rate-limiter'

// Types
export type {
  AuthUser,
  JWTPayload,
  TokenValidationResult,
  RefreshTokenFamily,
  CSRFTokenData,
  RateLimitData,
  AuthContextType,
  ServerSession,
} from './types'

// Token storage (for backward compatibility)
export { tokenStorage } from './token-storage'

// Session provider utilities
export { SessionProvider } from '../providers/auth-provider'
export { getSession, requireAuth, isAuthenticated } from './session-provider'