// Client utilities and middleware
import type { RequestMiddleware, RequestConfiguration, ClientResponse, ApiError } from './base'

// Logging middleware
export const loggingMiddleware: RequestMiddleware = {
  name: 'logging',
  onRequest: async (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] ${config.method} ${config.url || 'unknown'}`)
    }
    return config
  },
  onResponse: async (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Response ${response.status} (${response.responseTime || 0}ms)`)
    }
    return response
  },
  onError: async (error) => {
    console.error(`[API] Error: ${error.message}`, error)
    throw error
  }
}

// Retry middleware with exponential backoff
export const retryMiddleware = (maxRetries = 3, baseDelay = 1000): RequestMiddleware => ({
  name: 'retry',
  onError: async (error) => {
    // This would be handled by the base client's retry logic
    throw error
  }
})

// Cache middleware
export const cacheMiddleware = (ttl = 300): RequestMiddleware => ({
  name: 'cache',
  onRequest: async (config) => {
    // Add cache headers
    return {
      ...config,
      headers: {
        ...config.headers,
        'Cache-Control': `max-age=${ttl}`
      }
    }
  }
})

// Compression middleware
export const compressionMiddleware: RequestMiddleware = {
  name: 'compression',
  onRequest: async (config) => {
    return {
      ...config,
      headers: {
        ...config.headers,
        'Accept-Encoding': 'gzip, deflate, br'
      }
    }
  }
}

// Request timing middleware
export const timingMiddleware: RequestMiddleware = {
  name: 'timing',
  onRequest: async (config) => {
    (config as any)._startTime = Date.now()
    return config
  },
  onResponse: async (response) => {
    const startTime = (response as any)._startTime
    if (startTime) {
      response.responseTime = Date.now() - startTime
    }
    return response
  }
}

// Content type middleware
export const contentTypeMiddleware: RequestMiddleware = {
  name: 'content-type',
  onRequest: async (config) => {
    // Auto-detect content type based on body
    if (config.body) {
      if (config.body instanceof FormData) {
        // Don't set content-type for FormData (browser handles it)
        const headers = { ...config.headers }
        delete (headers as any)['Content-Type']
        return { ...config, headers }
      } else if (config.body instanceof URLSearchParams) {
        return {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      } else if (typeof config.body === 'object') {
        return {
          ...config,
          headers: {
            ...config.headers,
            'Content-Type': 'application/json'
          }
        }
      }
    }
    return config
  }
}

// Rate limiting middleware
export const rateLimitMiddleware = (requestsPerMinute = 60): RequestMiddleware => {
  const requests = new Map<string, number[]>()
  
  return {
    name: 'rate-limit',
    onRequest: async (config) => {
      const now = Date.now()
      const minute = Math.floor(now / 60000)
      const key = `${config.method}:${config.url}`
      
      const requestTimes = requests.get(key) || []
      const recentRequests = requestTimes.filter(time => time === minute)
      
      if (recentRequests.length >= requestsPerMinute) {
        throw new Error(`Rate limit exceeded: ${requestsPerMinute} requests per minute`)
      }
      
      requestTimes.push(minute)
      requests.set(key, requestTimes.slice(-requestsPerMinute))
      
      return config
    }
  }
}

// Token refresh middleware - automatically refreshes token on 401
// This middleware intercepts 401 errors and attempts to refresh the token
// Note: Actual retry logic is handled in base.ts executeRequestInternal
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshToken(): Promise<string | null> {
  // If already refreshing, return existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  // Start token refresh
  isRefreshing = true
  refreshPromise = (async (): Promise<string | null> => {
    try {
      // Use server action directly (works on both client and server)
      // Server actions are the preferred way in Next.js 16
      const { refreshTokenAction } = await import('@/lib/auth/actions')
      const result = await refreshTokenAction()
      
      if (result?.success && result?.data?.access_token) {
        return result.data.access_token as string
      }

      return null
    } catch (refreshError) {
      console.error('[Token Refresh] Failed to refresh token:', refreshError)
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export const tokenRefreshMiddleware: RequestMiddleware = {
  name: 'token-refresh',
  onError: async (error) => {
    // Only handle 401 errors (unauthorized)
    if (error.status !== 401) {
      throw error
    }

    // Skip token refresh for auth endpoints (login, refresh, etc.)
    const url = (error as any).config?.url || ''
    if (url.includes('/login') || url.includes('/refresh') || url.includes('/oauth')) {
      throw error
    }

    // Attempt to refresh token
    const newToken = await refreshToken()
    
    if (!newToken) {
      // Refresh failed, clear tokens and redirect to login (client-side only)
      if (typeof window !== 'undefined') {
        try {
          // Use server action for logout instead of API route
          const { logoutAction } = await import('@/lib/auth/actions')
          await logoutAction()
        } catch {
          // If logout action fails, redirect anyway
          window.location.replace('/login?error=session_expired')
        }
      }
      throw error
    }

    // Token refreshed successfully - the base client will retry the request
    // We need to update the error to indicate retry should happen
    // This is handled by the base client's retry logic
    throw error
  }
}

// Authentication error middleware
// Handles 401/403 errors and redirects to login when needed
export const authErrorMiddleware: RequestMiddleware = {
  name: 'auth-error',
  onError: async (error) => {
    // Token refresh middleware handles 401, so we only handle 403 here
    if (error.status !== 403) {
      throw error
    }

    if (typeof window === 'undefined') {
      throw error
    }

    const errorMessage = error.data?.detail || error.message || ''
    const errorCode = (error.data as any)?.error_code || ''
    const isInactive = (
      errorMessage.toLowerCase().includes('not active') ||
      errorMessage.toLowerCase().includes('inactive') ||
      errorMessage.toLowerCase().includes('account is not active') ||
      errorCode.toLowerCase() === 'user_account_inactive'
    )

    console.warn('[Auth Middleware] Authorization error detected:', {
      status: error.status,
      message: errorMessage,
      errorCode,
      isInactive,
      errorData: error.data,
    })

    // For inactive accounts, redirect to login
    if (isInactive) {
      if (typeof window !== 'undefined') {
        window.location.replace('/login?error=account_inactive')
      }
      throw error
    }

    // Try custom error handler
    try {
      const { handleAuthError } = await import('@/generated/lib/auth-error-handler')
      await handleAuthError(error)
      throw error
    } catch (handlerError) {
      console.error('[Auth Middleware] Error in handleAuthError:', handlerError)
      throw handlerError instanceof Error ? handlerError : error
    }
  }
}

// Default middleware stack
// Order matters: token refresh should come before auth error handling
export const defaultMiddleware: RequestMiddleware[] = [
  timingMiddleware,
  contentTypeMiddleware,
  compressionMiddleware,
  loggingMiddleware,
  tokenRefreshMiddleware, // Try token refresh first on 401
  authErrorMiddleware, // Handle remaining auth errors (403, etc.)
]

// Utility functions
export function createMiddlewareStack(...middleware: RequestMiddleware[]): RequestMiddleware[] {
  return [...defaultMiddleware, ...middleware]
}

export function withMiddleware<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  middleware: RequestMiddleware[]
): T {
  return (async (...args: any[]) => {
    // This would integrate with the base client's middleware system
    return fn(...args)
  }) as T
}