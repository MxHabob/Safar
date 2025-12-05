/**
 * Client-Side Authentication Hooks
 * 
 * React hooks for authentication in client components.
 * Integrates with refresh queue and retry system.
 * 
 * Uses generated server actions from @/generated/actions.
 * 
 * @security Handles token refresh and retry queue
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { tokenStorage } from './token-storage'
import { queueRefresh } from './refresh-queue'
import { z } from 'zod'
import type {
  AuthUser,
  AuthContextType,
  LoginResult,
} from './types'
import { LoginApiV1UsersLoginPostResponseSchema } from '@/generated/schemas'
import {
  loginApiV1UsersLoginPost,
  refreshTokenApiV1UsersRefreshPost,
  getCurrentUserInfoApiV1UsersMeGet,
  logoutApiV1UsersLogoutPost,
} from '@/generated/actions'

/**
 * Hook for authentication state and methods
 * 
 * @returns Auth context with user, loading state, and auth methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth()
 *   
 *   if (!isAuthenticated) {
 *     return <LoginForm onLogin={login} />
 *   }
 *   
 *   return <div>Hello {user.email}</div>
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  // Initialize token from storage on mount
  useEffect(() => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      setAccessToken(token)
    }
  }, [])

  // Fetch current user
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<AuthUser | null> => {
      const token = tokenStorage.getAccessToken()
      if (!token) return null

      try {
        const result = await getCurrentUserInfoApiV1UsersMeGet()
        
        if (result?.serverError) {
          // If 401, try to refresh token
          if (result.serverError.includes('Unauthorized') || result.serverError.includes('401')) {
            const refreshed = await refreshToken()
            if (refreshed) {
              // Retry the request
              const retryResult = await getCurrentUserInfoApiV1UsersMeGet()
              if (retryResult?.data) {
                return retryResult.data as AuthUser
              }
            }
            // Refresh failed, clear token
            tokenStorage.removeAccessToken()
            setAccessToken(null)
          }
          throw new Error(result.serverError)
        }
        
        if (!result?.data) {
          return null
        }
        
        return result.data as AuthUser
      } catch (error: any) {
        // If 401, try to refresh token
        if (error?.message?.includes('Unauthorized') || error?.status === 401) {
          const refreshed = await refreshToken()
          if (refreshed) {
            // Retry the request
            const retryResult = await getCurrentUserInfoApiV1UsersMeGet()
            if (retryResult?.data) {
              return retryResult.data as AuthUser
            }
          }
          // Refresh failed, clear token
          tokenStorage.removeAccessToken()
          setAccessToken(null)
        }
        throw error
      }
    },
    enabled: !!accessToken && tokenStorage.hasValidToken(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Token refresh function with queue
  const refreshToken = useCallback(async (): Promise<boolean> => {
    return (
      (await queueRefresh(async () => {
        try {
          const refreshTokenValue = tokenStorage.getRefreshToken()
          if (!refreshTokenValue) {
            return null
          }

          // Use action to refresh token directly
          const result = await refreshTokenApiV1UsersRefreshPost({
            refresh_token: refreshTokenValue,
          })

          if (result?.serverError) {
            console.error('Token refresh failed:', result.serverError)
            // Clear tokens on refresh failure
            tokenStorage.clearAll()
            setAccessToken(null)
            return null
          }

          if (!result?.data) {
            console.error('Token refresh failed: No data returned')
            tokenStorage.clearAll()
            setAccessToken(null)
            return null
          }

          const data = result.data

          // Update access token
          const expiresIn = data.expires_in || 1800
          tokenStorage.setAccessToken(data.access_token, expiresIn)
          
          // Update refresh token if a new one is provided
          if (data.refresh_token) {
            tokenStorage.setRefreshToken(data.refresh_token)
          }
          
          setAccessToken(data.access_token)

          return {
            accessToken: data.access_token,
            expiresIn,
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
          // Clear tokens on refresh failure
          tokenStorage.clearAll()
          setAccessToken(null)
          return null
        }
      })) !== null
    )
  }, [])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string
      password: string
    }) => {
      try {
        const result = await loginApiV1UsersLoginPost({ email, password })
        
        if (result?.serverError) {
          // Check if 2FA is required (202 status)
          // FastAPI returns 202 as an error response when 2FA is required
          if (result.serverError.includes('202') || result.serverError.includes('2FA')) {
            // Try to get user ID from error details if available
            const userId = (result as any)?.data?.userId || null
            return {
              type: '2fa_required' as const,
              userId: userId || null,
              email,
            }
          }
          // Re-throw other errors
          throw new Error(result.serverError)
        }
        
        if (!result?.data) {
          throw new Error('Login failed: No data returned')
        }
        
        return { 
          type: 'success' as const,
          data: result.data as z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>
        }
      } catch (error: any) {
        // Check if 2FA is required (202 status)
        // FastAPI returns 202 as an error response when 2FA is required
        const status = error?.status || error?.response?.status || error?.statusCode
        if (status === 202) {
          // Try to get user ID from response headers or error data
          const headers = error?.response?.headers || error?.headers || {}
          const userId = headers['x-user-id'] || headers['X-User-ID'] || headers.get?.('x-user-id') || headers.get?.('X-User-ID')
          return {
            type: '2fa_required' as const,
            userId: userId || null,
            email,
          }
        }
        // Re-throw other errors
        throw error
      }
    },
    onSuccess: async (result) => {
      // Handle 2FA requirement
      if (result.type === '2fa_required') {
        // Don't store tokens yet, user needs to verify 2FA
        // The component should handle redirecting to 2FA verification
        return
      }

      // Handle successful login
      const data = result.data
      // Store access token
      const expiresIn = data.expires_in || 1800
      tokenStorage.setAccessToken(data.access_token, expiresIn)
      
      // Store refresh token in localStorage
      if (data.refresh_token) {
        tokenStorage.setRefreshToken(data.refresh_token)
      }
      
      setAccessToken(data.access_token)

      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = tokenStorage.getAccessToken()
      if (token) {
        try {
          // Call logout endpoint using action
          const result = await logoutApiV1UsersLogoutPost()
          if (result?.serverError) {
            // Continue with logout even if API call fails
            console.error('Logout API error:', result.serverError)
          }
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API error:', error)
        }
      }
    },
    onSuccess: async () => {
      // Clear all tokens
      tokenStorage.clearAll()
      setAccessToken(null)

      // Clear all queries
      queryClient.clear()

      // Redirect to login
      router.push('/auth/signin')
    },
  })

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!accessToken) return

    const timeUntilExpiry = tokenStorage.getTimeUntilExpiry()
    if (!timeUntilExpiry) return

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0)

    const timeoutId = setTimeout(() => {
      refreshToken().then((success) => {
        if (!success) {
          // Refresh failed, logout user
          logoutMutation.mutate()
        }
      })
    }, refreshTime)

    return () => clearTimeout(timeoutId)
  }, [accessToken, refreshToken, logoutMutation])

  // Handle user error - if user fetch fails with 401, try to refresh
  useEffect(() => {
    if (userError && (userError as any)?.status === 401) {
      refreshToken().then((success) => {
        if (success) {
          refetchUser()
        } else {
          // Refresh failed, logout
          logoutMutation.mutate()
        }
      })
    }
  }, [userError, refreshToken, refetchUser, logoutMutation])

  return {
    user: user ?? null,
    isLoading: isLoadingUser || loginMutation.isPending,
    isAuthenticated: !!user && !!accessToken,
    login: async (email: string, password: string): Promise<LoginResult> => {
      const result = await loginMutation.mutateAsync({ email, password })
      // Return result so caller can check if 2FA is required
      if (result.type === '2fa_required') {
        return result
      }
      return { type: 'success' }
    },
    logout: async () => {
      await logoutMutation.mutateAsync()
    },
    refreshToken,
    updateUser: (user: AuthUser | null) => {
      queryClient.setQueryData(['auth', 'user'], user)
    },
  }
}

/**
 * Hook for login functionality
 */
export function useLogin() {
  const { login } = useAuth()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string
      password: string
    }) => {
      await login(email, password)
    },
    onSuccess: () => {
      router.push('/dashboard')
    },
  })
}

/**
 * Hook for logout functionality
 */
export function useLogout() {
  const { logout } = useAuth()

  return useMutation({
    mutationFn: async () => {
      await logout()
    },
  })
}

