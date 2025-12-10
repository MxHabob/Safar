# نظام المصادقة الجديد - Authentication System

## نظرة عامة

تم إعادة بناء نظام المصادقة بالكامل من الصفر ليكون:
- ✅ متوافق مع Next.js 16.0.7
- ✅ متوافق مع الباك اند الجديد (Session Management + IP Blocking + MFA Encryption)
- ✅ أداء أفضل من NextAuth
- ✅ أفضل ممارسات الأمان
- ✅ كود احترافي ومنظم

---

## البنية (Architecture)

```
web/src/lib/auth/
├── core/
│   ├── session-store.ts      # Session storage (in-memory, upgradeable to Redis)
│   └── token-manager.ts      # Token management (cookies, validation)
├── server/
│   ├── session.ts            # Server session management
│   └── actions.ts            # Server Actions (login, register, logout, etc.)
├── client/
│   └── provider.tsx          # React Query Auth Provider
├── oauth/
│   └── handlers.ts           # OAuth 2.0 with PKCE
├── middleware.ts            # Next.js middleware for route protection
└── index.ts                 # Centralized exports
```

---

## المميزات الرئيسية

### 1. Session Management
- **In-memory session store** (قابل للترقية إلى Redis)
- **Automatic cleanup** للجلسات المنتهية
- **Session tracking** لكل مستخدم
- **Device info tracking** (browser, OS, IP)

### 2. Token Management
- **Secure httpOnly cookies** (XSS protection)
- **Automatic token refresh** قبل انتهاء الصلاحية
- **Token validation** بدون API calls
- **CSRF protection** مع SameSite cookies

### 3. Server Actions
- **Next.js 16.0.7 Server Actions**
- **Type-safe** مع TypeScript
- **Error handling** محسّن
- **Session synchronization** مع الباك اند

### 4. Client Provider
- **React Query** للـ caching المحسّن
- **Automatic refetching** عند الحاجة
- **Optimistic updates** للـ UX أفضل
- **Token refresh automation**

### 5. OAuth 2.0
- **PKCE support** (RFC 7636)
- **State validation** للـ CSRF protection
- **Multiple providers** (Google, Apple, Facebook, GitHub)
- **Secure code exchange**

### 6. Middleware
- **Lightweight validation** (لا API calls)
- **Route protection** تلقائي
- **Redirect handling** للمستخدمين غير المصرح لهم
- **Performance optimized**

---

## الاستخدام (Usage)

### Server-Side

#### Get Current Session
```typescript
import { getServerSession } from '@/lib/auth'

// In Server Component or Server Action
const session = await getServerSession()
if (session) {
  console.log(session.user.email)
}
```

#### Require Authentication
```typescript
import { requireAuth } from '@/lib/auth'

// Throws or redirects if not authenticated
const session = await requireAuth()
```

#### Get Current User
```typescript
import { getCurrentUser } from '@/lib/auth'

const user = await getCurrentUser()
```

### Client-Side

#### Use Auth Hook
```typescript
'use client'

import { useAuth } from '@/lib/auth'

export function MyComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  
  if (!isAuthenticated) {
    return <button onClick={() => login({ email, password })}>Login</button>
  }
  
  return <div>Welcome, {user?.email}</div>
}
```

#### Login
```typescript
const { login } = useAuth()

const result = await login({
  email: 'user@example.com',
  password: 'password123'
})

if (result.requires2FA) {
  // Redirect to 2FA verification
}
```

#### Register
```typescript
const { register } = useAuth()

const result = await login({
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
})
```

#### Logout
```typescript
const { logout } = useAuth()

await logout() // Clears session and redirects to /login
```

### OAuth

#### Initiate OAuth
```typescript
import { initiateOAuth } from '@/lib/auth'

// In Server Action or Route Handler
const authUrl = await initiateOAuth('google', '/dashboard')
redirect(authUrl)
```

#### OAuth Button (Client)
```typescript
'use client'

export function OAuthButton({ provider }: { provider: 'google' | 'apple' | 'facebook' | 'github' }) {
  const handleClick = () => {
    window.location.href = `/api/auth/oauth/${provider}`
  }
  
  return <button onClick={handleClick}>Login with {provider}</button>
}
```

---

## API Routes

### GET /api/auth/session
Returns current session data.

**Response:**
```json
{
  "user": {
    "id": "USR123",
    "email": "user@example.com",
    ...
  },
  "sessionId": "session_token_here",
  "expiresAt": 1234567890
}
```

### GET /api/auth/oauth/[provider]
Initiates OAuth flow for the specified provider.

**Providers:** `google`, `apple`, `facebook`, `github`

### GET /api/auth/oauth/callback/[provider]
Handles OAuth callback and completes authentication.

---

## Middleware

Middleware automatically:
- ✅ Validates tokens (lightweight, no API calls)
- ✅ Protects routes (redirects to `/login` if not authenticated)
- ✅ Redirects authenticated users away from auth pages
- ✅ Handles public routes

