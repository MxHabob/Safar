/**
 * Auth Provider - Client-side authentication state management
 * 
 * Features:
 * - React Query for optimal caching
 * - Automatic token refresh
 * - Session synchronization
 * - Optimized for Next.js 16.0.7
 */

'use client'

import { createContext, useContext, useCallback, useTransition, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import type {
  GetCurrentUserInfoApiV1UsersMeGetResponse,
  LoginApiV1UsersLoginPostRequest,
  RegisterApiV1UsersRegisterPostRequest,
  Verify2faLoginApiV1UsersLogin2faVerifyPostRequest,
} from '@/generated/schemas'
import { 
  useLoginApiV1UsersLoginPostMutation,
  useRegisterApiV1UsersRegisterPostMutation,
  useVerify2faLoginApiV1UsersLogin2faVerifyPostMutation,
  useRefreshTokenApiV1UsersRefreshPostMutation,
  useLogoutApiV1UsersLogoutPostMutation,
} from '@/generated/hooks/users'
import { sessionStore } from '../core/session-store'
import type { AuthResponse, TokenResponse } from '@/generated/schemas'
import { 
  setTokensAction, 
  clearTokensAction, 
  getRefreshTokenAction,
  getSessionIdAction,
  validateTokenAction,
} from '../server/actions'

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
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()

  // Get user from session store (no API call needed - data comes with tokens)
  // User data is set directly from login/refresh responses, no useEffect needed
  const [user, setUser] = useState<GetCurrentUserInfoApiV1UsersMeGetResponse | null>(null)
  
  // Sync user from server session (for OAuth and page refreshes)
  // This runs automatically when component mounts or when query is invalidated
  const { data: sessionData, isLoading: isSessionLoading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      if (!response.ok) {
        return null
      }
      const data = await response.json()
      return data.user ? { user: data.user, sessionId: data.sessionId } : null
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })

  // Update user state when session data is available
  // Use useMemo to sync user from sessionData without causing infinite loops
  useMemo(() => {
    if (sessionData?.user && user?.id !== sessionData.user.id) {
      setUser(sessionData.user)
      // Also sync to session store
      if (sessionData.sessionId) {
        const session = sessionStore.get(sessionData.sessionId)
        if (!session && sessionData.user) {
          sessionStore.create({
            sessionId: sessionData.sessionId,
            userId: sessionData.user.id,
            user: sessionData.user,
            accessToken: '', // Will be set from cookies
            refreshToken: '', // Will be set from cookies
            expiresAt: Date.now() + 30 * 60 * 1000, // Default 30 min
          })
        }
      }
    }
  }, [sessionData?.user?.id, user?.id, sessionData?.sessionId])

  const isLoading = isSessionLoading

  // Refresh token mutation using generated hook (defined first for use in scheduleTokenRefresh)
  const refreshTokenMutation = useRefreshTokenApiV1UsersRefreshPostMutation({
    showToast: false, // We handle errors manually
    onSuccess: async (data: TokenResponse) => {
      // Get current session to preserve user data
      const sessionId = await getSessionIdAction()
      const currentSession = sessionId ? sessionStore.get(sessionId) : null

      // Update session if exists
      if (currentSession && sessionId) {
        const expiresAt = Date.now() + (data.expires_in * 1000)
        sessionStore.update(sessionId, {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt,
        })
      }

      // Update tokens in cookies
      await setTokensAction(
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        },
        sessionId || undefined
      )

      // User data is already in session store, no need to refetch
      // Just update the state if session exists
      const updatedSession = sessionId ? sessionStore.get(sessionId) : null
      if (updatedSession) {
        setUser(updatedSession.user)
        // Schedule automatic token refresh
        scheduleTokenRefresh()
      }
    },
  })

  // Auto-refresh token before expiry (scheduled in onSuccess callbacks, no useEffect needed)
  const scheduleTokenRefresh = useCallback(async () => {
    if (!user) return

    try {
      const refreshToken = await getRefreshTokenAction()
      if (!refreshToken) {
        return
      }

      // Validate refresh token before calling API
      const validation = await validateTokenAction(refreshToken)
      if (!validation.valid) {
        await clearTokensAction()
        setUser(null)
        return
      }

      // Schedule refresh 5 minutes before expiry (assuming 30 min token lifetime)
      const refreshDelay = 25 * 60 * 1000 // 25 minutes

      setTimeout(async () => {
        try {
          const currentRefreshToken = await getRefreshTokenAction()
          if (!currentRefreshToken) {
            return
          }

          await refreshTokenMutation.mutateAsync({
            refresh_token: currentRefreshToken,
          })
          // Recursively schedule next refresh
          scheduleTokenRefresh()
        } catch (error) {
          console.error('Token refresh failed:', error)
          // Try again in 1 minute
          setTimeout(() => scheduleTokenRefresh(), 60 * 1000)
        }
      }, refreshDelay)
    } catch (error) {
      console.error('Failed to schedule token refresh:', error)
    }
  }, [user, refreshTokenMutation])

  // Login mutation using generated hook
  const loginMutation = useLoginApiV1UsersLoginPostMutation({
    showToast: false, // We handle errors manually
    onSuccess: async (data: AuthResponse) => {
      console.log('Login response from backend:', {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        user: data.user,
        session_id: (data as any).session_id,
        requires2FA: (data as any).requires2FA,
      })
      // Check if 2FA is required (status 202 or requires2FA flag)
      if ('requires2FA' in data && data.requires2FA) {
        // Don't proceed - let the login function handle 2FA requirement
        return
      }

      // Store session
      const sessionId = (data as any).session_id || crypto.randomUUID()
      const expiresAt = Date.now() + (data.expires_in * 1000)

      sessionStore.create({
        sessionId,
        userId: data.user.id,
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      })

      // Set tokens in cookies
      await setTokensAction(
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        },
        sessionId
      )

      // Update user state directly from response (no API call needed)
      setUser(data.user)

      // Schedule automatic token refresh
      scheduleTokenRefresh()

      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ['Users'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
        router.push('/')
      })
    },
  })

  // Register mutation using generated hook
  const registerMutation = useRegisterApiV1UsersRegisterPostMutation({
    showToast: false, // We handle errors manually
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Users'] })
    },
  })

  // 2FA verification mutation using generated hook
  const verify2FAMutation = useVerify2faLoginApiV1UsersLogin2faVerifyPostMutation({
    showToast: false, // We handle errors manually
    onSuccess: async (data: AuthResponse) => {
      // Store session
      const sessionId = (data as any).session_id || crypto.randomUUID()
      const expiresAt = Date.now() + (data.expires_in * 1000)

      sessionStore.create({
        sessionId,
        userId: data.user.id,
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      })

      // Set tokens in cookies
      await setTokensAction(
        {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        },
        sessionId
      )

      // Update user state directly from response (no API call needed)
      setUser(data.user)

      // Schedule automatic token refresh
      scheduleTokenRefresh()

      startTransition(() => {
        queryClient.invalidateQueries({ queryKey: ['Users'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
        router.push('/')
      })
    },
  })

  // Logout mutation using generated hook
  const logoutMutation = useLogoutApiV1UsersLogoutPostMutation({
    showToast: false, // We handle errors manually
    onSuccess: async () => {
      // Get session ID
      const sessionId = await getSessionIdAction()
      
      // Delete session from store
      if (sessionId) {
        sessionStore.delete(sessionId)
      }

      // Clear tokens
      await clearTokensAction()

      // Clear user state
      setUser(null)

      // Clear query cache
      queryClient.clear()
      
      // Redirect to login
      router.push('/login')
    },
  })

  // Login function
  const login = useCallback(async (credentials: LoginApiV1UsersLoginPostRequest) => {
    try {
      const result = await loginMutation.mutateAsync(credentials)
      
      // Check if 2FA is required
      if (result && typeof result === 'object' && 'requires2FA' in result && result.requires2FA) {
        return { success: false, requires2FA: true }
      }

      // Success - tokens and session are already set in onSuccess
      return { success: true }
    } catch (error: any) {
      // Check for 2FA requirement (status 202)
      if (error?.statusCode === 202 || error?.status === 202 || error?.message?.includes('2FA')) {
        return { success: false, requires2FA: true }
      }

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
      // Success - tokens and session are already set in onSuccess
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
      queryClient.clear()
      router.push('/login')
    }
  }, [logoutMutation, queryClient, router])

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = await getRefreshTokenAction()
      if (!refreshTokenValue) {
        return false
      }

      // Validate refresh token before calling API
      const validation = await validateTokenAction(refreshTokenValue)
      if (!validation.valid) {
        await clearTokensAction()
        return false
      }

      await refreshTokenMutation.mutateAsync({
        refresh_token: refreshTokenValue,
      })
      return true
    } catch (error) {
      return false
    }
  }, [refreshTokenMutation])

  // Update user in state and session store
  const updateUser = useCallback((newUser: GetCurrentUserInfoApiV1UsersMeGetResponse | null) => {
    setUser(newUser)
    
    // Also update in session store if session exists
    const updateSessionStore = async () => {
      try {
        const sessionId = await getSessionIdAction()
        if (sessionId && newUser) {
          sessionStore.update(sessionId, { user: newUser })
        }
      } catch (error) {
        console.error('Failed to update session store:', error)
      }
    }
    updateSessionStore()
  }, [])

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

