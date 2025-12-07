# تحليل شامل لميزات Backend Safar API

## نظرة عامة

Safar API هو منصة سفر متكاملة وحديثة مبنية باستخدام FastAPI و PostgreSQL، مصممة لتوفير قدرات متقدمة مماثلة (وأكثر) من Airbnb.

---

## 📋 قائمة الميزات الكاملة

### 1. نظام المصادقة والأمان (Authentication & Security)

#### الميزات المتاحة:
- ✅ **التسجيل وال登录**: إنشاء حساب جديد وتسجيل الدخول
- ✅ **JWT Tokens**: نظام tokens آمن مع refresh tokens
- ✅ **OAuth2**: تسجيل الدخول عبر:
  - Google
  - Apple
  - Facebook
  - GitHub
- ✅ **OTP (One-Time Password)**: تسجيل الدخول برسائل SMS
- ✅ **Two-Factor Authentication (2FA)**: المصادقة الثنائية مع:
  - إعداد 2FA
  - رموز النسخ الاحتياطي
  - إعادة توليد الرموز
- ✅ **إدارة الأجهزة**: تسجيل وإدارة الأجهزة الموثوقة
- ✅ **إعادة تعيين كلمة المرور**: عبر البريد الإلكتروني
- ✅ **تغيير كلمة المرور**: للمستخدمين المسجلين
- ✅ **التحقق من البريد الإلكتروني**: إرسال وإعادة إرسال رموز التحقق
- ✅ **تسجيل الخروج**: تسجيل الخروج من جهاز واحد أو جميع الأجهزة
- ✅ **GDPR Compliance**: 
  - تصدير بيانات المستخدم
  - حذف الحساب

#### Endpoints الرئيسية:
```
POST   /api/v1/users/register          - التسجيل
POST   /api/v1/users/login             - تسجيل الدخول
POST   /api/v1/users/refresh           - تحديث Token
GET    /api/v1/users/me                - معلومات المستخدم الحالي
PUT    /api/v1/users/me                - تحديث الملف الشخصي
POST   /api/v1/users/oauth/login       - تسجيل الدخول عبر OAuth
POST   /api/v1/users/otp/request        - طلب OTP
POST   /api/v1/users/otp/verify         - التحقق من OTP
POST   /api/v1/users/2fa/setup         - إعداد 2FA
POST   /api/v1/users/2fa/verify         - التحقق من 2FA
POST   /api/v1/users/data-export        - تصدير البيانات
POST   /api/v1/users/account/delete     - حذف الحساب
```

---

### 2. إدارة العقارات (Listings Management)

#### الميزات المتاحة:
- ✅ **CRUD كامل**: إنشاء، قراءة، تحديث، حذف العقارات
- ✅ **أنواع متعددة**: شقق، منازل، فنادق، إلخ
- ✅ **إدارة الصور**: رفع وإدارة صور متعددة للعقار
- ✅ **الموقع الجغرافي**: إضافة وتحديث موقع العقار (PostGIS)
- ✅ **المرافق (Amenities)**: إضافة مرافق للعقار
- ✅ **الحالة (Status)**: إدارة حالة العقار (نشط، غير نشط، محجوز)
- ✅ **Premium Listings**: ترقية العقارات للمستوى المميز
- ✅ **Featured Listings**: عرض العقارات المميزة
- ✅ **التصفية المتقدمة**: حسب المدينة، الدولة، النوع، السعر، عدد الضيوف

#### Endpoints الرئيسية:
```
GET    /api/v1/listings                - قائمة العقارات (مع تصفية)
GET    /api/v1/listings/{id}           - تفاصيل عقار
POST   /api/v1/listings                - إنشاء عقار جديد
PUT    /api/v1/listings/{id}            - تحديث عقار
DELETE /api/v1/listings/{id}           - حذف عقار
POST   /api/v1/listings/{id}/location   - إضافة/تحديث الموقع
GET    /api/v1/premium-listings/featured - العقارات المميزة
POST   /api/v1/premium-listings/{id}/upgrade - ترقية عقار
```

---

### 3. نظام الحجوزات (Bookings System)

#### الميزات المتاحة:
- ✅ **إنشاء حجوزات**: حجوزات فورية أو بانتظار الموافقة
- ✅ **إدارة الحجوزات**: عرض، تحديث، إلغاء الحجوزات
- ✅ **حالات الحجز**: معلق، مؤكد، مكتمل، ملغي
- ✅ **Timeline Events**: تتبع أحداث الحجز
- ✅ **حجوزات المضيف**: عرض حجوزات المضيفين
- ✅ **تأكيد الحجز**: تأكيد الحجوزات من قبل المضيف
- ✅ **إكمال الحجز**: إتمام الحجز بعد الإقامة

