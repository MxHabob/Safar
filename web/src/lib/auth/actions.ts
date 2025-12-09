'use server'

import { setAuthTokens, clearAuthTokens, getServerSession } from './server'
import { 
  loginApiV1UsersLoginPost,
  refreshTokenApiV1UsersRefreshPost,
  logoutApiV1UsersLogoutPost,
  registerApiV1UsersRegisterPost,
  verify2faLoginApiV1UsersLogin2faVerifyPost,
} from '@/generated/actions/users'
import type { 
  LoginApiV1UsersLoginPostRequest,
  Verify2faLoginApiV1UsersLogin2faVerifyPostRequest,
  RegisterApiV1UsersRegisterPostRequest,
  TokenResponse,
  GetCurrentUserInfoApiV1UsersMeGetResponse,
} from '@/generated/schemas'
import { ActionError } from '@/generated/lib/safe-action'
import { redirect } from 'next/navigation'

/**
 * Login action
 * Handles login and sets tokens in cookies
 */
export async function loginAction(credentials: LoginApiV1UsersLoginPostRequest) {
  try {
    const result = await loginApiV1UsersLoginPost(credentials)
    
    // Safe actions return the data directly when called from server
    // But we need to check if it's actually a result object
    if (!result || typeof result !== 'object' || !('access_token' in result)) {
      // This might be a safe action result wrapper
      // For now, we'll assume the action returns data directly
      throw new ActionError('Invalid login response', 'INVALID_RESPONSE')
    }
    
    // Extract tokens and user data from response
    // New format (AuthResponse) includes user data, old format (TokenResponse) only has tokens
    const tokens = {
      access_token: (result as any).access_token as string,
      refresh_token: (result as any).refresh_token as string,
      token_type: ((result as any).token_type || 'bearer') as string,
      expires_in: (result as any).expires_in as number
    }
    
    // Extract user data from response (AuthResponse always includes user data)
    // Backend always returns user data with tokens in login response
    let user: GetCurrentUserInfoApiV1UsersMeGetResponse | null = null
    if ('user' in result && result.user) {
      user = result.user as GetCurrentUserInfoApiV1UsersMeGetResponse
    } else {
      // This should never happen as backend always returns user data
      // But if it does, we'll log a warning and continue without user data
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] User data missing from login response - this should not happen')
      }
    }
    
    // Set tokens with user data (if available) to create session immediately
    const sessionToken = await setAuthTokens(tokens, user || undefined)
    
    // Set session cookie immediately after login
    // This ensures the session is available on the next request
    if (sessionToken && user) {
      try {
        const { setSessionTokenCookie } = await import('./server')
        const expiresAt = tokens.expires_in 
          ? Date.now() + tokens.expires_in * 1000 
          : Date.now() + 1800000 // Default 30 minutes
        const maxAge = Math.floor((expiresAt - Date.now()) / 1000)
        
        if (maxAge > 0) {
          await setSessionTokenCookie(sessionToken, maxAge)
        }
      } catch (error) {
        // If setting session cookie fails, session will be created on next request
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Auth] Could not set session cookie after login, session will be created on next request')
        }
      }
    }
    
    return {
      success: true,
      data: result,
      requires2FA: false,
    }
  } catch (error) {
    // Check if it's a 2FA requirement
    if (error instanceof ActionError && error.statusCode === 202) {
      return {
        success: false,
        requires2FA: true,
        error: null,
      }
    }
    
    throw error
  }
}

/**
 * Register action
 */
export async function registerAction(data: RegisterApiV1UsersRegisterPostRequest) {
  try {
    const result = await registerApiV1UsersRegisterPost(data)
    
    // After registration, user needs to verify email
    // Don't set tokens yet
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Verify 2FA during login
 */
export async function verify2FAAction(data: Verify2faLoginApiV1UsersLogin2faVerifyPostRequest) {
  try {
    const result = await verify2faLoginApiV1UsersLogin2faVerifyPost(data)
    
    // Safe actions return data directly
    if (!result || typeof result !== 'object' || !('access_token' in result)) {
      throw new ActionError('Invalid 2FA response', 'INVALID_RESPONSE')
    }
    
    // Extract tokens and user data from response
    // New format (AuthResponse) includes user data, old format (TokenResponse) only has tokens
    const tokens = {
      access_token: (result as any).access_token as string,
      refresh_token: (result as any).refresh_token as string,
      token_type: ((result as any).token_type || 'bearer') as string,
      expires_in: (result as any).expires_in as number
    }
    
    // Extract user data from response (AuthResponse always includes user data)
    // Backend always returns user data with tokens in 2FA verification response
    let user: GetCurrentUserInfoApiV1UsersMeGetResponse | null = null
    if ('user' in result && result.user) {
      user = result.user as GetCurrentUserInfoApiV1UsersMeGetResponse
    } else {
      // This should never happen as backend always returns user data
      // But if it does, we'll log a warning and continue without user data
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] User data missing from 2FA response - this should not happen')
      }
    }
    
    // Set tokens with user data (if available) to create session immediately
    const sessionToken = await setAuthTokens(tokens, user || undefined)
    
    // Set session cookie immediately after 2FA verification
    // This ensures the session is available on the next request
    if (sessionToken && user) {
      try {
        const { setSessionTokenCookie } = await import('./server')
        const expiresAt = tokens.expires_in 
          ? Date.now() + tokens.expires_in * 1000 
          : Date.now() + 1800000 // Default 30 minutes
        const maxAge = Math.floor((expiresAt - Date.now()) / 1000)
        
        if (maxAge > 0) {
          await setSessionTokenCookie(sessionToken, maxAge)
        }
      } catch (error) {
        // If setting session cookie fails, session will be created on next request
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Auth] Could not set session cookie after 2FA, session will be created on next request')
        }
      }
    }
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    throw error
  }
}

