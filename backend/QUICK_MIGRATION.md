# إنشاء Migration الأولي - الطريقة السريعة

## المشكلة
إذا ظهر خطأ `Permission denied` عند تشغيل السكريبت، استخدم إحدى الطرق التالية:

## الطرق الصحيحة

### 1. استخدام docker exec مع python (موصى به)
```bash
docker exec <container_id> python scripts/create_initial_migration.py
```

### 2. استخدام docker exec مع bash
```bash
docker exec <container_id> bash scripts/create_initial_migration.sh
```

### 3. الطريقة الأسهل - مباشرة مع alembic
```bash
docker exec <container_id> alembic revision --autogenerate -m "initial"
```

### 4. استخدام docker-compose (الأسهل)
```bash
cd backend
docker-compose exec backend alembic revision --autogenerate -m "initial"
```

### 5. استخدام Makefile
```bash
cd backend
make migrate-initial
```

## مثال عملي

إذا كان container ID هو `693e9438606a`:

```bash
# الطريقة المباشرة (الأسهل)
docker exec 693e9438606a alembic revision --autogenerate -m "initial"

# أو مع python
docker exec 693e9438606a python scripts/create_initial_migration.py

# أو مع bash script
docker exec 693e9438606a bash scripts/create_initial_migration.sh
```

## بعد إنشاء Migration

```bash
# تطبيق migration
docker exec <container_id> alembic upgrade head

# أو مع docker-compose
cd backend
make migrate
```

