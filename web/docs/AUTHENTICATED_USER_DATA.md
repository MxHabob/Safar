# بيانات المستخدم المصادق - دليل شامل

## 📍 مواقع تخزين بيانات المستخدم

### 1. **Session Store (In-Memory Cache)**
**الموقع**: `web/src/lib/auth/core/session-store.ts`

**ما يتم تخزينه**:
```typescript
interface SessionData {
  sessionId: string
  userId: string
  user: GetCurrentUserInfoApiV1UsersMeGetResponse  // بيانات المستخدم الكاملة
  accessToken: string
  refreshToken: string
  expiresAt: number
  createdAt: number
  lastActivity: number
  deviceInfo?: { browser?, os?, device? }
  ipAddress?: string
  userAgent?: string
}
```

**الاستخدام**:
- تخزين مؤقت في الذاكرة (Memory)
- أسرع طريقة للوصول إلى بيانات المستخدم
- يتم تنظيفها تلقائياً عند انتهاء الصلاحية
- **ملاحظة**: في Production، يجب الترقية إلى Redis للخوادم المتعددة

**كيفية الوصول**:
```typescript
import { sessionStore } from '@/lib/auth/core/session-store'

// الحصول على session
const session = sessionStore.get(sessionId)
const user = session?.user

// الحصول على جميع sessions للمستخدم
const userSessions = sessionStore.getSessionsForUser(userId)
```

---

### 2. **HTTP-Only Cookies**
**الموقع**: `web/src/lib/auth/core/token-manager.ts`

**ما يتم تخزينه**:
- `auth-token`: Access Token (JWT)
- `refresh-token`: Refresh Token
- `session-id`: Session ID

**الخصائص**:
- `httpOnly: true` - محمية من JavaScript (XSS protection)
- `secure: true` (في Production) - HTTPS only
- `sameSite: 'lax'` - CSRF protection

**كيفية الوصول** (Server-Side فقط):
```typescript
import { getAccessToken, getRefreshToken, getSessionId } from '@/lib/auth/core/token-manager'

// في Server Components أو Server Actions
const accessToken = await getAccessToken()
const refreshToken = await getRefreshToken()
const sessionId = await getSessionId()
```

---

### 3. **React Query Cache (Client-Side)**
**الموقع**: `web/src/lib/auth/client/provider.tsx`

**ما يتم تخزينه**:
- بيانات المستخدم من API (`/api/v1/users/me`)
- يتم تخزينها في React Query cache
- Query Key: `['getCurrentUserInfoApiV1UsersMeGet']`

**كيفية الوصول** (Client-Side):
```typescript
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Not authenticated</div>
  
  return <div>Welcome, {user?.email}</div>
}
```

---

## 🔍 طرق الوصول إلى بيانات المستخدم

### **Client-Side (React Components)**

#### 1. استخدام `useAuth()` Hook
```typescript
import { useAuth } from '@/lib/auth'

function MyComponent() {
  const { 
    user,              // بيانات المستخدم الكاملة
    isLoading,         // حالة التحميل
    isAuthenticated,   // هل المستخدم مصادق؟
    login,             // دالة تسجيل الدخول
    logout,            // دالة تسجيل الخروج
    updateUser,        // تحديث بيانات المستخدم في cache
  } = useAuth()
  
  return (
    <div>
      {user && (
        <div>
          <p>Email: {user.email}</p>
          <p>Name: {user.first_name} {user.last_name}</p>
          <p>Role: {user.role}</p>
        </div>
      )}
    </div>
  )
}
```

#### 2. استخدام React Query Hook مباشرة
```typescript
import { useGetCurrentUserInfoApiV1UsersMeGet } from '@/generated/hooks/users'

function MyComponent() {
  const { data: user, isLoading, error } = useGetCurrentUserInfoApiV1UsersMeGet({
    enabled: true,
  })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>User: {user?.email}</div>
}
```

---

### **Server-Side (Server Components / Server Actions)**

#### 1. استخدام `getServerSession()`
```typescript
import { getServerSession } from '@/lib/auth/server/session'

export default async function MyServerComponent() {
  const session = await getServerSession()
  
  if (!session) {
    return <div>Not authenticated</div>
  }
  
  return (
    <div>
      <p>User: {session.user.email}</p>
      <p>Session ID: {session.sessionId}</p>
    </div>
  )
}
```

