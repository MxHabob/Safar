# دليل سريع لـ Safar API - مرجع سريع

## 📋 جميع الـ Endpoints المتاحة

### 🔐 المصادقة والأمان (Users)
```
POST   /api/v1/users/register                    - التسجيل
POST   /api/v1/users/login                        - تسجيل الدخول
POST   /api/v1/users/refresh                     - تحديث Token
GET    /api/v1/users/me                          - معلومات المستخدم
PUT    /api/v1/users/me                          - تحديث الملف الشخصي
POST   /api/v1/users/oauth/login                 - تسجيل الدخول عبر OAuth
POST   /api/v1/users/otp/request                  - طلب OTP
POST   /api/v1/users/otp/verify                   - التحقق من OTP
POST   /api/v1/users/logout                      - تسجيل الخروج
POST   /api/v1/users/logout-all                  - تسجيل الخروج من جميع الأجهزة
POST   /api/v1/users/password/reset/request       - طلب إعادة تعيين كلمة المرور
POST   /api/v1/users/password/reset               - إعادة تعيين كلمة المرور
POST   /api/v1/users/password/change              - تغيير كلمة المرور
POST   /api/v1/users/email/verify                 - التحقق من البريد
POST   /api/v1/users/email/resend-verification    - إعادة إرسال التحقق
POST   /api/v1/users/login/2fa/verify             - التحقق من 2FA عند الدخول
POST   /api/v1/users/2fa/setup                    - إعداد 2FA
POST   /api/v1/users/2fa/verify                   - التحقق من إعداد 2FA
GET    /api/v1/users/2fa/status                   - حالة 2FA
POST   /api/v1/users/2fa/disable                  - تعطيل 2FA
POST   /api/v1/users/2fa/backup-codes/regenerate  - إعادة توليد رموز النسخ الاحتياطي
GET    /api/v1/users/data-export                  - تصدير البيانات
POST   /api/v1/users/account/delete                - حذف الحساب
POST   /api/v1/users/users/devices/register       - تسجيل جهاز
GET    /api/v1/users/users/devices                - قائمة الأجهزة
DELETE /api/v1/users/users/devices/{device_id}    - حذف جهاز
PATCH  /api/v1/users/users/devices/{device_id}/trust - تحديد جهاز كموثوق
```

### 🏠 العقارات (Listings)
```
GET    /api/v1/listings                          - قائمة العقارات (مع تصفية)
GET    /api/v1/listings/{id}                     - تفاصيل عقار
POST   /api/v1/listings                          - إنشاء عقار جديد
PUT    /api/v1/listings/{id}                     - تحديث عقار
DELETE /api/v1/listings/{id}                     - حذف عقار
POST   /api/v1/listings/{id}/location            - إضافة/تحديث الموقع
GET    /api/v1/premium-listings/featured         - العقارات المميزة
GET    /api/v1/premium-listings/premium          - العقارات المدفوعة
POST   /api/v1/premium-listings/{id}/upgrade      - ترقية عقار
POST   /api/v1/premium-listings/{id}/feature     - جعل عقار مميز
GET    /api/v1/premium-listings/pricing           - أسعار الترقية
```

### 📅 الحجوزات (Bookings)
```
POST   /api/v1/bookings                          - إنشاء حجز جديد
GET    /api/v1/bookings                          - قائمة حجوزات المستخدم
GET    /api/v1/bookings/{id}                     - تفاصيل حجز
POST   /api/v1/bookings/{id}/cancel              - إلغاء حجز
POST   /api/v1/bookings/{id}/confirm             - تأكيد حجز
POST   /api/v1/bookings/{id}/complete            - إكمال حجز
GET    /api/v1/bookings/host/listings            - حجوزات المضيف
```

### 💳 المدفوعات (Payments)
```
POST   /api/v1/payments/intent                    - إنشاء نية دفع
POST   /api/v1/payments/process                   - معالجة الدفع
POST   /api/v1/webhooks/stripe                    - Webhook من Stripe
```

### ⭐ التقييمات (Reviews)
```
POST   /api/v1/reviews                           - إنشاء تقييم
GET    /api/v1/reviews/listings/{id}             - تقييمات عقار
GET    /api/v1/reviews/{id}                      - تفاصيل تقييم
POST   /api/v1/reviews/{id}/response             - رد المضيف
POST   /api/v1/reviews/{id}/helpful              - تصنيف كمفيد
```

### 🔍 البحث (Search)
```
GET    /api/v1/search/listings                   - بحث العقارات
GET    /api/v1/search/suggestions                 - اقتراحات البحث
```

