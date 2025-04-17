FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set GDAL environment variables
ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so
ENV GEOS_LIBRARY_PATH=/usr/lib/libgeos_c.so

WORKDIR /app

# Install system dependencies using apt-get (Debian package manager)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ./requirements.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . .

EXPOSE 8000

# Command to run migrations, create superuser, and start Daphne
CMD ["sh", "-c", "\
    echo 'Running migrations...' && \
    python manage.py makemigrations && \
    python manage.py migrate && \
    echo 'Collecting static files...' && \
    python manage.py collectstatic --noinput && \
    echo 'Creating superuser...' && \
    python manage.py shell -c \"from apps.authentication.models import User; User.objects.filter(email='admin@safar.com').exists() or User.objects.create_superuser(email='admin@safar.com', password='admin')\" && \
    echo 'Generate a fake data...' && \
    python manage.py generate_fake_data --users 50 --places 20 --experiences 15 --flights 10 --bookings 30 && \
    echo 'Starting Daphne...' && \
    daphne -b 0.0.0.0 -p 8000 core.asgi:application && \
    echo 'Downloading essential geographic data...' && \
    python manage.py import_geodata"]