/**
 * Refresh token action
 */
export async function refreshTokenAction() {
  try {
    const { getRefreshToken } = await import('./server')
    const refreshToken = await getRefreshToken()
    
    if (!refreshToken) {
      throw new ActionError('No refresh token available', 'UNAUTHORIZED')
    }
    
    const result = await refreshTokenApiV1UsersRefreshPost({
      refresh_token: refreshToken,
    })
    
    // Safe actions return data directly
    if (!result || typeof result !== 'object' || !('access_token' in result)) {
      throw new ActionError('Invalid refresh response', 'INVALID_RESPONSE')
    }
    
    // Get current session to preserve user data
    // Note: /refresh endpoint returns TokenResponse (no user data), so we preserve from session
    const currentSession = await getServerSession()
    
    // Use user data from current session to avoid unnecessary API call
    // If no session exists, we'll create one on next request when needed
    const user: GetCurrentUserInfoApiV1UsersMeGetResponse | null = currentSession?.user || null
    
    // Note: We don't fetch user data here because:
    // 1. If session exists, we have user data
    // 2. If session doesn't exist, it will be created on next getServerSession() call
    // 3. This avoids unnecessary API call since refresh only returns tokens
    
    // Cast result to TokenResponse for type safety
    const tokenResponse = result as TokenResponse
    
    // Update tokens with user data (if available)
    // Note: We preserve user data from current session to avoid API call
    const sessionToken = await setAuthTokens(tokenResponse, user || undefined)
    
    // Update session cookie if we have a session token
    // This ensures the session persists after token refresh
    if (sessionToken && user) {
      try {
        const { setSessionTokenCookie } = await import('./server')
        const expiresAt = tokenResponse.expires_in 
          ? Date.now() + tokenResponse.expires_in * 1000 
          : Date.now() + 1800000 // Default 30 minutes
        const maxAge = Math.floor((expiresAt - Date.now()) / 1000)
        
        if (maxAge > 0) {
          await setSessionTokenCookie(sessionToken, maxAge)
        }
      } catch (error) {
        // If setting session cookie fails, it's not critical
        // Session will be created on next request if needed
      }
    }
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    // If refresh fails, clear tokens
    await clearAuthTokens()
    throw error
  }
}

/**
 * Logout action
 */
export async function logoutAction() {
  try {
    const session = await getServerSession()
    
    if (session) {
      // Call backend logout to invalidate token
      try {
        await logoutApiV1UsersLogoutPost()
      } catch (error) {
        // Even if backend logout fails, clear local tokens
        console.error('Backend logout failed:', error)
      }
    }
    
    // Clear tokens
    await clearAuthTokens()
    
    // Redirect to login
    redirect('/auth/login')
  } catch (error) {
    // Clear tokens even if there's an error
    await clearAuthTokens()
    throw error
  }
}

/**
 * Update current user action
 * Updates user data and refreshes session cache
 */
export async function updateCurrentUserAction(
  userData: Parameters<typeof import('@/generated/actions/users').updateCurrentUserApiV1UsersMePut>[0]
) {
  try {
    const { updateCurrentUserApiV1UsersMePut } = await import('@/generated/actions/users')
    const updatedUser = await updateCurrentUserApiV1UsersMePut(userData)
    
    // Update session store with new user data
    const { updateSession } = await import('./server')
    if (updatedUser) {
      await updateSession(updatedUser as any)
    }
    
    return {
      success: true,
      data: updatedUser,
    }
  } catch (error) {
    throw error
  }
}