### 💬 الرسائل (Messages)
```
POST   /api/v1/messages                          - إرسال رسالة
GET    /api/v1/messages/conversations             - قائمة المحادثات
POST   /api/v1/messages/conversations            - إنشاء محادثة
GET    /api/v1/messages/conversations/{id}       - تفاصيل محادثة
GET    /api/v1/messages/conversations/{id}/messages - رسائل محادثة
POST   /api/v1/messages/conversations/{id}/read  - تحديد محادثة كمقروءة
POST   /api/v1/messages/{id}/read                - تحديد رسالة كمقروءة
WebSocket /ws                                     - اتصال WebSocket
```

### 🤖 مخطّط الرحلات بالذكاء الاصطناعي (AI Trip Planner)
```
POST   /api/v1/ai/travel-planner                 - إنشاء خطة سفر
GET    /api/v1/ai/travel-planner                 - قائمة الخطط
GET    /api/v1/ai/travel-planner/{id}            - تفاصيل خطة
```

### 🎁 العروض والكوبونات (Promotions)
```
POST   /api/v1/promotions/coupons                - إنشاء كوبون
GET    /api/v1/promotions/coupons                - قائمة الكوبونات
GET    /api/v1/promotions/coupons/{code}/validate - التحقق من كوبون
GET    /api/v1/promotions/applicable             - العروض المتاحة
```

### 🎯 الولاء والنقاط (Loyalty)
```
GET    /api/v1/loyalty/status                    - حالة برنامج الولاء
POST   /api/v1/loyalty/redeem                    - استبدال النقاط
GET    /api/v1/loyalty/redemption-options        - خيارات الاستبدال
GET    /api/v1/loyalty/history                    - تاريخ النقاط
```

### 🔔 الإشعارات (Notifications)
```
POST   /api/v1/notifications/push/send           - إرسال إشعار Push
POST   /api/v1/notifications/push/bulk            - إرسال جماعي
```

### 💡 التوصيات (Recommendations)
```
GET    /api/v1/recommendations/for-me            - توصيات شخصية
GET    /api/v1/recommendations/similar/{id}      - عقارات مشابهة
GET    /api/v1/recommendations/trending          - الأكثر شعبية
GET    /api/v1/recommendations/ml/for-me         - توصيات ML
GET    /api/v1/recommendations/ml/explain/{id}    - شرح التوصية
POST   /api/v1/recommendations/ml/train          - تدريب النموذج
```

### 📚 دليل السفر (Travel Guides)
```
POST   /api/v1/travel-guides                     - إنشاء دليل
POST   /api/v1/travel-guides/{id}/publish        - نشر دليل
GET    /api/v1/travel-guides                     - قائمة الأدلة
GET    /api/v1/travel-guides/{id}                - تفاصيل دليل
POST   /api/v1/travel-guides/{id}/bookmark       - حفظ دليل
POST   /api/v1/travel-guides/{id}/like           - إعجاب بدليل
POST   /api/v1/travel-guides/stories             - إنشاء قصة
POST   /api/v1/travel-guides/stories/{id}/publish - نشر قصة
GET    /api/v1/travel-guides/stories             - قائمة القصص
GET    /api/v1/travel-guides/stories/{id}        - تفاصيل قصة
```

### 💎 الاشتراكات (Subscriptions)
```
GET    /api/v1/subscriptions/plans                - خطط الاشتراك
GET    /api/v1/subscriptions/my-subscription     - اشتراكي الحالي
POST   /api/v1/subscriptions/subscribe           - الاشتراك
POST   /api/v1/subscriptions/{id}/cancel         - إلغاء الاشتراك
GET    /api/v1/subscriptions/usage/{type}       - استخدام الميزات
```

### 🏢 Multi-Tenancy
```
GET    /api/v1/tenancy/tenant                    - معلومات المستأجر
POST   /api/v1/tenancy/tenant                    - إنشاء مستأجر
PUT    /api/v1/tenancy/tenant/{id}/branding      - تحديث العلامة التجارية
POST   /api/v1/tenancy/tenant/{id}/domain        - إضافة نطاق
POST   /api/v1/tenancy/tenant/domain/verify      - التحقق من النطاق
GET    /api/v1/tenancy/tenant/{id}/config        - التكوين
PUT    /api/v1/tenancy/tenant/{id}/config        - تحديث التكوين
```

### 📁 الملفات (Files)
```
POST   /api/v1/files/upload                      - رفع ملف واحد
POST   /api/v1/files/upload-multiple             - رفع ملفات متعددة
```

### 📊 التحليلات (Analytics)
```
GET    /api/v1/analytics/audit-logs              - سجلات التدقيق
GET    /api/v1/analytics/audit-logs/{id}         - تفاصيل سجل
GET    /api/v1/analytics/audit-logs/stats/summary - إحصائيات
```

