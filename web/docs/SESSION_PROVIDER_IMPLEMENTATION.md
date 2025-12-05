# Session Provider Implementation

## Overview

The Session Provider system provides comprehensive authentication state management for both client-side and server-side components in the Safar web application.

## Architecture

### Client-Side Authentication

The client-side authentication is handled by the `useAuth` hook located in `web/src/lib/auth/client.ts`. This hook:

- Manages authentication state using React Query
- Handles token storage and refresh
- Provides login/logout functionality
- Supports 2FA authentication flow
- Automatically refreshes tokens before expiry

### Server-Side Authentication

Server-side session utilities are provided in `web/src/lib/auth/server.ts` and `web/src/lib/auth/session-provider.tsx`:

- `getServerSession()` - Get current session in Server Components/Route Handlers
- `validateToken()` - Validate JWT tokens
- `getSession()` - Convenience wrapper for server components
- `requireAuth()` - Throws error if not authenticated
- `isAuthenticated()` - Check authentication status

### Session Provider

The `SessionProvider` component (`web/src/lib/providers/auth-provider.tsx`) is a lightweight wrapper that:

- Initializes authentication state on mount
- Validates existing tokens
- Clears expired tokens
- Ensures proper session initialization

## Usage

### Client Components

```tsx
'use client'

import { useAuth } from '@/lib/auth'

export function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div>
      <p>Hello, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Server Components

```tsx
import { getSession } from '@/lib/auth/session-provider'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  return <div>Hello, {session.user.email}</div>
}
```

### Route Handlers

```tsx
import { getServerSession } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user: session.user })
}
```

### Login with 2FA Support

```tsx
'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login(email, password)
      
      if (result.type === '2fa_required') {
        // Redirect to 2FA verification
        router.push(`/auth/verify-2fa?email=${email}&userId=${result.userId}`)
        return
      }
      
      // Successful login
      router.push('/dashboard')
    } catch (error) {
      // Handle error
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      handleLogin(
        formData.get('email') as string,
        formData.get('password') as string
      )
    }}>
      {/* Form fields */}
    </form>
  )
}
```

## Provider Setup

The `SessionProvider` is already integrated into the app's provider tree in `web/src/lib/providers/index.tsx`:

```tsx
<QueryClientProvider client={queryClient}>
  <NuqsAdapter>
    <ThemeProvider attribute="class">
      <SessionProvider>
        <Toaster />
        {children}
      </SessionProvider>
    </ThemeProvider>
  </NuqsAdapter>
</QueryClientProvider>
```

## Features

### ✅ Token Management
- Access tokens stored in localStorage
- Refresh tokens stored in httpOnly cookies
- Automatic token refresh before expiry
- Token validation on initialization

### ✅ 2FA Support
- Detects 2FA requirement during login
- Redirects to 2FA verification page
- Handles TOTP codes and backup codes
- Stores tokens after successful 2FA verification

### ✅ Error Handling
- Account lockout detection (423 status)
- Invalid credentials with remaining attempts
- Network error handling
- Token expiration handling

### ✅ Security
- CSRF protection for all state-changing operations
- Secure token storage (httpOnly cookies for refresh tokens)
- Token blacklist checking
- Automatic logout on token refresh failure

## API Reference

### `useAuth()` Hook

Returns an `AuthContextType` object with:

- `user: AuthUser | null` - Current authenticated user
- `isLoading: boolean` - Loading state
- `isAuthenticated: boolean` - Authentication status
- `login(email: string, password: string): Promise<LoginResult>` - Login function
- `logout(): Promise<void>` - Logout function
- `refreshToken(): Promise<boolean>` - Refresh access token
- `updateUser(user: AuthUser | null): void` - Update user in cache

### `getSession()` (Server)

Returns `Promise<ServerSession | null>` - Current server session

### `requireAuth()` (Server)

Returns `Promise<ServerSession>` - Current server session, throws if not authenticated

### `isAuthenticated()` (Server)

Returns `Promise<boolean>` - Authentication status

## Token Lifecycle

1. **Login**: User logs in → Access token stored in localStorage → Refresh token stored in httpOnly cookie
2. **Token Refresh**: Access token expires → Automatically refreshed using refresh token → New tokens stored
3. **Logout**: Tokens cleared → Refresh token cookie deleted → User redirected to login

## Security Considerations

1. **XSS Protection**: Refresh tokens in httpOnly cookies cannot be accessed via JavaScript
2. **CSRF Protection**: All state-changing operations require CSRF tokens
3. **Token Rotation**: Refresh tokens are rotated on each use
4. **Token Blacklist**: Revoked tokens are checked against blacklist
5. **Automatic Cleanup**: Expired tokens are automatically cleared

## Troubleshooting

### Token Not Persisting
- Check browser localStorage is enabled
- Verify cookies are being set (check browser DevTools)
- Ensure CSRF token is being generated

### 2FA Not Working
- Verify backend returns 202 status with `X-Requires-2FA` header
- Check user ID is being passed in redirect URL
- Ensure 2FA verification endpoint is accessible

### Session Not Available on Server
- Verify `getServerSession()` is being called in Server Component or Route Handler
- Check JWT_SECRET environment variable is set
- Ensure access token is in cookies or Authorization header

