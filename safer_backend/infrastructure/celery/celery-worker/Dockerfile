FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1


WORKDIR /app

# Install PostgreSQL development packages and dependencies
RUN apt-get update && \
    apt-get install -y libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /app/

RUN pip install --upgrade pip && \
    pip install --default-timeout=1000 -r requirements.txt

COPY . .


EXPOSE 8000

CMD ["celery", "-A", "core", "worker", "--loglevel=info"]