#### Endpoints الرئيسية:
```
POST   /api/v1/bookings                - إنشاء حجز جديد
GET    /api/v1/bookings                - قائمة حجوزات المستخدم
GET    /api/v1/bookings/{id}           - تفاصيل حجز
POST   /api/v1/bookings/{id}/cancel    - إلغاء حجز
POST   /api/v1/bookings/{id}/confirm   - تأكيد حجز
POST   /api/v1/bookings/{id}/complete  - إكمال حجز
GET    /api/v1/bookings/host/listings  - حجوزات المضيف
```

---

### 4. نظام الدفع (Payments System)

#### الميزات المتاحة:
- ✅ **Payment Intents**: إنشاء نوايا الدفع
- ✅ **معالجة المدفوعات**: معالجة المدفوعات بشكل آمن
- ✅ **طرق دفع متعددة**: 
  - Stripe
  - PayPal
  - Fawry (مصر)
  - Klarna
  - M-Pesa (كينيا)
- ✅ **Idempotency**: منع المعالجة المكررة
- ✅ **Webhooks**: استقبال إشعارات من بوابات الدفع

#### Endpoints الرئيسية:
```
POST   /api/v1/payments/intent         - إنشاء نية دفع
POST   /api/v1/payments/process         - معالجة الدفع
POST   /api/v1/webhooks/stripe         - Webhook من Stripe
```

---

### 5. نظام التقييمات والمراجعات (Reviews System)

#### الميزات المتاحة:
- ✅ **إنشاء تقييمات**: تقييم العقارات بعد الإقامة
- ✅ **تقييمات متعددة**: تقييم العقار، المضيف، الموقع
- ✅ **ردود المضيف**: إمكانية رد المضيف على التقييمات
- ✅ **تصنيف "مفيد"**: المستخدمون يمكنهم تصنيف التقييمات كمفيدة
- ✅ **الاعتدال**: نظام اعتماد التقييمات
- ✅ **كشف الاحتيال**: كشف التقييمات المزيفة باستخدام AI

#### Endpoints الرئيسية:
```
POST   /api/v1/reviews                 - إنشاء تقييم
GET    /api/v1/reviews/listings/{id}   - تقييمات عقار
GET    /api/v1/reviews/{id}            - تفاصيل تقييم
POST   /api/v1/reviews/{id}/response   - رد المضيف
POST   /api/v1/reviews/{id}/helpful    - تصنيف كمفيد
```

---

### 6. نظام البحث المتقدم (Advanced Search)

#### الميزات المتاحة:
- ✅ **بحث نصي كامل**: بحث في أسماء ووصف العقارات
- ✅ **تصفية متقدمة**: 
  - المدينة، الدولة
  - نوع العقار
  - نطاق السعر
  - عدد الضيوف، غرف النوم، الحمامات
  - البحث الجغرافي (Latitude/Longitude + Radius)
- ✅ **ترتيب متقدم**:
  - حسب الصلة (Relevance)
  - حسب السعر (تصاعدي/تنازلي)
  - حسب التقييم
  - حسب الأحدث
  - حسب الشعبية
- ✅ **Personalization Boost**: تعزيز النتائج حسب تاريخ المستخدم
- ✅ **Popularity Boost**: تعزيز النتائج حسب الشعبية
- ✅ **Location Boost**: تعزيز النتائج حسب القرب من الموقع
- ✅ **A/B Testing**: اختبار خوارزميات الترتيب
- ✅ **Search Suggestions**: اقتراحات البحث

#### Endpoints الرئيسية:
```
GET    /api/v1/search/listings         - بحث العقارات
GET    /api/v1/search/suggestions      - اقتراحات البحث
```

---

### 7. نظام الرسائل والدردشة (Messaging System)

#### الميزات المتاحة:
- ✅ **إرسال الرسائل**: إرسال رسائل بين المستخدمين
- ✅ **المحادثات (Conversations)**: تنظيم الرسائل في محادثات
- ✅ **WebSocket**: رسائل فورية عبر WebSocket
- ✅ **قراءة الرسائل**: تتبع الرسائل المقروءة
- ✅ **ملخص المحادثات**: عرض ملخص للمحادثات

