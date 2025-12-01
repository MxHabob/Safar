# Frontend Authentication Strategy Recommendation

## Current Situation Analysis

### Backend Authentication
- ✅ **JWT-based authentication** with access/refresh token pattern
- ✅ **OAuth support** (Google, Apple)
- ✅ **Email/password authentication**
- ✅ **Complete API endpoints** for all auth operations
- ✅ **Token blacklist** for revocation
- ✅ **Rate limiting** and security features

### Frontend Stack
- **Next.js 16** with App Router
- **React Query** (@tanstack/react-query) for data fetching
- **Zustand** for state management
- **Generated API clients** (from mulink/link)
- **No auth library currently installed**

## Recommendation: **Custom Authentication** ✅

### Why Custom Authentication?

1. **Perfect Backend Alignment**
   - Your backend already provides complete JWT authentication
   - All endpoints are ready (`/login`, `/refresh`, `/register`, etc.)
   - Generated API clients already handle API calls
   - No need for additional abstraction layers

2. **Full Control**
   - Complete control over token storage strategy
   - Custom refresh token logic
   - Flexible error handling
   - Easy to customize for your specific needs

3. **Lightweight & Performant**
   - No additional dependencies
   - Smaller bundle size
   - Faster initial load
   - Direct API integration

4. **Better Developer Experience**
   - Uses your existing React Query setup
   - Integrates with your Zustand state management
   - Works seamlessly with generated API clients
   - Type-safe with TypeScript

5. **Cost-Effective**
   - No vendor lock-in
   - No subscription fees
   - Full ownership of code

### Why NOT auth.js (NextAuth.js)?

❌ **Session-based by default** - Your backend uses JWT tokens
❌ **Complex JWT setup** - Would need custom JWT provider
❌ **Overhead** - Adds complexity for simple JWT auth
❌ **Less flexible** - Harder to customize for your specific needs
❌ **Server-side focus** - Your backend handles auth, not Next.js

### Why NOT better-auth?

❌ **Backend-first approach** - Designed for its own backend
❌ **Overkill** - Your backend already handles everything
❌ **Custom adapter needed** - Would need to adapt to your FastAPI backend
❌ **Additional complexity** - More moving parts than necessary

## Recommended Implementation

### Architecture Overview

```
┌─────────────────┐
│   React Query   │  ← Data fetching & caching
└────────┬────────┘
         │
┌────────▼────────┐
│  Auth Context   │  ← Auth state management
└────────┬────────┘
         │
┌────────▼────────┐
│  Token Manager  │  ← Token storage & refresh
└────────┬────────┘
         │
┌────────▼────────┐
│  API Client     │  ← Generated API clients
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend API   │  ← FastAPI with JWT
└─────────────────┘
```

### Implementation Plan

#### 1. Token Storage Strategy

**Recommended**: **httpOnly Cookies for Refresh Token + localStorage for Access Token**

```typescript
// Why this approach:
// - Refresh token in httpOnly cookie (more secure, not accessible to JS)
// - Access token in localStorage (short-lived, less critical)
// - Automatic refresh via middleware
```

**Alternative**: Both in httpOnly cookies (most secure, but requires API routes)

#### 2. Core Components Needed

1. **Auth Context** - React context for auth state
2. **Token Manager** - Handles token storage and refresh
3. **Auth Hooks** - `useAuth()`, `useLogin()`, `useLogout()`, etc.
4. **Protected Route Component** - Route guard
5. **API Interceptor** - Auto-refresh tokens on 401

#### 3. Integration Points

- **React Query** - Use for auth mutations and queries
- **Zustand** - Optional global auth state store
- **Generated API Clients** - Already configured, just add auth headers
- **Next.js Middleware** - Token refresh on API calls

## Implementation Example

### 1. Token Storage (`lib/auth/token-storage.ts`)