---

## 🎯 أمثلة استخدام سريعة

### 1. تسجيل الدخول
```typescript
import { loginApiV1UsersLoginPost } from '@/generated/actions/users'

const result = await loginApiV1UsersLoginPost({
  email: 'user@example.com',
  password: 'password123'
})

// حفظ Token
localStorage.setItem('access_token', result.data.access_token)
```

### 2. البحث عن عقارات
```typescript
import { useSearchListings } from '@/generated/hooks/search'

const { data } = useSearchListings({
  city: 'Cairo',
  min_price: 50,
  max_price: 200,
  min_guests: 2,
  sort_by: 'price_asc'
})
```

### 3. إنشاء حجز
```typescript
import { createBookingApiV1BookingsPost } from '@/generated/actions/bookings'

const result = await createBookingApiV1BookingsPost({
  listing_id: 'LST123',
  check_in: '2025-06-01',
  check_out: '2025-06-05',
  guests: 2
})
```

### 4. إنشاء خطة سفر بالذكاء الاصطناعي
```typescript
import { createTravelPlanApiV1AiTravelPlannerPost } from '@/generated/actions/aiTravelPlanner'

const result = await createTravelPlanApiV1AiTravelPlannerPost({
  destination: 'Paris',
  start_date: '2025-06-01',
  end_date: '2025-06-06',
  budget: 3000,
  currency: 'USD',
  travelers_count: 2,
  travel_style: 'family',
  natural_language_request: 'رحلة عائلية لباريس لمدة 5 أيام بميزانية 3000 دولار'
})
```

### 5. التحقق من كوبون
```typescript
import { validateCouponApiV1PromotionsCouponsCouponCodeValidateGet } from '@/generated/actions/promotions'

const result = await validateCouponApiV1PromotionsCouponsCouponCodeValidateGet({
  coupon_code: 'SUMMER2025',
  booking_id: 'BKG123',
  amount: 500
})

if (result.data.valid) {
  console.log('الخصم:', result.data.discount_amount)
}
```

### 6. استبدال نقاط الولاء
```typescript
import { redeemPointsApiV1LoyaltyRedeemPost } from '@/generated/actions/loyalty'

const result = await redeemPointsApiV1LoyaltyRedeemPost({
  points: 1000,
  booking_id: 'BKG123'
})
```

---

## 🔑 مفاتيح البيئة المهمة

```env
# API
API_V1_PREFIX=/api/v1
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# Redis
REDIS_URL=redis://:password@host:6379/0

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
APPLE_CLIENT_ID=...

# AI
OPENAI_API_KEY=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Storage
STORAGE_TYPE=s3
S3_BUCKET_NAME=...
CDN_BASE_URL=https://cdn.example.com
```

---

## 📦 الملفات المولدة المتاحة

### Hooks (React Query)
- `@/generated/hooks/users` - مصادقة ومستخدمين
- `@/generated/hooks/listings` - عقارات
- `@/generated/hooks/bookings` - حجوزات
- `@/generated/hooks/search` - بحث
- `@/generated/hooks/messages` - رسائل
- `@/generated/hooks/payments` - مدفوعات
- `@/generated/hooks/reviews` - تقييمات
- `@/generated/hooks/promotions` - عروض
- `@/generated/hooks/loyalty` - ولاء
- `@/generated/hooks/aiTravelPlanner` - مخطّط رحلات
- `@/generated/hooks/recommendations` - توصيات
- `@/generated/hooks/notifications` - إشعارات
- `@/generated/hooks/travelGuides` - أدلة سفر
- `@/generated/hooks/subscriptions` - اشتراكات
- `@/generated/hooks/analytics` - تحليلات

### Actions (Server Actions)
- نفس القائمة أعلاه ولكن في `@/generated/actions/`

### Client (API Client)
- `@/generated/client` - API Client classes

### Schemas (Zod)
- `@/generated/schemas` - Zod schemas للتحقق

---

## 🚀 نصائح سريعة

1. **استخدم Hooks للاستعلامات**: `useQuery`, `useMutation`
2. **استخدم Actions للعمليات**: `createBookingAction`, `updateListingAction`
3. **استخدم WebSocket للرسائل الفورية**: `/ws`
4. **استخدم Infinite Queries للقوائم الطويلة**
5. **استخدم Optimistic Updates لتحسين UX**
6. **استخدم Error Boundaries لمعالجة الأخطاء**
7. **استخدم React Suspense للتحميل التدريجي**

---

## 📚 المزيد من المعلومات

- **التحليل الشامل**: راجع `FEATURES_ANALYSIS_AR.md`
- **API Documentation**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