**Protected Routes:**
- `/account/*`
- `/dashboard/*`
- `/admin/*`
- `/bookings/*`
- `/messages/*`
- `/notifications/*`
- `/payments/*`
- `/subscriptions/*`

**Auth Routes (redirect if authenticated):**
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/verify-2fa`

---

## التوافق مع الباك اند

### Login Response
```typescript
interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  expires_in: number
  user: UserResponse
  session_id: string  // New: Session ID from backend
}
```

### Session Management
- ✅ Session ID في tokens
- ✅ Session validation في refresh
- ✅ Session activity updates
- ✅ Session revocation support

### Security Features
- ✅ IP Blocking (handled by backend)
- ✅ Account Lockout (handled by backend)
- ✅ MFA Encryption (handled by backend)
- ✅ Token Blacklisting (handled by backend)

---

## الأداء (Performance)

### Optimizations
1. **React Query Caching**
   - `staleTime: 5 minutes` - Data stays fresh
   - `gcTime: 10 minutes` - Cache persists
   - `refetchOnWindowFocus: true` - Fresh data on focus

2. **Session Store**
   - In-memory cache (fast)
   - Automatic cleanup (every 5 minutes)
   - No database queries for session lookup

3. **Token Validation**
   - JWT decoding only (no API calls)
   - Lightweight middleware
   - No network requests

4. **Server Actions**
   - Direct backend calls
   - No API route overhead
   - Type-safe with generated types

### Comparison with NextAuth
- ✅ **Faster**: No database queries for session lookup
- ✅ **Lighter**: No heavy dependencies
- ✅ **More Control**: Full control over authentication flow
- ✅ **Better Performance**: Optimized caching and session management
- ✅ **Type-Safe**: Full TypeScript support with generated types

---

## الأمان (Security)

### Cookie Security
- ✅ `httpOnly: true` - XSS protection
- ✅ `secure: true` (production) - HTTPS only
- ✅ `sameSite: 'lax'` - CSRF protection
- ✅ Proper expiration handling

### Token Security
- ✅ JWT validation
- ✅ Expiration checking
- ✅ Automatic refresh
- ✅ Token rotation on refresh

### OAuth Security
- ✅ PKCE (RFC 7636)
- ✅ State validation (CSRF protection)
- ✅ Secure code exchange
- ✅ Proper redirect handling

### Session Security
- ✅ Session ID in tokens
- ✅ Session validation
- ✅ Session revocation
- ✅ Device tracking

---

## الترقية للإنتاج (Production Upgrade)

### Redis Session Store
للإنتاج مع multiple servers، يجب ترقية session store إلى Redis:

```typescript
// web/src/lib/auth/core/session-store-redis.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

class RedisSessionStore {
  async create(sessionId: string, data: SessionData, maxAge: number) {
    await redis.setex(
      `session:${sessionId}`,
      Math.floor(maxAge / 1000),
      JSON.stringify(data)
    )
  }
  
  async get(sessionId: string): Promise<SessionData | null> {
    const data = await redis.get(`session:${sessionId}`)
    return data ? JSON.parse(data) : null
  }
  
  // ... other methods
}
```

### Environment Variables
```bash
# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/oauth/callback/google

APPLE_CLIENT_ID=your_apple_client_id
APPLE_REDIRECT_URI=https://yourdomain.com/api/auth/oauth/callback/apple

FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/auth/oauth/callback/facebook

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/oauth/callback/github

# Redis (optional, for production)
REDIS_URL=redis://localhost:6379
```

---

## Migration Guide

### من النظام القديم

1. **Update Imports**
```typescript
// Old
import { useAuth } from '@/lib/auth/client'
import { getServerSession } from '@/lib/auth/server'

// New (same, but paths changed)
import { useAuth } from '@/lib/auth'
import { getServerSession } from '@/lib/auth'
```

2. **Update Components**
- Components using `useAuth()` should work without changes
- Server components using `getServerSession()` should work without changes

3. **Update OAuth**
```typescript
// Old
import { initiateOAuth } from '@/lib/auth/oauth'

// New
import { initiateOAuth } from '@/lib/auth'
```

---

## Testing

### Unit Tests
```typescript
import { validateToken } from '@/lib/auth/core/token-manager'

test('validates token correctly', () => {
  const token = 'valid.jwt.token'
  const result = validateToken(token)
  expect(result.valid).toBe(true)
})
```

### Integration Tests
```typescript
import { loginAction } from '@/lib/auth/server/actions'

test('login creates session', async () => {
  const result = await loginAction({
    email: 'test@example.com',
    password: 'password123'
  })
  expect(result.success).toBe(true)
})
```

---

## الخلاصة

النظام الجديد يوفر:
- ✅ **أداء أفضل** من NextAuth
- ✅ **أمان أعلى** مع أفضل الممارسات
- ✅ **سهولة الاستخدام** مع TypeScript
- ✅ **مرونة كاملة** للتحكم في flow
- ✅ **توافق كامل** مع الباك اند الجديد

جميع الملفات القديمة تم حذفها واستبدالها بنظام جديد منظم واحترافي.