#### Endpoints الرئيسية:
```
POST   /api/v1/messages               - إرسال رسالة
GET    /api/v1/messages/conversations  - قائمة المحادثات
POST   /api/v1/messages/conversations  - إنشاء محادثة
GET    /api/v1/messages/conversations/{id} - تفاصيل محادثة
GET    /api/v1/messages/conversations/{id}/messages - رسائل محادثة
POST   /api/v1/messages/{id}/read     - تحديد رسالة كمقروءة
WebSocket /ws                          - اتصال WebSocket للرسائل الفورية
```

---

### 8. مخطّط الرحلات بالذكاء الاصطناعي (AI Trip Planner)

#### الميزات المتاحة:
- ✅ **تخطيط ذكي**: إنشاء خطط سفر من طلبات باللغة الطبيعية
- ✅ **تكامل مع OpenAI**: استخدام GPT لإنشاء الخطط
- ✅ **معايير متعددة**:
  - الوجهة
  - تاريخ البداية والنهاية
  - الميزانية
  - العملة
  - عدد المسافرين
  - أسلوب السفر (عائلي، رومانسي، مغامر، إلخ)
  - التفضيلات الشخصية
- ✅ **حفظ الخطط**: حفظ الخطط للمستخدمين
- ✅ **عرض الخطط**: عرض قائمة الخطط المحفوظة

#### Endpoints الرئيسية:
```
POST   /api/v1/ai/travel-planner       - إنشاء خطة سفر
GET    /api/v1/ai/travel-planner       - قائمة الخطط
GET    /api/v1/ai/travel-planner/{id}  - تفاصيل خطة
```

---

### 9. نظام العروض والخصومات (Promotions & Discounts)

#### الميزات المتاحة:
- ✅ **كوبونات**: إنشاء وإدارة كوبونات الخصم
- ✅ **أنواع الخصم**: 
  - نسبة مئوية
  - مبلغ ثابت
- ✅ **شروط متقدمة**:
  - حد أدنى للشراء
  - حد أقصى للخصم
  - عدد مرات الاستخدام
  - عدد مرات الاستخدام لكل مستخدم
  - تاريخ البداية والنهاية
  - تطبيق على عقارات محددة
  - تطبيق على مستخدمين محددين
- ✅ **Flash Sales**: عروض محدودة الوقت
- ✅ **خصومات جماعية**: خصومات للجماعات
- ✅ **التحقق من الكوبونات**: التحقق من صحة الكوبونات
- ✅ **العروض القابلة للتطبيق**: عرض العروض المتاحة للمستخدم

#### Endpoints الرئيسية:
```
POST   /api/v1/promotions/coupons       - إنشاء كوبون
GET    /api/v1/promotions/coupons       - قائمة الكوبونات
GET    /api/v1/promotions/coupons/{code}/validate - التحقق من كوبون
GET    /api/v1/promotions/applicable    - العروض المتاحة
```

---

### 10. نظام الولاء والنقاط (Loyalty & Points)

#### الميزات المتاحة:
- ✅ **نظام النقاط**: كسب النقاط من الحجوزات
- ✅ **المستويات (Tiers)**: مستويات مختلفة (برونزي، فضي، ذهبي، بلاتيني)
- ✅ **استبدال النقاط**: استبدال النقاط بخصومات
- ✅ **تاريخ المعاملات**: تتبع كسب واستخدام النقاط
- ✅ **خيارات الاستبدال**: عرض خيارات استبدال النقاط

#### Endpoints الرئيسية:
```
GET    /api/v1/loyalty/status          - حالة برنامج الولاء
POST   /api/v1/loyalty/redeem          - استبدال النقاط
GET    /api/v1/loyalty/redemption-options - خيارات الاستبدال
GET    /api/v1/loyalty/history         - تاريخ النقاط
```

---

### 11. نظام الإشعارات (Notifications System)

#### الميزات المتاحة:
- ✅ **إشعارات متعددة القنوات**:
  - البريد الإلكتروني
  - Push Notifications (FCM)
  - SMS (Twilio)
  - In-App Notifications
- ✅ **إرسال جماعي**: إرسال إشعارات لعدة مستخدمين
- ✅ **قوالب الإشعارات**: قوالب جاهزة للإشعارات
- ✅ **تفضيلات المستخدم**: تخصيص أنواع الإشعارات

#### Endpoints الرئيسية:
```
POST   /api/v1/notifications/push/send - إرسال إشعار Push
POST   /api/v1/notifications/push/bulk  - إرسال جماعي
```