#### 2. استخدام `getCurrentUser()` (Convenience Function)
```typescript
import { getCurrentUser } from '@/lib/auth/server/session'

export default async function MyServerComponent() {
  const user = await getCurrentUser()
  
  if (!user) {
    return <div>Not authenticated</div>
  }
  
  return <div>User: {user.email}</div>
}
```

#### 3. استخدام `requireAuth()` (مع Redirect تلقائي)
```typescript
import { requireAuth } from '@/lib/auth/server/session'

export default async function ProtectedPage() {
  // إذا لم يكن المستخدم مصادق، سيتم redirect تلقائياً إلى /login
  const session = await requireAuth()
  
  return <div>Welcome, {session.user.email}</div>
}
```

#### 4. الوصول المباشر إلى Session Store
```typescript
import { sessionStore } from '@/lib/auth/core/session-store'
import { getSessionId } from '@/lib/auth/core/token-manager'

export default async function MyServerComponent() {
  const sessionId = await getSessionId()
  
  if (!sessionId) {
    return <div>No session</div>
  }
  
  const session = sessionStore.get(sessionId)
  
  if (!session) {
    return <div>Session expired</div>
  }
  
  return <div>User: {session.user.email}</div>
}
```

---

## 🔄 تدفق البيانات

### **عند تسجيل الدخول**:
```
1. User submits login form
   ↓
2. useLoginApiV1UsersLoginPostMutation calls backend
   ↓
3. Backend returns AuthResponse (access_token, refresh_token, user)
   ↓
4. onSuccess callback:
   - sessionStore.create() → تخزين في Memory
   - setTokensAction() → تخزين في Cookies
   ↓
5. React Query refetch → تحديث cache
   ↓
6. useAuth() returns updated user data
```

### **عند الوصول إلى بيانات المستخدم**:

**Client-Side**:
```
1. useAuth() hook
   ↓
2. useGetCurrentUserInfoApiV1UsersMeGet
   ↓
3. React Query cache check
   ↓
4. If not cached → API call to /api/v1/users/me
   ↓
5. Return user data
```

**Server-Side**:
```
1. getServerSession()
   ↓
2. Check sessionStore (Priority 1 - Fastest)
   ↓
3. If not found → Validate tokens from cookies
   ↓
4. Return session with user data
```

---

## 📊 هيكل بيانات المستخدم

```typescript
interface GetCurrentUserInfoApiV1UsersMeGetResponse {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: 'guest' | 'host' | 'admin' | 'super_admin' | 'agency'
  is_email_verified: boolean
  is_phone_verified: boolean
  avatar_url?: string
  date_of_birth?: string
  gender?: string
  nationality?: string
  city?: any
  // ... المزيد من الحقول
}
```

---

## 🔐 الأمان

### **Session Store**:
- ✅ In-memory فقط (لا يتم تخزين على القرص)
- ✅ تنظيف تلقائي للـ sessions المنتهية
- ⚠️ في Production: يجب استخدام Redis للخوادم المتعددة

### **Cookies**:
- ✅ `httpOnly: true` - محمية من JavaScript
- ✅ `secure: true` - HTTPS only في Production
- ✅ `sameSite: 'lax'` - CSRF protection

### **React Query Cache**:
- ✅ يتم تنظيفها تلقائياً عند logout
- ✅ يتم invalidate عند تحديث البيانات

---

## 🛠️ تحديث بيانات المستخدم

### **Client-Side**:
```typescript
const { updateUser } = useAuth()

// تحديث بيانات المستخدم في cache
updateUser(newUserData)
```

### **Server-Side**:
```typescript
import { updateSession } from '@/lib/auth/server/session'

await updateSession(sessionId, {
  user: newUserData
})
```

---

## 📝 ملاحظات مهمة

1. **Session Store** هو الأسرع ولكن مؤقت (in-memory)
2. **Cookies** تحتوي على tokens فقط، وليس بيانات المستخدم الكاملة
3. **React Query Cache** يتم تحديثها تلقائياً عند refetch
4. في Production، يجب استخدام Redis بدلاً من in-memory store
5. بيانات المستخدم الحساسة يجب أن تكون في `httpOnly` cookies فقط

---

## 🔗 الملفات ذات الصلة

- `web/src/lib/auth/core/session-store.ts` - Session Store
- `web/src/lib/auth/core/token-manager.ts` - Token Management
- `web/src/lib/auth/client/provider.tsx` - Client-Side Auth Provider
- `web/src/lib/auth/server/session.ts` - Server-Side Session Management
- `web/src/lib/auth/server/actions.ts` - Server Actions

