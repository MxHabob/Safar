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
    
    // Fetch user data FIRST before setting tokens
    // This ensures we have user data to store in session
    let user: GetCurrentUserInfoApiV1UsersMeGetResponse | null = null
    try {
      const { apiClient } = await import('@/generated/client')
      const userResponse = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
        config: {
          headers: {
            Authorization: `Bearer ${(result as TokenResponse).access_token}`,
          },
        },
      })
      user = userResponse.data as GetCurrentUserInfoApiV1UsersMeGetResponse | null
    } catch (error) {
      // If fetching user fails, we'll still set tokens and fetch user on next request
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Could not fetch user data during login, will fetch on next request')
      }
    }
    
    // Set tokens with user data (if available) to create session immediately
    await setAuthTokens(result as TokenResponse, user || undefined)
    
    // Create session and set cookie
    // This is safe here because we're in a Server Action
    try {
      const { getServerSession, setSessionTokenCookie } = await import('./server')
      const session = await getServerSession()
      
      // If session was created, set the cookie now (we're in a Server Action, so it's safe)
      if (session?.sessionToken) {
        const expiresAt = session.expiresAt
        const maxAge = Math.floor((expiresAt - Date.now()) / 1000)
        if (maxAge > 0) {
          await setSessionTokenCookie(session.sessionToken, maxAge)
        }
      }
    } catch (error) {
      // If fetching fails, tokens are still set and session will be created on next request
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Could not set session cookie after login, session will be created on next request')
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
    
    // Fetch user data FIRST before setting tokens
    let user: GetCurrentUserInfoApiV1UsersMeGetResponse | null = null
    try {
      const { apiClient } = await import('@/generated/client')
      const userResponse = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
        config: {
          headers: {
            Authorization: `Bearer ${(result as TokenResponse).access_token}`,
          },
        },
      })
      user = userResponse.data as GetCurrentUserInfoApiV1UsersMeGetResponse | null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Auth] Could not fetch user data during 2FA verification')
      }
    }
    
    // Set tokens with user data (if available) to create session immediately
    await setAuthTokens(result as TokenResponse, user || undefined)
    
    // Set session cookie
    try {
      const { getServerSession, setSessionTokenCookie } = await import('./server')
      const session = await getServerSession()
      if (session?.sessionToken) {
        const expiresAt = session.expiresAt
        const maxAge = Math.floor((expiresAt - Date.now()) / 1000)
        if (maxAge > 0) {
          await setSessionTokenCookie(session.sessionToken, maxAge)
        }
      }
    } catch (error) {
      // Session will be created on next request
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
    const currentSession = await getServerSession()
    
    // Update tokens with existing user data (if available) to avoid API call
    // If no session exists, fetch user data
    let user: GetCurrentUserInfoApiV1UsersMeGetResponse | null = currentSession?.user || null
    
    if (!user) {
      // No session, fetch user data
      try {
        const { apiClient } = await import('@/generated/client')
        const userResponse = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
          config: {
            headers: {
              Authorization: `Bearer ${(result as TokenResponse).access_token}`,
            },
          },
        })
        user = userResponse.data as GetCurrentUserInfoApiV1UsersMeGetResponse | null
      } catch (error) {
        // User will be fetched on next request
      }
    }
    
    // Update tokens with user data (if available)
    await setAuthTokens(result as TokenResponse, user || undefined)
    
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

