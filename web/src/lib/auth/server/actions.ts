/**
 * Server Actions for Authentication
 * 
 * Next.js 16.0.7 Server Actions with proper error handling
 */

'use server'

import { redirect } from 'next/navigation'
import { setTokens, clearTokens, getRefreshToken, validateToken } from '../core/token-manager'
import { sessionStore } from '../core/session-store'
import type {
  LoginApiV1UsersLoginPostRequest,
  RegisterApiV1UsersRegisterPostRequest,
  Verify2faLoginApiV1UsersLogin2faVerifyPostRequest,
  AuthResponse,
  TokenResponse,
} from '@/generated/schemas'
import {
  loginApiV1UsersLoginPost,
  registerApiV1UsersRegisterPost,
  refreshTokenApiV1UsersRefreshPost,
  logoutApiV1UsersLogoutPost,
  verify2faLoginApiV1UsersLogin2faVerifyPost,
} from '@/generated/actions/users'

/**
 * Login action
 */
export async function loginAction(
  credentials: LoginApiV1UsersLoginPostRequest
): Promise<{ success: boolean; requires2FA?: boolean; error?: string }> {
  try {
    const result = await loginApiV1UsersLoginPost(credentials)

    // Check if 2FA is required (status 202)
    if (!result || typeof result !== 'object') {
      return { success: false, error: 'Invalid response' }
    }

    // Check for 2FA requirement
    if ('requires2FA' in result && result.requires2FA) {
      return { success: false, requires2FA: true }
    }

    // Extract tokens and user data
    const authResponse = result as AuthResponse

    if (!authResponse.access_token || !authResponse.refresh_token) {
      return { success: false, error: 'Invalid response format' }
    }

    // Store session
    const sessionId = (authResponse as any).session_id || crypto.randomUUID()
    const expiresAt = Date.now() + (authResponse.expires_in * 1000)

    sessionStore.create({
      sessionId,
      userId: authResponse.user.id,
      user: authResponse.user,
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      expiresAt,
    })

    // Set tokens in cookies
    await setTokens(
      {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresIn: authResponse.expires_in,
      },
      sessionId
    )

    return { success: true }
  } catch (error: any) {
    // Check for 2FA requirement (status 202)
    if (error?.statusCode === 202 || error?.status === 202) {
      return { success: false, requires2FA: true }
    }

    return {
      success: false,
      error: error?.message || 'Login failed',
    }
  }
}

/**
 * Register action
 */
export async function registerAction(
  data: RegisterApiV1UsersRegisterPostRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    await registerApiV1UsersRegisterPost(data)
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Registration failed',
    }
  }
}

/**
 * Verify 2FA action
 */
export async function verify2FAAction(
  data: Verify2faLoginApiV1UsersLogin2faVerifyPostRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await verify2faLoginApiV1UsersLogin2faVerifyPost(data)

    if (!result || typeof result !== 'object' || !('access_token' in result)) {
      return { success: false, error: 'Invalid response' }
    }

    const authResponse = result as AuthResponse

    // Store session
    const sessionId = (authResponse as any).session_id || crypto.randomUUID()
    const expiresAt = Date.now() + (authResponse.expires_in * 1000)

    sessionStore.create({
      sessionId,
      userId: authResponse.user.id,
      user: authResponse.user,
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      expiresAt,
    })

    // Set tokens
    await setTokens(
      {
        accessToken: authResponse.access_token,
        refreshToken: authResponse.refresh_token,
        expiresIn: authResponse.expires_in,
      },
      sessionId
    )

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || '2FA verification failed',
    }
  }
}

/**
 * Refresh token action
 */
export async function refreshTokenAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' }
    }

    // Validate refresh token
    const validation = validateToken(refreshToken)
    if (!validation.valid) {
      await clearTokens()
      return { success: false, error: 'Invalid refresh token' }
    }

    // Get current session to preserve user data
    const sessionId = await import('../core/token-manager').then(m => m.getSessionId())
    const currentSession = sessionId ? sessionStore.get(sessionId) : null

    // Call refresh endpoint
    const result = await refreshTokenApiV1UsersRefreshPost({
      refresh_token: refreshToken,
    })

    if (!result || typeof result !== 'object' || !('access_token' in result)) {
      return { success: false, error: 'Invalid response' }
    }

    const tokenResponse = result as TokenResponse

    // Update session if exists
    if (currentSession && sessionId) {
      const expiresAt = Date.now() + (tokenResponse.expires_in * 1000)
      sessionStore.update(sessionId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt,
      })
    }

    // Update tokens
    await setTokens(
      {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresIn: tokenResponse.expires_in,
      },
      sessionId || undefined
    )

    return { success: true }
  } catch (error: any) {
    await clearTokens()
    return {
      success: false,
      error: error?.message || 'Token refresh failed',
    }
  }
}

/**
 * Logout action
 */
export async function logoutAction(): Promise<void> {
  try {
    // Get session ID
    const sessionId = await import('../core/token-manager').then(m => m.getSessionId())
    
    // Call backend logout
    try {
      await logoutApiV1UsersLogoutPost()
    } catch (error) {
      // Continue even if backend logout fails
      if (process.env.NODE_ENV === 'development') {
        console.error('Backend logout failed:', error)
      }
    }

    // Delete session from store
    if (sessionId) {
      sessionStore.delete(sessionId)
    }

    // Clear tokens
    await clearTokens()

    // Redirect to login
    redirect('/login')
  } catch (error) {
    // Clear tokens even if there's an error
    await clearTokens()
    throw error
  }
}

/**
 * Logout from all devices
 */
export async function logoutAllAction(): Promise<void> {
  try {
    const session = await import('./session').then(m => m.getServerSession())
    
    if (session) {
      // Delete all sessions for user (except current)
      sessionStore.deleteAllForUser(session.user.id, session.sessionId)
      
      // Call backend logout-all
      try {
        const { logoutAllApiV1UsersLogoutAllPost } = await import('@/generated/actions/users')
        await logoutAllApiV1UsersLogoutAllPost()
      } catch (error) {
        // Continue even if backend fails
      }
    }

    // Clear tokens
    await clearTokens()

    // Redirect to login
    redirect('/login')
  } catch (error) {
    await clearTokens()
    throw error
  }
}

/**
 * Set tokens (wrapper for client-side use)
 */
export async function setTokensAction(
  tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  sessionId?: string
): Promise<void> {
  await setTokens(tokens, sessionId)
}

/**
 * Clear tokens (wrapper for client-side use)
 */
export async function clearTokensAction(): Promise<void> {
  await clearTokens()
}

/**
 * Get refresh token (wrapper for client-side use)
 */
export async function getRefreshTokenAction(): Promise<string | null> {
  return await getRefreshToken()
}

/**
 * Get session ID (wrapper for client-side use)
 */
export async function getSessionIdAction(): Promise<string | null> {
  const { getSessionId } = await import('../core/token-manager')
  return await getSessionId()
}

/**
 * Validate token (wrapper for client-side use)
 */
export async function validateTokenAction(token: string): Promise<{ valid: boolean; payload?: any }> {
  return validateToken(token)
}

