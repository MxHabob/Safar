FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so
ENV GEOS_LIBRARY_PATH=/usr/lib/libgeos_c.so

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "\
    echo 'Running migrations...' && \
    python manage.py makemigrations && \
    python manage.py migrate && \
    echo 'Collecting static files...' && \
    python manage.py collectstatic --noinput && \
    echo 'Creating superuser...' && \
    python manage.py shell -c \"from apps.authentication.models import User; User.objects.filter(email='admin@safar.com').exists() or User.objects.create_superuser(email='admin@safar.com', password='admin')\" && \
    # echo 'Downloading essential geographic data...' && \
    # python manage.py import_geodata && \
    echo 'Generate a fake data...' && \
    python manage.py generate_fake_data --users 50 --places 60 --experiences 50 --boxes 20 --flights 0 --bookings 0 --safe-mode && \
    echo 'Starting Daphne...' && \
    daphne -b 0.0.0.0 -p 8000 core.asgi:application"]