```typescript
// Secure token storage utilities
export const tokenStorage = {
  getAccessToken: () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('access_token')
  },
  
  setAccessToken: (token: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('access_token', token)
  },
  
  removeAccessToken: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('access_token')
  },
  
  // Refresh token handled via httpOnly cookie
  // Set via API route: /api/auth/set-refresh-token
}
```

### 2. Auth Context (`lib/auth/auth-context.tsx`)

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/generated/client'
import { tokenStorage } from './token-storage'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const token = tokenStorage.getAccessToken()
      if (!token) return null
      
      const response = await apiClient.users.getCurrentUserApiV1UsersMeGet({
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    enabled: !!accessToken,
    retry: false
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiClient.users.loginApiV1UsersLoginPost({
        body: { email, password }
      })
      return response.data
    },
    onSuccess: async (data) => {
      tokenStorage.setAccessToken(data.access_token)
      setAccessToken(data.access_token)
      
      // Set refresh token in httpOnly cookie via API route
      await fetch('/api/auth/set-refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: data.refresh_token })
      })
      
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] })
    }
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = tokenStorage.getAccessToken()
      if (token) {
        await apiClient.users.logoutApiV1UsersLogoutPost({
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    },
    onSuccess: () => {
      tokenStorage.removeAccessToken()
      setAccessToken(null)
      queryClient.clear()
      
      // Clear refresh token cookie
      fetch('/api/auth/clear-refresh-token', { method: 'POST' })
    }
  })

  // Token refresh
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        tokenStorage.setAccessToken(data.access_token)
        setAccessToken(data.access_token)
      }
    } catch (error) {
      // Refresh failed, logout
      await logoutMutation.mutateAsync()
    }
  }

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!accessToken) return
    
    const interval = setInterval(() => {
      refreshToken()
    }, 25 * 60 * 1000) // Refresh every 25 minutes (token expires in 30)
    
    return () => clearInterval(interval)
  }, [accessToken])

  const value: AuthContextType = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshToken
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

### 3. API Route for Refresh Token (`app/api/auth/refresh/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/v1/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    } else {
      return NextResponse.json(data, { status: response.status })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
```

### 4. Protected Route Component (`components/auth/protected-route.tsx`)

```typescript
'use client'

import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
```

### 5. API Client Interceptor (`lib/auth/api-interceptor.ts`)

```typescript
// Add to your generated API client configuration
export const authInterceptor = {
  onRequest: async (config: any) => {
    const token = tokenStorage.getAccessToken()
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      }
    }
    return config
  },
  
  onError: async (error: any) => {
    if (error.status === 401) {
      // Try to refresh token
      await refreshToken()
      // Retry original request
      // Implementation depends on your API client
    }
    throw error
  }
}
```

## Benefits of This Approach

✅ **Simple & Maintainable** - Easy to understand and modify
✅ **Type-Safe** - Full TypeScript support
✅ **Flexible** - Easy to customize for your needs
✅ **Performant** - No unnecessary overhead
✅ **Secure** - Follows best practices for JWT storage
✅ **Integrated** - Works seamlessly with your existing stack

## Migration Path

1. **Phase 1**: Implement basic auth context and token storage
2. **Phase 2**: Add protected routes and API interceptors
3. **Phase 3**: Add OAuth integration (Google, Apple)
4. **Phase 4**: Add advanced features (remember me, session management)

## Estimated Implementation Time

- **Basic Auth**: 2-3 days
- **OAuth Integration**: 1-2 days
- **Advanced Features**: 2-3 days
- **Total**: ~1 week

## Conclusion

**Recommendation: Custom Authentication**

Given your backend architecture and frontend stack, custom authentication is the best choice. It provides:
- Perfect alignment with your backend
- Full control and flexibility
- Better performance
- Easier maintenance
- No vendor lock-in

The implementation is straightforward and leverages your existing tools (React Query, Zustand, generated API clients).

---

**Next Steps**:
1. Review this recommendation
2. Implement token storage utilities
3. Create auth context and hooks
4. Add protected route components
5. Integrate with API clients

