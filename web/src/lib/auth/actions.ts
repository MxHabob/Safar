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
    
    // Set tokens first
    await setAuthTokens(result as TokenResponse)
    
    // Fetch user data to create session (will be done automatically on next getServerSession call)
    // This avoids circular dependencies
    
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
    
    // Set tokens after successful 2FA verification
    await setAuthTokens(result as TokenResponse)
    
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
    
    // Update tokens (session will be refreshed automatically on next getServerSession call)
    await setAuthTokens(result as TokenResponse)
    
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

