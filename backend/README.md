# Safar API - منصة السفر المتكاملة

منصة سفر متكاملة متقدمة مبنيّة باستخدام FastAPI و PostgreSQL مع ميزات متقدمة تفوق Airbnb.

## المميزات الرئيسية

- ✅ **نظام مصادقة متكامل**: JWT, OAuth2 (Google, Apple), OTP
- ✅ **إدارة العقارات**: عقارات متعددة الأنواع مع صور ومرافق
- ✅ **نظام حجوزات متقدم**: حجوزات فورية وغير فورية
- ✅ **مخطط سفر بالذكاء الاصطناعي**: توليد خطط سفر ذكية بناءً على وصف طبيعي
- ✅ **عروض وخصومات ذكية**: Flash Sales, كوبونات, خصومات جماعية
- ✅ **عروض مضادة**: نظام "Name Your Price"
- ✅ **تقييمات ومراجعات متقدمة**: مع كشف التزييف بالذكاء الاصطناعي
- ✅ **دعم متعدد اللغات والعملات**: تحويل فوري
- ✅ **دردشة فورية**: WebSocket للرسائل الفورية
- ✅ **إشعارات متعددة القنوات**: Email, Push, SMS, In-app
- ✅ **Multi-tenancy**: دعم وكالات سفر متعددة

## التقنيات المستخدمة

- **Backend**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0 (Async)
- **Cache**: Redis
- **Background Tasks**: Celery
- **AI**: OpenAI GPT-4
- **Authentication**: JWT, OAuth2
- **WebSocket**: للدردشة والإشعارات الفورية
- **Migrations**: Alembic

## التثبيت والإعداد

### 1. المتطلبات الأساسية

- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (اختياري)

### 2. إعداد البيئة

```bash
# استنساخ المشروع
git clone <repository-url>
cd backend

# إنشاء بيئة افتراضية
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# تثبيت المتطلبات
pip install -r requirements.txt

# نسخ ملف الإعدادات
cp .env.example .env
# تعديل .env حسب احتياجاتك
```

### 3. إعداد قاعدة البيانات

```bash
# إنشاء قاعدة البيانات
createdb safar_db

# تشغيل Migrations
alembic upgrade head
```

### 4. تشغيل التطبيق

```bash
# Development
uvicorn app.main:app --reload

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. استخدام Docker

```bash
# تشغيل جميع الخدمات
docker-compose up -d

# عرض السجلات
docker-compose logs -f

# إيقاف الخدمات
docker-compose down
```

## API Documentation

بعد تشغيل التطبيق، يمكنك الوصول إلى:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## الهيكل التنظيمي للمشروع

```
backend/
├── app/
│   ├── api/              # API routes
│   ├── core/             # Core configuration
│   ├── infrastructure/  # Infrastructure (Redis, WebSocket, etc.)
│   ├── modules/          # Business logic modules
│   │   ├── users/
│   │   ├── properties/
│   │   ├── bookings/
│   │   ├── reviews/
│   │   ├── ai_trip_planner/
│   │   └── ...
│   └── shared/           # Shared utilities
├── alembic/              # Database migrations
├── tests/                # Tests
├── docker-compose.yml     # Docker configuration
├── Dockerfile            # Docker image
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

## أمثلة الاستخدام

### 1. تسجيل مستخدم جديد

```bash
curl -X POST "http://localhost:8000/api/v1/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

### 2. تسجيل الدخول

```bash
curl -X POST "http://localhost:8000/api/v1/users/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### 3. إنشاء خطة سفر بالذكاء الاصطناعي

```bash
curl -X POST "http://localhost:8000/api/v1/ai/travel-planner" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris",
    "start_date": "2025-06-01",
    "end_date": "2025-06-06",
    "budget": 3000,
    "currency": "USD",
    "travelers_count": 2,
    "travel_style": "family",
    "natural_language_request": "سفر عائلي إلى باريس 5 أيام بميزانية 3000 دولار"
  }'
```

## التطوير

### إضافة Migration جديد

```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### تشغيل الاختبارات

```bash
pytest
```

## الإنتاج

### متغيرات البيئة المهمة

- `SECRET_KEY`: يجب أن يكون عشوائياً وقوياً
- `DATABASE_URL`: رابط قاعدة البيانات
- `REDIS_URL`: رابط Redis
- `OPENAI_API_KEY`: مفتاح OpenAI API
- `STRIPE_SECRET_KEY`: مفتاح Stripe (للمدفوعات)

## الترخيص

MIT License

## الدعم

للأسئلة والدعم، يرجى فتح issue في المستودع.

