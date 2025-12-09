# ترقية نظام المصادقة: Session Management و MFA Encryption و IP Blocking

## نظرة عامة

تمت إضافة ثلاث ميزات أمان متقدمة إلى نظام المصادقة في المشروع:

1. **Session Management** - إدارة متقدمة للجلسات
2. **MFA Encryption** - تشفير أسرار 2FA
3. **IP Blocking** - حظر عناوين IP بعد محاولات فاشلة

---

## 1. Session Management (إدارة الجلسات)

### الملفات المضافة/المحدثة:

#### `backend/app/modules/users/models.py`
- إضافة نموذج `UserSession` مع الحقول التالية:
  - `session_id` - معرف الجلسة الفريد
  - `user_id` - معرف المستخدم
  - `device_info` (JSONB) - معلومات الجهاز (Browser, OS, Device Type)
  - `user_agent` - User-Agent string
  - `ip_address` - عنوان IP
  - `location` (JSONB) - الموقع الجغرافي
  - `is_secure` - هل الاتصال عبر HTTPS
  - `is_remember_me` - هل الجلسة "تذكرني"
  - `mfa_verified` - هل تم التحقق من MFA
  - `status` - حالة الجلسة (ACTIVE, EXPIRED, REVOKED, SUSPENDED)
  - `created_at`, `last_activity`, `expires_at`, `revoked_at`

#### `backend/app/modules/users/session_service.py` (جديد)
خدمة شاملة لإدارة الجلسات:
- `create_session()` - إنشاء جلسة جديدة
- `get_session()` - الحصول على جلسة
- `get_active_sessions()` - الحصول على جميع الجلسات النشطة للمستخدم
- `update_session_activity()` - تحديث آخر نشاط
- `revoke_session()` - إلغاء جلسة محددة
- `revoke_all_sessions()` - إلغاء جميع الجلسات
- `validate_session()` - التحقق من صحة الجلسة
- `cleanup_expired_sessions()` - تنظيف الجلسات المنتهية

### Endpoints الجديدة:

```
GET /api/v1/users/sessions
- الحصول على جميع الجلسات النشطة للمستخدم الحالي

DELETE /api/v1/users/sessions/{session_id}
- إلغاء جلسة محددة
```

### التحديثات على Endpoints الموجودة:

- `POST /api/v1/users/login` - الآن ينشئ جلسة عند تسجيل الدخول
- `POST /api/v1/users/login/2fa/verify` - ينشئ جلسة بعد التحقق من 2FA
- `POST /api/v1/users/logout-all` - يلغي جميع الجلسات بالإضافة إلى Tokens

---

## 2. MFA Encryption (تشفير أسرار 2FA)

### الملفات المحدثة:

#### `backend/app/core/security.py`
إضافة وظائف التشفير:
- `encrypt_secret()` - تشفير سر (مثل TOTP secret)
- `decrypt_secret()` - فك تشفير سر
- `encrypt_backup_codes()` - تشفير قائمة backup codes
- `decrypt_backup_codes()` - فك تشفير backup codes

**التقنية المستخدمة:**
- Fernet encryption (من مكتبة cryptography)
- إذا لم يتم تعيين `ENCRYPTION_KEY`، يتم اشتقاق المفتاح من `SECRET_KEY` باستخدام PBKDF2

#### `backend/app/core/config.py`
إضافة متغير البيئة:
```python
encryption_key: Optional[str] = Field(
    default=None,
    env="ENCRYPTION_KEY",
    description="Fernet encryption key for MFA secrets"
)
```

#### `backend/app/modules/users/two_factor_service.py`
تحديث جميع الوظائف لاستخدام التشفير:
- `setup_totp()` - يشفر TOTP secret قبل التخزين
- `verify_and_enable_totp()` - يفك التشفير قبل التحقق
- `verify_2fa()` - يفك التشفير قبل التحقق

**Backward Compatibility:**
- إذا فشل فك التشفير، يحاول استخدام النص العادي (للمستخدمين القدامى)

---

## 3. IP Blocking (حظر عناوين IP)

### الملفات المضافة:

#### `backend/app/modules/users/account_security_service.py` (جديد)
خدمة أمان الحساب:
- `record_failed_login()` - تسجيل محاولة دخول فاشلة للمستخدم
- `record_failed_login_attempt_by_ip()` - تسجيل محاولة دخول فاشلة حسب IP
- `reset_failed_attempts()` - إعادة تعيين محاولات الدخول الفاشلة
- `check_account_locked()` - التحقق من قفل الحساب
- `check_ip_blocked()` - التحقق من حظر IP

**الإعدادات:**
- `MAX_FAILED_LOGIN_ATTEMPTS = 5` - عدد المحاولات قبل قفل الحساب
- `ACCOUNT_LOCKOUT_DURATION_MINUTES = 15` - مدة قفل الحساب
- `MAX_FAILED_ATTEMPTS_PER_IP = 10` - عدد المحاولات قبل حظر IP
- `IP_BLOCK_DURATION_MINUTES = 30` - مدة حظر IP

