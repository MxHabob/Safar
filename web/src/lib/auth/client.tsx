'use client'

import { createContext, useContext, useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { 
  GetCurrentUserInfoApiV1UsersMeGetResponse,
  LoginApiV1UsersLoginPostRequest,
  RegisterApiV1UsersRegisterPostRequest,
  Verify2faLoginApiV1UsersLogin2faVerifyPostRequest,
} from '@/generated/schemas'
import { loginAction, registerAction, verify2FAAction, logoutAction, refreshTokenAction } from './actions'

/**
 * Auth context type
 */
interface AuthContextType {
  user: GetCurrentUserInfoApiV1UsersMeGetResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginApiV1UsersLoginPostRequest) => Promise<{ success: boolean; requires2FA?: boolean; error?: string }>
  register: (data: RegisterApiV1UsersRegisterPostRequest) => Promise<{ success: boolean; error?: string }>
  verify2FA: (data: Verify2faLoginApiV1UsersLogin2faVerifyPostRequest) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
  updateUser: (user: GetCurrentUserInfoApiV1UsersMeGetResponse | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider Component
 * Manages authentication state on the client side
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  // Fetch current user session
  // Optimized caching strategy similar to auth.js:
  // - Long staleTime to reduce API calls
  // - No refetch on mount if data exists (prevents unnecessary calls)
  // - Only refetch on window focus if data is stale
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store', // Always fetch fresh data from server
        })
        
        if (!response.ok) {
          return null
        }
        
        const data = await response.json()
        return data.user ?? null
      } catch (error) {
        return null
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists
    refetchOnWindowFocus: false, // Don't refetch on window focus (reduces API calls)
    refetchOnMount: false, // Don't refetch on mount if data exists (prevents duplicate calls)
    refetchOnReconnect: true, // Only refetch on reconnect
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginAction,
    onSuccess: (result) => {
      if (result.success && !result.requires2FA) {
        // Refetch user data
        refetch()
        queryClient.invalidateQueries({ queryKey: ['auth'] })
      }
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: registerAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  // 2FA verification mutation
  const verify2FAMutation = useMutation({
    mutationFn: verify2FAAction,
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutAction,
    onSuccess: () => {
      queryClient.clear()
      router.push('/login')
    },
  })

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: refreshTokenAction,
    onSuccess: () => {
      refetch()
    },
  })

  // Auto-refresh token before expiry
  // Next.js 16 & OAuth 2026: Proactive token refresh to prevent expiration
  useEffect(() => {
    if (!user) return

    let refreshTimeout: NodeJS.Timeout | null = null

    const scheduleRefresh = () => {
      // Clear existing timeout
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }

      // Refresh 5 minutes before expiry (assuming 30 min token lifetime)
      // This prevents race conditions and ensures smooth user experience
      const refreshDelay = 25 * 60 * 1000 // 25 minutes
      
      refreshTimeout = setTimeout(async () => {
        try {
          await refreshTokenMutation.mutateAsync()
          // Schedule next refresh after successful refresh
          scheduleRefresh()
        } catch (error) {
          // If refresh fails, user will be logged out
          console.error('Token refresh failed:', error)
          // Try again in 1 minute
          refreshTimeout = setTimeout(scheduleRefresh, 60 * 1000)
        }
      }, refreshDelay)
    }

    // Initial schedule
    scheduleRefresh()

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout)
      }
    }
  }, [user, refreshTokenMutation])

  // Login function
  const login = useCallback(async (credentials: LoginApiV1UsersLoginPostRequest) => {
    try {
      const result = await loginMutation.mutateAsync(credentials)
      return {
        success: result.success,
        requires2FA: result.requires2FA,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }
    }
  }, [loginMutation])

  // Register function
  const register = useCallback(async (data: RegisterApiV1UsersRegisterPostRequest) => {
    try {
      await registerMutation.mutateAsync(data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }
    }
  }, [registerMutation])

  // Verify 2FA function
  const verify2FA = useCallback(async (data: Verify2faLoginApiV1UsersLogin2faVerifyPostRequest) => {
    try {
      await verify2FAMutation.mutateAsync(data)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '2FA verification failed',
      }
    }
  }, [verify2FAMutation])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync()
    } catch (error) {
      // Even if logout fails, clear local state
      queryClient.clear()
      router.push('/login')
    }
  }, [logoutMutation, queryClient, router])

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      await refreshTokenMutation.mutateAsync()
      return true
    } catch (error) {
      return false
    }
  }, [refreshTokenMutation])

  // Update user in cache
  const updateUser = useCallback((newUser: GetCurrentUserInfoApiV1UsersMeGetResponse | null) => {
    queryClient.setQueryData(['auth', 'session'], newUser)
  }, [queryClient])

  const value: AuthContextType = {
    user: user ?? null,
    isLoading: isLoading || isPending,
    isAuthenticated: !!user,
    login,
    register,
    verify2FA,
    logout,
    refreshToken,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

