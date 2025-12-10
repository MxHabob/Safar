/**
 * Authentication Module Exports
 * 
 * Centralized exports for authentication functionality
 */

// Server-side exports
export {
  getServerSession,
  getCurrentUser,
  isAuthenticated,
  requireAuth,
} from './server/session'

export {
  loginAction,
  registerAction,
  verify2FAAction,
  refreshTokenAction,
  logoutAction,
  logoutAllAction,
} from './server/actions'

// Client-side exports
export { useAuth, AuthProvider } from './client/provider'

// OAuth exports
export {
  initiateOAuth,
  handleOAuthCallback,
  type OAuthProvider,
} from './oauth/handlers'

// Token management
export {
  getAccessToken,
  getRefreshToken,
  getSessionId,
  setTokens,
  clearTokens,
} from './core/token-manager'
export {
  validateToken,
  isTokenExpiringSoon,
} from './core/token-utils'

// Types
export type { ServerSession } from './server/session'
export type { SessionData } from './core/session-store'

