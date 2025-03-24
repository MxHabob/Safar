FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set GDAL environment variables
ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so
ENV GEOS_LIBRARY_PATH=/usr/lib/libgeos_c.so

WORKDIR /app

# Install system dependencies including PostGIS/GDAL requirements and build tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    g++ \
    binutils \
    make \
    libproj-dev \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ./requirements.txt ./
RUN pip install --upgrade pip && \
    pip install numpy && \
    pip install -r requirements.txt

COPY . .


EXPOSE 8000

CMD ["celery", "-A", "core", "worker", "--loglevel=info"]
