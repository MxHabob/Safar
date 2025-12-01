/**
 * Client-Side Authentication Hooks
 * 
 * React hooks for authentication in client components.
 * Integrates with refresh queue and retry system.
 * 
 * @security Handles token refresh, retry queue, and CSRF tokens
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { tokenStorage } from './token-storage'
import { queueRefresh, queueRetry } from './refresh-queue'
import { CSRF_HEADER } from './csrf'
import { apiClient } from '@/generated/client'
import { z } from 'zod'
import type {
  AuthUser,
  AuthContextType,
} from './types'
import { LoginApiV1UsersLoginPostResponseSchema } from '@/generated/schemas'

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
        const response = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
          config: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        })
        return response.data as AuthUser
      } catch (error: any) {
        // If 401, try to refresh token
        if (error?.status === 401) {
          const refreshed = await refreshToken()
          if (refreshed) {
            // Retry the request
            const newToken = tokenStorage.getAccessToken()
            if (newToken) {
              const retryResponse = await apiClient.users.getCurrentUserInfoApiV1UsersMeGet({
                config: {
                  headers: {
                    Authorization: `Bearer ${newToken}`,
                  },
                },
              })
              return retryResponse.data as AuthUser
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
          // Get CSRF token from cookie (via API route)
          const csrfResponse = await fetch('/api/auth/csrf-token', {
            credentials: 'include',
          })
          const { csrfToken } = await csrfResponse.json()

          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              [CSRF_HEADER]: csrfToken,
            },
          })

          if (!response.ok) {
            return null
          }

          const data = await response.json()

          // Update access token
          const expiresIn = data.expires_in || 1800
          tokenStorage.setAccessToken(data.access_token, expiresIn)
          setAccessToken(data.access_token)

          return {
            accessToken: data.access_token,
            expiresIn,
          }
        } catch (error) {
          console.error('Token refresh failed:', error)
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
      // Get CSRF token first
      const csrfResponse = await fetch('/api/auth/csrf-token', {
        credentials: 'include',
      })
      const { csrfToken } = await csrfResponse.json()

      const response = await apiClient.users.loginApiV1UsersLoginPost({
        body: { email, password },
        config: {
          headers: {
            [CSRF_HEADER]: csrfToken,
          },
        },
      })
      return response.data as z.infer<typeof LoginApiV1UsersLoginPostResponseSchema>
    },
    onSuccess: async (data) => {
      // Store access token
      const expiresIn = data.expires_in || 1800
      tokenStorage.setAccessToken(data.access_token, expiresIn)
      setAccessToken(data.access_token)

      // Store refresh token in httpOnly cookie via API route
      try {
        const csrfResponse = await fetch('/api/auth/csrf-token', {
          credentials: 'include',
        })
        const { csrfToken } = await csrfResponse.json()

        await fetch('/api/auth/set-refresh-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            [CSRF_HEADER]: csrfToken,
          },
          body: JSON.stringify({ refresh_token: data.refresh_token }),
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to set refresh token:', error)
      }

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
          // Get CSRF token
          const csrfResponse = await fetch('/api/auth/csrf-token', {
            credentials: 'include',
          })
          const { csrfToken } = await csrfResponse.json()

          await apiClient.users.logoutApiV1UsersLogoutPost({
            config: {
              headers: {
                Authorization: `Bearer ${token}`,
                [CSRF_HEADER]: csrfToken,
              },
            },
          })
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API error:', error)
        }
      }
    },
    onSuccess: async () => {
      // Clear tokens
      tokenStorage.removeAccessToken()
      setAccessToken(null)

      // Clear refresh token cookie
      try {
        const csrfResponse = await fetch('/api/auth/csrf-token', {
          credentials: 'include',
        })
        const { csrfToken } = await csrfResponse.json()

        await fetch('/api/auth/clear-refresh-token', {
          method: 'POST',
          headers: {
            [CSRF_HEADER]: csrfToken,
          },
          credentials: 'include',
        })
      } catch (error) {
        console.error('Failed to clear refresh token:', error)
      }

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
    login: async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password })
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

