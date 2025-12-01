# Authentication Implementation Guide

## Overview

A complete custom authentication system has been implemented following security best practices. This system integrates seamlessly with your existing backend JWT authentication and frontend stack.

## Architecture

```
┌─────────────────────────────────────────┐
│         React Components                 │
│  (Login, Register, Protected Routes)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Auth Hooks                       │
│  (useLogin, useLogout, useRegister)     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Auth Context                     │
│  (AuthProvider, useAuth)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      React Query                         │
│  (Data fetching & caching)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Token Storage                       │
│  (localStorage + httpOnly cookies)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      API Client                          │
│  (Generated clients with interceptors)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Backend API                         │
│  (FastAPI with JWT)                      │
└──────────────────────────────────────────┘
```

## Components Implemented

### 1. Token Storage (`lib/auth/token-storage.ts`)

**Security Strategy**:
- **Access Token**: Stored in `localStorage` (short-lived, 30 minutes)
- **Refresh Token**: Stored in `httpOnly` cookie (long-lived, 7 days)

**Features**:
- Automatic expiry checking
- Secure token management
- Time-until-expiry calculation

### 2. Auth Context (`lib/auth/auth-context.tsx`)

**Features**:
- React Context for global auth state
- React Query integration for data fetching
- Automatic token refresh before expiry
- User data caching
- Error handling and retry logic

**Usage**:
```tsx
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  // Use auth state and methods
}
```

### 3. Auth Hooks (`lib/auth/hooks.ts`)

**Available Hooks**:
- `useLogin()` - Login functionality
- `useLogout()` - Logout functionality
- `useRegister()` - User registration
- `usePasswordResetRequest()` - Request password reset
- `usePasswordReset()` - Reset password with code
- `usePasswordChange()` - Change password (authenticated)
- `useEmailVerification()` - Verify email with code
- `useResendVerificationEmail()` - Resend verification email
- `useOAuthLogin()` - OAuth login (Google, Apple)

**Usage**:
```tsx
import { useLogin } from '@/lib/auth'

function LoginForm() {
  const login = useLogin()
  
  const handleSubmit = async (email: string, password: string) => {
    await login.mutateAsync({ email, password })
  }
}
```

### 4. Protected Route Component (`components/auth/protected-route.tsx`)

**Features**:
- Route protection wrapper
- Automatic redirect to login
- Loading states
- HOC support

**Usage**:
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

### 5. API Routes

**Refresh Token Route** (`app/api/auth/refresh/route.ts`):
- Server-side token refresh
- Uses httpOnly cookie for refresh token
- Returns new access token

**Set Refresh Token Route** (`app/api/auth/set-refresh-token/route.ts`):
- Sets refresh token in httpOnly cookie
- Secure cookie configuration

**Clear Refresh Token Route** (`app/api/auth/clear-refresh-token/route.ts`):
- Removes refresh token cookie
- Used on logout

### 6. API Client Interceptors (`lib/auth/api-interceptor.ts`)

**Features**:
- Automatic auth header injection
- Token refresh on 401 errors
- Retry logic for failed requests
- Integrated with generated API clients

### 7. Next.js Middleware (`middleware.ts`)

**Features**:
- Route protection at edge
- Public/protected route configuration
- Token validation
- Automatic redirects

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://safar.mulverse.com
API_URL=https://safar.mulverse.com
```

### 2. Root Layout Integration

The `AuthProvider` and `QueryClientProvider` are already integrated in `app/layout.tsx`.

### 3. Using Authentication

#### Login Example:
```tsx
'use client'

import { useLogin } from '@/lib/auth'
import { useState } from 'react'

export default function LoginPage() {
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login.mutateAsync({ email, password })
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

#### Protected Route Example:
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Dashboard Content</div>
    </ProtectedRoute>
  )
}
```

#### Access User Data:
```tsx
'use client'

import { useAuth } from '@/lib/auth'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      <h1>Welcome, {user.first_name || user.email}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  )
}
```

## Security Features

### ✅ Implemented

1. **Secure Token Storage**
   - Access token in localStorage (short-lived)
   - Refresh token in httpOnly cookie (not accessible to JavaScript)

2. **Automatic Token Refresh**
   - Refreshes 5 minutes before expiry
   - Automatic retry on 401 errors
   - Seamless user experience

3. **Route Protection**
   - Client-side protection via components
   - Server-side protection via middleware
   - Automatic redirects

4. **Error Handling**
   - Graceful error handling
   - Automatic logout on token expiry
   - User-friendly error messages

5. **CSRF Protection**
   - httpOnly cookies prevent XSS attacks
   - SameSite cookie attribute
   - Secure flag in production

## Best Practices Followed

1. **Token Management**
   - Short-lived access tokens (30 minutes)
   - Long-lived refresh tokens (7 days)
   - Automatic refresh before expiry

2. **Security**
   - httpOnly cookies for refresh tokens
   - Secure flag in production
   - SameSite protection
   - No token exposure in URLs

3. **Performance**
   - React Query caching
   - Optimistic updates
   - Minimal re-renders

4. **Developer Experience**
   - Type-safe with TypeScript
   - Easy-to-use hooks
   - Clear error messages
   - Comprehensive documentation

## API Integration

The authentication system automatically integrates with your generated API clients:

```tsx
import { apiClient } from '@/generated/client'
import { useAuth } from '@/lib/auth'

// Auth headers are automatically added
const response = await apiClient.users.getCurrentUserApiV1UsersMeGet()
```

## Testing

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Access protected route (should redirect if not authenticated)
- [ ] Token refresh on expiry
- [ ] Logout clears tokens
- [ ] Register new user
- [ ] Password reset flow
- [ ] Email verification

## Troubleshooting

### Token Not Refreshing
- Check browser console for errors
- Verify API route `/api/auth/refresh` is accessible
- Check refresh token cookie is set

### Redirect Loop
- Verify middleware configuration
- Check public routes are correctly configured
- Ensure token storage is working

### 401 Errors
- Verify token is being sent in headers
- Check token expiry
- Verify backend is accepting tokens

## Next Steps

1. **Create Auth Pages**:
   - `/auth/signin` - Login page
   - `/auth/signup` - Registration page
   - `/auth/forgot-password` - Password reset request
   - `/auth/reset-password` - Password reset form
   - `/auth/verify-email` - Email verification

2. **Add OAuth Integration**:
   - Google OAuth button
   - Apple OAuth button
   - OAuth callback handling

3. **Enhance UX**:
   - Loading states
   - Error messages
   - Success notifications
   - Form validation

## Support

For issues or questions, refer to:
- `AUTHENTICATION_RECOMMENDATION.md` - Architecture decisions
- `AUTHENTICATION_ANALYSIS.md` - Backend analysis
- Code comments in implementation files

---

**Status**: ✅ Complete and Ready for Use
**Last Updated**: 2024

