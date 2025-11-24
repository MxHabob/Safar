# إعداد MinIO - MinIO Setup Guide

## نظرة عامة - Overview

تم إعداد MinIO كخدمة تخزين الملفات في التطبيق. MinIO هو خادم تخزين كائنات متوافق مع S3.

MinIO has been set up as the file storage service in the application. MinIO is an S3-compatible object storage server.

## الإعداد - Configuration

### متغيرات البيئة - Environment Variables

أضف المتغيرات التالية إلى ملف `.env`:

Add the following variables to your `.env` file:

```env
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost  # Use 'minio' in docker-compose
MINIO_PORT=9000  # Internal port (inside container)
MINIO_API_PORT=19000  # External API port
MINIO_CONSOLE_PORT=19001  # External Console port
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=safar-files
MINIO_USE_SSL=False
```

### في Docker Compose - In Docker Compose

عند استخدام Docker Compose، سيتم إعداد MinIO تلقائياً:

When using Docker Compose, MinIO will be set up automatically:

- **MinIO Server**: متاح على المنفذ 19000 (افتراضي) - Available on port 19000 (default)
- **MinIO Console**: متاح على المنفذ 19001 (افتراضي) - Available on port 19001 (default)

**ملاحظة**: تم تغيير المنافذ الافتراضية من 9000/9001 إلى 19000/19001 لتجنب التعارضات مع خدمات أخرى.

**Note**: Default ports have been changed from 9000/9001 to 19000/19001 to avoid conflicts with other services.

يمكنك تغيير هذه المنافذ في ملف `.env` باستخدام:
You can change these ports in `.env` file using:
- `MINIO_API_PORT` - منفذ API
- `MINIO_CONSOLE_PORT` - منفذ Console

## الاستخدام - Usage

### الوصول إلى MinIO Console

1. افتح المتصفح وانتقل إلى: `http://localhost:19001` (أو المنفذ المحدد في `MINIO_CONSOLE_PORT`)
2. سجل الدخول باستخدام:
   - Username: `minioadmin` (أو القيمة المحددة في `MINIO_ACCESS_KEY`)
   - Password: `minioadmin` (أو القيمة المحددة في `MINIO_SECRET_KEY`)

### رفع الملفات - Uploading Files

استخدم API endpoint التالي لرفع الملفات:

Use the following API endpoint to upload files:

```bash
POST /api/v1/files/upload
Content-Type: multipart/form-data

{
  "file": <file>,
  "category": "listing_photo"
}
```

### أنواع التخزين المدعومة - Supported Storage Types

- `local`: التخزين المحلي - Local storage
- `minio`: تخزين MinIO - MinIO storage
- `s3`: AWS S3 (قيد التطوير - under development)
- `cloudinary`: Cloudinary (قيد التطوير - under development)

## الأمان - Security

⚠️ **تحذير**: في الإنتاج، قم بتغيير:
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- قم بتمكين SSL (`MINIO_USE_SSL=True`)

⚠️ **Warning**: In production, change:
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- Enable SSL (`MINIO_USE_SSL=True`)

## البنية - Architecture

```
app/infrastructure/storage/
  ├── __init__.py
  └── minio_service.py  # خدمة MinIO - MinIO service
```

الخدمة تقوم تلقائياً بإنشاء الـ bucket عند أول استخدام.

The service automatically creates the bucket on first use.

## API Endpoints

- `POST /api/v1/files/upload` - رفع ملف واحد - Upload single file
- `POST /api/v1/files/upload-multiple` - رفع عدة ملفات - Upload multiple files

## الميزات - Features

- ✅ رفع الملفات - File upload
- ✅ تحميل الملفات - File download
- ✅ حذف الملفات - File deletion
- ✅ التحقق من وجود الملف - File existence check
- ✅ إنشاء روابط مؤقتة - Presigned URLs
- ✅ معلومات الملف - File information