---

### 12. نظام التوصيات (Recommendations System)

#### الميزات المتاحة:
- ✅ **توصيات شخصية**: توصيات مخصصة لكل مستخدم
- ✅ **عقارات مشابهة**: إيجاد عقارات مشابهة لعقار معين
- ✅ **الأكثر شعبية**: عرض العقارات الأكثر شعبية
- ✅ **Machine Learning**: استخدام ML لتحسين التوصيات
- ✅ **شرح التوصيات**: شرح سبب التوصية

#### Endpoints الرئيسية:
```
GET    /api/v1/recommendations/for-me   - توصيات شخصية
GET    /api/v1/recommendations/similar/{id} - عقارات مشابهة
GET    /api/v1/recommendations/trending - الأكثر شعبية
GET    /api/v1/recommendations/ml/for-me - توصيات ML
GET    /api/v1/recommendations/ml/explain/{id} - شرح التوصية
```

---

### 13. دليل السفر (Travel Guides)

#### الميزات المتاحة:
- ✅ **إنشاء أدلة**: إنشاء أدلة سفر للمدن
- ✅ **النشر**: نشر الأدلة للعامة
- ✅ **الإشارات المرجعية**: حفظ الأدلة المفضلة
- ✅ **الإعجابات**: إعجاب بالأدلة
- ✅ **قصص المستخدمين**: إنشاء قصص سفر
- ✅ **نشر القصص**: نشر القصص

#### Endpoints الرئيسية:
```
POST   /api/v1/travel-guides           - إنشاء دليل
POST   /api/v1/travel-guides/{id}/publish - نشر دليل
GET    /api/v1/travel-guides            - قائمة الأدلة
GET    /api/v1/travel-guides/{id}       - تفاصيل دليل
POST   /api/v1/travel-guides/{id}/bookmark - حفظ دليل
POST   /api/v1/travel-guides/{id}/like  - إعجاب بدليل
POST   /api/v1/travel-guides/stories    - إنشاء قصة
```

---

### 14. نظام الاشتراكات (Subscriptions System)

#### الميزات المتاحة:
- ✅ **خطط الاشتراك**: خطط مختلفة للاشتراك
- ✅ **الاشتراك**: الاشتراك في خطة
- ✅ **إلغاء الاشتراك**: إلغاء الاشتراك
- ✅ **تتبع الاستخدام**: تتبع استخدام الميزات

#### Endpoints الرئيسية:
```
GET    /api/v1/subscriptions/plans     - خطط الاشتراك
GET    /api/v1/subscriptions/my-subscription - اشتراكي الحالي
POST   /api/v1/subscriptions/subscribe - الاشتراك
POST   /api/v1/subscriptions/{id}/cancel - إلغاء الاشتراك
GET    /api/v1/subscriptions/usage/{type} - استخدام الميزات
```

---

### 15. نظام Multi-Tenancy (Multi-Tenancy)

#### الميزات المتاحة:
- ✅ **إدارة المستأجرين**: إدارة عدة وكالات سفر
- ✅ **العلامة التجارية**: تخصيص العلامة التجارية لكل مستأجر
- ✅ **النطاقات المخصصة**: ربط نطاقات مخصصة
- ✅ **التكوين**: تكوين مخصص لكل مستأجر

#### Endpoints الرئيسية:
```
GET    /api/v1/tenancy/tenant          - معلومات المستأجر
POST   /api/v1/tenancy/tenant          - إنشاء مستأجر
PUT    /api/v1/tenancy/tenant/{id}/branding - تحديث العلامة التجارية
POST   /api/v1/tenancy/tenant/{id}/domain - إضافة نطاق
GET    /api/v1/tenancy/tenant/{id}/config - التكوين
```

---

### 16. نظام الملفات (Files System)

#### الميزات المتاحة:
- ✅ **رفع الملفات**: رفع ملف واحد أو متعدد
- ✅ **التخزين المتعدد**: 
  - Local Storage
  - S3
  - MinIO
  - Cloudinary
- ✅ **CDN Integration**: تكامل مع CDN (Cloudflare, CloudFront)
- ✅ **تحسين الصور**: تحسين الصور تلقائياً

#### Endpoints الرئيسية:
```
POST   /api/v1/files/upload            - رفع ملف واحد
POST   /api/v1/files/upload-multiple    - رفع ملفات متعددة
```

---

### 17. نظام التحليلات (Analytics System)

