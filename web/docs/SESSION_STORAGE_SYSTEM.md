# نظام تخزين الجلسة - مشابه لـ auth.js

## نظرة عامة

تم إنشاء نظام تخزين جلسة متقدم مشابه لـ auth.js يوفر:
- **Session Storage** - تخزين الجلسات في memory cache (يمكن ترقيته لـ Redis)
- **Session Management** - إدارة كاملة للجلسات مع session tokens
- **Session Expiration** - إدارة انتهاء صلاحية الجلسات تلقائياً
- **Multi-device Support** - دعم عدة جلسات لنفس المستخدم

## المكونات

### 1. Session Store (`session-store.ts`)

نظام تخزين الجلسات في memory:

```typescript
interface SessionData {
  sessionToken: string
  userId: string
  user: GetCurrentUserInfoApiV1UsersMeGetResponse
  expires: Date
  createdAt: Date
  updatedAt: Date
}
```

**الميزات:**
- تخزين الجلسات في memory cache
- تتبع الجلسات لكل مستخدم
- تنظيف تلقائي للجلسات المنتهية
- دعم عدة جلسات لنفس المستخدم

### 2. Session Management في `server.ts`

تم تحسين `getServerSession()` لاستخدام session store:

**الأولوية:**
1. **Session Store** (سريع، مخزن) - إذا كانت الجلسة موجودة في الـ store
2. **JWT Token** - التحقق من الـ token وجلب البيانات من API إذا لزم الأمر
3. **Token Refresh** - تحديث الـ token تلقائياً إذا انتهت صلاحيته

### 3. Session Cookies

تم إضافة `session-token` cookie:
- **httpOnly** - حماية من XSS
- **Secure** - في الإنتاج
- **SameSite=lax** - حماية من CSRF
- **MaxAge** - 30 يوم افتراضياً

## الاستخدام

### الحصول على الجلسة

```typescript
import { getServerSession } from '@/lib/auth/server'

const session = await getServerSession()
if (session) {
  console.log(session.user)
  console.log(session.sessionToken)
}
```

### تحديث الجلسة

```typescript
import { updateSession } from '@/lib/auth/server'

// عند تحديث بيانات المستخدم
await updateSession(updatedUser)
```

### إلغاء جميع الجلسات

```typescript
import { invalidateUserSessions } from '@/lib/auth/server'

// إلغاء جميع جلسات المستخدم (مفيد عند تسجيل الخروج من جميع الأجهزة)
await invalidateUserSessions(userId)
```

### الحصول على جميع الجلسات النشطة

```typescript
import { getUserSessions } from '@/lib/auth/server'

const sessions = await getUserSessions(userId)
console.log(`User has ${sessions.length} active sessions`)
```

## الفوائد

### 1. الأداء
- **تقليل استدعاءات API** - الجلسات مخزنة محلياً
- **استجابة أسرع** - لا حاجة لجلب البيانات في كل مرة
- **React Cache** - تخزين مؤقت في نفس الطلب

### 2. الأمان
- **Session Tokens** - رموز جلسة آمنة
- **HttpOnly Cookies** - حماية من XSS
- **Session Expiration** - انتهاء صلاحية تلقائي
- **Session Invalidation** - إمكانية إلغاء الجلسات

### 3. المرونة
- **Multi-device** - دعم عدة أجهزة
- **Session Management** - إدارة كاملة للجلسات
- **Backward Compatible** - متوافق مع النظام القديم

## الترقية المستقبلية

### Redis Storage

يمكن ترقية النظام لاستخدام Redis بدلاً من memory:

```typescript
// في session-store.ts
import Redis from 'ioredis'

class RedisSessionStore {
  private redis: Redis
  
  async create(sessionToken: string, userId: string, user: User, maxAge: number) {
    await this.redis.setex(
      `session:${sessionToken}`,
      Math.floor(maxAge / 1000),
      JSON.stringify({ userId, user, ... })
    )
  }
  
  // ... باقي الدوال
}
```

### Database Storage

أو استخدام قاعدة البيانات:

```typescript
// إنشاء جدول sessions في قاعدة البيانات
// تخزين الجلسات مع userId, sessionToken, expires, userData
```

## المقارنة مع auth.js

| الميزة | auth.js | نظامنا |
|--------|---------|--------|
| Session Storage | Database/Redis | Memory (قابل للترقية) |
| Session Tokens | ✅ | ✅ |
| Session Expiration | ✅ | ✅ |
| Multi-device | ✅ | ✅ |
| Session Invalidation | ✅ | ✅ |
| React Cache | ✅ | ✅ |
| JWT Support | ✅ | ✅ |

## أفضل الممارسات

1. **استخدام Session Store أولاً** - أسرع وأكثر كفاءة
2. **تحديث الجلسة عند تغيير البيانات** - استخدام `updateSession()`
3. **إلغاء الجلسات عند الحاجة** - للأمان
4. **مراقبة عدد الجلسات** - لتجنب الاستخدام المفرط

## ملاحظات

- **Memory Storage** - مناسب للتطوير والاختبار
- **Production** - يُنصح باستخدام Redis أو Database
- **Scalability** - Memory storage لا يعمل مع عدة خوادم
- **Persistence** - Memory storage لا يبقى بعد إعادة التشغيل

## المراجع

- [Auth.js Documentation](https://authjs.dev/)
- [Next.js Session Management](https://nextjs.org/docs/app/building-your-application/authentication)
- [React Cache](https://react.dev/reference/react/cache)

