FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install PostgreSQL development packages
RUN apt-get update && \
    apt-get install -y libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ./requirements.txt ./
RUN pip install --upgrade pip
RUN pip install --default-timeout=1000 -r requirements.txt

# Copy project
COPY . .

# Start the Celery Beat scheduler
CMD ["celery", "-A", "core", "beat", "--loglevel=info"]