#### الميزات المتاحة:
- ✅ **سجلات التدقيق**: تتبع جميع العمليات
- ✅ **إحصائيات**: إحصائيات شاملة
- ✅ **مراقبة الأداء**: مراقبة أداء النظام

#### Endpoints الرئيسية:
```
GET    /api/v1/analytics/audit-logs    - سجلات التدقيق
GET    /api/v1/analytics/audit-logs/{id} - تفاصيل سجل
GET    /api/v1/analytics/audit-logs/stats/summary - إحصائيات
```

---

## 🏗️ كيفية بناء تطبيق Web يستفيد من هذه الميزات

### 1. استخدام الكود المولد (Generated Code)

المجلد `web/src/generated` يحتوي على:
- **Hooks**: React Query hooks جاهزة للاستخدام
- **Actions**: Server Actions للاستخدام مع Next.js
- **Client**: API Client classes
- **Schemas**: Zod schemas للتحقق من البيانات

#### مثال على الاستخدام:

```typescript
// استخدام Hook
import { useListings } from '@/generated/hooks/listings'

function ListingsPage() {
  const { data, isLoading } = useListings({
    city: 'Cairo',
    limit: 20
  })
  
  if (isLoading) return <Loading />
  
  return (
    <div>
      {data?.items.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}

// استخدام Action
import { createBookingAction } from '@/generated/actions/bookings'

async function BookButton({ listingId }) {
  const handleBook = async () => {
    const result = await createBookingAction({
      listing_id: listingId,
      check_in: '2025-06-01',
      check_out: '2025-06-05',
      guests: 2
    })
    
    if (result.data) {
      // نجحت العملية
      router.push(`/bookings/${result.data.id}`)
    }
  }
  
  return <button onClick={handleBook}>احجز الآن</button>
}
```

---

### 2. هيكلة التطبيق (Application Structure)

#### هيكل مقترح:

```
web/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # صفحات المصادقة
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-email/
│   ├── (main)/            # الصفحات الرئيسية
│   │   ├── listings/      # قائمة العقارات
│   │   ├── listings/[id]/ # تفاصيل عقار
│   │   ├── bookings/      # الحجوزات
│   │   ├── messages/      # الرسائل
│   │   └── profile/       # الملف الشخصي
│   └── api/               # API Routes (إذا لزم الأمر)
├── features/              # Features (Feature-based structure)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   ├── listings/
│   ├── bookings/
│   ├── search/
│   └── ai-trip-planner/
├── components/            # Components مشتركة
│   ├── ui/               # UI Components (shadcn/ui)
│   ├── layout/           # Layout Components
│   └── shared/           # Shared Components
├── lib/                  # Utilities
│   ├── auth.ts          # Auth utilities
│   ├── api.ts           # API configuration
│   └── utils.ts         # General utilities
└── generated/           # Generated code (لا تعدل)
```

---

### 3. صفحات رئيسية مقترحة

#### أ. الصفحة الرئيسية (Home Page)
```typescript
// app/(main)/page.tsx
import { useListings } from '@/generated/hooks/listings'
import { useRecommendations } from '@/generated/hooks/recommendations'
import { SearchBar } from '@/features/search/components/search-bar'
import { FeaturedListings } from '@/features/listings/components/featured-listings'

export default function HomePage() {
  const { data: featured } = useListings({ featured: true, limit: 6 })
  const { data: recommendations } = useRecommendations()
  
  return (
    <div>
      <HeroSection />
      <SearchBar />
      <FeaturedListings listings={featured} />
      <RecommendedListings listings={recommendations} />
      <TravelGuidesSection />
    </div>
  )
}
```

#### ب. صفحة البحث (Search Page)
```typescript
// app/(main)/search/page.tsx
'use client'

import { useSearchListings } from '@/generated/hooks/search'
import { useQueryStates } from 'nuqs'
import { SearchFilters } from '@/features/search/components/filters'
import { SearchResults } from '@/features/search/components/results'

export default function SearchPage() {
  const [params, setParams] = useQueryStates({
    query: parseAsString,
    city: parseAsString,
    minPrice: parseAsInteger,
    maxPrice: parseAsInteger,
    guests: parseAsInteger,
  })
  
  const { data, isLoading } = useSearchListings({
    query: params.query,
    city: params.city,
    min_price: params.minPrice,
    max_price: params.maxPrice,
    min_guests: params.guests,
  })
  
  return (
    <div className="grid grid-cols-4 gap-4">
      <aside>
        <SearchFilters params={params} onParamsChange={setParams} />
      </aside>
      <main className="col-span-3">
        <SearchResults listings={data?.items} loading={isLoading} />
      </main>
    </div>
  )
}
```

