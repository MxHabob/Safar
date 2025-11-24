# منافذ الخدمات - Service Ports

هذا الملف يوضح جميع المنافذ المستخدمة في التطبيق وكيفية تخصيصها.

This file explains all ports used in the application and how to customize them.

## المنافذ الافتراضية - Default Ports

| الخدمة - Service | المنفذ الداخلي - Internal Port | المنفذ الخارجي الافتراضي - Default External Port | متغير البيئة - Env Variable |
|------------------|-------------------------------|------------------------------------------------|---------------------------|
| Backend API | 8000 | 8000 | `BACKEND_PORT` |
| PostgreSQL | 5432 | 5432 | `POSTGRES_PORT` |
| Redis | 6379 | 6379 | `REDIS_PORT` |
| MinIO API | 9000 | **19000** | `MINIO_API_PORT` |
| MinIO Console | 9001 | **19001** | `MINIO_CONSOLE_PORT` |
| Flower (Celery) | 5555 | 5555 | `FLOWER_PORT` |

## ملاحظات مهمة - Important Notes

### MinIO Ports

تم تغيير المنافذ الافتراضية لـ MinIO من 9000/9001 إلى 19000/19001 لتجنب التعارضات مع خدمات أخرى قد تستخدم نفس المنافذ.

MinIO default ports have been changed from 9000/9001 to 19000/19001 to avoid conflicts with other services that might use the same ports.

- **MINIO_PORT**: المنفذ الداخلي داخل الحاوية (دائماً 9000) - Internal port inside container (always 9000)
- **MINIO_API_PORT**: المنفذ الخارجي للـ API (افتراضي: 19000) - External API port (default: 19000)
- **MINIO_CONSOLE_PORT**: المنفذ الخارجي للـ Console (افتراضي: 19001) - External Console port (default: 19001)

### تغيير المنافذ - Changing Ports

لتغيير أي منفذ، أضف المتغير المناسب في ملف `.env`:

To change any port, add the appropriate variable in `.env` file:

```env
# مثال - Example
BACKEND_PORT=8080
POSTGRES_PORT=5433
REDIS_PORT=6380
MINIO_API_PORT=19000
MINIO_CONSOLE_PORT=19001
FLOWER_PORT=5556
```

## الوصول إلى الخدمات - Accessing Services

### في Docker Compose - In Docker Compose

عند استخدام Docker Compose، الخدمات تتواصل داخلياً باستخدام أسماء الخدمات والمنافذ الداخلية:

When using Docker Compose, services communicate internally using service names and internal ports:

- Backend → PostgreSQL: `postgres:5432`
- Backend → Redis: `redis:6379`
- Backend → MinIO: `minio:9000`

### من خارج Docker - From Outside Docker

للوصول من خارج Docker، استخدم المنافذ الخارجية:

To access from outside Docker, use external ports:

- Backend API: `http://localhost:8000` (أو `BACKEND_PORT`)
- MinIO Console: `http://localhost:19001` (أو `MINIO_CONSOLE_PORT`)
- Flower: `http://localhost:5555` (أو `FLOWER_PORT`)

## حل مشاكل التعارض - Troubleshooting Port Conflicts

إذا واجهت مشكلة "port already in use":

If you encounter "port already in use" error:

1. تحقق من المنافذ المستخدمة:
   ```bash
   # Linux/Mac
   lsof -i :8000
   netstat -tulpn | grep :8000
   
   # Windows
   netstat -ano | findstr :8000
   ```

2. غيّر المنفذ في ملف `.env`:
   ```env
   BACKEND_PORT=8080  # استخدم منفذ مختلف
   ```

3. أعد تشغيل الخدمات:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

