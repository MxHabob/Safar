# Authentication System Documentation

## Overview

This is a production-grade, custom authentication system for Next.js 16 (App Router) with React 19 and TypeScript. It implements industry-standard security practices including server-side token validation, CSRF protection, refresh token rotation, and rate limiting.

## Architecture

### Security Features

1. **Server-Side Token Validation**
   - JWT signature verification using `jose`
   - Expiry checking
   - Blacklist checking (via backend API)
   - Works in middleware, Server Components, and Route Handlers

2. **CSRF Protection (Double Submit Cookie Pattern)**
   - CSRF token stored in httpOnly cookie
   - Same token returned in response body
   - Required on all state-changing requests (POST, PUT, PATCH, DELETE)
   - Constant-time comparison to prevent timing attacks

3. **Refresh Token Rotation**
   - New refresh token issued on every refresh
   - Token family tracking for reuse detection
   - Automatic invalidation of token family on reuse

4. **Race Condition Prevention**
   - Global refresh queue ensures only one refresh at a time
   - Concurrent requests wait for the same refresh promise
   - Retry queue for failed requests during refresh

5. **Rate Limiting**
   - LRU cache-based rate limiting (in-memory)
   - Configurable limits per endpoint
   - IP-based identification
   - Automatic retry-after headers

6. **Secure Cookie Settings**
   - httpOnly cookies for refresh tokens
   - Secure flag in production
   - SameSite=Strict
   - Proper path and maxAge settings

## File Structure

```
src/lib/auth/
├── types.ts              # Type definitions
├── server.ts             # Server-side utilities (getServerSession, validateToken)
├── client.ts             # Client-side hooks (useAuth, useLogin, useLogout)
├── csrf.ts               # CSRF protection utilities
├── refresh-queue.ts      # Refresh token queue and retry system
├── rate-limiter.ts       # Rate limiting implementation
├── middleware.ts         # Middleware business logic
├── token-storage.ts      # Token storage utilities
├── auth-context.tsx      # Legacy context provider (deprecated)
├── index.ts              # Main exports
└── __tests__/            # Unit tests
    ├── csrf.test.ts
    ├── refresh-queue.test.ts
    └── rate-limiter.test.ts
```

## Usage

### Server Components

```tsx
import { getServerSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <div>Hello {session.user.email}</div>
}
```

### Route Handlers

```tsx
import { getServerSession } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return NextResponse.json({ user: session.user })
}
```

### Client Components

```tsx
'use client'

import { useAuth } from '@/lib/auth'

export default function ClientComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return (
    <div>
      <p>Hello {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Protected Layouts

```tsx
import { getServerSession } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

async function ProtectedContent({ children }) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/signin')
  }

  return <>{children}</>
}

export default function Layout({ children }) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProtectedContent>{children}</ProtectedContent>
    </Suspense>
  )
}
```

## API Routes

### `/api/auth/csrf-token` (GET)
Returns CSRF token for client-side use. Token is also stored in httpOnly cookie.

### `/api/auth/refresh` (POST)
Refreshes access token using refresh token from httpOnly cookie. Requires CSRF token.

### `/api/auth/set-refresh-token` (POST)
Sets refresh token in httpOnly cookie. Requires CSRF token.

### `/api/auth/clear-refresh-token` (POST)
Clears refresh token cookie. Requires CSRF token.

## Environment Variables

```env
# JWT Secret (must match backend)
JWT_SECRET=your-secret-key-here

# API Base URL
NEXT_PUBLIC_API_URL=https://api.example.com
API_URL=https://api.example.com

# Node Environment
NODE_ENV=production
```

## Security Considerations

### Token Storage
- **Access Token**: Stored in `localStorage` (short-lived, 30 minutes)
- **Refresh Token**: Stored in httpOnly cookie (long-lived, 7 days)
- **CSRF Token**: Stored in httpOnly cookie + returned in response body

### Cookie Security
- `httpOnly: true` - Prevents JavaScript access (XSS protection)
- `secure: true` in production - HTTPS only
- `sameSite: 'strict'` - CSRF protection
- Proper `path` and `maxAge` settings

### Token Validation
- Server-side validation in middleware
- Signature verification using `jose`
- Expiry checking
- Blacklist checking (via backend)

### CSRF Protection
- Double Submit Cookie Pattern
- Required on all state-changing operations
- Constant-time comparison

### Rate Limiting
- IP-based identification
- Configurable limits per endpoint
- Automatic retry-after headers

## Testing

Run tests with:

```bash
npm test
```

Tests cover:
- CSRF token generation and verification
- Refresh queue race condition prevention
- Rate limiting functionality

## Migration from Old System

1. **Update imports**: Change from `@/lib/auth/auth-context` to `@/lib/auth`
2. **Use Server Components**: Replace client-side auth checks with `getServerSession()`
3. **Update middleware**: The new middleware automatically handles auth, CSRF, and rate limiting
4. **Add CSRF tokens**: All state-changing requests now require CSRF token in header

## Troubleshooting

### "Invalid CSRF token" errors
- Ensure CSRF token is fetched before making requests
- Check that `X-CSRF-Token` header is set correctly
- Verify cookie settings allow CSRF cookie

### Token refresh failures
- Check that refresh token cookie is set
- Verify backend refresh endpoint is working
- Check network connectivity

### Rate limiting issues
- Check IP identification (x-forwarded-for header)
- Verify rate limit configuration
- Consider using Redis for distributed rate limiting

## Best Practices

1. **Always use Server Components** for auth checks when possible
2. **Use Suspense boundaries** around auth-dependent content
3. **Handle loading states** during token refresh
4. **Clear tokens on logout** (both client and server)
5. **Monitor rate limit violations** for security threats
6. **Rotate JWT secret** regularly in production
7. **Use HTTPS** in production (required for secure cookies)

## License

MIT