#### ج. صفحة تفاصيل العقار (Listing Details)
```typescript
// app/(main)/listings/[id]/page.tsx
import { useListing } from '@/generated/hooks/listings'
import { useListingReviews } from '@/generated/hooks/reviews'
import { useSimilarListings } from '@/generated/hooks/recommendations'
import { BookingForm } from '@/features/bookings/components/booking-form'
import { ReviewsSection } from '@/features/reviews/components/reviews-section'

export default function ListingPage({ params }) {
  const { data: listing } = useListing(params.id)
  const { data: reviews } = useListingReviews(params.id)
  const { data: similar } = useSimilarListings(params.id)
  
  return (
    <div>
      <ListingGallery images={listing?.images} />
      <ListingInfo listing={listing} />
      <BookingForm listing={listing} />
      <ReviewsSection reviews={reviews} />
      <SimilarListings listings={similar} />
    </div>
  )
}
```

#### د. صفحة الحجوزات (Bookings Page)
```typescript
// app/(main)/bookings/page.tsx
import { useBookings } from '@/generated/hooks/bookings'
import { BookingCard } from '@/features/bookings/components/booking-card'

export default function BookingsPage() {
  const { data: bookings } = useBookings()
  
  return (
    <div>
      <h1>حجوزاتي</h1>
      <div className="grid gap-4">
        {bookings?.items.map(booking => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  )
}
```

#### هـ. صفحة الرسائل (Messages Page)
```typescript
// app/(main)/messages/page.tsx
'use client'

import { useConversations } from '@/generated/hooks/messages'
import { useWebSocket } from '@/lib/websocket'
import { ConversationList } from '@/features/messages/components/conversation-list'
import { MessageThread } from '@/features/messages/components/message-thread'

export default function MessagesPage() {
  const { data: conversations } = useConversations()
  const [selectedConversation, setSelectedConversation] = useState(null)
  
  // الاتصال بـ WebSocket للرسائل الفورية
  useWebSocket('/ws', {
    onMessage: (message) => {
      // تحديث الرسائل عند وصول رسالة جديدة
      queryClient.invalidateQueries(['conversations'])
    }
  })
  
  return (
    <div className="flex h-screen">
      <aside className="w-1/3">
        <ConversationList 
          conversations={conversations}
          onSelect={setSelectedConversation}
        />
      </aside>
      <main className="flex-1">
        {selectedConversation && (
          <MessageThread conversationId={selectedConversation.id} />
        )}
      </main>
    </div>
  )
}
```

#### و. صفحة مخطّط الرحلات بالذكاء الاصطناعي (AI Trip Planner)
```typescript
// app/(main)/ai-trip-planner/page.tsx
'use client'

import { useState } from 'react'
import { useCreateTravelPlan } from '@/generated/hooks/aiTravelPlanner'
import { TravelPlanForm } from '@/features/ai-trip-planner/components/form'
import { TravelPlanResult } from '@/features/ai-trip-planner/components/result'

export default function AITripPlannerPage() {
  const [plan, setPlan] = useState(null)
  const createPlan = useCreateTravelPlan()
  
  const handleSubmit = async (formData) => {
    const result = await createPlan.mutateAsync({
      destination: formData.destination,
      start_date: formData.startDate,
      end_date: formData.endDate,
      budget: formData.budget,
      currency: formData.currency,
      travelers_count: formData.guests,
      travel_style: formData.style,
      natural_language_request: formData.request,
    })
    
    setPlan(result.data)
  }
  
  return (
    <div>
      <h1>مخطّط الرحلات بالذكاء الاصطناعي</h1>
      {!plan ? (
        <TravelPlanForm onSubmit={handleSubmit} loading={createPlan.isLoading} />
      ) : (
        <TravelPlanResult plan={plan} />
      )}
    </div>
  )
}
```

---

### 4. ميزات متقدمة للاستخدام