### التحديثات على Endpoints:

#### `POST /api/v1/users/login`
1. التحقق من حظر IP **قبل** أي عمليات أخرى
2. تسجيل محاولات الدخول الفاشلة لكل من المستخدم و IP
3. التحقق من قفل الحساب
4. إعادة تعيين المحاولات الفاشلة عند نجاح تسجيل الدخول

#### `POST /api/v1/users/login/2fa/verify`
1. التحقق من قفل الحساب
2. إعادة تعيين المحاولات الفاشلة عند نجاح التحقق من 2FA

---

## متطلبات قاعدة البيانات

### Migration مطلوب:

```sql
-- إنشاء جدول user_sessions
CREATE TABLE user_sessions (
    id VARCHAR(40) PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(40) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_info JSONB DEFAULT '{}',
    user_agent VARCHAR(500),
    ip_address INET,
    location JSONB DEFAULT '{}',
    is_secure BOOLEAN DEFAULT FALSE,
    is_remember_me BOOLEAN DEFAULT FALSE,
    mfa_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_session_user_status ON user_sessions(user_id, status);
CREATE INDEX idx_session_expires ON user_sessions(expires_at);
CREATE INDEX idx_session_user_active ON user_sessions(user_id, status, expires_at);
CREATE INDEX idx_session_ip ON user_sessions(ip_address);
CREATE INDEX idx_session_last_activity ON user_sessions(last_activity);
```

---

## متغيرات البيئة المطلوبة

### `.env` أو Environment Variables:

```bash
# Encryption Key for MFA secrets (اختياري - سيتم اشتقاقه من SECRET_KEY إذا لم يتم تعيينه)
ENCRYPTION_KEY=your-fernet-encryption-key-here

# لإنشاء مفتاح Fernet:
# python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'
```

---

## كيفية الاستخدام

### 1. إنشاء Migration

```bash
# إنشاء migration جديد
alembic revision -m "add_user_sessions_table"

# تطبيق migration
alembic upgrade head
```

### 2. إعداد Encryption Key (اختياري)

```bash
# إنشاء مفتاح Fernet
python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'

# إضافة إلى .env
ENCRYPTION_KEY=<generated-key>
```

### 3. اختبار الميزات

#### اختبار Session Management:
```bash
# تسجيل الدخول
POST /api/v1/users/login
# Response includes: session_id

# الحصول على جميع الجلسات
GET /api/v1/users/sessions

# إلغاء جلسة محددة
DELETE /api/v1/users/sessions/{session_id}
```

#### اختبار IP Blocking:
```bash
# محاولة تسجيل دخول فاشلة 10 مرات من نفس IP
# سيتم حظر IP لمدة 30 دقيقة
```

---

## ملاحظات مهمة

### Backward Compatibility:

1. **MFA Encryption:**
   - إذا فشل فك التشفير، يحاول استخدام النص العادي
   - يسمح بالانتقال التدريجي من غير مشفر إلى مشفر

2. **Session Management:**
   - الجلسات القديمة (قبل التحديث) لن تظهر في `/sessions`
   - الجلسات الجديدة فقط يتم تتبعها

### الأمان:

1. **IP Blocking:**
   - يتم تخزين معلومات IP blocking في Redis
   - TTL تلقائي (30 دقيقة)
   - لا يؤثر على المستخدمين الشرعيين من نفس IP

2. **Session Management:**
   - Session IDs عشوائية وآمنة (32 bytes)
   - تتبع معلومات الجهاز والموقع
   - إمكانية إلغاء الجلسات من أي جهاز

3. **MFA Encryption:**
   - Fernet encryption (AES 128 في CBC mode)
   - المفتاح مشتق من SECRET_KEY إذا لم يتم تعيين ENCRYPTION_KEY
   - أسرار 2FA مشفرة في قاعدة البيانات

---

## التحسينات المستقبلية

1. **Location Tracking:**
   - إضافة خدمة لتحديد الموقع الجغرافي من IP
   - عرض الموقع في قائمة الجلسات

2. **Device Fingerprinting:**
   - تحسين كشف الجهاز باستخدام مكتبة user-agents
   - تتبع التغييرات في الجهاز

3. **Session Notifications:**
   - إرسال إشعار عند تسجيل الدخول من جهاز جديد
   - إرسال إشعار عند إلغاء جلسة

4. **Backup Codes Encryption:**
   - حالياً backup_codes مخزنة كـ ARRAY
   - يمكن تحسينها لتخزين مشفر كـ string

---

## الخلاصة

تمت إضافة ثلاث ميزات أمان متقدمة تجعل نظام المصادقة أكثر أماناً ومرونة:

✅ **Session Management** - تتبع شامل للجلسات النشطة  
✅ **MFA Encryption** - تشفير أسرار 2FA  
✅ **IP Blocking** - حماية من هجمات Brute Force  

جميع الميزات متوافقة مع الكود الحالي وتعمل بشكل تدريجي.

