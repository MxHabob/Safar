# نظام المصادقة والأمان (Authentication & Security)

## 🔒 نظام الحماية

### النموذج الأمني (Security Model)

**القاعدة الأساسية:** جميع الصفحات محمية افتراضياً وتتطلب مصادقة.

**الاستثناءات:**
1. **صفحات المصادقة العامة** - مسموحة بدون مصادقة:
   - `/login`
   - `/register`
   - `/forgot-password`
   - `/reset-password`
   - `/verify-email`
   - `/verify-2fa`

2. **المسارات المستثناة** - لا يتم فحصها:
   - `/_next/*` - Next.js internal files
   - `/api/*` - API routes
   - `/favicon.ico`
   - `/public/*` - Public files
   - `/static/*` - Static files
   - `/health` - Health check
   - `/robots.txt`
   - `/sitemap.xml`
   - ملفات ثابتة (`.png`, `.jpg`, `.css`, `.js`, etc.)

## 🛡️ آلية العمل

### 1. Middleware Flow

```
Request → proxy.ts → authMiddleware → Response
```

### 2. Authentication Check

```typescript
// 1. Check if path is excluded (skip auth check)
if (isExcludedPath(pathname)) {
  return null // Allow access
}

// 2. Check if path is public auth path
if (isAuthPath(pathname)) {
  if (isAuthenticated) {
    // Redirect authenticated users away from auth pages
    return redirect('/')
  }
  // Allow unauthenticated users to access auth pages
  return null
}

// 3. ALL other paths require authentication
if (!isAuthenticated) {
  // Redirect to login with redirect parameter
  return redirect('/login?redirect=' + pathname)
}

// 4. User is authenticated - allow access
return null
```

### 3. Token Validation

- يتم التحقق من JWT token من cookies
- التحقق من expiration
- لا يتم إجراء API calls (lightweight validation)

## 📋 المسارات المحمية

### جميع المسارات التالية تتطلب مصادقة:

- `/` - Dashboard الرئيسي
- `/users` - إدارة المستخدمين
- `/users/[id]` - تفاصيل المستخدم
- `/listings` - إدارة القوائم
- `/listings/[id]` - تفاصيل القائمة
- `/bookings` - إدارة الحجوزات
- `/bookings/[id]` - تفاصيل الحجز
- `/payments` - إدارة المدفوعات
- `/payments/[id]` - تفاصيل الدفعة
- أي مسار آخر غير مستثنى

## 🔐 Security Headers

يتم إضافة Security Headers تلقائياً:

- `X-Frame-Options: SAMEORIGIN` - منع clickjacking
- `X-Content-Type-Options: nosniff` - منع MIME sniffing
- `X-XSS-Protection: 1; mode=block` - حماية من XSS
- `Referrer-Policy: origin-when-cross-origin` - تحكم في referrer
- `Content-Security-Policy` - سياسة أمان المحتوى
- `Strict-Transport-Security` - HSTS (في production فقط)

## 🚀 السلوك المتوقع

### مستخدم غير مصادق عليه:
1. محاولة الوصول إلى `/` → إعادة توجيه إلى `/login?redirect=/`
2. محاولة الوصول إلى `/users` → إعادة توجيه إلى `/login?redirect=/users`
3. الوصول إلى `/login` → مسموح ✅

### مستخدم مصادق عليه:
1. الوصول إلى `/` → مسموح ✅
2. الوصول إلى `/users` → مسموح ✅
3. الوصول إلى `/login` → إعادة توجيه إلى `/` (أو redirect parameter)

## 🔧 التخصيص

### إضافة مسار عام جديد:

```typescript
// في middleware.ts
function isAuthPath(pathname: string): boolean {
  const authPaths = [
    '/login',
    '/register',
    '/your-public-path', // أضف هنا
  ]
  return authPaths.some(path => pathname === path || pathname.startsWith(path + '/'))
}
```

### إضافة مسار مستثنى:

```typescript
// في middleware.ts
function isExcludedPath(pathname: string): boolean {
  const excludedPaths = [
    '/_next',
    '/api',
    '/your-excluded-path', // أضف هنا
  ]
  return excludedPaths.some(path => pathname.startsWith(path))
}
```

## ⚠️ ملاحظات مهمة

1. **الافتراضي هو الحماية** - جميع المسارات محمية إلا ما تم استثناؤه
2. **لا توجد مسارات عامة افتراضية** - فقط صفحات المصادقة
3. **Token Validation** - يتم التحقق من JWT بدون API calls
4. **Redirect Preservation** - يتم حفظ المسار المطلوب في query parameter

## 🧪 الاختبار

### اختبار الحماية:

1. **افتح المتصفح في وضع Incognito**
2. **حاول الوصول إلى `/`** → يجب إعادة التوجيه إلى `/login`
3. **حاول الوصول إلى `/users`** → يجب إعادة التوجيه إلى `/login?redirect=/users`
4. **سجل الدخول** → يجب إعادة التوجيه إلى `/users` (من redirect parameter)

### اختبار الصفحات العامة:

1. **افتح `/login` بدون مصادقة** → يجب أن يعمل ✅
2. **سجل الدخول** → يجب إعادة التوجيه إلى `/`
3. **افتح `/login` بعد المصادقة** → يجب إعادة التوجيه إلى `/`

---

**آخر تحديث:** 2024
**Status:** ✅ All Routes Protected by Default