#### أ. نظام البحث المتقدم
```typescript
// features/search/components/advanced-search.tsx
'use client'

import { useSearchListings } from '@/generated/hooks/search'
import { useQueryStates } from 'nuqs'

export function AdvancedSearch() {
  const [params, setParams] = useQueryStates({
    query: parseAsString,
    city: parseAsString,
    country: parseAsString,
    minPrice: parseAsInteger,
    maxPrice: parseAsInteger,
    guests: parseAsInteger,
    bedrooms: parseAsInteger,
    bathrooms: parseAsInteger,
    lat: parseAsFloat,
    lng: parseAsFloat,
    radius: parseAsFloat,
    sortBy: parseAsString.withDefault('relevance'),
  })
  
  const { data, isLoading } = useSearchListings({
    query: params.query,
    city: params.city,
    country: params.country,
    min_price: params.minPrice,
    max_price: params.maxPrice,
    min_guests: params.guests,
    min_bedrooms: params.bedrooms,
    min_bathrooms: params.bathrooms,
    latitude: params.lat,
    longitude: params.lng,
    radius_km: params.radius,
    sort_by: params.sortBy,
    enable_personalization: true,
    enable_popularity_boost: true,
    enable_location_boost: true,
  })
  
  // ... UI
}
```

#### ب. نظام العروض والكوبونات
```typescript
// features/promotions/components/coupon-apply.tsx
'use client'

import { useState } from 'react'
import { useValidateCoupon } from '@/generated/hooks/promotions'
import { useApplicablePromotions } from '@/generated/hooks/promotions'

export function CouponApply({ bookingId, amount }) {
  const [couponCode, setCouponCode] = useState('')
  const validateCoupon = useValidateCoupon()
  const { data: applicable } = useApplicablePromotions()
  
  const handleApply = async () => {
    const result = await validateCoupon.mutateAsync({
      code: couponCode,
      booking_id: bookingId,
      amount: amount,
    })
    
    if (result.data?.valid) {
      // تطبيق الخصم
      setDiscount(result.data.discount_amount)
    }
  }
  
  return (
    <div>
      <input 
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        placeholder="أدخل كود الكوبون"
      />
      <button onClick={handleApply}>تطبيق</button>
      
      {applicable && (
        <div>
          <h3>عروض متاحة لك:</h3>
          {applicable.map(promo => (
            <PromoCard key={promo.id} promotion={promo} />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### ج. نظام الولاء والنقاط
```typescript
// features/loyalty/components/loyalty-status.tsx
import { useLoyaltyStatus } from '@/generated/hooks/loyalty'
import { useRedemptionOptions } from '@/generated/hooks/loyalty'

export function LoyaltyStatus() {
  const { data: status } = useLoyaltyStatus()
  const { data: options } = useRedemptionOptions()
  
  return (
    <div>
      <div>
        <h2>نقاط الولاء</h2>
        <p>النقاط الحالية: {status?.current_balance}</p>
        <p>المستوى: {status?.tier}</p>
      </div>
      
      <div>
        <h3>خيارات الاستبدال:</h3>
        {options?.map(option => (
          <RedemptionOption key={option.id} option={option} />
        ))}
      </div>
    </div>
  )
}
```

#### د. نظام الإشعارات الفورية
```typescript
// lib/notifications.ts
import { useWebSocket } from '@/lib/websocket'

export function useNotifications() {
  const { lastMessage } = useWebSocket('/ws/notifications')
  
  useEffect(() => {
    if (lastMessage) {
      const notification = JSON.parse(lastMessage.data)
      
      // عرض إشعار في UI
      toast.info(notification.message)
      
      // تحديث عداد الإشعارات
      queryClient.invalidateQueries(['notifications'])
    }
  }, [lastMessage])
}
```

---

### 5. أفضل الممارسات (Best Practices)

#### أ. إدارة الحالة (State Management)
- استخدم **React Query** للبيانات من API
- استخدم **Zustand** أو **Jotai** للحالة المحلية
- استخدم **Server Actions** للعمليات على الخادم

#### ب. إدارة المصادقة (Authentication)
```typescript
// lib/auth.ts
import { getCurrentUser } from '@/generated/actions/users'

export async function getAuthUser() {
  try {
    const result = await getCurrentUser()
    return result.data
  } catch {
    return null
  }
}

