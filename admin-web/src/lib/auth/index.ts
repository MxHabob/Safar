/**
 * Authentication module exports
 * 
 * Server-side:
 * - getServerSession() - Get current session
 * - requireAuth() - Require authentication (redirects if not)
 * - isAuthenticated() - Check auth status
 * - getCurrentUser() - Get current user
 * 
 * Client-side:
 * - useAuth() - React hook for auth state
 * - AuthProvider - React context provider
 * 
 * Actions:
 * - loginAction() - Login
 * - registerAction() - Register
 * - logoutAction() - Logout
 * - refreshTokenAction() - Refresh token
 * - verify2FAAction() - Verify 2FA
 */

// Server-side exports
export {
  getServerSession,
  requireAuth,
  isAuthenticated,
  getCurrentUser,
  getAccessToken,
  setAuthTokens,
  clearAuthTokens,
} from './server'

// Session provider exports
export { getSession, requireSession } from './session-provider'

// Client-side exports
export { useAuth, AuthProvider } from './client'

// Action exports
export {
  loginAction,
  registerAction,
  logoutAction,
  refreshTokenAction,
  verify2FAAction,
  updateCurrentUserAction,
} from './actions'

// OAuth exports
export {
  initiateOAuth,
  handleOAuthCallback,
  type OAuthProvider,
} from './oauth'

// Types
export type { ServerSession } from './server'