// middleware.ts (Next.js)
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')
  
  if (!token && request.nextUrl.pathname.startsWith('/bookings')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

#### ج. معالجة الأخطاء (Error Handling)
```typescript
// lib/error-handler.ts
import { toast } from 'sonner'

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('401')) {
      // غير مصرح - إعادة توجيه للدخول
      router.push('/login')
    } else if (error.message.includes('403')) {
      toast.error('ليس لديك صلاحية للوصول')
    } else if (error.message.includes('429')) {
      toast.error('تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً')
    } else {
      toast.error(error.message)
    }
  }
}
```

#### د. تحسين الأداء (Performance)
- استخدم **React Suspense** للتحميل التدريجي
- استخدم **Infinite Queries** للقوائم الطويلة
- استخدم **Optimistic Updates** لتحسين تجربة المستخدم
- استخدم **Image Optimization** من Next.js

```typescript
// مثال على Infinite Query
import { useInfiniteListings } from '@/generated/hooks/listings'

export function InfiniteListings() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteListings({
    city: 'Cairo',
    limit: 20,
  })
  
  return (
    <InfiniteScroll
      hasMore={hasNextPage}
      loadMore={fetchNextPage}
      loader={<Loading />}
    >
      {data?.pages.map(page => 
        page.items.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))
      )}
    </InfiniteScroll>
  )
}
```

---

### 6. ميزات إضافية مقترحة

#### أ. صفحة لوحة تحكم المضيف (Host Dashboard)
```typescript
// app/(main)/host/dashboard/page.tsx
import { useHostBookings } from '@/generated/hooks/bookings'
import { useHostListings } from '@/generated/hooks/listings'
import { useAnalytics } from '@/generated/hooks/analytics'

export default function HostDashboard() {
  const { data: bookings } = useHostBookings()
  const { data: listings } = useHostListings()
  const { data: analytics } = useAnalytics()
  
  return (
    <div>
      <StatsCards analytics={analytics} />
      <RecentBookings bookings={bookings} />
      <MyListings listings={listings} />
    </div>
  )
}
```

#### ب. صفحة الملف الشخصي (Profile Page)
```typescript
// app/(main)/profile/page.tsx
import { useCurrentUser } from '@/generated/hooks/users'
import { useUpdateUser } from '@/generated/hooks/users'
import { ProfileForm } from '@/features/auth/components/profile-form'
import { TwoFactorSetup } from '@/features/auth/components/2fa-setup'
import { DeviceManagement } from '@/features/auth/components/device-management'

export default function ProfilePage() {
  const { data: user } = useCurrentUser()
  
  return (
    <div>
      <ProfileForm user={user} />
      <TwoFactorSetup />
      <DeviceManagement />
      <LoyaltyStatus />
    </div>
  )
}
```

---

## 📊 ملخص الميزات حسب الأولوية

### أولوية عالية (Must Have):
1. ✅ نظام المصادقة (التسجيل، الدخول، OAuth)
2. ✅ إدارة العقارات (CRUD)
3. ✅ نظام الحجوزات
4. ✅ نظام الدفع
5. ✅ نظام البحث
6. ✅ نظام التقييمات

### أولوية متوسطة (Should Have):
7. ✅ نظام الرسائل (WebSocket)
8. ✅ نظام العروض والكوبونات
9. ✅ نظام الولاء والنقاط
10. ✅ نظام الإشعارات
11. ✅ نظام التوصيات

### أولوية منخفضة (Nice to Have):
12. ✅ مخطّط الرحلات بالذكاء الاصطناعي
13. ✅ دليل السفر
14. ✅ نظام الاشتراكات
15. ✅ Multi-Tenancy

---

## 🚀 خطوات البدء

1. **إعداد البيئة**:
   ```bash
   cd web
   npm install
   ```

2. **تكوين API**:
   ```typescript
   // lib/api.ts
   export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
   ```

3. **إعداد المصادقة**:
   ```typescript
   // lib/auth.ts
   // إعداد JWT token storage
   // إعداد refresh token logic
   ```

4. **بناء الصفحات الأساسية**:
   - صفحة الرئيسية
   - صفحة البحث
   - صفحة تفاصيل العقار
   - صفحة الحجوزات

5. **إضافة الميزات المتقدمة تدريجياً**

---

## 📚 موارد إضافية

- **Documentation**: `/docs` في Swagger UI
- **Generated Code**: `web/src/generated/README.md`
- **API Examples**: راجع ملفات `routes.py` في كل module

---

## 🎯 خاتمة

Backend Safar API يوفر مجموعة شاملة من الميزات لبناء منصة سفر كاملة. باستخدام الكود المولد والهيكل المقترح، يمكنك بناء تطبيق ويب حديث وقوي يستفيد من جميع هذه الميزات بشكل فعال.

**نصيحة**: ابدأ بالميزات الأساسية (المصادقة، العقارات، الحجوزات) ثم أضف الميزات المتقدمة تدريجياً.

